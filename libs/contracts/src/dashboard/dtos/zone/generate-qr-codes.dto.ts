import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  IsEmail,
  Min,
  Max,
  ValidateIf,
  Matches,
} from 'class-validator';

export class GenerateQrCodesDto {
  @IsOptional()
  @IsBoolean()
  onlyMenu?: boolean;

  @IsOptional()
  @IsBoolean()
  useServicePointNameAsFrameText?: boolean;

  @IsOptional()
  @IsString()
  menuOnlyFrameText?: string;

  @ValidateIf((o: GenerateQrCodesDto) => !o.onlyMenu)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  servicePointIds: string[];

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'dotColor must be a valid hex color (e.g. #000000)',
  })
  dotColor: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'bgColor must be a valid hex color (e.g. #FFFFFF)',
  })
  bgColor: string;

  @IsString()
  @IsIn(['L', 'M', 'Q', 'H'])
  errorLevel: 'L' | 'M' | 'Q' | 'H';

  @IsInt()
  @Min(0)
  @Max(10)
  frameId: number;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'frameColor must be a valid hex color',
  })
  frameColor: string;

  @IsString()
  frameText: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'frameTextColor must be a valid hex color',
  })
  frameTextColor: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;
}
