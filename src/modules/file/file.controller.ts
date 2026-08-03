import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FileService } from './file.service';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { FileResponseDto, UploadImageDto } from './dto/file.Dto';

import { AuthGuard } from '../../guards/auth.guards';
import { RoleGuard } from '../../guards/auth.guards.role';
import { Roles, UserRole } from '../../decorator/role.decorator';

@ApiTags('File')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiBearerAuth()
  @Post('uploadImage/:id')
  @ApiOperation({ summary: 'Upload image for a product' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Tipo de archivo no permitido. Solo se permiten: JPEG, JPG, PNG, WEBP'),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida exitosamente',
    type: FileResponseDto,
  })
  uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was provided');
    }
    return this.fileService.uploadImage(id, file);
  }

  @ApiBearerAuth()
  @Get('product/:productId')
  @ApiOperation({ summary: 'List images of a product (admin)' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Product images retrieved',
    type: [FileResponseDto],
  })
  async getProductImages(@Param('productId', ParseUUIDPipe) productId: string): Promise<FileResponseDto[]> {
    const files = await this.fileService.getProductImages(productId);
    return files.map((f) => ({ id: f.id, url: f.url }));
  }

  @ApiBearerAuth()
  @Delete('image/:imageId')
  @ApiOperation({ summary: 'Delete a product image (also removes the file from Cloudinary) - Admin only' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
  })
  async deleteProductImage(@Param('imageId', ParseUUIDPipe) imageId: string): Promise<{ message: string }> {
    return await this.fileService.deleteImage(imageId);
  }
}
