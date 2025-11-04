import type { 
  Product, 
  ProductSummary, 
  ProductWithRelations, 
  Category, 
  Seller,
  PriceWithDiscount 
} from '../types';

// Price utilities
export const formatPrice = (price: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(price);
};

export const calculateDiscountedPrice = (price: PriceWithDiscount): number => {
  if (!price.discount) return price.current;
  
  if (price.discount.validUntil && new Date() > price.discount.validUntil) {
    return price.current;
  }
  
  return price.current - price.discount.amount;
};

export const getDiscountPercentage = (price: PriceWithDiscount): number | null => {
  if (!price.discount || !price.original) return null;
  
  if (price.discount.validUntil && new Date() > price.discount.validUntil) {
    return null;
  }
  
  return Math.round(((price.original - price.current) / price.original) * 100);
};

// Product utilities
export const isProductInStock = (product: Product | ProductSummary): boolean => {
  return product.inventory.inStock && product.inventory.status !== 'out_of_stock';
};

export const isProductOnSale = (product: Product | ProductSummary): boolean => {
  const discount = product.price.discount;
  if (!discount) return false;
  
  if (discount.validUntil && new Date() > discount.validUntil) {
    return false;
  }
  
  return true;
};

export const getProductUrl = (product: Product | ProductSummary): string => {
  return `/products/${product.slug}`;
};

export const getProductImageUrl = (
  product: Product | ProductSummary, 
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string => {
  const baseUrl = product.images.main;
  
  // Add size parameters for image optimization
  const sizeParams = {
    thumbnail: 'w=150&h=150',
    medium: 'w=400&h=400',
    large: 'w=800&h=800'
  };
  
  return `${baseUrl}&${sizeParams[size]}&fit=crop`;
};

// Search and filter utilities
export const filterProducts = (
  products: (Product | ProductSummary)[],
  filters: {
    category?: string;
    brand?: string;
    priceRange?: { min: number; max: number };
    inStock?: boolean;
    onSale?: boolean;
    rating?: number;
    tags?: string[];
  }
): (Product | ProductSummary)[] => {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.categoryId !== filters.category) {
      return false;
    }
    
    // Brand filter
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }
    
    // Price range filter
    if (filters.priceRange) {
      const price = calculateDiscountedPrice(product.price);
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
    }
    
    // Stock filter
    if (filters.inStock !== undefined && isProductInStock(product) !== filters.inStock) {
      return false;
    }
    
    // Sale filter
    if (filters.onSale !== undefined && isProductOnSale(product) !== filters.onSale) {
      return false;
    }
    
    // Rating filter (only for full Product objects)
    if (filters.rating && 'reviews' in product && product.reviews.average < filters.rating) {
      return false;
    }
    
    // Tags filter (only for full Product objects)
    if (filters.tags && filters.tags.length > 0 && 'tags' in product) {
      const hasMatchingTag = filters.tags.some(tag => 
        product.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
};

export const searchProducts = (
  products: (Product | ProductSummary)[],
  query: string
): (Product | ProductSummary)[] => {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return products;
  
  return products.filter(product => {
    // Search in name
    if (product.name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in brand
    if (product.brand?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in SKU
    if (product.sku.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in tags (only for full Product objects)
    if ('tags' in product) {
      return product.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
    }
    
    return false;
  });
};

// Sort utilities
export type SortOption = 
  | 'name_asc' 
  | 'name_desc' 
  | 'price_asc' 
  | 'price_desc' 
  | 'rating_desc' 
  | 'newest' 
  | 'popular';

export const sortProducts = (
  products: (Product | ProductSummary)[],
  sortBy: SortOption
): (Product | ProductSummary)[] => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    
    case 'price_asc':
      return sorted.sort((a, b) => 
        calculateDiscountedPrice(a.price) - calculateDiscountedPrice(b.price)
      );
    
    case 'price_desc':
      return sorted.sort((a, b) => 
        calculateDiscountedPrice(b.price) - calculateDiscountedPrice(a.price)
      );
    
    case 'rating_desc':
      return sorted.sort((a, b) => {
        const aRating = 'reviews' in a ? a.reviews.average : 0;
        const bRating = 'reviews' in b ? b.reviews.average : 0;
        return bRating - aRating;
      });
    
    case 'newest':
      return sorted.sort((a, b) => {
        if ('createdAt' in a && 'createdAt' in b) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
    
    case 'popular':
      return sorted.sort((a, b) => {
        const aReviews = 'reviews' in a ? a.reviews.total : 0;
        const bReviews = 'reviews' in b ? b.reviews.total : 0;
        return bReviews - aReviews;
      });
    
    default:
      return sorted;
  }
};

// Data transformation utilities
export const populateProductRelations = (
  product: Product,
  categories: Category[],
  sellers: Seller[]
): ProductWithRelations => {
  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = product.subcategoryId 
    ? categories.find(c => c.id === product.subcategoryId)
    : undefined;
  const seller = sellers.find(s => s.id === product.sellerId);
  
  if (!category || !seller) {
    throw new Error('Required relations not found');
  }
  
  const { categoryId, subcategoryId, sellerId, ...productWithoutIds } = product;
  
  return {
    ...productWithoutIds,
    category,
    subcategory,
    seller
  };
};

// Validation utilities
export const validateProductData = (product: Partial<Product>): string[] => {
  const errors: string[] = [];
  
  if (!product.name?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!product.sku?.trim()) {
    errors.push('SKU is required');
  }
  
  if (!product.price?.current || product.price.current <= 0) {
    errors.push('Valid price is required');
  }
  
  if (!product.categoryId) {
    errors.push('Category is required');
  }
  
  if (!product.images?.main) {
    errors.push('Main image is required');
  }
  
  return errors;
};