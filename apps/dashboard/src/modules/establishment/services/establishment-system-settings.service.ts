import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, FeatureUsageService } from '@weats/common';
import {
    EstablishmentLanguageDto, EstablishmentPreferencesDto, UpdateEstablishmentSystemSettingsDto
} from '@weats/contracts';
import { CorePrismaService, EstablishmentLanguage } from '@weats/database';
import { CacheService } from '@weats/cache';
import { Establishment } from '@weats/types';
import { EstablishmentLanguageSyncService } from '../establishment-language-sync.service';
import { InjectQueue } from '@nestjs/bull';
import { QUEUES } from '@weats/bull';
import { Queue } from 'bull';

export interface LanguageSyncJobData {
    establishmentId: string;
    primaryLanguage: EstablishmentLanguage;
    addedLanguages: EstablishmentLanguage[];
    finalLanguagesList: EstablishmentLanguage[];
}


@Injectable()
export class EstablishmentSystemSettingsService {
    private readonly logger = new Logger(EstablishmentSystemSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService,
        private readonly featureUsageService: FeatureUsageService,
        private readonly establishmentLanguageSyncService: EstablishmentLanguageSyncService,
        @InjectQueue(QUEUES.LANGUAGES) private readonly languageQueue: Queue,

    ) { }
    async getEstablishmentSystemSettings(establishment: Establishment) {
        return {
            preferences: {
                currency: establishment.currency,
                timezone: establishment.timezone,
            },
            languages: {
                primaryLanguage: establishment.primaryLanguage,
                availableLanguages: establishment.availableLanguages,
            },
        };
    }

    async updateEstablishmentSystemSettings(
        establishment: Establishment,
        dto: UpdateEstablishmentSystemSettingsDto,
    ) {
        try {
            let result;

            switch (dto.section) {
                case 'preferences':
                    result = await this.updatePreferences(
                        establishment.id,
                        dto.preferences,
                    );
                    break;
                default:
                    throw new RpcException({
                        status: 400,
                        message: 'Invalid section provided',
                        code: ERRORS.BAD_REQUEST,
                    });
            }

            this.cacheService.clearCoreCache(establishment.slug);

            return result;
        } catch (error) {
            // Se já for uma RpcException, apenas a relança
            if (error instanceof RpcException) throw error;

            // Log do erro real para debug interno
            this.logger.error(`[SystemSettings] Update failed:`, error);

            // Erro genérico para o cliente
            throw new RpcException({
                message: ERRORS.BAD_REQUEST,
                code: 400,
            });
        }
    }

    private async updatePreferences(
        id: string,
        data: EstablishmentPreferencesDto,
    ) {
        return this.prisma.establishment.update({
            where: { id },
            data: {
                currency: data.currency,
                timezone: data.timezone,
            },
        });
    }

    async updateLanguages(
        establishment: Establishment,
        data: EstablishmentLanguageDto,
    ) {
        // 1. Validação: a língua primária deve estar sempre na lista
        if (!data.availableLanguages.includes(establishment.primaryLanguage as EstablishmentLanguage)) {
            throw new RpcException({
                status: 400,
                message: 'Primary language must be included in available languages',
                code: ERRORS.BAD_REQUEST,
            });
        }

        // 2. Validação de limite do plano
        const { limit } = await this.featureUsageService.getUsageAndLimit('languages', establishment.id);
        if (limit !== null && data.availableLanguages.length > limit) {
            throw new RpcException({ status: 400, message: ERRORS.FEATURE_LIMIT_REACHED });
        }

        // 3. Calcular línguas adicionadas (novas)
        const currentLanguages = establishment.availableLanguages as EstablishmentLanguage[];
        const addedLanguages = data.availableLanguages.filter(
            (locale) => !currentLanguages.includes(locale),
        );

        // 4. Se não há línguas novas, apenas atualizar a lista no DB (caso de remoção)
        //    As traduções das línguas removidas são mantidas para o caso de o user reativar
        if (addedLanguages.length === 0) {
            await this.prisma.establishment.update({
                where: { id: establishment.id },
                data: { availableLanguages: data.availableLanguages },
            });

            return { syncJobId: null, status: 'completed' };
        }

        // 5. Enfileiramos o Job passando a lista COMPLETA que queremos ter no final
        const job = await this.establishmentLanguageSyncService.enqueueLanguageSyncJob(
            establishment.id,
            establishment.primaryLanguage as EstablishmentLanguage,
            addedLanguages,
            data.availableLanguages, // Passamos a lista final desejada
        );

        return {
            syncJobId: job?.id ?? null,
            status: 'pending_sync'
        };
    }

    async getLanguageSyncStatus(jobId: string) {
        const job = await this.languageQueue.getJob(jobId);

        if (!job) {
            throw new RpcException({
                status: 404,
                message: ERRORS.JOB_NOT_FOUND,
                code: 404,
            });
        }

        const state = await job.getState(); // 'active', 'waiting', 'completed', 'failed', 'delayed'
        const progress = job.progress(); // Retorna o objeto { percentage, currentStep, label }
        const reason = job.failedReason; // Caso o job tenha falhado

        return {
            jobId: job.id,
            state,
            progress: progress || { percentage: 0, label: 'A iniciar...' },
            isFinished: ['completed', 'failed'].includes(state),
            failedReason: reason,
        };
    }


}
