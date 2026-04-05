import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { ERRORS } from '../errors';

/**
 * Validator for phone numbers using libphonenumber-js.
 * Validates that a phone number string is valid for the given country code.
 */
@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments): boolean {
        const [propertyName] = args.constraints;
        const countryCodeRaw = (args.object as any)[propertyName];

        if (!countryCodeRaw || typeof countryCodeRaw !== 'string') {
            return false;
        }

        // 🔹 Normaliza o countryCode removendo o "+" se vier do frontend
        const countryCode = countryCodeRaw.replace(/^\+/, '');

        // Phone number deve ser digits only
        if (!/^\d+$/.test(value)) {
            return false;
        }

        // Construir E.164: +{countryCode}{phoneNumber}
        const e164 = `+${countryCode}${value}`;

        return isValidPhoneNumber(e164);
    }

    defaultMessage(args: ValidationArguments): string {
        return ERRORS.INVALID_PHONE_NUMBER;
    }
}

/**
 * Decorator to validate a phone number for a specific country code.
 */
export function IsValidPhoneNumber(
    propertyNameOfCountryCode: string,
    validationOptions?: ValidationOptions,
) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [propertyNameOfCountryCode],
            validator: IsValidPhoneNumberConstraint,
        });
    };
}

/**
 * Validator for ISO country codes using libphonenumber-js.
 */
@ValidatorConstraint({ name: 'isValidCountryCode', async: false })
export class IsValidCountryCodeConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }

        // 🔹 Normaliza o countryCode removendo "+" ou "00"
        const cleaned = value.replace(/^\+/, '').replace(/^00/, '');

        if (!/^\d{1,3}$/.test(cleaned)) {
            return false;
        }

        try {
            const result = parsePhoneNumber(`+${cleaned}1234567`);
            return result !== undefined;
        } catch {
            return false;
        }
    }

    defaultMessage(): string {
        return ERRORS.INVALID_PHONE_NUMBER;
    }
}

/**
 * Decorator to validate a country code (calling code).
 */
export function IsValidCountryCode(validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidCountryCodeConstraint,
        });
    };
}
