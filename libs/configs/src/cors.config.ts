import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppConfigService } from './app-config.service';

export const getCorsOptions = (appConfigService: AppConfigService): CorsOptions => ({
    origin: (origin, callback) => {
        const allowedOrigins = [
            appConfigService.getAppUrl(),
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:4000',
            'https://staff.weats.app',
            'https://app.weats.app',
            'https://table-management.weats.app',
        ];
        // Check if the origin matches our allowed list, or if it's an ngrok tunnel
        const isNgrok = origin && (origin.endsWith('.ngrok-free.dev') || origin.endsWith('.ngrok.io') || origin.endsWith('.loca.lt'));

        if (!origin || allowedOrigins.includes(origin) || isNgrok) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
});
