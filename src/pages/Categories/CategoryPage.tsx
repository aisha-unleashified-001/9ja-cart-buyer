import React, { useState, useEffect } from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { Breadcrumb, Loading, Alert } from "../../components/UI";
import ProductCard from "../../components/Product/ProductCard";
import { useRealProductsByCategory } from "../../hooks/api/useRealProducts";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import { normalizeProductImages } from "@/lib/utils";

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Redirect services category to services page
  if (categoryId === "services") {
    return <Navigate to="/services" replace />;
  }

  const { categories } = useAllRealCategories();

  const params = React.useMemo(
    () => ({ page: currentPage, perPage }),
    [currentPage, perPage]
  );

  // Fetch products for the category
  const { products, loading, error, pagination } = useRealProductsByCategory(
    categoryId || null,
    params
  );

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" title="Error">
            {error}
          </Alert>
        </div>
      </div>
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {categoryTitle}
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2">
              Showing {products.length} of {pagination.totalItems} active product
              {pagination.totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products found in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
