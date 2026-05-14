import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

import { Button, Alert } from "../UI";
import SectionHeader from "../UI/SectionHeader";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import type { Category } from "../../types";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import { getDefaultCategoryImage } from "@/utils/category-mappers";

type ShowcaseCategory = Category & { icon: LucideIcon };

// Icons stay available for sidebar + fallback when image is missing or fails to load.
const transformCategories = (categories: Category[]): ShowcaseCategory[] => {
  return categories
    .filter((cat) => cat.level === 1 && !cat.archived)
    .map((category) => ({
      ...category,
      icon: getCategoryIcon(category.name, category.id),
    }));
};

function ShopCategoryCard({
  category,
  linkClassName,
  compact,
}: {
  category: ShowcaseCategory;
  linkClassName?: string;
  compact?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const Icon = category.icon;
  const imageUrl =
    category.imageUrl?.trim() || getDefaultCategoryImage(category.name);
  const showImage = Boolean(imageUrl) && !imgError;

  return (
    <Link
      to={`/category/${category.id}`}
      state={{ categoryName: category.name }}
      className={cn(
        "group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        linkClassName
      )}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300",
          "group-hover:border-primary group-hover:shadow-md",
          compact ? "h-40 w-[7.25rem]" : "h-48"
        )}
      >
        <div
          className={cn(
            "relative w-full flex-1 bg-white",
            compact ? "min-h-[5.5rem]" : "min-h-[7.5rem]"
          )}
        >
          {showImage ? (
            <img
              src={imageUrl}
              alt={category.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3">
              <Icon
                className={cn(
                  "text-gray-500 transition-all duration-300 group-hover:text-primary group-hover:scale-110",
                  compact ? "h-7 w-7" : "h-9 w-9"
                )}
                aria-hidden
              />
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-gray-100 px-2 py-2.5">
          <span
            className={cn(
              "block text-center font-medium leading-snug text-gray-900 line-clamp-2",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {category.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

const CategoryShowcase: React.FC = () => {
  const { categories: rawCategories, loading, error, refetch } = useAllRealCategories();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Transform categories to include icons
  const categories = transformCategories(rawCategories);
  
  const itemsPerView = 6; // Show 6 items at a time on desktop
  const maxIndex = Math.max(0, categories.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (loading) {
    // Show non-blocking skeletons instead of a spinner so the
    // section layout appears instantly without a loading indicator.
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader
              text="Shop by Category"
              subtitle="Find products by their categories"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-lg border border-gray-200 bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader text="Shop by Category" subtitle="Find products by their categories" />
          </div>
          
          <Alert variant="destructive" className="max-w-md mx-auto">
            <div className="flex flex-col items-center gap-4">
              <p>{error}</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </Alert>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader text="Shop by Category" subtitle="Find products by their categories" />
          </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">No categories available at the moment.</p>
        </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <SectionHeader text="Shop by Category" subtitle="Find products by their categories" />

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="rounded-full w-10 h-10 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="rounded-full w-10 h-10 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Categories Container */}
        <div className="relative overflow-hidden">
          {/* Desktop View - Sliding Grid */}
          <div className="hidden sm:block">
            <div
              className="flex transition-transform duration-300 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {categories.map((category) => (
                <ShopCategoryCard
                  key={category.id}
                  category={category}
                  linkClassName="w-[calc(100%/6-1rem)] flex-shrink-0"
                />
              ))}
            </div>
          </div>

          {/* Mobile View - Horizontal Scroll */}
          <div className="sm:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <ShopCategoryCard
                  key={category.id}
                  category={category}
                  linkClassName="flex-shrink-0"
                  compact
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dots */}
        <div className="sm:hidden flex justify-center mt-6 gap-2">
          {Array.from({ length: Math.ceil(categories.length / 4) }).map(
            (_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / 4) === index
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
                onClick={() => setCurrentIndex(index * 4)}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;