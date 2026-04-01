import { Type } from "class-transformer";
import { CreateScheduleDto } from "../schedule/create-schedule.dto";
import { ValidateNested } from "class-validator";

export class UpdateEstablishmentScheduleDto {
    @Type(() => CreateScheduleDto)
    @ValidateNested()
    schedule: CreateScheduleDto;
}