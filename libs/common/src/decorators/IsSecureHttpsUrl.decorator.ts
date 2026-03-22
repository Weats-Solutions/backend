import { Validate } from 'class-validator';
import { IsSecureHttpsUrlConstraint } from '../validators/IsSecureHttpsUrlConstraint.validator';

export function IsSecureHttpsUrl() {
    return Validate(IsSecureHttpsUrlConstraint);
}
