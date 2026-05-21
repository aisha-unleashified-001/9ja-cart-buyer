import SectionHeader from "../UI/SectionHeader";
import { useBuyerActiveProductsList } from "../../hooks/api/useRealProducts";
import { ProductCard } from "../Product";
import { Button, Alert } from "../UI";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
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

  // Ensure we don't show the same product twice, even if it appears multiple times in allProducts
  const uniqueFlashSaleProducts = Array.from(
    new Map(flashSaleProducts.map((product) => [product.id, product])).values()
  );

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

  const viewAllButtonClass =
    "bg-white border-[#2ac12a] text-gray-900 hover:bg-[#8DEB6E] hover:text-[#1E4700] hover:border-[#2ac12a]";

  return (
    <section id="flash-deals" className="py-8 sm:py-12 bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <SectionHeader
            text="Today's deal"
            subtitle="Explore products with remarkable discounts"
          />
          <Link to="/products" className="shrink-0">
            <Button
              variant="outline"
              className={`hidden items-center gap-2 sm:flex ${viewAllButtonClass}`}
            >
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div
          className={`@container pb-2 ${
            uniqueFlashSaleProducts.length > 5
              ? "overflow-x-auto scrollbar-hide"
              : "overflow-x-hidden"
          }`}
        >
          <div
            className={`flex gap-3 sm:gap-4 lg:gap-6 ${
              uniqueFlashSaleProducts.length > 5 ? "w-max min-w-full" : "w-full"
            }`}
          >
            {uniqueFlashSaleProducts.map((product) => (
              <div
                key={product.id}
                className="w-[calc((100cqw-0.75rem)/2)] shrink-0 sm:w-[calc((100cqw-2rem)/3)] md:w-[calc((100cqw-3rem)/4)] lg:w-[calc((100cqw-6rem)/5)]"
              >
                <ProductCard
                  product={normalizeProductImages(product)}
                  eagerImages
                  highlightAsFlashSale
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Link to="/products">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${viewAllButtonClass}`}
            >
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
