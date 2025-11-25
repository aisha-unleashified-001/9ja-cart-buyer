import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button, Alert } from '../UI';
import ProductCard from '../Product/ProductCard';
import { useRealProductsList } from '../../hooks/api/useRealProducts';
import { normalizeProductImages } from '@/lib/utils';

const LiveProducts: React.FC = () => {
  const { products, loading, error, refetch, pagination } = useRealProductsList({ page: 1, perPage: 100 }); // Fetch all products
  
  // Debug logging (can be removed in production)
  console.log('🎨 LiveProducts:', { 
    loading, 
    productsCount: products?.length,
    totalItems: pagination?.totalItems
  });

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">All Live Products</h2>
            <p className="text-muted-foreground">Loading complete inventory from our live API</p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading all products...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">All Live Products</h2>
            <p className="text-muted-foreground">Error loading products from our live API</p>
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

  if (!products || products.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">All Live Products</h2>
            <p className="text-muted-foreground">Complete inventory from our live API</p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available in our live inventory at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">All Live Products</h2>
            <p className="text-muted-foreground">Complete inventory from our live API - All available products</p>
          </div>
          
          <Link to="/products">
            <Button variant="outline" className="hidden sm:flex items-center gap-2">
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={normalizeProductImages(product)}
              showQuickAdd={true}
              className="h-full"
            />
          ))}
        </div>

        {/* Show total count */}
        {products.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing all {products.length} products from our live inventory
            </p>
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="flex justify-center mt-6 sm:hidden">
          <Link to="/products">
            <Button variant="outline" className="flex items-center gap-2">
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* API Badge with Stats */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live API Data • {products.length} of {pagination.totalItems} products
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveProducts;