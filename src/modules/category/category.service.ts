import { Injectable, HttpException, HttpStatus, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { Category } from './entities/category.entity';
import { PRODUCTS_SEED } from 'src/seeds/products.data';
import { CategorySearchQueryDto } from './dto/PaginationQueryDto';
import { ICreateCategory } from './interface/category.interface';
import { IPaginatedResult } from '../../common/pagination';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async preloadCategories(): Promise<{ message: string }> {
    const uniqueCategory_names = new Set<string>();
    const categoriesToInsert: Category[] = [];

    for (const cat of PRODUCTS_SEED) {
      const name = cat.category_name;

      if (uniqueCategory_names.has(name)) continue;
      uniqueCategory_names.add(name);

      const exists = await this.findByName(name);
      if (!exists) {
        const newCategory = new Category();
        newCategory.category_name = name;
        categoriesToInsert.push(newCategory);
      }
    }

    if (categoriesToInsert.length > 0) {
      await this.categoryRepo.save(categoriesToInsert);
      await this.cacheManager.del('/categories');
      return { message: 'Categories seeded successfully' };
    }

    throw new HttpException('Categories already exist', HttpStatus.CONFLICT);
  }

  async getCategories(query?: CategorySearchQueryDto): Promise<IPaginatedResult<Category>> {
    const { page = 1, limit = 10, category } = query || {};

    const queryBuilder = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .leftJoinAndSelect('products.category', 'productCategory');

    if (category) {
      queryBuilder.andWhere('LOWER(category.category_name) LIKE LOWER(:category)', {
        category: `%${category}%`,
      });
    }

    queryBuilder.orderBy('category.category_name', 'ASC');

    const [categories, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    for (const cat of categories) {
      cat.products?.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return {
      items: categories,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findByName(category_name: string): Promise<Category | null> {
    return await this.categoryRepo.findOneBy({ category_name });
  }

  async createCategory(dto: ICreateCategory): Promise<Category> {
    const exists = await this.findByName(dto.category_name);
    if (exists) {
      throw new HttpException(`Category "${dto.category_name}" already exists`, HttpStatus.CONFLICT);
    }

    const category = this.categoryRepo.create({
      category_name: dto.category_name,
    });
    const savedCategory = await this.categoryRepo.save(category);
    await this.cacheManager.del('/categories');
    return savedCategory;
  }

  async getByIdCategory(id: string): Promise<Category> {
    const exist = await this.categoryRepo.findOne({ where: { id }, relations: ['products', 'products.variants'] });
    if (!exist) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return exist;
  }
}
