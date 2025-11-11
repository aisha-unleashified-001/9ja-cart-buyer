// Base types for reusability
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slug {
  slug: string;
}

export interface SEOData {
  title?: string;
  metaDescription?: string;
  keywords?: string[];
}

// Category types
export interface Category extends BaseEntity, Slug {
  name: string;
  parentId?: string;
  level: number;
  imageUrl?: string;
}

// Price types
export interface Price {
  current: number;
  original?: number;
  currency: string;
}

export interface Discount {
  percentage: number;
  amount: number;
  validUntil?: Date;
  code?: string;
}

export interface PriceWithDiscount extends Price {
  discount?: Discount;
}

// Inventory types
export type StockStatus = "in_stock" | "out_of_stock" | "limited_stock" | "pre_order";

export interface Inventory {
  inStock: boolean;
  quantity?: number;
  status: StockStatus;
  lowStockThreshold?: number;
  trackQuantity: boolean;
}

// Variant types
export type VariantType = "color" | "size" | "material" | "style";

export interface VariantOption {
  id: string;
  name: string;
  value: string;
  hex?: string; // for colors
  image?: string;
  priceModifier?: number;
  sku?: string;
  inStock: boolean;
}

export interface ProductVariant {
  type: VariantType;
  options: VariantOption[];
}

// Media types
export interface ProductMedia {
  main: string;
  gallery: string[];
  alt: string;
  videos?: string[];
}

// Reviews types
export interface ReviewBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ProductReviews {
  average: number;
  total: number;
  breakdown?: ReviewBreakdown;
}

// Seller types
export interface Seller extends BaseEntity {
  name: string;
  location?: string;
  verified: boolean;
  rating?: number;
  totalSales?: number;
}

// Shipping types
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "in";
}

export interface Shipping {
  weight?: number;
  dimensions?: Dimensions;
  freeShipping: boolean;
  shippingClass?: string;
  estimatedDelivery?: string;
  restrictions?: string[];
}

// Returns and warranty types
export interface Returns {
  returnable: boolean;
  period: number;
  unit: "days" | "weeks" | "months";
  free: boolean;
  conditions?: string[];
}

export interface Warranty {
  period: number;
  unit: "days" | "months" | "years";
  type: "manufacturer" | "seller" | "extended";
  details?: string;
}

// Product status types
export type ProductStatus = "active" | "inactive" | "draft" | "archived";

export interface ProductFlags {
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
}

// Main Product interface - optimized and modular
export interface Product extends BaseEntity, Slug {
  // Core identification
  sku: string;
  name: string;
  brand?: string;
  model?: string;

  // Categorization
  categoryId: string; // Reference to category
  subcategoryId?: string;
  tags: string[];

  // Content
  description: string;
  shortDescription?: string;
  features?: string[];
  specifications?: Record<string, string | number | boolean>;

  // Pricing
  price: PriceWithDiscount;

  // Inventory
  inventory: Inventory;

  // Variants (optional for simple products)
  variants?: ProductVariant[];

  // Media
  images: ProductMedia;

  // Reviews
  reviews: ProductReviews;

  // Seller reference
  sellerId: string; // Reference to seller
  storeName?: string; // Store/vendor name from API

  // Shipping
  shipping: Shipping;

  // Returns and warranty
  returns: Returns;
  warranty?: Warranty;

  // SEO
  seo?: SEOData;

  // Status and flags
  status: ProductStatus;
  flags: ProductFlags;

  // Published date
  publishedAt?: Date;
}

// Simplified Product for listings (performance optimization)
export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand?: string;
  categoryId: string;
  price: PriceWithDiscount;
  inventory: Pick<Inventory, 'inStock' | 'status'>;
  images: Pick<ProductMedia, 'main' | 'alt'>;
  reviews: Pick<ProductReviews, 'average' | 'total'>;
  flags: ProductFlags;
  storeName?: string; // Store/vendor name from API
}

// Product with populated references (for detailed views)
export interface ProductWithRelations extends Omit<Product, 'categoryId' | 'subcategoryId' | 'sellerId'> {
  category: Category;
  subcategory?: Category;
  seller: Seller;
}

// Cart types
export interface CartItem {
  // Client-side fields
  id: string;           // productId for guest, cartItemId for authenticated
  product: Product;     // Full product data
  quantity: number;
  
  // Server-side fields (when authenticated)
  cartItemId?: string;  // Backend cart item ID
  vendor?: string;      // Vendor ID from backend
  price?: number;       // Server-calculated price
  subtotal?: number;    // Server-calculated subtotal
  addedAt?: string;     // Server timestamp
  productImages?: string[]; // Server product images
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  isServerSynced: boolean; // Indicates if data is from server
}

// Order types
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: Address;
}

// User types
export interface User {
  id: string; // Maps to buyerId from API
  email: string; // Maps to emailAddress from API
  firstName: string;
  lastName: string;
  phone?: string; // Maps to phoneNumber from API
  avatar?: string;
  token?: string; // JWT token from API
  isActive?: boolean; // Maps to isActive from API
  isEmailVerified?: boolean; // Maps to isEmailVerified from API
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Verification types
export interface PendingVerification {
  identifier: string;
  verificationId: string;
}

// Profile-specific types
export interface UserProfile extends User {
  addresses: UserAddress[];
}

export interface UserAddress {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// Auth-related types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Profile update types
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Address types
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Checkout types
export interface BillingDetails {
  firstName: string;
  lastName: string;
  companyName?: string;
  streetAddress: string;
  apartment?: string;
  townCity: string;
  phoneNumber: string;
  emailAddress: string;
}

export interface CheckoutPaymentMethod {
  id: string;
  name: string;
  type: 'bank-card' | 'cash-on-delivery' | 'buy-now-pay-later' | 'emergency-credit';
  icon?: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}