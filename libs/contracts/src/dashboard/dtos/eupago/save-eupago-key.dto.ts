import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { EUPAGO_KEY_PATTERN } from '@weats/common';


export class SaveEupagoKeyDto {
    @IsString()
    @IsNotEmpty({ message: 'A chave da API EuPago não pode estar vazia.' })
    @Matches(EUPAGO_KEY_PATTERN, {
        message:
            'Formato de chave inválido. Formatos aceites: a2eb-3e54-2bfa-439 ou demo-a2eb-3e54-2bfa-439',
    })
    apiKey: string;
}
