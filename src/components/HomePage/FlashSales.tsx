import CountdownTimer from "./CountdownTimer";

import SectionHeader from "../UI/SectionHeader";
import { useRealProductsList } from "../../hooks/api/useRealProducts";
import { ProductCard } from "../Product";
import { Button, Alert } from "../UI";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { normalizeProductImages } from "@/lib/utils";

export default function FlashSales() {
  // Get products from real API and filter for discounts
  const { products, loading, error, refetch } = useRealProductsList({ page: 1, perPage: 20 });
  
  // Filter products with discounts for flash sales
  const flashSaleProducts = products
    .filter((product) => {
      const price = typeof product.price === 'object' ? product.price : null;
      return price?.discount && price.discount.percentage > 0;
    })
    .slice(0, 4);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-10 mb-8">
            <div className="flex-shrink-0">
              <SectionHeader title="Today's" text="Flash Sales" />
            </div>
            <div className="flex justify-center lg:justify-start">
              <CountdownTimer targetDate={new Date("2025-12-31T23:59:59Z")} />
            </div>
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading flash sale products...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-10 mb-8">
            <div className="flex-shrink-0">
              <SectionHeader title="Today's" text="Flash Sales" />
            </div>
            <div className="flex justify-center lg:justify-start">
              <CountdownTimer targetDate={new Date("2025-12-31T23:59:59Z")} />
            </div>
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
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-10 mb-8">
          <div className="flex-shrink-0">
            <SectionHeader title="Today's" text="Flash Sales" />
          </div>

          {/* Countdown Timer - Responsive positioning */}
          <div className="flex justify-center lg:justify-start">
            {/* <div className="bg-gray-100 rounded-xl p-3 sm:p-4"> */}
             
              <CountdownTimer targetDate={new Date("2025-12-31T23:59:59Z")} />
            {/* </div> */}
          </div>
        </div>

        {/* Product Grid - Improved responsive layout */}
        {flashSaleProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {flashSaleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={normalizeProductImages(product)}
                  className="w-full"
                />
              ))}
            </div>

            {/* View All Button */}
            <div className="flex justify-center mt-8 sm:mt-12">
              <Link to="/products">
                <Button className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                  View All Products
                </Button>
              </Link>
            </div>

            {/* API Status Badge */}
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live API Data • {flashSaleProducts.length} flash sale items
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No flash sale products available at the moment</p>
            <div className="flex justify-center mt-6">
              <Link to="/products">
                <Button className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
