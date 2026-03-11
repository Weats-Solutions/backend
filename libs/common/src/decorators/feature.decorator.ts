import { SetMetadata } from '@nestjs/common';
import { feature } from '@weats/types';
import { FEATURE_KEY } from '@weats/common';

export const RequiresFeature = (featureName: feature) =>
  SetMetadata(FEATURE_KEY, featureName);
