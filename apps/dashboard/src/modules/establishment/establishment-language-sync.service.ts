import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import {
  CorePrismaService,
  EstablishmentLanguage,
  Prisma
} from '@weats/database';
import { Job, Queue } from 'bull';
import { CacheService } from '@weats/cache';
import { QUEUES } from '@weats/bull/queues/queues.constants';
import { LanguageSyncJobData } from './services/establishment-system-settings.service';

const LANGUAGE_SYNC_JOB = 'sync-establishment-language-translations';
const LANGUAGE_SYNC_BATCH_SIZE = 500;
/**
 * Interface para garantir tipagem forte nos métodos genéricos do Prisma
 */
interface PrismaDelegate<T, TCreateInput> {
  findMany(args: any): Promise<T[]>;
  createMany(args: { data: TCreateInput[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
}

@Injectable()
export class EstablishmentLanguageSyncService {
  private readonly logger = new Logger(EstablishmentLanguageSyncService.name);

  constructor(
    @InjectQueue(QUEUES.LANGUAGES)
    private readonly jobsQueue: Queue,
    private readonly prisma: CorePrismaService,
    private readonly cacheService: CacheService,
  ) { }

  /**
   * Enfileira um trabalho de sincronização garantindo que não existam duplicados ativos
   */
  async enqueueLanguageSyncJob(
    establishmentId: string,
    primaryLanguage: EstablishmentLanguage,
    addedLanguages: EstablishmentLanguage[],
    finalLanguagesList: EstablishmentLanguage[],
  ) {
    const normalizedAddedLanguages = [
      ...new Set(addedLanguages.filter((locale) => locale !== primaryLanguage)),
    ];

    if (normalizedAddedLanguages.length === 0) return null;

    const jobId = this.getJobId(establishmentId);
    const existingJob = await this.jobsQueue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();
      if (['waiting', 'active', 'delayed'].includes(state)) {
        return existingJob;
      }
      await existingJob.remove().catch(() => undefined);
    }

    return this.jobsQueue.add(
      LANGUAGE_SYNC_JOB,
      {
        establishmentId,
        primaryLanguage,
        addedLanguages: normalizedAddedLanguages,
        finalLanguagesList,
      } satisfies LanguageSyncJobData,
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { age: 600 }, // 10 minutos
        removeOnFail: { age: 600 }, // 10 minutos
      },
    );
  }

  /**
   * Processador principal do Job
   */
  async processLanguageSyncJob(job: Job<LanguageSyncJobData>) {
    const { establishmentId, primaryLanguage, addedLanguages, finalLanguagesList } = job.data;

    if (!addedLanguages.length) return { synced: 0 };

    this.logger.log(
      `Starting sync for establishment ${establishmentId}. Target locales: ${addedLanguages.join(', ')}`,
    );

    // Definição das etapas para cálculo de progresso
    const steps = [
      { id: 'menus', label: 'Menus', action: () => this.syncEntity(this.prisma.menuTranslation, { menu: { establishmentId } }, 'menuId', job.data, (s) => ({ menuId: s.menuId, name: s.name, description: s.description, observations: s.observations })) },
      { id: 'categories', label: 'Categorias', action: () => this.syncEntity(this.prisma.menuCategoryTranslation, { category: { menu: { establishmentId } } }, 'categoryId', job.data, (s) => ({ categoryId: s.categoryId, name: s.name })) },
      { id: 'subcategories', label: 'Subcategorias', action: () => this.syncEntity(this.prisma.menuSubcategoryTranslation, { subcategory: { category: { menu: { establishmentId } } } }, 'subcategoryId', job.data, (s) => ({ subcategoryId: s.subcategoryId, name: s.name, description: s.description })) },
      { id: 'items', label: 'Itens', action: () => this.syncEntity(this.prisma.itemTranslation, { item: { establishmentId } }, 'itemId', job.data, (s) => ({ itemId: s.itemId, name: s.name, shortDescription: s.shortDescription, description: s.description })) },
      { id: 'variantOptions', label: 'Opções de Variantes', action: () => this.syncEntity(this.prisma.variantOptionTranslation, { variantOption: { establishmentId } }, 'variantOptionId', job.data, (s) => ({ variantOptionId: s.variantOptionId, name: s.name })) },
      { id: 'variantGroups', label: 'Grupos de Variantes', action: () => this.syncEntity(this.prisma.itemVariantGroupTranslation, { itemVariantGroup: { item: { establishmentId } } }, 'itemVariantGroupId', job.data, (s) => ({ itemVariantGroupId: s.itemVariantGroupId, name: s.name })) },
      { id: 'modifierGroups', label: 'Grupos de Modificadores', action: () => this.syncEntity(this.prisma.itemModifierGroupTranslation, { modifierGroup: { item: { establishmentId } } }, 'modifierGroupId', job.data, (s) => ({ modifierGroupId: s.modifierGroupId, name: s.name, deletedAt: s.deletedAt })) },
      { id: 'addons', label: 'Complementos', action: () => this.syncEntity(this.prisma.addonTranslation, { addon: { establishmentId } }, 'addonId', job.data, (s) => ({ addonId: s.addonId, name: s.name })) },
    ];

    // Executa cada etapa e atualiza o progresso no Bull
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      this.logger.debug(`[Sync] Processing ${step.label}...`);

      // Atualiza o progresso ANTES de começar a etapa (opcional, para mostrar o que está a fazer)
      await job.progress({
        percentage: Math.round((i / steps.length) * 100),
        currentStep: step.id,
        label: `A processar ${step.label}...`
      });

      // Executa a sincronização da entidade
      await step.action();

      // Atualiza o progresso APÓS terminar a etapa
      await job.progress({
        percentage: Math.round(((i + 1) / steps.length) * 100),
        currentStep: step.id,
        label: `${step.label} concluído.`
      });
    }

    this.logger.log(`Sync completed for establishment ${establishmentId}`);

    try {
      this.logger.log(`Finalizing sync. Updating establishment languages to: ${finalLanguagesList.join(', ')}`);

      const establishment = await this.prisma.establishment.update({
        where: { id: establishmentId },
        data: {
          availableLanguages: finalLanguagesList,
        },
        select: {
          slug: true,
        }
      });

      this.cacheService.clearEstablishmentCache(
        establishment.slug,
      );

    } catch (error) {
      this.logger.error(`Failed to update establishment languages after sync: ${error.message}`);
      throw error; // Se falhar aqui, o Bull fará retry do job
    }

    return {
      synced: addedLanguages.length,
      establishmentId,
      status: 'success'
    };
  }

  /**
   * MÁQUINA DE SYNC GENÉRICA (Type-Safe)
   * Processa em batches usando cursor para evitar consumo excessivo de RAM
   */
  private async syncEntity<T extends { id: string; locale: string }, TCreate>(
    delegate: PrismaDelegate<T, TCreate>,
    where: any,
    parentKey: keyof T,
    jobData: LanguageSyncJobData,
    mapperFields: (source: T) => Omit<TCreate, 'locale'>,
  ) {
    let cursorId: string | undefined;

    while (true) {
      const translations: T[] = await delegate.findMany({
        where,
        orderBy: { id: 'asc' },
        take: LANGUAGE_SYNC_BATCH_SIZE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      });

      if (translations.length === 0) break;

      const createData = this.buildMissingTranslations(
        translations,
        parentKey,
        jobData.primaryLanguage,
        jobData.addedLanguages,
        (source, locale) => ({
          ...mapperFields(source),
          locale,
        } as unknown as TCreate),
      );

      if (createData.length > 0) {
        await delegate.createMany({
          data: createData,
          skipDuplicates: true,
        });
      }

      if (translations.length < LANGUAGE_SYNC_BATCH_SIZE) break;
      cursorId = translations[translations.length - 1].id;
    }
  }

  /**
   * Lógica de agrupamento e identificação de traduções em falta
   */
  private buildMissingTranslations<
    TTranslation extends Record<TParentKey, any> & { locale: string },
    TParentKey extends keyof TTranslation,
    TCreateData,
  >(
    translations: TTranslation[],
    parentKey: TParentKey,
    primaryLanguage: EstablishmentLanguage,
    addedLanguages: EstablishmentLanguage[],
    createMapper: (source: TTranslation, locale: EstablishmentLanguage) => TCreateData,
  ): TCreateData[] {
    const grouped = new Map<string, TTranslation[]>();

    for (const translation of translations) {
      const parentId = String(translation[parentKey]);
      const current = grouped.get(parentId);
      if (current) current.push(translation);
      else grouped.set(parentId, [translation]);
    }

    const createData: TCreateData[] = [];

    for (const group of grouped.values()) {
      // Tenta usar a língua primária como fonte, caso contrário usa a primeira disponível
      const source = group.find((entry) => entry.locale === primaryLanguage) ?? group[0];
      if (!source) continue;

      for (const locale of addedLanguages) {
        const hasLocale = group.some((entry) => entry.locale === locale);
        if (!hasLocale) {
          createData.push(createMapper(source, locale));
        }
      }
    }

    return createData;
  }

  private getJobId(establishmentId: string) {
    return `language-sync:${establishmentId}`;
  }
}