import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAllRealCategories } from '../../hooks/api/useRealCategories';

const SecondaryNav: React.FC = () => {
  const location = useLocation();
  const { loading, getMainCategories } = useAllRealCategories();
  
  // Show all main categories (excluding archived)
  const mainCategories = getMainCategories();
  const displayCategories = mainCategories.filter(cat => !cat.archived);

  // Count total items: 1 (All) + categories + 3 (special links)
  const totalItems = 1 + displayCategories.length + 3;
  const shouldScroll = totalItems > 10;

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/products') {
      return location.pathname === '/products';
    }
    if (path === '/services') {
      return location.pathname === '/services' || location.pathname.startsWith('/services/');
    }
    if (path.startsWith('/category/')) {
      const categoryId = path.replace('/category/', '');
      return location.pathname === `/category/${categoryId}`;
    }
    // For special links
    return location.pathname === path;
  };

  if(location.pathname === "/about") return null;

  return (
    <nav className="bg-muted text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex items-center space-x-6 py-2 ${shouldScroll ? 'overflow-x-auto scrollbar-hide' : 'overflow-x-hidden'}`}>
          {/* All Categories */}
          <Link
            to="/products"
            className={`flex items-center whitespace-nowrap text-sm hover:text-primary transition-colors py-1 flex-shrink-0 relative ${
              isActive('/products')
                ? 'text-primary font-medium'
                : ''
            }`}
          >
            All
            {isActive('/products') && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
            )}
          </Link>

          {/* Category Links */}
          {loading ? (
            // Loading skeleton for categories
            Array.from({ length: 5 }).map((_, index) => (
              <React.Fragment key={`skeleton-${index}`}>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse flex-shrink-0"></div>
                {index < 4 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                )}
              </React.Fragment>
            ))
          ) : (
            displayCategories.map((category, index) => {
              const categoryPath = category.id === "services" ? "/services" : `/category/${category.id}`;
              const active = isActive(categoryPath);
              return (
                <React.Fragment key={category.slug}>
                  <Link
                    to={categoryPath}
                    state={
                      category.id === "services"
                        ? undefined
                        : { categoryName: category.name }
                    }
                    className={`whitespace-nowrap text-sm hover:text-primary transition-colors py-1 flex-shrink-0 relative ${
                      active ? 'text-primary font-medium' : ''
                    }`}
                  >
                    {category.name}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
                    )}
                  </Link>
                  {index < displayCategories.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Special Links */}
          <div className={`flex items-center space-x-6 ${shouldScroll ? '' : 'ml-auto'} flex-shrink-0`}>
            <Link
              to="/deals"
              className={`whitespace-nowrap text-sm hover:text-primary/80 transition-colors py-1 relative ${
                isActive('/deals') ? 'text-primary font-medium' : ''
              }`}
            >
              Today's Deals
              {isActive('/deals') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </Link>
            <Link
              to="/new-arrivals"
              className={`whitespace-nowrap text-sm hover:text-primary transition-colors py-1 relative ${
                isActive('/new-arrivals') ? 'text-primary font-medium' : ''
              }`}
            >
              New Arrivals
              {isActive('/new-arrivals') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </Link>
            <Link
              to="/bestsellers"
              className={`whitespace-nowrap text-sm hover:text-primary transition-colors py-1 relative ${
                isActive('/bestsellers') ? 'text-primary font-medium' : ''
              }`}
            >
              Best Sellers
              {isActive('/bestsellers') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;