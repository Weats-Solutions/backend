import { EstablishmentLanguage } from '@weats/database';

export interface LanguageSyncJobData {
  establishmentId: string;
  primaryLanguage: EstablishmentLanguage;
  addedLanguages: EstablishmentLanguage[];
  finalLanguagesList: EstablishmentLanguage[];
}
