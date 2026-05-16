import { SetMetadata } from '@nestjs/common';

export const SKIP_ESTABLISHMENT_STAFF_KEY = 'skipEstablishmentStaff';
export const SkipEstablishmentStaff = () => SetMetadata(SKIP_ESTABLISHMENT_STAFF_KEY, true);
