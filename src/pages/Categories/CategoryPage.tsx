import React, { useState, useEffect } from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Breadcrumb, Loading, Alert } from "../../components/UI";
import ProductCard from "../../components/Product/ProductCard";
import CategoriesSidebar from "../../components/HomePage/CategoriesSidebar";
import RecentlyViewedProductsSection from "../../components/HomePage/RecentlyViewedProductsSection";
import { useRealProductsByCategory, useFeaturedProducts } from "../../hooks/api/useRealProducts";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import { normalizeProductImages } from "@/lib/utils";
import Container from "@/components/Layout/Container";

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Typing search (Storefront-style): apply automatically as user types.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);


  const { categories, loading: categoriesLoading, error: categoriesError } = useAllRealCategories();

  const params = React.useMemo(
    () => ({
      page: currentPage,
      perPage,
      ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    }),
    [currentPage, perPage, debouncedSearchQuery]
  );

  // Single fetch for category products; derive main list + Related Items from allProducts
  const { products, allProducts, loading, error, pagination } = useRealProductsByCategory(
    categoryId || null,
    params
  );

  const { products: featuredPool } = useFeaturedProducts(16);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, debouncedSearchQuery]);

  const currentPageIds = React.useMemo(
    () => new Set(products.map((p) => p.id)),
    [products]
  );
  const filteredRelatedProducts = React.useMemo(() => {
    return allProducts
      .filter((p) => !currentPageIds.has(p.id))
      .slice(0, 4);
  }, [allProducts, currentPageIds]);

  const fallbackRelatedProducts = React.useMemo(() => {
    return featuredPool
      .filter((p) => !currentPageIds.has(p.id))
      .slice(0, 4);
  }, [featuredPool, currentPageIds]);

  const displayRelatedProducts = React.useMemo(() => {
    if (filteredRelatedProducts.length > 0) return filteredRelatedProducts;
    return fallbackRelatedProducts;
  }, [filteredRelatedProducts, fallbackRelatedProducts]);

    // Redirect services category to services page
  if (categoryId === "services") {
    return <Navigate to="/services" replace />;
  }


  if (error) {
    return (
      <Container className="min-h-screen p-6">
        <div className=" mx-auto">
          <Alert variant="destructive" title="Error">
            {error}
          </Alert>
        </div>
      </Container>
    );
  }

  const categoryNameFromState =
    typeof (location.state as any)?.categoryName === "string"
      ? ((location.state as any).categoryName as string)
      : undefined;

  const categoryNameFromList =
    categoryId && categories.length > 0
      ? categories.find((c) => c.id === categoryId)?.name
      : undefined;

  const categoryTitle =
    categoryNameFromState ||
    categoryNameFromList ||
    products[0]?.categoryName ||
    "Category";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: categoryTitle, isCurrentPage: true },
  ];

  return (
    <Container className="min-h-screen p-6">
      <div className=" mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {categoryTitle}
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2">
              {loading
                ? "Loading products..."
                : `Showing ${products.length} of ${pagination.totalItems} active product${pagination.totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Search */}
          <div className="w-full sm:w-auto sm:max-w-md">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ac12a] focus:border-[#2ac12a]"
              />
              <button
                onClick={() => {
                  setDebouncedSearchQuery(searchQuery.trim());
                  setCurrentPage(1);
                }}
                className="bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary p-2.5 rounded-lg border border-[#2ac12a] transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Search"
              >
                {loading ? <Loading size="sm" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
          {/* Categories Sidebar */}
          {categoriesLoading ? (
            <div className="hidden lg:block lg:col-span-1 pr-4 lg:pr-6">
              <div className="sticky top-4 py-4">
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-4 w-3/4 rounded bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : categoriesError ? (
            <div className="hidden lg:block lg:col-span-1 pr-4 lg:pr-6">
              <div className="sticky top-4 text-center py-8">
                <p className="text-sm text-gray-500">Categories unavailable</p>
              </div>
            </div>
          ) : (
            <CategoriesSidebar categories={categories} />
          )}

          {/* Products Content */}
          <div className="lg:col-span-3 xl:col-span-4 min-h-[650px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loading />
                <p className="text-gray-500 text-sm">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={normalizeProductImages(product)}
                      showQuickAdd={true}
                      className="w-full"
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => {
                        if (currentPage < pagination.totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      disabled={currentPage >= pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-gray-500 text-lg">
                    No products found in this category
                  </p>
                  {searchQuery.trim() && (
                    <p className="text-gray-400 mt-2">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recently Viewed Products (inline, like Related Items; global, no category filter) */}
            {!loading && <RecentlyViewedProductsSection variant="inline" />}

            {/* Related Items: same-category exclusives, or fallback to featured when all category products are on page */}
            {!loading && displayRelatedProducts.length > 0 && (
              <div className="space-y-6 mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-8 bg-primary rounded" />
                  <h2 className="text-2xl font-bold text-gray-900">Related Items</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {displayRelatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct.id}
                      product={normalizeProductImages(relatedProduct)}
                      showQuickAdd={true}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default CategoryPage;
