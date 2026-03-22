import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';

@Injectable()
export class EncryptionService {
    private readonly key: Buffer;
    private readonly iv: Buffer;

    constructor(@Inject('ENCRYPTION_ALGORITHM') private readonly algorithm: string,
        @Inject('ENCRYPTION_IV') private readonly EncryptionIv: string,
        @Inject('ENCRYPTION_KEY') private readonly EncryptionKey: string,
        @Inject('ENCRYPTION_SALT') private readonly EncryptionSalt: string,
    ) {
        try {
            // 1. Transformamos o Salt e o IV que estão no .env (Hex) de volta em Buffers
            const saltBuffer = Buffer.from(this.EncryptionSalt, 'hex');
            this.iv = Buffer.from(this.EncryptionIv, 'hex');

            // 2. Geramos a chave real de 32 bytes usando scrypt (Síncrono para o constructor)
            // Usamos a key do .env como "password" para o algoritmo
            this.key = scryptSync(this.EncryptionKey, saltBuffer, 32);

            // Validação de segurança: O IV para AES-CTR/GCM deve ter 16 bytes
            if (this.iv.length !== 16) {
                throw new Error('IV inválido. Deve ter 16 bytes (32 caracteres hex).');
            }
        } catch (error) {
            throw new InternalServerErrorException('Erro ao inicializar criptografia: ' + error.message);
        }
    }

    encrypt(text: string): string {
        if (!text) return text;

        const cipher = createCipheriv(this.algorithm, this.key, this.iv);
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        return encrypted.toString('hex');
    }

    decrypt(encryptedHex: string): string {
        if (!encryptedHex) return encryptedHex;

        const decipher = createDecipheriv(this.algorithm, this.key, this.iv);
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    }
}
