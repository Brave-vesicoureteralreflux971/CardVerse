import { CardStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ImportCardsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  batchName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cards!: string[];
}

export class UpdateCardDto {
  @ApiProperty()
  @IsString()
  cardSecret!: string;

  @ApiPropertyOptional({ enum: CardStatus })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;
}

export class UpdateCardStatusDto {
  @ApiProperty({ enum: CardStatus })
  @IsEnum(CardStatus)
  status!: CardStatus;
}

export class CardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({ enum: CardStatus })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;
}

export class BatchDeleteCardsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cardIds!: string[];
}
