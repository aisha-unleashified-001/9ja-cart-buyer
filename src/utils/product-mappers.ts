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

// Helper function to parse vendorLogo from URL-encoded JSON string
const parseVendorLogo = (vendorLogo?: string): string | undefined => {
  if (!vendorLogo) return undefined;
  
  try {
    // Check if vendorLogo is a URL with encoded JSON in the path
    // Format: https://api.9jacart.ng/%7B%22original%22:...%7D
    if (vendorLogo.startsWith('https://api.9jacart.ng/') || vendorLogo.startsWith('http://api.9jacart.ng/')) {
      // Extract everything after the domain (including the encoded JSON)
      const pathStart = vendorLogo.indexOf('/', vendorLogo.indexOf('//') + 2);
      if (pathStart !== -1) {
        const encodedPath = vendorLogo.substring(pathStart + 1);
        
        // Decode the URL-encoded path
        const decoded = decodeURIComponent(encodedPath);
        
        // Check if decoded path is a JSON string
        if (decoded.trim().startsWith('{')) {
          const logoData = JSON.parse(decoded);
          // Prefer large, then medium, then original, then thumbnail
          const logoUrl = logoData.large || logoData.medium || logoData.original || logoData.thumbnail;
          
          if (logoUrl) {
            // Normalize path separators and construct full URL
            const normalizedPath = logoUrl.replace(/\\/g, '/');
            if (normalizedPath.startsWith('public/')) {
              return `https://api.9jacart.ng/${normalizedPath}`;
            }
            // If it's already a full URL, return as is
            if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
              return normalizedPath;
            }
            // Otherwise, assume it's relative to the API base
            return `https://api.9jacart.ng/${normalizedPath}`;
          }
        }
      }
    }
    
    // Try to decode the entire string if it's URL-encoded JSON (without domain)
    try {
      const decoded = decodeURIComponent(vendorLogo);
      if (decoded.trim().startsWith('{')) {
        const logoData = JSON.parse(decoded);
        const logoUrl = logoData.large || logoData.medium || logoData.original || logoData.thumbnail;
        
        if (logoUrl) {
          const normalizedPath = logoUrl.replace(/\\/g, '/');
          if (normalizedPath.startsWith('public/')) {
            return `https://api.9jacart.ng/${normalizedPath}`;
          }
          if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
            return normalizedPath;
          }
          return `https://api.9jacart.ng/${normalizedPath}`;
        }
      }
    } catch (e) {
      // Not a JSON string, continue
    }
    
    // If it's already a valid URL, return as is
    if (vendorLogo.startsWith('http://') || vendorLogo.startsWith('https://')) {
      return vendorLogo;
    }
    
    return undefined;
  } catch (error) {
    console.warn('Failed to parse vendorLogo:', error, vendorLogo);
    // If parsing fails but it looks like a URL, return it
    if (vendorLogo.startsWith('http://') || vendorLogo.startsWith('https://')) {
      return vendorLogo;
    }
    return undefined;
  }
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

  // Create images object — handle both 'images' and 'productImages' (single-product API may differ)
  const rawImages = Array.isArray((apiProduct as Record<string, unknown>).images)
    ? (apiProduct as Record<string, unknown>).images as string[]
    : Array.isArray((apiProduct as Record<string, unknown>).productImages)
    ? (apiProduct as Record<string, unknown>).productImages as string[]
    : [];
  const images: ProductMedia = {
    main: (rawImages[0] && typeof rawImages[0] === 'string' ? rawImages[0] : null) || '/placeholder-product.jpg',
    gallery: rawImages.filter((u): u is string => typeof u === 'string'),
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
    categoryName: apiProduct.categoryName, // Include category name for related products filtering
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
    vendorId: apiProduct.vendorId, // Vendor ID from API
    storeName: apiProduct.storeName, // Store/vendor name from API
    vendorLogo: parseVendorLogo(apiProduct.vendorLogo), // Parse and extract vendor logo URL
    isSubaccountSet: apiProduct.isSubaccountSet, // Preserve subaccount status
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

  // Create images summary — handle both 'images' and 'productImages'
  const rawImages = Array.isArray((apiProduct as Record<string, unknown>).images)
    ? (apiProduct as Record<string, unknown>).images as string[]
    : Array.isArray((apiProduct as Record<string, unknown>).productImages)
    ? (apiProduct as Record<string, unknown>).productImages as string[]
    : [];
  const images = {
    main: (rawImages[0] && typeof rawImages[0] === 'string' ? rawImages[0] : null) || '/placeholder-product.jpg',
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
    categoryName: apiProduct.categoryName, // Include category name for related products filtering
    tags: apiProduct.productTags,
    description: apiProduct.productDescription, // Include full description
    shortDescription: apiProduct.productDescription ? apiProduct.productDescription.substring(0, 150) + '...' : undefined, // Truncate for short description
    price,
    inventory,
    images,
    reviews,
    flags,
    vendorId: apiProduct.vendorId, // Vendor ID from API
    storeName: apiProduct.storeName, // Store/vendor name from API
    vendorLogo: parseVendorLogo(apiProduct.vendorLogo), // Parse and extract vendor logo URL
  };
};

// Map array of API products to ProductSummary array
export const mapApiProductsToProductSummaries = (apiProducts: ApiProductData[]): ProductSummary[] => {
  // Buyer-side rule: do not expose inactive products
  return apiProducts
    .filter((p) => p.isActive === '1')
    .map(mapApiProductToProductSummary);
};

// Map array of API products to Product array
export const mapApiProductsToProducts = (apiProducts: ApiProductData[]): Product[] => {
  // Buyer-side rule: do not expose inactive products
  return apiProducts
    .filter((p) => p.isActive === '1')
    .map(mapApiProductToProduct);
};

/** Recently-viewed API product shape (currentPrice, productImages, vendor, etc.). */
export type RecentlyViewedApiItem = Record<string, unknown> & {
  productId?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  currentPrice?: number;
  originalPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;
  productImages?: string[];
  stock?: number;
  minStock?: number;
  stockStatus?: string;
  isAvailable?: boolean;
  vendor?: { vendorId?: string; storeName?: string };
  productTags?: string[];
  vendorId?: string;
  storeName?: string;
  vendorLogo?: string;
  createdAt?: string;
  /** Optional: average rating 0–5 */
  averageRating?: number;
  /** Optional: total number of ratings */
  totalRatings?: number;
};

function mapStockStatus(status?: string): 'in_stock' | 'limited_stock' | 'out_of_stock' {
  const s = String(status ?? '').toUpperCase();
  if (s === 'OUT_OF_STOCK' || s === 'OUT OF STOCK') return 'out_of_stock';
  if (s === 'LOW_STOCK' || s === 'LOW STOCK' || s === 'LIMITED_STOCK') return 'limited_stock';
  return 'in_stock';
}

function mapRecentlyViewedItemToProductSummary(item: RecentlyViewedApiItem): ProductSummary {
  const id = String(item.productId ?? item.id ?? '');
  const name = String(item.name ?? item.productName ?? 'Product');
  const desc = String(item.description ?? item.productDescription ?? '');
  const currentPrice = typeof item.currentPrice === 'number' ? item.currentPrice : (parseFloat(String(item.currentPrice ?? '0')) || 0);
  const originalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : (parseFloat(String(item.originalPrice ?? '0')) || 0);
  const discountPrice = typeof item.discountPrice === 'number' ? item.discountPrice : (parseFloat(String(item.discountPrice ?? '0')) || 0);
  const discountPct = typeof item.discountPercentage === 'number' ? item.discountPercentage : (parseFloat(String(item.discountPercentage ?? '0')) || 0);
  const hasDiscount = Boolean(item.hasDiscount) && (discountPrice > 0 || discountPct > 0);
  const imgs = Array.isArray(item.productImages) ? item.productImages : (Array.isArray((item as any).images) ? (item as any).images : []);
  const mainImg = imgs[0] || '/placeholder-product.jpg';
  const inStock = item.isAvailable !== undefined ? Boolean(item.isAvailable) : (typeof item.stock === 'number' ? item.stock > 0 : true);
  const status = mapStockStatus(item.stockStatus);
  const vendor = item.vendor && typeof item.vendor === 'object' ? item.vendor as { vendorId?: string; storeName?: string } : null;
  const vendorId = vendor?.vendorId ?? (item.vendorId != null ? String(item.vendorId) : undefined);
  const storeName = vendor?.storeName ?? (item.storeName != null ? String(item.storeName) : undefined);

  return {
    id,
    sku: id,
    name,
    slug: generateSlug(name),
    brand: undefined,
    categoryId: String(item.categoryId ?? ''),
    categoryName: item.categoryName != null ? String(item.categoryName) : undefined,
    tags: Array.isArray(item.productTags) ? item.productTags : undefined,
    description: desc || undefined,
    shortDescription: desc ? desc.slice(0, 150) + (desc.length > 150 ? '...' : '') : undefined,
    price: {
      current: hasDiscount && discountPrice > 0 ? discountPrice : currentPrice,
      original: hasDiscount && originalPrice > 0 ? originalPrice : undefined,
      currency: 'NGN',
      discount: hasDiscount && (discountPct > 0 || (originalPrice > 0 && discountPrice > 0)) ? {
        percentage: discountPct > 0 ? discountPct : (originalPrice > 0 ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) : 0),
        amount: originalPrice > 0 && discountPrice > 0 ? originalPrice - discountPrice : 0,
        validUntil: undefined,
        code: undefined,
      } : undefined,
    },
    inventory: { inStock, status },
    images: { main: mainImg, alt: name },
    reviews: {
      average: typeof item.averageRating === 'number' ? item.averageRating : 4,
      total: typeof item.totalRatings === 'number' ? item.totalRatings : 1,
    },
    flags: { featured: false, newArrival: false, bestseller: false },
    vendorId,
    storeName,
    vendorLogo: parseVendorLogo(item.vendorLogo as string | undefined),
  };
}

export function mapRecentlyViewedToProductSummaries(
  items: RecentlyViewedApiItem[]
): ProductSummary[] {
  return items.map(mapRecentlyViewedItemToProductSummary);
}