// mail/subjects/index.ts
import { subjects as en } from './en';
import { subjects as pt } from './pt';
import { subjects as es } from './es';

import type { ACCEPTED_LANGUAGES } from '@weats/types';

export const SUBJECTS: Record<ACCEPTED_LANGUAGES, Record<string, string>> = {
    en,
    pt,
    es,
};
