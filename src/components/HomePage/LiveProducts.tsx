import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button, Alert } from '../UI';
import SectionHeader from '../UI/SectionHeader';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <SectionHeader text="All Products" subtitle="Explore everything available — updated in real time" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <SectionHeader text="All Products" subtitle="Error loading products" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <SectionHeader text="All Products" subtitle="Explore everything available — updated in real time" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <SectionHeader text="All Products" subtitle="Explore everything available — updated in real time" />
          
          <Link to="/products">
            <Button variant="outline" className="hidden sm:flex items-center gap-2 hover:border-[#2ac12a]">
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

        {/* Mobile View All Button */}
        <div className="flex justify-center mt-6 sm:hidden">
          <Link to="/products">
            <Button variant="outline" className="flex items-center gap-2 hover:border-[#2ac12a]">
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LiveProducts;