import { IsNotEmpty, IsString } from 'class-validator';

export class SaveIfthenpayKeyDto {
    @IsString()
    @IsNotEmpty({ message: 'O token de autenticação Ifthenpay não pode estar vazio.' })
    authToken: string;
}
