import HeroSection from "@/components/HomePage/HeroSection";
import FlashSales from "@/components/HomePage/FlashSales";
import LiveProducts from "@/components/HomePage/LiveProducts";
import CategoryShowcase from "@/components/HomePage/CategoryShowcase";
import FastSelling from "@/components/HomePage/FastSelling";
import RecentlyViewedProductsSection from "@/components/HomePage/RecentlyViewedProductsSection";
import { useAuthStore } from "@/store/useAuthStore";
import React from "react";
import { Helmet } from "react-helmet-async";
// Archived: FeaturedProducts (replaced by FastSelling displayed as "Featured Picks")

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-white min-h-screen max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <Helmet>
        <title>9ja-cart - Buy and Sell Online in Nigeria</title>
        <meta name="description" content="Shop top deals on food, gadgets, electronics, fashion & lifestyle products at 9jaCart.ng — Nigeria's trusted Buy Now Pay Later online store. Fast delivery, secure checkout & affordable prices" />
        <link rel="icon" type="image/svg+xml" href="/9Jacart Icon SVG.svg" />
      </Helmet>
      <HeroSection />
      <FlashSales />
      <CategoryShowcase />
      <FastSelling />
      {isAuthenticated && (
        <RecentlyViewedProductsSection variant="section" />
      )}
      <LiveProducts />
    </div>
  );
};

export default HomePage;
