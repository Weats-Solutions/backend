import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "../libs/database/prisma/core/generated/core";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as crypto from "crypto";

async function migrateImages() {
    // 1. Carregar variáveis do .env
    const envPath = path.join(__dirname, "../.env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    envContent.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        }
    });

    // 2. Configurar Prisma tal como no CorePrismaService
    const connectionString = env.CORE_DB_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const s3 = new S3Client({
        region: "auto",
        endpoint: env.R2_IMAGES_BUCKET_S3_ENDPOINT,
        credentials: {
            accessKeyId: env.R2_IMAGES_BUCKET_ACCESS_KEY,
            secretAccessKey: env.R2_IMAGES_BUCKET_SECRET_KEY,
        },
    });

    const BUCKET_NAME = env.R2_IMAGES_BUCKET_NAME || "images";
    const CDN_URL = "https://cdn.weats.app"; // O teu novo domínio

    console.log("🔍 À procura de imagens para migrar...");

    // 2. Encontrar imagens que ainda não estão no R2
    // Imagens R2 começam com 'establishments/'
    const imagesToMigrate = await prisma.image.findMany({
        where: {
            NOT: {
                cloudflareImageId: {
                    startsWith: "establishments/"
                }
            }
        }
    });

    console.log(`✅ Encontradas ${imagesToMigrate.length} imagens para migrar.`);

    for (const image of imagesToMigrate) {
        try {
            console.log(`\n📦 A migrar: ${image.fileName} (ID: ${image.id})`);

            // 3. Download da imagem original (tentar variant 'public' ou 'original')
            let response;
            try {
                response = await axios.get(`${image.url}/public`, { responseType: 'arraybuffer' });
            } catch (e) {
                console.log(`   ⚠️  'public' falhou, a tentar 'original'...`);
                response = await axios.get(`${image.url}/original`, { responseType: 'arraybuffer' });
            }
            
            const buffer = Buffer.from(response.data, 'binary');
            const contentType = response.headers['content-type'] || 'image/jpeg';

            // 4. Definir nova chave (Key) no R2
            const fileId = crypto.randomUUID();
            const extension = path.extname(image.fileName) || '.jpg';
            const newKey = `establishments/${image.establishmentId}/${fileId}${extension}`;

            // 5. Upload para o R2
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: newKey,
                Body: buffer,
                ContentType: contentType,
                Metadata: {
                    migrated: "true",
                    originalId: image.cloudflareImageId,
                    establishmentId: image.establishmentId
                }
            }));

            // 6. Atualizar Base de Dados
            const newUrl = `${CDN_URL}/${newKey}`;
            await prisma.image.update({
                where: { id: image.id },
                data: {
                    cloudflareImageId: newKey,
                    url: newUrl
                }
            });

            console.log(`✨ Migrada com sucesso! Novo URL: ${newUrl}`);

        } catch (error) {
            console.error(`❌ Erro ao migrar imagem ${image.id}:`, error.message);
        }
    }

    console.log("\n🏁 Migração terminada!");
    await prisma.$disconnect();
}

migrateImages();
