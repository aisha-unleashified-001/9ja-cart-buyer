import React, { useCallback, useEffect, useRef, useState } from "react";
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

const ITEMS_PER_VIEW = 6;

const transformCategories = (categories: Category[]): ShowcaseCategory[] => {
  return categories
    .filter((cat) => cat.level === 1 && !cat.archived)
    .map((category) => ({
      ...category,
      icon: getCategoryIcon(category.name, category.id),
    }));
};

const categoryCardSlotClass =
  "w-[calc((100cqw-0.75rem)/2)] shrink-0 sm:w-[calc((100cqw-2rem)/3)] lg:w-[calc((100cqw-5rem)/6)]";

function ShopCategoryCard({
  category,
  linkClassName,
}: {
  category: ShowcaseCategory;
  linkClassName?: string;
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
      data-category-card
      className={cn(
        "group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        linkClassName
      )}
    >
      <div
        className={cn(
          "flex h-48 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300",
          "group-hover:border-primary group-hover:shadow-md"
        )}
      >
        <div className="relative min-h-[7.5rem] w-full flex-1 bg-white">
          {showImage ? (
            <img
              src={imageUrl}
              alt={category.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 h-full w-full object-contain px-0 py-1 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3">
              <Icon
                className="h-9 w-9 text-gray-500 transition-all duration-300 group-hover:scale-110 group-hover:text-primary"
                aria-hidden
              />
            </div>
          )}
        </div>
        <div className="shrink-0 px-1 py-2.5">
          <span className="block text-center text-sm font-medium leading-snug text-gray-900 line-clamp-2">
            {category.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

const CategoryShowcase: React.FC = () => {
  const { categories: rawCategories, loading, error, refetch } =
    useAllRealCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = transformCategories(rawCategories);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [categories.length, updateScrollButtons]);

  const scrollCategories = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const flexRow = el.firstElementChild as HTMLElement | null;
    const firstCard = el.querySelector<HTMLElement>("[data-category-card]");
    if (!flexRow || !firstCard) return;

    const gap = parseFloat(getComputedStyle(flexRow).gap || "16") || 16;
    const step = (firstCard.offsetWidth + gap) * ITEMS_PER_VIEW;

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const navigationArrows = (
    <div className="hidden shrink-0 items-center gap-2 sm:flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => scrollCategories("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll categories left"
        className="h-10 w-10 rounded-full disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => scrollCategories("right")}
        disabled={!canScrollRight}
        aria-label="Scroll categories right"
        className="h-10 w-10 rounded-full disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <SectionHeader
              text="Shop by Category"
              subtitle="Find products by their categories"
            />
            {navigationArrows}
          </div>

          <div className="@container flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-48 animate-pulse rounded-lg border border-gray-200 bg-gray-100",
                  categoryCardSlotClass
                )}
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
          <div className="mb-8 flex items-center justify-between gap-4">
            <SectionHeader
              text="Shop by Category"
              subtitle="Find products by their categories"
            />
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
          <div className="mb-8 flex items-center justify-between gap-4">
            <SectionHeader
              text="Shop by Category"
              subtitle="Find products by their categories"
            />
          </div>

          <div className="py-12 text-center">
            <p className="text-gray-500">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  const needsScroll = categories.length > ITEMS_PER_VIEW;

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <SectionHeader
            text="Shop by Category"
            subtitle="Find products by their categories"
          />
          {navigationArrows}
        </div>

        <div
          ref={scrollRef}
          className={cn(
            "@container pb-2",
            needsScroll ? "overflow-x-auto scrollbar-hide" : "overflow-x-hidden"
          )}
        >
          <div
            className={cn(
              "flex gap-3 sm:gap-4",
              needsScroll ? "w-max min-w-full" : "w-full"
            )}
          >
            {categories.map((category) => (
              <ShopCategoryCard
                key={category.id}
                category={category}
                linkClassName={categoryCardSlotClass}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
