import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMailTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  eventCode!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;
}

export class UpdateMailTemplateDto extends CreateMailTemplateDto {}
