import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EstablishmentLanguageSyncService } from './establishment-language-sync.service';
import { LanguageSyncJobData } from './establishment-language-sync.types';
import { Logger } from '@nestjs/common';

@Processor('jobs')
export class EstablishmentLanguageSyncProcessor {
  private readonly logger = new Logger(EstablishmentLanguageSyncProcessor.name);

  constructor(
    private readonly establishmentLanguageSyncService: EstablishmentLanguageSyncService,
  ) { }

  @Process('sync-establishment-language-translations')
  async handleLanguageSync(job: Job<LanguageSyncJobData>) {
    this.logger.log(`Job ${job.id} picked up by processor`);
    try {
      return await this.establishmentLanguageSyncService.processLanguageSyncJob(job);
    } catch (error) {
      this.logger.error(`Error in processor: ${error.message}`);
      throw error;
    }
  }
} 
