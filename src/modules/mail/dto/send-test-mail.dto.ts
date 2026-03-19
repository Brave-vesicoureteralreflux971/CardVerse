import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendTestMailDto {
  @ApiProperty()
  @IsEmail()
  toEmail!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiProperty()
  @IsString()
  content!: string;
}
