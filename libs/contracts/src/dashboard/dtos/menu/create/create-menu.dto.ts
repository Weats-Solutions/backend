import { Type } from 'class-transformer';
import {
    IsArray, IsDefined, IsEnum, IsEmpty, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, Max, Min, ValidateIf, ValidateNested
} from 'class-validator';
import { MenuTranslationDto } from '../translations/menu-translation.dto';
import { CreateScheduleDto } from '../../schedule/create-schedule.dto';
import { MenuType } from '@weats/database';

export class CreateMenuDto {

    @IsEnum(MenuType)
    type: MenuType;

    @ValidateIf(o => o.type === MenuType.RODIZIO)
    @IsNotEmpty({ message: 'Price is required for RODIZIO menus' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0, { message: 'Price must be greater than or equal to 0' })
    @Max(999999, { message: 'Price must be less than or equal to 999999' })
    @ValidateIf(o => o.type !== MenuType.RODIZIO)
    @IsEmpty({ message: 'Price is not allowed for this menu type' })
    price?: number;

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
