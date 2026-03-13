import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { DatabaseModule } from '@weats/database';
import { IntegrationsModule } from '@weats/integrations';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
    ],
    controllers: [ImageController],
    providers: [
        ImageService,
    ],
    exports: [ImageService],
})
export class ImageModule { }
