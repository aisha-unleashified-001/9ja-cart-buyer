import FlashSales from "@/components/HomePage/FlashSales";
import HeroSection from "@/components/HomePage/HeroSection";
import FeaturedProducts from "@/components/HomePage/FeaturedProducts";
import LiveProducts from "@/components/HomePage/LiveProducts";
import CategoryShowcase from "@/components/HomePage/CategoryShowcase";
import FastSelling from "@/components/HomePage/FastSelling";
import RecentlyViewedProductsSection from "@/components/HomePage/RecentlyViewedProductsSection";
import { useAuthStore } from "@/store/useAuthStore";
// import Newsletter from "@/components/HomePage/Newsletter";
import React from "react";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* 1. Flash Sales */}
      <FlashSales />

      {/* 2. Featured Picks */}
      <FeaturedProducts />

      {/* 3. All Products */}
      <LiveProducts />

      {/* 4. Shop by Category */}
      <CategoryShowcase />

      {/* 5. Fast Selling */}
      <FastSelling />

      {/* 6. Recently Viewed - only when signed in */}
      {isAuthenticated && (
        <RecentlyViewedProductsSection variant="section" />
      )}

      {/* Newsletter Subscription */}
      {/* <Newsletter /> */}
    </div>
  );
};

export default HomePage;
