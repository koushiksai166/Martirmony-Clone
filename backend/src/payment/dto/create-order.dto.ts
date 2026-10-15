import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PlanKey {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export class CreateOrderDto {
  @ApiPropertyOptional({ enum: PlanKey, default: PlanKey.SILVER })
  @IsOptional()
  @IsEnum(PlanKey)
  plan?: PlanKey = PlanKey.SILVER;
}
