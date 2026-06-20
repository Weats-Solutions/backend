import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { IntegrationsValidationService } from './integrations-validation.service';

@Module({
    imports: [DatabaseModule],
    providers: [IntegrationsValidationService],
    exports: [IntegrationsValidationService],
})
export class IntegrationsValidationModule {}
