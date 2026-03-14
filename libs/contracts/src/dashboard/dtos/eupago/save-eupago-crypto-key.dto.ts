import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para guardar a Chave Criptográfica do canal EuPago.
 *
 * Esta chave é gerada no backoffice EuPago (Canais → [canal] → Chave Criptográfica)
 * e é usada para:
 *   - Verificar a assinatura HMAC-SHA256 dos webhooks (header X-Signature)
 *   - Desencriptar o payload AES-256-CBC (header X-Initialization-Vector)
 */
export class SaveEupagoCryptoKeyDto {
    @IsString()
    @IsNotEmpty({ message: 'A chave criptográfica EuPago não pode estar vazia.' })
    cryptoKey: string;
}