import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SaveXdRestCredentialsDto {
    @IsString()
    @IsNotEmpty()
    baseUrl: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
