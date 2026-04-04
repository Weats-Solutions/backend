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
  API_PORT: number;

  @IsString()
  NEXT_PUBLIC_MENU_URL: string;

  @IsString()
  MENU_CACHE_TOKEN: string;
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
