export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  coverImage?: string | null;
  description?: string | null;
  content?: string | null;
  price: string | number;
  stock: number;
  category?: ProductCategory | null;
}

