import { Type } from 'class-transformer';
import {
    IsArray, IsDefined, IsNotEmptyObject, ValidateNested
} from 'class-validator';
import { MenuTranslationDto } from '../translations/menu-translation.dto';
import { CreateScheduleDto } from '../../schedule/create-schedule.dto';

export class CreateMenuDto {
    @IsArray()
    @Type(() => MenuTranslationDto)
    @ValidateNested({ each: true })
    translations: MenuTranslationDto[];

    @IsDefined()
    @IsNotEmptyObject()
    @Type(() => CreateScheduleDto)
    @ValidateNested()
    schedule: CreateScheduleDto;
}
