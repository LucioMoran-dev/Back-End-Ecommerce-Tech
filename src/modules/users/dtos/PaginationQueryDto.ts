import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

export class UserSearchQueryDto extends PaginationQueryDto {
  // Filtro por nombre de la persona (columna `name`). Va aparte de `username`
  // porque antes solo se podia buscar por username: si dos usuarios se llaman
  // igual pero tienen username distinto, buscar por username perdia a uno.
  @ApiProperty({
    example: 'John Doe',
    required: false,
    description: 'Name (or partial name) to search for users',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'john_doe',
    required: false,
    description: 'Username to search for users',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'john@example.com',
    required: false,
    description: 'Email or partial email to search for users',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
