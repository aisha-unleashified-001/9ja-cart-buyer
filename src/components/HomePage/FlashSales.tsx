import SectionHeader from "../UI/SectionHeader";
import { useBuyerActiveProductsList } from "../../hooks/api/useRealProducts";
import { ProductCard } from "../Product";
import { Button, Alert } from "../UI";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { normalizeProductImages } from "@/lib/utils";

export default function FlashSales() {
  // Fetch all products across pages so we can show every discounted product
  const { allProducts, loading, error, refetch } = useBuyerActiveProductsList({});
  
  // Filter products with discounts for flash sales — include both discount object and price comparison
  const flashSaleProducts = allProducts
    .filter((product) => {
      const price = typeof product.price === 'object' ? product.price : null;
      if (!price) return false;
      const hasDiscountBadge = price.discount && price.discount.percentage > 0;
      const hasPriceReduction = price.original != null && price.current < price.original;
      return hasDiscountBadge || hasPriceReduction;
    });

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <SectionHeader text="Today's deal" subtitle="Explore products with remarkable discounts" />
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading today's deals...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <SectionHeader text="Today's deal" subtitle="Explore products with remarkable discounts" />
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

  // Only show the section when there are discounted products (flash sales)
  if (flashSaleProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <SectionHeader text="Today's deal" subtitle="Explore products with remarkable discounts" />
        </div>

        {/* Product Grid - Improved responsive layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {flashSaleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={normalizeProductImages(product)}
              eagerImages
              highlightAsFlashSale
              className="w-full"
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-8 sm:mt-12">
          <Link to="/products">
            <Button
              variant="outline"
              className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base bg-white border-[#2ac12a] text-gray-900 hover:bg-[#8DEB6E] hover:text-[#1E4700] hover:border-[#2ac12a]"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
