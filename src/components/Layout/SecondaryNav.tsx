import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAllRealCategories } from '../../hooks/api/useRealCategories';

const SecondaryNav: React.FC = () => {
  const { loading, getMainCategories } = useAllRealCategories();
  
  // Show all main categories
  const mainCategories = getMainCategories();
  const displayCategories = mainCategories;

  // Count total items: 1 (All) + categories + 3 (special links)
  const totalItems = 1 + displayCategories.length + 3;
  const shouldScroll = totalItems > 10;

  return (
    <nav className="bg-muted text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex items-center space-x-6 py-2 ${shouldScroll ? 'overflow-x-auto scrollbar-hide' : 'overflow-x-hidden'}`}>
          {/* All Categories */}
          <Link
            to="/products"
            className="flex items-center whitespace-nowrap text-sm hover:text-primary transition-colors py-1 flex-shrink-0"
          >
            <span className="font-medium">All</span>
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
            displayCategories.map((category, index) => (
              <React.Fragment key={category.slug}>
                <Link
                  to={`/category/${category.id}`}
                  className="whitespace-nowrap text-sm hover:text-primary transition-colors py-1 flex-shrink-0"
                >
                  {category.name}
                </Link>
                {index < displayCategories.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                )}
              </React.Fragment>
            ))
          )}

          {/* Special Links */}
          <div className={`flex items-center space-x-6 ${shouldScroll ? '' : 'ml-auto'} flex-shrink-0`}>
            <Link
              to="/deals"
              className="whitespace-nowrap text-sm text-primary hover:text-primary/80 transition-colors py-1 font-medium"
            >
              Today's Deals
            </Link>
            <Link
              to="/new-arrivals"
              className="whitespace-nowrap text-sm hover:text-primary transition-colors py-1"
            >
              New Arrivals
            </Link>
            <Link
              to="/bestsellers"
              className="whitespace-nowrap text-sm hover:text-primary transition-colors py-1"
            >
              Best Sellers
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;