import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';
import { v2 as CloudinaryType } from 'cloudinary';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { File } from './entities/file.entity';
import { ICloudinaryUploadResult } from './interface/file.interface';
import { Product } from '../products/entities/products.entity';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof CloudinaryType,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async uploadImage(id: string, file: Express.Multer.File): Promise<{ id: string; url: string }> {
    if (!file?.buffer) {
      this.logger.error('Empty or missing file');
      throw new BadRequestException('Invalid file');
    }

    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      this.logger.warn(`Product with ID ${id} not found`);
      throw new NotFoundException(`Product with ID ${id} does not exist`);
    }

    this.logger.log(`Uploading image for product: ${product.id}`);

    const result = await this.uploadToCloudinary(file);
    this.logger.log(`Image uploaded successfully: ${result.secure_url}`);

    const image = this.fileRepo.create({
      url: result.secure_url,
      mimeType: file.mimetype,
      publicId: result.public_id,
      product: { id } as Product,
    });

    await this.fileRepo.save(image);

    const updatedFiles = await this.fileRepo.find({
      where: { product: { id } },
      order: { createdAt: 'ASC' },
    });

    await this.productRepo.update(id, { imgUrls: updatedFiles.map((f) => f.url) });
    await this.cacheManager.del(`/products/${id}`);

    return { id: image.id, url: image.url };
  }

  async destroyFromCloudinary(publicId: string): Promise<void> {
    if (!publicId) return;
    try {
      await this.cloudinary.uploader.destroy(publicId);
      this.logger.log(`Cloudinary asset destroyed: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to destroy Cloudinary asset ${publicId}`, error as Error);
    }
  }

  async uploadManyToCloudinary(
    files: Express.Multer.File[],
  ): Promise<{ secureUrl: string; publicId: string; mimeType: string }[]> {
    const uploaded: { secureUrl: string; publicId: string; mimeType: string }[] = [];
    try {
      for (const file of files) {
        const result = await this.uploadToCloudinary(file);
        uploaded.push({ secureUrl: result.secure_url, publicId: result.public_id, mimeType: file.mimetype });
      }
      return uploaded;
    } catch (error) {
      await Promise.all(uploaded.map((u) => this.destroyFromCloudinary(u.publicId)));
      throw error;
    }
  }

  private uploadToCloudinary(file: Express.Multer.File): Promise<ICloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || 'products',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Error uploading image to Cloudinary', error);
            return reject(new Error('Error uploading image to Cloudinary'));
          }
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(stream);
    });
  }

  async getProductImages(productId: string): Promise<File[]> {
    return await this.fileRepo.find({
      where: { product: { id: productId } },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteImage(imageId: string): Promise<{ message: string }> {
    const image = await this.fileRepo.findOne({
      where: { id: imageId },
      relations: ['product'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    const productId = image.product.id;
    const { publicId } = image;

    await this.fileRepo.remove(image);

    const remainingFiles = await this.fileRepo.find({
      where: { product: { id: productId } },
    });

    await this.productRepo.update(productId, {
      imgUrls: remainingFiles.map((f) => f.url),
    });
    await this.cacheManager.del(`/products/${productId}`);
    await this.destroyFromCloudinary(publicId);

    return { message: 'Image deleted successfully' };
  }
}
