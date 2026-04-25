import { plainToInstance } from 'class-transformer';
import {
  IsNumber,
  IsString,
  validateSync,
  IsOptional,
  IsIn,
  isInt,
  IsInt,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  @IsIn(['development', 'production', 'test', 'staging', 'local'])
  NODE_ENV: string;

  @IsNumber()
  DASHBOARD_CLIENT_PORT: number;

  @IsString()
  ORDERS_DB_URL: string;

  @IsString()
  CORE_DB_URL: string;

  @IsInt()
  GATEWAY_PORT: number;

  @IsNumber()
  WEBHOOKS_PORT: number;

  @IsInt()
  REALTIME_PORT: number;

  @IsString()
  APP_URL: string;

  @IsString()
  CLERK_SECRET_KEY: string;

  @IsString()
  CLERK_WEBHOOK_SECRET: string;

  @IsString()
  CLERK_JWT_KEY: string;

  @IsString()
  STRIPE_API_KEY: string;

  @IsString()
  STRIPE_API_VERSION: string;

  @IsString()
  STRIPE_WEBHOOK_SECRET: string;

  @IsString()
  R2_IMAGES_BUCKET_URL: string;

  @IsString()
  R2_CDN_URL: string;

  @IsString()
  R2_IMAGES_BUCKET_NAME: string;

  @IsString()
  R2_IMAGES_BUCKET_ACCESS_KEY: string;

  @IsString()
  R2_IMAGES_BUCKET_SECRET_KEY: string;

  @IsString()
  R2_IMAGES_BUCKET_S3_ENDPOINT: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  REDIS_USERNAME: string;

  @IsString()
  REDIS_PASSWORD: string;

  @IsNumber()
  REDIS_JOB_DB: number;

  @IsNumber()
  REDIS_CACHE_DB: number;

  @IsNumber()
  REDIS_NEXT_CACHE_DB: number;

  @IsString()
  ENCRYPTION_ALGORITHM: string;

  @IsString()
  ENCRYPTION_KEY: string;

  @IsString()
  ENCRYPTION_SALT: string;

  @IsString()
  ENCRYPTION_IV: string;

  @IsString()
  DISCORD_WEBHOOK_URL: string;

  @IsString()
  EUPAGO_API_URL: string;

  @IsString()
  ZEPTO_API_URL: string;

  @IsString()
  ZEPTO_ZOHO_ENCZAPIKEY: string;

  @IsString()
  ZEPTO_SENDER_EMAIL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
