import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

async function setupR2Cors() {
    // Manually parse .env to avoid dependency issues
    const envPath = path.join(__dirname, "../.env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    
    envContent.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        }
    });

    const accessKeyId = env.R2_IMAGES_BUCKET_ACCESS_KEY;
    const secretAccessKey = env.R2_IMAGES_BUCKET_SECRET_KEY;
    const bucketName = env.R2_IMAGES_BUCKET_NAME || "images";
    const endpoint = env.R2_IMAGES_BUCKET_S3_ENDPOINT;

    if (!accessKeyId || !secretAccessKey || !endpoint) {
        console.error("Missing R2 credentials in .env");
        process.exit(1);
    }

    const s3 = new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const corsConfiguration = {
        CORSRules: [
            {
                AllowedOrigins: ["http://localhost:3000", "https://app.weats.pro", "https://*.weats.pro"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                AllowedHeaders: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
            },
        ],
    };

    try {
        console.log(`Setting CORS for bucket: ${bucketName}...`);
        await s3.send(
            new PutBucketCorsCommand({
                Bucket: bucketName,
                CORSConfiguration: corsConfiguration,
            })
        );
        console.log("CORS configuration applied successfully!");
    } catch (error) {
        console.error("Failed to apply CORS configuration:", error);
    }
}

setupR2Cors();
