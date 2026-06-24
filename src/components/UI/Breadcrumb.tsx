import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  className,
  showHome = true,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  if (breadcrumbItems.length === 0 && !showHome) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs sm:text-sm text-gray-600',
        className
      )}
      aria-label="Breadcrumb"
    >
      {showHome && (
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <Link
            to="/"
            className="flex items-center hover:text-gray-900 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbItems.length > 0 && (
            <span className="flex items-center" aria-hidden="true">
              {separator}
            </span>
          )}
        </span>
      )}

      {breadcrumbItems.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-1.5 shrink-0">
          {item.href && !item.isCurrentPage ? (
            <Link
              to={item.href}
              className="whitespace-nowrap hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'whitespace-nowrap',
                item.isCurrentPage
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-600'
              )}
              aria-current={item.isCurrentPage ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}

          {index < breadcrumbItems.length - 1 && (
            <span className="flex items-center" aria-hidden="true">
              {separator}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

export { Breadcrumb };