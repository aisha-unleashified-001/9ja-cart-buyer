import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button, Alert } from "../UI";
import SectionHeader from "../UI/SectionHeader";
import ProductCard from "../Product/ProductCard";
import { useFeaturedProducts } from "../../hooks/api/useRealProducts";
import { normalizeProductImages } from "@/lib/utils";

const FeaturedProducts: React.FC = () => {
  // Get featured products from real API
  const {
    products: featuredProducts,
    loading,
    error,
    refetch,
  } = useFeaturedProducts(8);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <SectionHeader text="Featured Picks" subtitle="Handpicked products you don't want to miss" />
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading featured products...
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <SectionHeader text="Featured Picks" subtitle="Error loading our featured picks" />
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

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <SectionHeader text="Featured Picks" subtitle="Handpicked products you don't want to miss" />

          <Link to="/products">
            <Button
              variant="outline"
              className="hidden sm:flex items-center gap-2 hover:border-[#2ac12a]"
            >
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={normalizeProductImages(product)}
              showQuickAdd={true}
              className="h-full"
            />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Link to="/products">
            <Button variant="outline" className="flex items-center gap-2 hover:border-[#2ac12a]">
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
