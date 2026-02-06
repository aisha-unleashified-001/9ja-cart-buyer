import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Baby,
  Smartphone,
  ShoppingCart,
  Heart,
  Shirt,
  Wrench,
  Phone,
  Receipt,
  Home,
  Package,
  Gamepad2,
  Utensils,
  Sparkles,
  Monitor,
} from "lucide-react";

import { Button, Loading, Alert } from "../UI";
import SectionHeader from "../UI/SectionHeader";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import type { Category } from "../../types";

// Icon mapping for categories - enhanced for real API categories
const getCategoryIcon = (categoryName: string, categoryId?: string) => {
  const name = categoryName.toLowerCase();
  
  // First check by category ID (for services and known categories)
  const idIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'services': Wrench,
    'mobile-topup': Phone,
    'bills': Receipt,
  };
  
  if (categoryId && idIconMap[categoryId]) {
    return idIconMap[categoryId];
  }
  
  // Then check by category name keywords
  const nameIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'toys': Gamepad2,
    'games': Gamepad2,
    'gaming': Gamepad2,
    'home': Home,
    'kitchen': Utensils,
    'health': Heart,
    'beauty': Sparkles,
    'electronics': Monitor,
    'gadgets': Smartphone,
    'devices': Smartphone,
    'men': Shirt,
    'wear': Shirt,
    'fashion': Shirt,
    'clothing': Shirt,
    'appliances': Zap,
    'baby': Baby,
    'groceries': ShoppingCart,
    'food': ShoppingCart,
  };
  
  // Find matching icon based on category name keywords
  for (const [keyword, IconComponent] of Object.entries(nameIconMap)) {
    if (name.includes(keyword)) {
      return IconComponent;
    }
  }
  
  // Default fallback icon
  return Package;
};

// Transform categories to include icons
const transformCategories = (categories: Category[]) => {
  return categories
    .filter(cat => cat.level === 1 && !cat.archived) // Only show top-level categories that are not archived
    .map((category) => ({
      ...category,
      icon: getCategoryIcon(category.name, category.id),
    }));
};

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
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader text="Shop by Category" subtitle="Find products by their categories" />
          </div>
          
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
            <span className="ml-2 text-muted-foreground">Loading categories...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    state={{ categoryName: category.name }}
                    className="flex-shrink-0 w-[calc(100%/6-1rem)] group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
                  >
                    <div
                      className="
                        relative p-6 rounded-lg border-2 transition-all duration-300 h-32 flex flex-col items-center justify-center
                        bg-white border-gray-200
                        group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg
                        group-focus-visible:bg-primary group-focus-visible:border-primary group-focus-visible:shadow-lg
                        group-active:bg-primary/90 group-active:border-primary
                      "
                    >
                      <IconComponent
                        className="
                          w-8 h-8 mb-3 transition-all duration-300 text-gray-600
                          group-hover:text-white group-hover:scale-110
                          group-focus-visible:text-white group-focus-visible:scale-110
                          group-active:text-white
                        "
                      />
                      <span
                        className="
                          text-sm font-medium text-center text-gray-900 transition-colors duration-300
                          group-hover:text-white
                          group-focus-visible:text-white
                          group-active:text-white
                        "
                      >
                        {category.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile View - Horizontal Scroll */}
          <div className="sm:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    state={{ categoryName: category.name }}
                    className="flex-shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
                  >
                    <div
                      className="
                        relative p-4 rounded-lg border-2 transition-all duration-300 w-24 h-24 flex flex-col items-center justify-center
                        bg-white border-gray-200
                        group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg
                        group-focus-visible:bg-primary group-focus-visible:border-primary group-focus-visible:shadow-lg
                        group-active:bg-primary/90 group-active:border-primary
                      "
                    >
                      <IconComponent
                        className="
                          w-6 h-6 mb-1 transition-all duration-300 text-gray-600
                          group-hover:text-white group-hover:scale-110
                          group-focus-visible:text-white group-focus-visible:scale-110
                          group-active:text-white
                        "
                      />
                      <span
                        className="
                          text-xs font-medium text-center leading-tight text-gray-900 transition-colors duration-300
                          group-hover:text-white
                          group-focus-visible:text-white
                          group-active:text-white
                        "
                      >
                        {category.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
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