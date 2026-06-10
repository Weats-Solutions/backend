import "dotenv/config";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "../libs/database/prisma/core/generated/core";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

async function optimizeExistingImages() {

    let connectionString = process.env.CORE_DB_URL;
    if (!connectionString) {
        console.error("❌ CORE_DB_URL não definida no .env");
        return;
    }

    // Fallback IPv4 (127.0.0.1) para evitar problemas de resolução de localhost no Node.js
    connectionString = connectionString.replace("@localhost:", "@127.0.0.1:");

    // 2. Configurar Prisma tal como nos seeds
    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });

    // 3. Configurar R2 S3Client
    const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_IMAGES_BUCKET_S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_IMAGES_BUCKET_ACCESS_KEY || "",
            secretAccessKey: process.env.R2_IMAGES_BUCKET_SECRET_KEY || "",
        },
    });

    const BUCKET_NAME = process.env.R2_IMAGES_BUCKET_NAME || "images";

    console.log("🔍 À procura de imagens para otimizar...");

    // Seleciona imagens que tenham tamanho maior que 150KB (150.000 Bytes)
    // E que estejam salvas no R2 (começando com 'establishments/')
    const imagesToOptimize = await prisma.image.findMany({
        where: {
            cloudflareImageId: {
                startsWith: "establishments/"
            },
            fileSize: {
                gt: 150000 // 150 KB
            }
        }
    });

    console.log(`✅ Encontradas ${imagesToOptimize.length} imagens pesadas para otimizar.`);

    let optimizedCount = 0;

    for (const image of imagesToOptimize) {
        try {
            console.log(`\n📦 A processar: ${image.fileName} (ID: ${image.id}, Tamanho original: ${(image.fileSize / 1024 / 1024).toFixed(2)} MB)`);

            const oldKey = image.cloudflareImageId;
            
            // 3. Descarregar imagem do R2
            const getResponse = await s3.send(new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: oldKey
            }));

            const chunks: Buffer[] = [];
            for await (const chunk of getResponse.Body as any) {
                chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);

            // 4. Comprimir imagem com Sharp para WebP (max 1000px, 80% qualidade)
            const compressedBuffer = await sharp(buffer)
                .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const newSize = compressedBuffer.length;
            console.log(`   ⚡ Comprimida: ${(image.fileSize / 1024).toFixed(0)} KB -> ${(newSize / 1024).toFixed(0)} KB (Redução de ${(((image.fileSize - newSize) / image.fileSize) * 100).toFixed(0)}%)`);

            // 5. Definir nova chave (Key) com extensão .webp
            const newKey = oldKey.replace(/\.[^/.]+$/, "") + ".webp";
            const newUrl = image.url.replace(/\.[^/.]+$/, "") + ".webp";
            const newFileName = image.fileName.replace(/\.[^/.]+$/, "") + ".webp";

            // 6. Fazer upload da versão WebP
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: newKey,
                Body: compressedBuffer,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000, immutable",
            }));

            // 7. Atualizar a base de dados
            await prisma.image.update({
                where: { id: image.id },
                data: {
                    cloudflareImageId: newKey,
                    url: newUrl,
                    fileName: newFileName,
                    fileSize: newSize
                }
            });

            // 8. Se a nova Key for diferente da antiga, apagar a antiga para poupar espaço
            if (newKey !== oldKey) {
                await s3.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: oldKey
                }));
                console.log(`   🧹 Imagem antiga removida: ${oldKey}`);
            }

            console.log(`   ✨ Sucesso! Nova URL: ${newUrl}`);
            optimizedCount++;

        } catch (error: any) {
            console.error(`   ❌ Erro ao otimizar imagem ${image.id}:`, error.message);
        }
    }

    console.log(`\n🏁 Otimização terminada! Total otimizadas com sucesso: ${optimizedCount}/${imagesToOptimize.length}`);
    await prisma.$disconnect();
}

optimizeExistingImages();
