
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
    image: "/banners/electronics-gaming.png",
    categoryName: "Electronics",
  },
  {
    id: "phone-gadget",
    titlePrimary: "Upgrade Your",
    titleAccent: "Digital Life",
    titleAccentColor: "#008743",
    ctaColor: "#008743",
    subtitle: "Smart Phones, Smart Watches, Air Pods, Head Set",
    cta: "Explore deals",
    image: "/banners/phone-gadget.png",
    categoryName: "Phone & Gadget",
  },
  {
    id: "fashion",
    titlePrimary: "Beauty Starts",
    titleAccent: "Here",
    titleAccentColor: "#DD857E",
    ctaColor: "#DD857E",
    subtitle: "Skincare, Makeup, Luxury Fragrances",
    cta: "Shop Beauty",
    image: "/banners/fashion-beauty.png",
    categoryName: "Fashion",
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
