import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "../UI";
import SectionHeader from "../UI/SectionHeader";
import ProductCard from "../Product/ProductCard";
import { useRecentlyViewedProducts } from "../../hooks/api/useRecentlyViewedProducts";
import { normalizeProductImages } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface RecentlyViewedProductsSectionProps {
  /** Optional category ID (e.g. from category page) */
  categoryId?: string | null;
  /** Optional vendor ID */
  vendorId?: string | null;
  /** Max number of products to show. Default 4. */
  limit?: number;
  /** Show quick-add on cards. Default true. */
  showQuickAdd?: boolean;
  /** 'inline' = same style as Related Items (border-t, compact). 'section' = standalone section like Featured (padding, View All). */
  variant?: "inline" | "section";
  /** Extra class for the wrapper */
  className?: string;
}

const gridClass =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6";

/**
 * Recently Viewed Products section. Styled like Related Items.
 * Only renders when there are recently viewed products to show.
 * - Loading: spinner + message.
 * - Has products: product grid.
 * - No products: section is hidden (not rendered).
 * - Not authenticated: section is hidden.
 */
const RecentlyViewedProductsSection: React.FC<
  RecentlyViewedProductsSectionProps
> = ({
  categoryId,
  vendorId,
  limit = 4,
  showQuickAdd = true,
  variant = "inline",
  className,
}) => {
  const { products, loading, isAuthenticated } = useRecentlyViewedProducts({
    categoryId,
    vendorId,
    limit,
  });

  // Hide section when user has no recently viewed products (avoids empty state)
  if (!loading && products.length === 0) {
    return null;
  }

  const viewAllLink = (
    <Link to="/products">
      <Button
        variant="outline"
        className="flex items-center gap-2 bg-white border-[#2ac12a] text-gray-900 hover:bg-[#8DEB6E] hover:text-[#1E4700] hover:border-[#2ac12a]"
      >
        View All Products
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Link>
  );

  const signInLink = (
    <Link
      to="/auth/login"
      className="font-medium text-[#1E4700] hover:text-[#1E4700]/80 underline"
    >
      Sign in
    </Link>
  );

  const renderEmptyOrAuthState = () => {
    if (!isAuthenticated) {
      return (
        <div className="py-8 sm:py-12 text-center">
          <p className="text-muted-foreground text-base sm:text-lg">
            Sign in to see your recently viewed products
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Already have an account? {signInLink}
          </p>
          <div className="mt-6 flex justify-center">{viewAllLink}</div>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm sm:text-base">
            Loading recently viewed...
          </span>
        </div>
      );
    }
    return (
      <div className="py-8 sm:py-12 text-center">
        <p className="text-muted-foreground text-base sm:text-lg">
          No recently viewed products yet
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Browse our catalog to start building your list
        </p>
        <div className="mt-6 flex justify-center">{viewAllLink}</div>
      </div>
    );
  };

  const sectionHeaderBlock = (
    <SectionHeader text="Recently Viewed" subtitle="Your recently viewed items are waiting" />
  );

  if (variant === "section") {
    return (
      <section
        className={cn("py-16 bg-white", className)}
        data-section="recently-viewed-products"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              {sectionHeaderBlock}
            </div>
            {isAuthenticated && products.length > 0 && (
              <div className="hidden sm:block">{viewAllLink}</div>
            )}
          </div>

          {loading && isAuthenticated ? (
            renderEmptyOrAuthState()
          ) : products.length > 0 ? (
            <>
              <div className={gridClass}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={normalizeProductImages(product)}
                    showQuickAdd={showQuickAdd}
                    eagerImages
                    className="w-full"
                  />
                ))}
              </div>
              <div className="flex justify-center mt-8 sm:hidden">
                {viewAllLink}
              </div>
            </>
          ) : (
            renderEmptyOrAuthState()
          )}
        </div>
      </section>
    );
  }

  return (
    <div
      className={cn(
        "space-y-6 mt-8 pt-8 border-t border-gray-200",
        className
      )}
      data-section="recently-viewed-products"
    >
      {sectionHeaderBlock}

      {loading && isAuthenticated ? (
        renderEmptyOrAuthState()
      ) : products.length > 0 ? (
        <div className={gridClass}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={normalizeProductImages(product)}
              showQuickAdd={showQuickAdd}
              eagerImages
              className="w-full"
            />
          ))}
        </div>
      ) : (
        renderEmptyOrAuthState()
      )}
    </div>
  );
};

export default RecentlyViewedProductsSection;
