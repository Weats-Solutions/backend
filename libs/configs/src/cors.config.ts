import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppConfigService } from './app-config.service';

export const getCorsOptions = (appConfigService: AppConfigService): CorsOptions => ({
    origin: (origin, callback) => {
        const allowedOrigins = [
            appConfigService.getAppUrl(),
            'http://localhost:3000',
            'http://localhost:3001',
            'https://staff.weats.pro',
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
});
