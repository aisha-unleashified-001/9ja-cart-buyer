import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../UI/Modal";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  level: number;
  imageUrl?: string;
  archived?: boolean;
}

interface CategoriesSidebarProps {
  categories: Category[];
  /** Show vertical line to the right (e.g. beside hero banner). Default false. */
  showBorderRight?: boolean;
}

// Define subcategory service options
const subcategoryOptions: Record<string, string[]> = {
  "mobile-topup": ["Buy Airtime", "Buy Mobile Data"],
  bills: ["Postpaid", "Prepaid"],
  // Add more subcategory options as needed
};

const CategoriesSidebar: React.FC<CategoriesSidebarProps> = ({ categories, showBorderRight = false }) => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    category: Category | null;
    options: string[];
  }>({
    isOpen: false,
    category: null,
    options: [],
  });

  // Filter main categories (level 1, excluding archived)
  const allMainCategories = categories.filter((cat) => cat.level === 1 && !cat.archived);
  const mainCategories = allMainCategories;

  // Get subcategories for a given parent (excluding archived)
  const getSubcategories = (parentId: string) => {
    return categories.filter((cat) => cat.parentId === parentId && !cat.archived);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (category: Category) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;

    if (category.level === 1) {
      // Level 1 categories
      if (hasSubcategories) {
        // Has subcategories - toggle expand/collapse
        toggleCategory(category.id);
      } else {
        // No subcategories - navigate directly
        navigate(`/category/${category.id}`, {
          state: { categoryName: category.name },
        });
      }
    } else if (category.level === 2) {
      // Level 2 categories (subcategories) - open modal
      const options = subcategoryOptions[category.id] || [];
      if (options.length > 0) {
        setModalState({
          isOpen: true,
          category,
          options,
        });
      } else {
        // Fallback to direct navigation if no options defined
        navigate(`/category/${category.id}`, {
          state: { categoryName: category.name },
        });
      }
    }
  };

  const handleModalOptionClick = (option: string) => {
    // Close modal and handle the selected option
    setModalState({ isOpen: false, category: null, options: [] });

    // You can customize this logic based on your routing needs
    // For now, we'll navigate to a generic service page with query params
    if (modalState.category) {
      const serviceType = option.toLowerCase().replace(/\s+/g, "-");
      navigate(`/services/${modalState.category.slug}?type=${serviceType}`);
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, category: null, options: [] });
  };

  const renderCategoryItem = (category: Category, isSubcategory = false) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const hasModalOptions =
      category.level === 2 && subcategoryOptions[category.id];

    return (
      <li key={category.id}>
        <div
          className={`
            group relative text-sm cursor-pointer flex items-center justify-between py-1.5 px-2 rounded-md
            transition-all duration-300 ease-in-out
            ${isSubcategory ? "ml-4 pl-4" : ""}
            text-gray-700 bg-transparent
            hover:text-primary hover:bg-[#8DEB6E]/10 hover:pl-3
            ${isSubcategory ? "hover:ml-4" : ""}
            ${isExpanded ? "text-primary bg-[#8DEB6E]/10" : ""}
          `}
          onClick={() => handleCategoryClick(category)}
        >
          {/* Left accent bar - appears on hover with lemon color */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#8DEB6E] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
            aria-hidden="true"
          />
          
          <span className="font-medium relative z-10 transition-all duration-300 group-hover:translate-x-1">
            {category.name}
          </span>
          
          {hasSubcategories && (
            <span
              className={`
                relative z-10 transition-all duration-300
                text-gray-400 group-hover:text-primary
                ${isExpanded ? "rotate-90 text-primary" : ""}
              `}
            >
              ›
            </span>
          )}
          {hasModalOptions && (
            <span className="relative z-10 text-blue-500 group-hover:text-primary text-xs transition-colors duration-300">
              ⚡
            </span>
          )}
        </div>

        {hasSubcategories && isExpanded && (
          <ul className="mt-1 space-y-0.5">
            {subcategories.map((subcat) => renderCategoryItem(subcat, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block lg:col-span-1 ${showBorderRight ? "border-r border-gray-200" : ""}`}>
        <div className="sticky top-4">
          <div className="h-[240px] sm:h-[300px] md:h-[360px] lg:h-[420px] overflow-y-auto scroll-smooth scrollbar-thin">
            <ul className="space-y-0.5 pr-4 lg:pr-6">
              {mainCategories.map((category) => renderCategoryItem(category))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile Categories - Horizontal scroll */}
      <div className="lg:hidden mb-3 sm:mb-4 -mx-4 px-4">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mainCategories.length > 0 ? (
            mainCategories.slice(0, 8).map((category) => {
              const subcategories = getSubcategories(category.id);
              const hasSubcategories = subcategories.length > 0;

              return (
                <button
                  key={`mobile-${category.id}`}
                  onClick={() => handleCategoryClick(category)}
                  className="flex-shrink-0 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                >
                  {category.name}
                  {hasSubcategories && <span className="ml-1">›</span>}
                </button>
              );
            })
          ) : (
            // Loading skeleton for mobile categories
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 rounded-full animate-pulse"
                style={{ width: `${60 + Math.random() * 40}px`, height: '32px' }}
              />
            ))
          )}
        </div>
      </div>

      {/* Service Options Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.category?.name || ""}
        size="md"
      >
        <div className="space-y-3">
          {modalState.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleModalOptionClick(option)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 group-hover:text-primary">
                  {option}
                </span>
                <span className="text-gray-400 group-hover:text-primary">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default CategoriesSidebar;
