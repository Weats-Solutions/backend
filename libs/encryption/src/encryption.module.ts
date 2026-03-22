import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ConfigsModule } from '@weats/configs';
import { CryptoConfigService } from '@weats/configs/crypto-config.service';

@Module({
  imports: [ConfigsModule],
  providers: [EncryptionService,
    {
      provide: 'ENCRYPTION_ALGORITHM',
      useFactory: async (cryptoConfig: CryptoConfigService) =>
        cryptoConfig.getAlgorithm(),
      inject: [CryptoConfigService],
    },
    {
      provide: 'ENCRYPTION_KEY',
      useFactory: async (cryptoConfig: CryptoConfigService) =>
        cryptoConfig.getCryptoKey(),
      inject: [CryptoConfigService],
    },
    {
      provide: 'ENCRYPTION_IV',
      useFactory: async (cryptoConfig: CryptoConfigService) =>
        cryptoConfig.getIv(),
      inject: [CryptoConfigService],
    },
    {
      provide: 'ENCRYPTION_SALT',
      useFactory: async (cryptoConfig: CryptoConfigService) =>
        cryptoConfig.getSalt(),
      inject: [CryptoConfigService],
    },
  ],
  exports: [EncryptionService],
})
export class EncryptionModule { }
