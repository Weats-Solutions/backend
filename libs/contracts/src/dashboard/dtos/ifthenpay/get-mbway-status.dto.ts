import { IsNotEmpty, IsString } from 'class-validator';

export class IfthenpayGetMbwayStatusDto {
    @IsString()
    @IsNotEmpty()
    transactionId: string;
}
