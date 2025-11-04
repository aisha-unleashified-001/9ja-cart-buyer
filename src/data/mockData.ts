import type {
  Product,
  ProductSummary,
  Category,
  Seller,
  Order,
  User,
} from "../types";

/**
 * @deprecated These categories use mock data and will be removed in a future version.
 * Use the real API categories from './hooks/api/useRealCategories' instead:
 * - useAllRealCategories() for all categories including services
 * - useRealCategories() for paginated categories
 */
// Mock categories
export const mockCategories: Category[] = [
  {
    id: "appliances",
    name: "Appliances",
    slug: "appliances",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "baby-products",
    name: "Baby Products",
    slug: "baby-products",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "devices-accessories",
    name: "Devices & Accessories",
    slug: "devices-accessories",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "groceries",
    name: "Groceries",
    slug: "groceries",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "health",
    name: "Health",
    slug: "health",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "laundry",
    name: "Laundry",
    slug: "laundry",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1517677129300-07b130802f46?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "fashion",
    name: "Fashion",
    slug: "fashion",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "services",
    name: "Services",
    slug: "services",
    level: 1,
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Services subcategories
  {
    id: "mobile-topup",
    name: "Mobile Top Up",
    slug: "mobile-topup",
    parentId: "services",
    level: 2,
    imageUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "bills",
    name: "Bills",
    slug: "bills",
    parentId: "services",
    level: 2,
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock sellers
export const mockSellers: Seller[] = [
  {
    id: "seller-1",
    name: "TechStore Pro",
    location: "New York, USA",
    verified: true,
    rating: 4.8,
    totalSales: 15420,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "seller-2",
    name: "Fashion Hub",
    location: "Los Angeles, USA",
    verified: true,
    rating: 4.6,
    totalSales: 8930,
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock products with optimized structure
export const mockProducts: Product[] = [
  {
    id: "1",
    sku: "HVG-G92",
    name: "Havic HV G-92 Gamepad",
    slug: "havic-hv-g-92-gamepad",
    brand: "Havic",
    model: "HV G-92",
    categoryId: "electronics",
    tags: ["gaming", "controller", "wireless", "playstation"],
    description:
      "PlayStation 5 Controller Skin High quality vinyl with air channel adhesive for easy bubble free install & mess free removal Pressure sensitive.",
    shortDescription:
      "PlayStation 5 Controller Skin High quality vinyl with air channel adhesive for easy bubble free install & mess free removal Pressure sensitive.",
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Quick charge (3 hours in 15 minutes)",
      "Premium leather ear cups",
      "Multi-device connectivity",
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      Impedance: "32 ohms",
      Weight: "250g",
      "Bluetooth Version": "5.0",
    },
    price: {
      current: 96000.0,
      original: 120000.0,
      currency: "NGN",
      discount: {
        percentage: 20,
        amount: 48.0,
        validUntil: new Date("2024-12-31"),
      },
    },
    inventory: {
      inStock: true,
      quantity: 45,
      status: "in_stock",
      lowStockThreshold: 10,
      trackQuantity: true,
    },
    variants: [
      {
        type: "color",
        options: [
          {
            id: "white-blue",
            name: "White & Blue",
            value: "white-blue",
            hex: "#4A90E2",
            image:
              "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
            inStock: true,
          },
          {
            id: "pink",
            name: "Pink",
            value: "pink",
            hex: "#FF69B4",
            image:
              "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
            inStock: true,
          },
        ],
      },
      {
        type: "size",
        options: [
          {
            id: "xs",
            name: "Extra Small",
            value: "xs",
            inStock: true,
          },
          {
            id: "s",
            name: "Small",
            value: "s",
            inStock: true,
          },
          {
            id: "m",
            name: "Medium",
            value: "m",
            inStock: true,
          },
          {
            id: "l",
            name: "Large",
            value: "l",
            inStock: true,
          },
          {
            id: "xl",
            name: "Extra Large",
            value: "xl",
            inStock: true,
          },
        ],
      },
    ],
    images: {
      main: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1592840062661-eb5ad9746842?w=500&h=500&fit=crop",
      ],
      alt: "Havic HV G-92 Gamepad",
      videos: ["https://example.com/product-video.mp4"],
    },
    reviews: {
      average: 4.5,
      total: 150,
      breakdown: {
        5: 95,
        4: 35,
        3: 15,
        2: 3,
        1: 2,
      },
    },
    sellerId: "seller-1",
    shipping: {
      weight: 0.5,
      dimensions: {
        length: 20,
        width: 18,
        height: 8,
        unit: "cm",
      },
      freeShipping: true,
      estimatedDelivery: "2-3 business days",
      restrictions: [],
    },
    returns: {
      returnable: true,
      period: 30,
      unit: "days",
      free: true,
      conditions: ["Original packaging required", "No damage or wear"],
    },
    warranty: {
      period: 2,
      unit: "years",
      type: "manufacturer",
      details: "Full manufacturer warranty covering defects",
    },
    seo: {
      title: "Premium Wireless Bluetooth Headphones - AudioTech AT-WH1000",
      metaDescription:
        "Experience premium sound quality with our wireless Bluetooth headphones featuring active noise cancellation and 30-hour battery life.",
      keywords: [
        "wireless headphones",
        "bluetooth",
        "noise cancelling",
        "premium audio",
      ],
    },
    status: "active",
    flags: {
      featured: true,
      newArrival: false,
      bestseller: true,
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    sku: "HVG-G92-2",
    name: "HAVIT HV-G92 Gamepad",
    slug: "havit-hv-g92-gamepad-red",
    brand: "HAVIT",
    model: "HV-G92",
    categoryId: "electronics",
    tags: ["gaming", "controller", "wired", "pc"],
    description:
      "Professional gaming controller with ergonomic design and responsive buttons for PC gaming.",
    shortDescription: "Professional gaming controller for PC",
    price: {
      current: 60000.0,
      original: 80000.0,
      currency: "NGN",
      discount: {
        percentage: 40,
        amount: 40.0,
        validUntil: new Date("2024-12-31"),
      },
    },
    inventory: {
      inStock: true,
      quantity: 23,
      status: "in_stock",
      trackQuantity: true,
    },
    features: [
      "Ergonomic design",
      "Responsive buttons",
      "Wired connection",
      "Compatible with PC",
      "Durable construction",
    ],
    specifications: {
      Connection: "USB Wired",
      Compatibility: "PC/Steam",
      "Cable Length": "1.8m",
      Weight: "280g",
      Warranty: "1 year",
    },
    images: {
      main: "https://images.unsplash.com/photo-1592840062661-eb5ad9746842?w=500&h=500&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1592840062661-eb5ad9746842?w=500&h=500&fit=crop",
      ],
      alt: "HAVIT HV-G92 Gamepad",
    },
    reviews: {
      average: 4.8,
      total: 88,
    },
    sellerId: "seller-1",
    shipping: {
      weight: 0.3,
      dimensions: {
        length: 15,
        width: 10,
        height: 5,
        unit: "cm",
      },
      freeShipping: true,
      estimatedDelivery: "1-2 business days",
      restrictions: [],
    },
    returns: {
      returnable: true,
      period: 30,
      unit: "days",
      free: true,
      conditions: ["Original packaging required"],
    },
    warranty: {
      period: 1,
      unit: "years",
      type: "manufacturer",
      details: "Full manufacturer warranty",
    },
    seo: {
      title: "HAVIT HV-G92 Gaming Controller - Professional PC Gamepad",
      metaDescription:
        "Professional gaming controller with ergonomic design for PC gaming.",
      keywords: ["gaming controller", "pc gamepad", "havit", "gaming"],
    },
    status: "active",
    flags: {
      featured: false,
      newArrival: false,
      bestseller: true,
    },
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    publishedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    sku: "AK900-KB",
    name: "AK-900 Wired Keyboard",
    slug: "ak-900-wired-keyboard",
    brand: "AK",
    model: "AK-900",
    categoryId: "electronics",
    tags: ["keyboard", "gaming", "mechanical", "rgb"],
    description:
      "Mechanical gaming keyboard with RGB backlighting and responsive switches.",
    shortDescription: "Mechanical gaming keyboard with RGB",
    price: {
      current: 480000.0,
      original: 580000.0,
      currency: "NGN",
      discount: {
        percentage: 35,
        amount: 200.0,
        validUntil: new Date("2024-12-31"),
      },
    },
    inventory: {
      inStock: true,
      quantity: 15,
      status: "in_stock",
      trackQuantity: true,
    },
    features: [
      "Mechanical switches",
      "RGB backlighting",
      "Anti-ghosting technology",
      "Programmable keys",
      "Durable construction",
    ],
    specifications: {
      "Switch Type": "Mechanical Blue",
      Backlighting: "RGB",
      Connection: "USB-C",
      "Key Layout": "Full Size",
      Dimensions: "440 x 135 x 35mm",
    },
    images: {
      main: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop",
      ],
      alt: "AK-900 Wired Keyboard",
    },
    reviews: {
      average: 4.7,
      total: 75,
    },
    sellerId: "seller-1",
    shipping: {
      weight: 1.2,
      dimensions: {
        length: 45,
        width: 15,
        height: 3,
        unit: "cm",
      },
      freeShipping: true,
      estimatedDelivery: "2-3 business days",
      restrictions: [],
    },
    returns: {
      returnable: true,
      period: 30,
      unit: "days",
      free: true,
      conditions: ["Original packaging required", "No damage or wear"],
    },
    warranty: {
      period: 2,
      unit: "years",
      type: "manufacturer",
      details: "Full manufacturer warranty covering defects",
    },
    seo: {
      title: "AK-900 Mechanical Gaming Keyboard with RGB Backlighting",
      metaDescription:
        "Professional mechanical gaming keyboard with RGB backlighting and responsive switches.",
      keywords: ["mechanical keyboard", "gaming keyboard", "rgb", "ak-900"],
    },
    status: "active",
    flags: {
      featured: true,
      newArrival: false,
      bestseller: false,
    },
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    publishedAt: new Date("2024-01-05"),
  },
  {
    id: "4",
    sku: "IPS-GM24",
    name: "IPS LCD Gaming Monitor",
    slug: "ips-lcd-gaming-monitor",
    brand: "GameView",
    model: "GM-24",
    categoryId: "electronics",
    tags: ["monitor", "gaming", "ips", "24inch"],
    description:
      "24-inch IPS LCD gaming monitor with high refresh rate and low input lag.",
    shortDescription: "24-inch IPS LCD gaming monitor",
    price: {
      current: 185000.0,
      original: 200000.0,
      currency: "NGN",
      discount: {
        percentage: 30,
        amount: 30.0,
        validUntil: new Date("2024-12-31"),
      },
    },
    inventory: {
      inStock: true,
      quantity: 8,
      status: "limited_stock",
      trackQuantity: true,
    },
    features: [
      "24-inch IPS display",
      "144Hz refresh rate",
      "1ms response time",
      "FreeSync compatible",
      "Multiple connectivity options",
    ],
    specifications: {
      "Screen Size": "24 inches",
      Resolution: "1920 x 1080",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms",
      "Panel Type": "IPS",
    },
    images: {
      main: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
      ],
      alt: "IPS LCD Gaming Monitor",
    },
    reviews: {
      average: 4.9,
      total: 99,
    },
    sellerId: "seller-2",
    shipping: {
      weight: 5.5,
      dimensions: {
        length: 60,
        width: 40,
        height: 8,
        unit: "cm",
      },
      freeShipping: true,
      estimatedDelivery: "3-5 business days",
      restrictions: [],
    },
    returns: {
      returnable: true,
      period: 30,
      unit: "days",
      free: true,
      conditions: ["Original packaging required", "No dead pixels"],
    },
    warranty: {
      period: 3,
      unit: "years",
      type: "manufacturer",
      details: "Full manufacturer warranty with dead pixel guarantee",
    },
    seo: {
      title: "24-inch IPS LCD Gaming Monitor - High Refresh Rate",
      metaDescription:
        "24-inch IPS LCD gaming monitor with high refresh rate and low input lag for competitive gaming.",
      keywords: ["gaming monitor", "ips lcd", "24 inch", "high refresh rate"],
    },
    status: "active",
    flags: {
      featured: false,
      newArrival: true,
      bestseller: false,
    },
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
    publishedAt: new Date("2024-01-12"),
  },
  {
    id: "5",
    sku: "RGB-CC120",
    name: "RGB liquid CPU Cooler",
    slug: "rgb-liquid-cpu-cooler",
    brand: "CoolTech",
    model: "CC-120",
    categoryId: "electronics",
    tags: ["cooling", "cpu", "rgb", "liquid"],
    description:
      "High-performance liquid CPU cooler with RGB lighting and quiet operation.",
    shortDescription: "High-performance liquid CPU cooler with RGB",
    price: {
      current: 80000.0,
      original: 85000.0,
      currency: "NGN",
    },
    inventory: {
      inStock: true,
      quantity: 12,
      status: "in_stock",
      trackQuantity: true,
    },
    features: [
      "RGB lighting effects",
      "Quiet operation",
      "High-performance pump",
      "Universal socket support",
      "Easy installation",
    ],
    specifications: {
      "Radiator Size": "240mm",
      "Fan Speed": "800-1800 RPM",
      "Noise Level": "< 25 dBA",
      "Socket Support": "Intel/AMD",
      Warranty: "5 years",
    },
    images: {
      main: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&h=500&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&h=500&fit=crop",
      ],
      alt: "RGB liquid CPU Cooler",
    },
    reviews: {
      average: 4.6,
      total: 65,
    },
    sellerId: "seller-1",
    shipping: {
      weight: 1.8,
      dimensions: {
        length: 25,
        width: 25,
        height: 8,
        unit: "cm",
      },
      freeShipping: true,
      estimatedDelivery: "2-3 business days",
      restrictions: [],
    },
    returns: {
      returnable: true,
      period: 30,
      unit: "days",
      free: true,
      conditions: ["Original packaging required", "No liquid damage"],
    },
    warranty: {
      period: 5,
      unit: "years",
      type: "manufacturer",
      details: "Extended manufacturer warranty with pump guarantee",
    },
    seo: {
      title: "RGB Liquid CPU Cooler - High Performance Cooling",
      metaDescription:
        "High-performance liquid CPU cooler with RGB lighting and quiet operation for gaming PCs.",
      keywords: ["cpu cooler", "liquid cooling", "rgb", "pc cooling"],
    },
    status: "active",
    flags: {
      featured: false,
      newArrival: false,
      bestseller: true,
    },
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    publishedAt: new Date("2024-01-08"),
  },
];

// Optimized product summaries for listings
export const mockProductSummaries: ProductSummary[] = mockProducts.map(
  (product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.categoryId,
    price: product.price,
    inventory: {
      inStock: product.inventory.inStock,
      status: product.inventory.status,
    },
    images: {
      main: product.images.main,
      alt: product.images.alt,
    },
    reviews: {
      average: product.reviews.average,
      total: product.reviews.total,
    },
    flags: product.flags,
  })
);

// Mock user data
export const mockUser: User = {
  id: "1",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1 (555) 123-4567",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
};

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      {
        id: "1",
        product: mockProducts[0],
        quantity: 1,
      },
      {
        id: "2",
        product: mockProducts[2],
        quantity: 2,
      },
    ],
    total: 259.97,
    status: "delivered",
    createdAt: "2024-01-15T10:30:00Z",
    shippingAddress: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
  },
  {
    id: "ORD-002",
    items: [
      {
        id: "3",
        product: mockProducts[1],
        quantity: 1,
      },
    ],
    total: 299.99,
    status: "shipped",
    createdAt: "2024-01-20T14:15:00Z",
    shippingAddress: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
  },
  {
    id: "3354654654526",
    items: [
      {
        id: "macbook-pro-14",
        product: {
          ...mockProducts[0],
          id: "macbook-pro-14",
          name: "MacBook Pro 14\"",
          images: {
            main: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
            gallery: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop"],
            alt: "MacBook Pro 14 inch"
          },
          price: {
            current: 1299500.00,
            original: 1399500.00,
            currency: "NGN",
            discount: {
              percentage: 20,
              amount: 200.0,
              validUntil: new Date("2024-12-31"),
            },
          }
        },
        quantity: 1,
      },
    ],
    total: 2599.00,
    status: "shipped",
    createdAt: "2024-02-16T10:30:00Z",
    shippingAddress: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      street: "No2 Kobape Road Apt. along Lagos",
      city: "Abeokuta",
      state: "Ogun",
      zipCode: "234810565869",
      country: "Nigeria",
      isDefault: true,
    },
  },
];

// Helper functions for mock API
export const mockApi = {
  // Simulate network delay
  delay: (ms: number = 1000) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  // Get products with optional filtering
  getProducts: async (filters?: { category?: string; search?: string }) => {
    await mockApi.delay(800);

    let products = [...mockProducts];

    if (filters?.category) {
      products = products.filter((p) => p.categoryId === filters.category);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    return products;
  },

  // Get single product
  getProduct: async (id: string) => {
    await mockApi.delay(500);
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new Error("Product not found");
    return product;
  },

  // Get user orders
  getOrders: async () => {
    await mockApi.delay(600);
    return mockOrders;
  },

  // Get single order
  getOrder: async (id: string) => {
    await mockApi.delay(500);
    const order = mockOrders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found");
    return order;
  },
};
