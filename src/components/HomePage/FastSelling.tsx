import SectionHeader from "../UI/SectionHeader";
import { useRealProductsList } from "../../hooks/api/useRealProducts";
import { ProductCard } from "../Product";
import { Button, Alert } from "../UI";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { normalizeProductImages } from "@/lib/utils";

export default function FastSelling() {
  const { products, loading, error, refetch } = useRealProductsList({ page: 1, perPage: 20 });

  const fastSellingProducts = products
    .filter((p) => p.flags?.bestseller)
    .slice(0, 4);
  const displayProducts =
    fastSellingProducts.length >= 4 ? fastSellingProducts : products.slice(0, 4);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <SectionHeader text="Fast Selling" subtitle="Popular items selling out quickly" />
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <SectionHeader text="Fast Selling" subtitle="Popular items selling out quickly" />
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

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionHeader text="Fast Selling" subtitle="Popular items selling out quickly" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={normalizeProductImages(product)}
              className="w-full"
            />
          ))}
        </div>
        <div className="flex justify-center mt-8 sm:mt-12">
          <Link to="/products">
            <Button className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
