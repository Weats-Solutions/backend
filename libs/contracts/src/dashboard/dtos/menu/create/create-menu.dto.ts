import { Type } from 'class-transformer';
import {
    IsArray, ValidateNested
} from 'class-validator';
import { MenuTranslationDto } from '../translations/menu-translation.dto';
import { CreateScheduleDto } from '../../schedule/create-schedule.dto';

export class CreateMenuDto {
    @IsArray()
    @Type(() => MenuTranslationDto)
    @ValidateNested({ each: true })
    translations: MenuTranslationDto[];

    @Type(() => CreateScheduleDto)
    @ValidateNested()
    schedule: CreateScheduleDto;
}
