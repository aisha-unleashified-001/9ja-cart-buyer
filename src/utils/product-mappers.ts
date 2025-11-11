import type { Product, ProductSummary, PriceWithDiscount, ProductMedia, Inventory, ProductReviews, ProductFlags } from '../types';
import type { ApiProductData } from '../api/products';

// Helper function to calculate discount percentage
const calculateDiscountPercentage = (unitPrice: number, discountPrice: number): number => {
  if (unitPrice <= 0 || discountPrice >= unitPrice) return 0;
  return Math.round(((unitPrice - discountPrice) / unitPrice) * 100);
};

// Helper function to generate slug from product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Map API product data to internal Product type
export const mapApiProductToProduct = (apiProduct: ApiProductData): Product => {
  const unitPrice = parseFloat(apiProduct.unitPrice);
  const discountValue = parseFloat(apiProduct.discountValue);
  const discountPrice = parseFloat(apiProduct.discountPrice);
  
  // When discountValue is 0, there's no discount - use unitPrice as current price
  const hasDiscount = discountValue > 0 && discountPrice < unitPrice;
  
  // Create price object
  const price: PriceWithDiscount = {
    current: hasDiscount ? discountPrice : unitPrice,
    original: hasDiscount ? unitPrice : undefined,
    currency: 'NGN',
    discount: hasDiscount ? {
      percentage: calculateDiscountPercentage(unitPrice, discountPrice),
      amount: unitPrice - discountPrice,
      validUntil: undefined, // API doesn't provide this
      code: undefined, // API doesn't provide this
    } : undefined,
  };

  // Create inventory object
  const inventory: Inventory = {
    inStock: parseInt(apiProduct.stock) > 0,
    quantity: parseInt(apiProduct.stock),
    status: parseInt(apiProduct.stock) > parseInt(apiProduct.minStock) 
      ? 'in_stock' 
      : parseInt(apiProduct.stock) > 0 
        ? 'limited_stock' 
        : 'out_of_stock',
    lowStockThreshold: parseInt(apiProduct.minStock),
    trackQuantity: true,
  };

  // Create images object
  const images: ProductMedia = {
    main: apiProduct.images[0] || '/placeholder-product.jpg',
    gallery: apiProduct.images,
    alt: apiProduct.productName,
    videos: [], // API doesn't provide videos
  };

  // Create mock reviews (API doesn't provide reviews)
  const reviews: ProductReviews = {
    average: 4.0 + Math.random(), // Random rating between 4-5
    total: Math.floor(Math.random() * 100) + 10, // Random review count
  };

  // Create product flags
  const flags: ProductFlags = {
    featured: false, // Can be determined by business logic
    newArrival: new Date(apiProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // New if created in last 30 days
    bestseller: false, // Can be determined by sales data
  };

  return {
    id: apiProduct.productId,
    sku: apiProduct.productId, // Using productId as SKU
    name: apiProduct.productName,
    slug: generateSlug(apiProduct.productName),
    brand: undefined, // API doesn't provide brand
    model: undefined, // API doesn't provide model
    categoryId: apiProduct.categoryId,
    subcategoryId: undefined, // API doesn't provide subcategory
    tags: apiProduct.productTags,
    description: apiProduct.productDescription,
    shortDescription: apiProduct.productDescription.substring(0, 150) + '...', // Truncate for short description
    features: [], // API doesn't provide features
    specifications: {}, // API doesn't provide specifications
    price,
    inventory,
    variants: [], // API doesn't provide variants
    images,
    reviews,
    sellerId: apiProduct.storeName || 'api-seller', // Use storeName as sellerId
    storeName: apiProduct.storeName, // Store/vendor name from API
    shipping: {
      weight: undefined,
      dimensions: undefined,
      freeShipping: false, // Default value
      shippingClass: undefined,
      estimatedDelivery: '3-5 business days', // Default value
      restrictions: [],
    },
    returns: {
      returnable: true, // Default value
      period: 30, // Default 30 days
      unit: 'days',
      free: false, // Default value
      conditions: [],
    },
    warranty: undefined, // API doesn't provide warranty info
    seo: {
      title: apiProduct.productName,
      metaDescription: apiProduct.productDescription,
      keywords: apiProduct.productTags,
    },
    status: apiProduct.isActive === '1' ? 'active' : 'inactive',
    flags,
    createdAt: new Date(apiProduct.createdAt),
    updatedAt: new Date(apiProduct.updatedAt),
    publishedAt: new Date(apiProduct.createdAt),
  };
};

// Map API product data to internal ProductSummary type (for listings)
export const mapApiProductToProductSummary = (apiProduct: ApiProductData): ProductSummary => {
  const unitPrice = parseFloat(apiProduct.unitPrice);
  const discountValue = parseFloat(apiProduct.discountValue);
  const discountPrice = parseFloat(apiProduct.discountPrice);
  
  // When discountValue is 0, there's no discount - use unitPrice as current price
  const hasDiscount = discountValue > 0 && discountPrice < unitPrice;
  
  // Create price object
  const price: PriceWithDiscount = {
    current: hasDiscount ? discountPrice : unitPrice,
    original: hasDiscount ? unitPrice : undefined,
    currency: 'NGN',
    discount: hasDiscount ? {
      percentage: calculateDiscountPercentage(unitPrice, discountPrice),
      amount: unitPrice - discountPrice,
      validUntil: undefined,
      code: undefined,
    } : undefined,
  };

  // Create inventory summary
  const inventory = {
    inStock: parseInt(apiProduct.stock) > 0,
    status: parseInt(apiProduct.stock) > parseInt(apiProduct.minStock) 
      ? 'in_stock' as const
      : parseInt(apiProduct.stock) > 0 
        ? 'limited_stock' as const
        : 'out_of_stock' as const,
  };

  // Create images summary
  const images = {
    main: apiProduct.images[0] || '/placeholder-product.jpg',
    alt: apiProduct.productName,
  };

  // Create reviews summary
  const reviews = {
    average: 4.0 + Math.random(), // Random rating between 4-5
    total: Math.floor(Math.random() * 100) + 10, // Random review count
  };

  // Create product flags
  const flags: ProductFlags = {
    featured: false,
    newArrival: new Date(apiProduct.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    bestseller: false,
  };

  return {
    id: apiProduct.productId,
    sku: apiProduct.productId,
    name: apiProduct.productName,
    slug: generateSlug(apiProduct.productName),
    brand: undefined,
    categoryId: apiProduct.categoryId,
    price,
    inventory,
    images,
    reviews,
    flags,
    storeName: apiProduct.storeName, // Store/vendor name from API
  };
};

// Map array of API products to ProductSummary array
export const mapApiProductsToProductSummaries = (apiProducts: ApiProductData[]): ProductSummary[] => {
  return apiProducts.map(mapApiProductToProductSummary);
};

// Map array of API products to Product array
export const mapApiProductsToProducts = (apiProducts: ApiProductData[]): Product[] => {
  return apiProducts.map(mapApiProductToProduct);
};