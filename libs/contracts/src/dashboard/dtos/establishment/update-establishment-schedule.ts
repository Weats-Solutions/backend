import { Type } from "class-transformer";
import { CreateScheduleDto } from "../schedule/create-schedule.dto";
import { ValidateNested, IsString, IsNotEmpty } from "class-validator";

export class UpdateEstablishmentScheduleDto {
    @IsString()
    @IsNotEmpty()
    scheduleId: string;

    @Type(() => CreateScheduleDto)
    @ValidateNested()
    schedule: CreateScheduleDto;
}