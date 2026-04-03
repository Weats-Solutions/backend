import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { validateVatEU  } from '@salespark/validate-vat-eu';

/**
 * Validator for Tax IDs (VAT numbers) using country code.
 * Uses @salespark/validate-vat-eu library which supports all EU countries and beyond.
 */
@ValidatorConstraint({ name: 'isValidTaxId', async: true })
export class IsValidTaxIdConstraint implements ValidatorConstraintInterface {
    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        const [propertyName] = args.constraints;
        const countryCode = (args.object as any)[propertyName];

        if (!countryCode || typeof countryCode !== 'string') {
            return false;
        }

        const cleanValue = value.replace(/\s|-/g, '').toUpperCase();
        
        try {
            const result = await validateVatEU(countryCode, cleanValue);
            return result.valid;
        } catch {
            // If VIES service fails, do basic validation as fallback
            return this.basicValidation(cleanValue, countryCode);
        }
    }

    defaultMessage(args: ValidationArguments): string {
        const [propertyName] = args.constraints;
        const countryCode = (args.object as any)[propertyName];
        return `billingTaxId: ID fiscal inválido para o país ${countryCode || 'desconhecido'}`;
    }

    /**
     * Basic validation for fallback when VIES service is unavailable
     */
    private basicValidation(value: string, countryCode: string): boolean {
        const cleanValue = value.replace(/\s|-/g, '').toUpperCase();

        // At least 5 characters
        if (cleanValue.length < 5) {
            return false;
        }

        // Must contain alphanumeric
        if (!/^[A-Z0-9]+$/.test(cleanValue)) {
            return false;
        }

        return true;
    }
}

/**
 * Decorator to validate a Tax ID (NIF/CIF) for a specific country code.
 * Must be used with @IsString() and @IsNotEmpty() before it.
 *
 * Example:
 *   @IsString()
 *   @IsNotEmpty()
 *   @IsValidTaxId('countryCode')
 *   billingTaxId: string;
 *
 * @param propertyNameOfCountryCode The property name that holds the country code (e.g., 'countryCode')
 * @param validationOptions Optional validation options
 */
export function IsValidTaxId(
    propertyNameOfCountryCode: string,
    validationOptions?: ValidationOptions,
) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [propertyNameOfCountryCode],
            validator: IsValidTaxIdConstraint,
        });
    };
}
