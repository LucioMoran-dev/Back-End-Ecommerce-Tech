import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Technology',
  })
  @IsString()
  @MaxLength(50)
  category_name: string;

  @ApiPropertyOptional({
    example: 'Laptops and ultrabooks for work and gaming',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
