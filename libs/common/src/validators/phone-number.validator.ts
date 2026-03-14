import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

/**
 * Validator for phone numbers using libphonenumber-js.
 * Validates that a phone number string is valid for the given country code.
 */
@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: any): boolean {
        const [countryCode] = args.constraints;

        // Phone number should be digits only
        if (!/^\d+$/.test(value)) {
            return false;
        }

        // Construct E.164 format: +{countryCode}{phoneNumber}
        const e164 = `+${countryCode}${value}`;

        // Validate using libphonenumber-js
        return isValidPhoneNumber(e164);
    }

    defaultMessage(args: any): string {
        const [countryCode] = args.constraints;
        return `customerPhone: Número de telefone inválido para o país ${countryCode}`;
    }
}

/**
 * Decorator to validate a phone number for a specific country code.
 * Must be used with @IsString() and @IsNotEmpty() before it.
 *
 * Example:
 *   @IsString()
 *   @IsNotEmpty()
 *   @IsValidPhoneNumber('countryCode')
 *   customerPhone: string;
 *
 * @param propertyNameOfCountryCode The property name that holds the country code (e.g., 'countryCode')
 * @param validationOptions Optional validation options
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
 * Checks that a country code is valid (can parse a phone number with it).
 */
@ValidatorConstraint({ name: 'isValidCountryCode', async: false })
export class IsValidCountryCodeConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean {
        // Country code should be 1-3 digits
        if (!/^\d{1,3}$/.test(value)) {
            return false;
        }

        // Try to find a country that uses this calling code
        // We use a simple heuristic: try to parse a dummy phone number
        try {
            const result = parsePhoneNumber(`+${value}1234567`);
            return result !== undefined;
        } catch {
            return false;
        }
    }

    defaultMessage(): string {
        return 'countryCode: Indicativo de país inválido';
    }
}

/**
 * Decorator to validate a country code (calling code).
 * Must be used with @IsString() and @IsNotEmpty() before it.
 *
 * Example:
 *   @IsString()
 *   @IsNotEmpty()
 *   @IsValidCountryCode()
 *   countryCode: string;
 *
 * @param validationOptions Optional validation options
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
