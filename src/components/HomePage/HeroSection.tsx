
import React, { useMemo } from "react";
import CategoriesSidebar from "./CategoriesSidebar";
import HeroCarousel, { type CarouselSlide } from "./HeroCarousel";
import TopDealsPanel from "./TopDealsPanel";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import { Loading } from "../UI";
import type { Category } from "../../types";

const BANNER_SLIDES: Omit<CarouselSlide, "categoryId">[] = [
  {
    id: "electronics",
    titlePrimary: "Next-Gen",
    titleAccent: "Gaming & Electronics",
    subtitle: "Laptops, Keyboards, Headsets, Monitors & More",
    cta: "Shop Now",
    image: "/banners/electronics-gaming.jpg",
    categoryName: "Electronics",
  },
  {
    id: "beauty",
    titlePrimary: "Beauty Starts",
    titleAccent: "Here",
    titleAccentColor: "#DD857E",
    ctaColor: "#DD857E",
    subtitle: "Skincare, Makeup, Luxury Fragrances",
    cta: "Shop Beauty",
    image: "/banners/fashion-beauty.jpg",
    categoryName: "Beauty",
  },
  {
    id: "fashion",
    titlePrimary: "Elevate Your",
    titleAccent: "Everyday Style",
    titleAccentColor: "#B09071",
    ctaColor: "#B09071",
    subtitle:
      "Discover premium fashion, statement footwear, and luxury accessories curated for every occasion.",
    cta: "Shop Fashion",
    image: "/banners/just-fashion.png",
    categoryName: "Fashion",
  },
  {
    id: "phone-gadget",
    titlePrimary: "Upgrade Your",
    titleAccent: "Digital Life",
    titleAccentColor: "#008743",
    ctaColor: "#008743",
    subtitle: "Smart Phones, Smart Watches, Air Pods, Head Set",
    cta: "Explore deals",
    image: "/banners/phone-gadget.jpg",
    categoryName: "Phone & Gadget",
  },
  {
    id: "groceries",
    titlePrimary: "Fresh Groceries,",
    titleAccent: "Delivered to Your Door",
    titleAccentColor: "#BD8855",
    ctaColor: "#BD8855",
    subtitle: "Shop your pantry essentials and your everyday groceries all in one place.",
    cta: "Shop Groceries",
    image: "/banners/groceries.png",
    categoryName: "Groceries",
  },
  {
    id: "african-prints",
    titlePrimary: "Wear Your Culture",
    titleAccent: "with Confidence",
    titleAccentColor: "#7A2F12",
    ctaColor: "#7A2F12",
    subtitle: "Authentic African prints designed to celebrate culture, color, and confidence.",
    cta: "Explore the Collection",
    image: "/banners/africa-prints.png",
    categoryName: "African Prints",
  },
];

function normalizeLabel(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

const SLIDE_CATEGORY_ALIASES: Record<string, string[]> = {
  "Phone & Gadget": [
    "phone and gadget",
    "phones and gadget",
    "phone gadget",
    "phones gadget",
    "phones and gadgets",
    "phone and gadgets",
    "devices and accessories",
    "devices accessories",
  ],
  Beauty: ["beauty", "health and beauty", "makeup", "skincare", "fashion"],
  Groceries: ["grocery", "groceries", "food and grocery", "supermarket"],
  Fashion: ["fashion", "clothing", "apparel"],
  "African Prints": ["african print", "african prints", "ankara"],
};

function findCategoryByName(categories: Category[], targetName: string): Category | undefined {
  const normalizedTarget = normalizeLabel(targetName);

  const exact = categories.find(
    (cat) => normalizeLabel(cat.name) === normalizedTarget
  );
  if (exact) return exact;

  const aliases = SLIDE_CATEGORY_ALIASES[targetName] ?? [];
  const aliasMatch = categories.find((cat) =>
    aliases.some((alias) => normalizeLabel(cat.name).includes(alias))
  );
  if (aliasMatch) return aliasMatch;

  return categories.find((cat) => {
    const normalized = normalizeLabel(cat.name);
    return (
      normalized.includes(normalizedTarget) ||
      normalizedTarget.includes(normalized)
    );
  });
}

function resolveBannerSlides(categories: Category[]): CarouselSlide[] {
  return BANNER_SLIDES.map((slide) => {
    const category = slide.categoryName
      ? findCategoryByName(categories, slide.categoryName)
      : undefined;

    return {
      ...slide,
      categoryId: category?.id,
      categoryName: category?.name ?? slide.categoryName,
    };
  });
}

const HeroSection: React.FC = () => {
  const { categories, loading, error } = useAllRealCategories();

  const slides = useMemo(
    () => resolveBannerSlides(categories),
    [categories]
  );

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:pb-6 lg:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
        {loading ? (
          <div className="hidden lg:block lg:col-span-1 relative -mt-4 pt-4 pr-4 lg:pr-6">
            <div className="sticky top-4 flex items-center justify-center py-8">
              <Loading size="sm" />
            </div>
          </div>
        ) : error ? (
          <div className="hidden lg:block lg:col-span-1 relative -mt-4 pt-4 pr-4 lg:pr-6">
            <div className="sticky top-4 text-center py-8">
              <p className="text-sm text-gray-500">Categories unavailable</p>
            </div>
          </div>
        ) : (
          <CategoriesSidebar categories={categories} showBorderRight />
        )}
        <HeroCarousel slides={slides} />
        <TopDealsPanel />
      </div>
    </div>
  );
};

export default HeroSection;
