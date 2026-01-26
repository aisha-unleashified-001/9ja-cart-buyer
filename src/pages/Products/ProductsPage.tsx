import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Breadcrumb, Loading, Alert } from '../../components/UI';
import ProductCard from '../../components/Product/ProductCard';
import CategoriesSidebar from '../../components/HomePage/CategoriesSidebar';
import { useBuyerActiveProductsList } from '../../hooks/api/useRealProducts';
import { useAllRealCategories } from '../../hooks/api/useRealCategories';
import { normalizeProductImages } from '@/lib/utils';

const ProductsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Typing search (Storefront-style): apply automatically as user types.
  // Debounced to avoid firing a request on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  const { 
    products, 
    loading, 
    error, 
    pagination
  } = useBuyerActiveProductsList({ 
    page: currentPage, 
    perPage,
    ...(debouncedSearchQuery && { search: debouncedSearchQuery })
  });

  const { categories, loading: categoriesLoading, error: categoriesError } = useAllRealCategories();

  const isInitialLoad = loading && products.length === 0;

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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">
              Showing {products.length} of {pagination.totalItems} active product
              {pagination.totalItems !== 1 ? 's' : ''}
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
                  // Optional "instant apply" if user clicks the icon before debounce fires
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
            <div className="hidden lg:block lg:col-span-1 border-r border-gray-200 pr-4 lg:pr-6">
              <div className="sticky top-4 flex items-center justify-center py-8">
                <Loading size="sm" />
              </div>
            </div>
          ) : categoriesError ? (
            <div className="hidden lg:block lg:col-span-1 border-r border-gray-200 pr-4 lg:pr-6">
              <div className="sticky top-4 text-center py-8">
                <p className="text-sm text-gray-500">Categories unavailable</p>
              </div>
            </div>
          ) : (
            <CategoriesSidebar categories={categories} />
          )}

          {/* Products Content */}
          <div className="lg:col-span-3 xl:col-span-4">
            {isInitialLoad ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loading size="lg" />
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
                          const nextPage = currentPage - 1;
                          setCurrentPage(nextPage);
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
                          const nextPage = currentPage + 1;
                          setCurrentPage(nextPage);
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
                  <p className="text-gray-500 text-lg">No products found</p>
                  {searchQuery.trim() && (
                    <p className="text-gray-400 mt-2">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;