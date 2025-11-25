import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb, Loading, Alert } from '../../components/UI';
import ProductCard from '../../components/Product/ProductCard';
import { useRealProductsByCategory } from '../../hooks/api/useRealProducts';
import { normalizeProductImages } from '@/lib/utils';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Fetch products for the category
  const { 
    products, 
    loading, 
    error, 
    pagination
  } = useRealProductsByCategory(categoryId || null, { 
    page: currentPage, 
    perPage 
  });

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

  // Get category name from first product if available
  // const categoryName = products.length > 0 ? products[0].categoryId : categoryId;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: `Category`, isCurrentPage: true },
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
              {products.length > 0 && products[0].categoryId ? 
                `Category Products` : 
                'Category Products'
              }
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2">
              Showing {products.length} of {pagination.totalItems} product{pagination.totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
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
            <p className="text-gray-500 text-lg">No products found in this category</p>
          </div>
        )}

        {/* API Status Badge */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live API Data • Category: {categoryId?.substring(0, 8)}... • {products.length} products
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;