import { IProducts } from 'src/modules/products/interface/products.interface';
export interface ICategory {
  id: string;
  category_name: string;
  description: string | null;
  products?: IProducts[];
}
export interface ICreateCategory {
  category_name: string;
  description?: string | null;
}
export interface IUpdateCategory {
  category_name?: string;
  description?: string | null;
}
