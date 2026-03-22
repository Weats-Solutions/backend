import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSecureHttpsUrl', async: false })
export class IsSecureHttpsUrlConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, _args: ValidationArguments) {
    try {
      const url = new URL(value);

      // 1. HTTPS obrigatório
      if (url.protocol !== 'https:') return false;

      const hostname = url.hostname.toLowerCase();

      // 2. localhost / loopback
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // 3. IPs privados
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
      ) {
        return false;
      }

      // 4. bloquear eupago.pt + subdomínios
      if (hostname === 'eupago.pt' || hostname.endsWith('.eupago.pt')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property}: A EuPago não aceita localhost, IPs locais nem URLs do domínio eupago.pt e exige HTTPS.`;
  }
}
