import { Product } from '../../products/entities/products.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  publicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product, (product) => product.files, { onDelete: 'CASCADE' })
  product: Product;
}
