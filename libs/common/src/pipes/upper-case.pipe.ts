import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ToUpperCasePipe implements PipeTransform {
    transform(value: any) {
        if (typeof value !== 'string') {
            return value;
        }
        return value.toUpperCase();
    }
}
