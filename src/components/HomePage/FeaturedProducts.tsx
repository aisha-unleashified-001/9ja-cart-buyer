import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button, Alert } from "../UI";
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Loading our handpicked selection of premium items
            </p>
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Error loading our featured products
            </p>
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Discover our handpicked selection of premium items
            </p>
          </div>

          <Link to="/products">
            <Button
              variant="outline"
              className="hidden sm:flex items-center gap-2"
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
            <Button variant="outline" className="flex items-center gap-2">
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* API Status Badge */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live API Data • {featuredProducts.length} featured products
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
