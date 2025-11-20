

import React from "react";
import CategoriesSidebar from "./CategoriesSidebar";
import HeroCarousel, { type CarouselSlide } from "./HeroCarousel";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import { Loading } from "../UI";

const slides: CarouselSlide[] = [
  {
    id: "iphone",
    title: "iPhone 14 Series",
    subtitle: "Up to 10% off Voucher",
    cta: "Shop Now",
    bg: "#8DEB6E",
    image:
      "https://images.unsplash.com/photo-1678685888233-d1d68e72282b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "gaming",
    title: "Pro Gaming Gear",
    subtitle: "Headsets, Keyboards & More",
    cta: "Explore Deals",
    bg: "#E0EAFF",
    image:
      "https://images.unsplash.com/photo-1603481588273-0c4c8b1a20fd?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "appliances",
    title: "Home Appliances",
    subtitle: "Save up to 30%",
    cta: "Discover",
    bg: "#F6E5FF",
    image:
      "https://images.unsplash.com/photo-1585386959984-a4155223168f?q=80&w=1600&auto=format&fit=crop",
  },
];

const HeroSection: React.FC = () => {
  const { categories, loading, error } = useAllRealCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 items-start">
        {loading ? (
          <div className="hidden lg:block lg:col-span-1 border-r border-gray-200 pr-4 lg:pr-6">
            <div className="sticky top-4 flex items-center justify-center py-8">
              <Loading size="sm" />
            </div>
          </div>
        ) : error ? (
          <div className="hidden lg:block lg:col-span-1 border-r border-gray-200 pr-4 lg:pr-6">
            <div className="sticky top-4 text-center py-8">
              <p className="text-sm text-gray-500">Categories unavailable</p>
            </div>
          </div>
        ) : (
          <CategoriesSidebar categories={categories} />
        )}
        <HeroCarousel slides={slides} />
      </div>
    </div>
  );
};

export default HeroSection;