import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class UpsertSystemConfigDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  configKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  configValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  groupName?: string;
}

export class BatchUpsertSystemConfigDto {
  @ApiProperty({ type: [UpsertSystemConfigDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertSystemConfigDto)
  items!: UpsertSystemConfigDto[];
}
