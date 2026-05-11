import type { Category } from "../types";
import type { ApiCategoryData } from '../api/categories';

// Helper function to generate slug from category name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Unsplash URL for category tiles. Uses auto=format (not forced fm=png) so
 * every photo id reliably returns an image in the browser.
 */
function categoryStockImage(photoPath: string): string {
  return `https://images.unsplash.com/${photoPath}?w=480&h=320&fit=crop&auto=format&q=85`;
}

/** Normalize labels so "Foo & Bar" and "Foo And Bar" match the same rules. */
function normalizeCategoryLabel(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
}

// Curated Unsplash assets (path after images.unsplash.com/) — distinct subjects per rule set.
const CAT_IMG = {
  phones: 'photo-1511707171634-5f897ff02aa9',
  laptopTech: 'photo-1496181133206-80ce9b88a853',
  tvAudio: 'photo-1593359677879-e3615ed8fcea',
  headphones: 'photo-1505740420928-5e560c06d30e',
  beauty: 'photo-1596462502278-27bfdc403348',
  hair: 'photo-1522338242992-e1a54906a8da',
  fashion: 'photo-1445205170230-053b83016050',
  shoes: 'photo-1542291026-7eec264c27ff',
  baby: 'photo-1515488042361-ee00e0ddd4e4',
  groceries: 'photo-1542838132-92c53300491e',
  pets: 'photo-1450778869180-41aaf06085b6',
  toys: 'photo-1558060370-13524fbce593',
  furniture: 'photo-1555041469-a586c61ea9bc',
  home: 'photo-1586023492125-27b2c045efd7',
  kitchen: 'photo-1556911220-bff31c812dba',
  office: 'photo-1524758631624-e2822e584c01',
  watch: 'photo-1524592094714-0f065f8b4638',
  fragrance: 'photo-1541643600911-758d62a966cb',
  sports: 'photo-1571902943202-507ec2618e8f',
  books: 'photo-1524993602760-ecd993f36353',
  garden: 'photo-1416879595882-3373a0480a5f',
  automotive: 'photo-1489824904134-891ab64532f1',
  jewellery: 'photo-1535632066927-ab7c9d609a01',
  /** Bold patterned fabrics — African prints / ankara */
  africanPrints: 'photo-1616423664072-cfebddd1d337',
  default: 'photo-1607082349446-86a205291afb',
} as const;

type Rule = { keywords: string[]; photo: string };

/** Exact API names (any casing / & vs and) → photo. Checked before keyword rules. */
const EXACT_CATEGORY_PHOTO_ENTRIES: [string, string][] = [
  ["Wristwatch And Accessories", CAT_IMG.watch],
  ["Wristwatch & Accessories", CAT_IMG.watch],
  ["Wristwatch and Accessory", CAT_IMG.watch],
  ["Wristwatch and Accessories", CAT_IMG.watch],
  ["African Prints", CAT_IMG.africanPrints],
  ["African Print", CAT_IMG.africanPrints],
  ["Fragrances", CAT_IMG.fragrance],
  ["Fragrance", CAT_IMG.fragrance],
  ["Electronics", CAT_IMG.tvAudio],
  ["Pet Supplies", CAT_IMG.pets],
  ["Pet Supply", CAT_IMG.pets],
  ["Toy and Games", CAT_IMG.toys],
  ["Toys and Games", CAT_IMG.toys],
  ["Toy & Games", CAT_IMG.toys],
  ["Toys & Games", CAT_IMG.toys],
  ["Toys and Game", CAT_IMG.toys],
  ["Toy and Game", CAT_IMG.toys],
];

const EXACT_CATEGORY_IMAGE_URL: Record<string, string> = Object.fromEntries(
  EXACT_CATEGORY_PHOTO_ENTRIES.map(([label, photo]) => [
    normalizeCategoryLabel(label),
    categoryStockImage(photo),
  ])
);

/** First matching rule wins — keep narrower product types above broad buckets. */
const CATEGORY_IMAGE_RULES: Rule[] = [
  { keywords: ['phone', 'tablet', 'smartphone', 'mobile', 'iphone'], photo: CAT_IMG.phones },
  {
    keywords: [
      'wristwatch',
      'wrist watch',
      'watch accessories',
      'watch accessory',
      'watch and accessory',
      'apple watch',
      'smart watch',
      'timepiece',
      'watches',
    ],
    photo: CAT_IMG.watch,
  },
  {
    keywords: [
      'african print',
      'african fabric',
      'ankara',
      'kente',
      'adire',
      'native wear',
    ],
    photo: CAT_IMG.africanPrints,
  },
  {
    keywords: ['fragrances', 'perfume', 'fragrance', 'scent', 'cologne'],
    photo: CAT_IMG.fragrance,
  },
  { keywords: ['baby', 'infant', 'toddler', 'nursery', 'diaper'], photo: CAT_IMG.baby },
  {
    keywords: [
      'pet supplies',
      'pet supply',
      'pet food',
      'pet care',
      'pet',
      'dog',
      'cat',
      'animal feed',
      'aquarium',
    ],
    photo: CAT_IMG.pets,
  },
  {
    keywords: ['grocery', 'grocer', 'supermarket', 'fresh food', 'vegetable', 'produce'],
    photo: CAT_IMG.groceries,
  },
  {
    keywords: [
      'toy and game',
      'toys and game',
      'toy and games',
      'toys and games',
      'toy & game',
      'toys & games',
      'toy',
      'game',
      'lego',
      'playstation',
      'gaming console',
    ],
    photo: CAT_IMG.toys,
  },
  { keywords: ['makeup', 'cosmetic', 'skincare', 'beauty'], photo: CAT_IMG.beauty },
  { keywords: ['hair', 'wig', 'braid', 'salon'], photo: CAT_IMG.hair },
  { keywords: ['sneaker', 'footwear', 'shoe'], photo: CAT_IMG.shoes },
  {
    keywords: ['fashion', 'apparel', 'clothing', 'textile', 'dress', 'shirt'],
    photo: CAT_IMG.fashion,
  },
  {
    keywords: [
      'electronics',
      'television',
      'tv ',
      ' monitor',
      'laptop',
      'computer',
      'camera',
      'speaker',
    ],
    photo: CAT_IMG.tvAudio,
  },
  { keywords: ['headphone', 'earbud'], photo: CAT_IMG.headphones },
  {
    keywords: ['gadget', 'charger', 'cable', 'power bank', 'smartwatch band'],
    photo: CAT_IMG.laptopTech,
  },
  { keywords: ['electronic'], photo: CAT_IMG.laptopTech },
  { keywords: ['furniture', 'sofa', 'mattress', 'bedroom', 'wardrobe'], photo: CAT_IMG.furniture },
  { keywords: ['kitchen', 'cookware', 'utensil', 'dining'], photo: CAT_IMG.kitchen },
  { keywords: ['office furniture', 'desk', 'chair', 'bookshelf'], photo: CAT_IMG.office },
  { keywords: ['home essential', 'household', 'decor', 'lighting', 'bedding'], photo: CAT_IMG.home },
  { keywords: ['home ', ' home', 'living room'], photo: CAT_IMG.home },
  { keywords: ['sport', 'fitness', 'gym', 'exercise'], photo: CAT_IMG.sports },
  { keywords: ['book', 'stationery', 'pen '], photo: CAT_IMG.books },
  { keywords: ['garden', 'lawn', 'outdoor plant'], photo: CAT_IMG.garden },
  { keywords: ['automotive', 'tyre', 'tire', 'motor', 'vehicle'], photo: CAT_IMG.automotive },
  { keywords: ['jewel', 'jewellery', 'jewelry'], photo: CAT_IMG.jewellery },
  { keywords: ['health', 'vitamin', 'wellness', 'medical supply'], photo: CAT_IMG.beauty },
  { keywords: ['bills', 'bill payment', 'utility'], photo: 'photo-1554224155-6726b3ff858f' },
  { keywords: ['airtime', 'top up', 'topup', 'data bundle'], photo: CAT_IMG.phones },
];

const getDefaultCategoryImage = (categoryName: string): string => {
  const normalized = normalizeCategoryLabel(categoryName);
  const exact = EXACT_CATEGORY_IMAGE_URL[normalized];
  if (exact) return exact;

  const name = normalized;

  for (const rule of CATEGORY_IMAGE_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return categoryStockImage(rule.photo);
    }
  }

  return categoryStockImage(CAT_IMG.default);
};

/**
 * Re-applies {@link getDefaultCategoryImage} for every category (name → imageUrl).
 * Use when hydrating from session/memory so mapper improvements show up without waiting for cache TTL.
 */
export function applyCategoryImageDefaults(categories: Category[]): Category[] {
  return categories.map((c) => ({
    ...c,
    imageUrl: getDefaultCategoryImage(c.name),
  }));
}

// Map API category data to internal Category type
export const mapApiCategoryToCategory = (apiCategory: ApiCategoryData): Category => {
  return {
    id: apiCategory.categoryId,
    name: apiCategory.categoryName,
    slug: generateSlug(apiCategory.categoryName),
    level: 1, // All API categories are treated as level 1 (main categories)
    parentId: undefined, // API doesn't provide hierarchy
    imageUrl: getDefaultCategoryImage(apiCategory.categoryName),
    createdAt: new Date(apiCategory.createdAt),
    updatedAt: new Date(apiCategory.updatedAt),
  };
};

// Map array of API categories to Category array
export const mapApiCategoriesToCategories = (apiCategories: ApiCategoryData[]): Category[] => {
  return apiCategories.map(mapApiCategoryToCategory);
};

// Create services category and subcategories (static data to preserve existing functionality)
// NOTE: Services category is currently archived - set archived: false to restore it
export const createServicesCategories = (): Category[] => {
  const now = new Date();
  
  return [
    // Main services category (ARCHIVED)
    {
      id: "services",
      name: "Services",
      slug: "services",
      level: 1,
      imageUrl: categoryStockImage('photo-1560472354-b33ff0c44a43'),
      createdAt: now,
      updatedAt: now,
      archived: true, // Archived - not displayed but not deleted
    },
    // Services subcategories (ARCHIVED)
    {
      id: "mobile-topup",
      name: "Mobile Top Up",
      slug: "mobile-topup",
      parentId: "services",
      level: 2,
      imageUrl: categoryStockImage(CAT_IMG.phones),
      createdAt: now,
      updatedAt: now,
      archived: true, // Archived - not displayed but not deleted
    },
    {
      id: "bills",
      name: "Bills",
      slug: "bills",
      parentId: "services",
      level: 2,
      imageUrl: categoryStockImage('photo-1554224155-6726b3ff858f'),
      createdAt: now,
      updatedAt: now,
      archived: true, // Archived - not displayed but not deleted
    },
  ];
};

// Combine API categories with services categories
export const combineWithServicesCategories = (apiCategories: Category[]): Category[] => {
  const servicesCategories = createServicesCategories();
  return [...apiCategories, ...servicesCategories];
};