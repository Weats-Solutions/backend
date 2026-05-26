import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppConfigService } from './app-config.service';

export const getCorsOptions = (appConfigService: AppConfigService): CorsOptions => ({
    origin: (origin, callback) => {
        const env = appConfigService.getWeatsEnv();
        let allowedOrigins: string[] = [];

        switch (env) {
            case 'local':
                allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:4000',
                ];
                break;
            case 'dev':
                allowedOrigins = [
                    'http://localhost:3000',
                    'https://dev-dash.weats.app',
                    'https://dev-tm.weats.app',
                    'https://dev-menu.weats.app',
                ];
                break;
            case 'prod':
                allowedOrigins = [
                    'https://dash.weats.app',
                    'https://*.weats.pt',
                    'https://tm.weats.app',
                ];
                break;
            default:
                allowedOrigins = [];
        }

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
