import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  MapPin,
  ShoppingCart,
  User,
  ChevronDown,
  Menu,
  HelpCircle,
} from "lucide-react";
// Removed unused import
import { useAuthStore } from "../../store/useAuthStore";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
import logoImage from "../../assets/logo.png";

const NewHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalItems: cartTotalItems } = useCart();
  const { getTotalItems: getWishlistItems } = useWishlistStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Refs for click outside detection
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Mobile-friendly click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Account menu
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        // Add delay on mobile to prevent immediate closing
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setTimeout(() => setShowAccountMenu(false), 100);
        } else {
          setShowAccountMenu(false);
        }
      }

      // Mobile menu
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowMobileMenu(false), 100);
      }
    };

    if (showAccountMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showAccountMenu, showMobileMenu]);

  const categories = [
    "All",
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Sports",
    "Books",
    "Beauty",
    "Automotive",
  ];

  const totalItems = cartTotalItems;
  const wishlistItems = getWishlistItems();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("q", searchQuery.trim());
      if (selectedCategory !== "All") {
        searchParams.set("category", selectedCategory.toLowerCase());
      }
      navigate(`/search?${searchParams.toString()}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowAccountMenu(false);
    navigate("/");
  };

  const handleAccountMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAccountMenu(!showAccountMenu);
  };

  const handleMenuItemClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation();
    setShowAccountMenu(false);
    callback?.();
  };

  const handleMobileLogout = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAccountMenu(false);
    // Small delay to ensure menu closes before logout
    setTimeout(() => {
      handleLogout();
    }, 50);
  };

  // Clear search query when navigating to homepage
  useEffect(() => {
    if (location.pathname === "/") {
      setSearchQuery("");
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        document
          .querySelector("header")
          ?.classList.add("shadow-2xl", "bg-[#182F38]/98");
      } else {
        document
          .querySelector("header")
          ?.classList.remove("shadow-2xl", "bg-[#182F38]/98");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // <header className="fixed top-0 left-0 w-full z-50 bg-[#182F38]/95 backdrop-blur-md text-white shadow-lg border-b border-gray-700">
    <header className="sticky top-0 z-50 bg-[#182F38]/95 backdrop-blur-md text-white shadow-lg border-b border-gray-700">
      {/* Main Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto">
          {/* Top row for mobile - Logo and essential actions */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:hidden mb-2">
            {/* Mobile Menu Button */}
            <button
              className="p-2 text-white hover:bg-white/10 rounded-md transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileMenu(!showMobileMenu);
              }}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo - Centered on mobile */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src={logoImage}
                alt="9ja-cart"
                className="h-6 sm:h-8 w-auto"
              />
            </Link>

            {/* Mobile Right Actions */}
            <div className="flex items-center gap-1">
              {/* Account Section - Mobile */}
              {isAuthenticated ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    className="p-2 text-white hover:bg-white/10 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    onClick={handleAccountMenuClick}
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 w-72 bg-white text-gray-900 rounded-md shadow-xl border border-gray-200 z-[60]"
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <div className="p-4">
                        <div className="border-b border-gray-200 pb-3 mb-3">
                          <p className="font-medium text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <Link
                            to="/account"
                            className="block px-3 py-3 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors min-h-[44px] flex items-center"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-3 py-3 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors min-h-[44px] flex items-center"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Orders
                          </Link>
                          <Link
                            to="/wishlist"
                            className="block px-3 py-3 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors min-h-[44px] flex items-center"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Wishlist{" "}
                            {wishlistItems > 0 && `(${wishlistItems})`}
                          </Link>
                          <Link
                            to="/contact-admin"
                            className="block px-3 py-3 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors min-h-[44px] flex items-center"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Contact Support
                          </Link>
                          <hr className="my-2 border-gray-200" />
                          <button
                            onClick={handleMobileLogout}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              handleMobileLogout(e);
                            }}
                            className="w-full text-left px-3 py-3 text-red-600 hover:text-red-700 active:text-red-700 hover:bg-red-50 active:bg-red-50 rounded-md transition-colors min-h-[44px] flex items-center"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Cart - Mobile */}
              <Link
                to="/cart"
                className="p-2 text-white hover:bg-white/10 rounded-md transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src={logoImage} alt="9ja-cart" className="h-8 w-auto" />
            </Link>

            {/* Delivery Location */}
            <button className="flex items-center text-sm hover:bg-white/10 px-3 py-2 rounded-md cursor-pointer transition-colors flex-shrink-0">
              <MapPin className="w-6 h-6 mr-2 text-white" />
              <div className="text-white">
                <div className="text-xs">Deliver to</div>
                <div className="font-medium">Nigeria</div>
              </div>
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl min-w-0">
              <div className="flex rounded-md overflow-hidden bg-white">
                {/* Category Dropdown */}
                <div className="relative flex-shrink-0 bg-primary">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-primary text-primary-foreground px-3 py-2 appearance-none pr-8 min-w-[100px] w-auto max-w-[140px] font-normal h-full border-0 outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground pointer-events-none" />
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DEB6E] min-w-0"
                />

                {/* Search Button */}
                <button
                  type="submit"
                  className="px-4 text-primary-foreground py-2 bg-primary hover:bg-primary/90 flex-shrink-0 transition-colors font-medium"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Right Side Items */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* ARCHIVED: Language Selector - commented out until language switching is supported */}
              {/* <button className="flex text-white items-center text-sm hover:bg-white/10 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <Globe className="w-4 h-4 mr-2" />
                <span>EN</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button> */}

              {/* Help - Direct Link */}
              <Link
                to="/contact-admin"
                className="flex text-white items-center text-sm hover:bg-white/10 px-3 py-2 rounded-md cursor-pointer transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span>Help</span>
              </Link>

              {/* Account Section */}
              {isAuthenticated ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    className="flex items-center text-sm text-white hover:text-white/80 hover:bg-white/5 px-3 py-2 rounded-md transition-colors"
                    onClick={handleAccountMenuClick}
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="text-xs">Hello, {user?.firstName}</div>
                        <div className="font-medium">Account & Lists</div>
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>

                  {/* Desktop Account Dropdown */}
                  {showAccountMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 w-80 bg-white text-gray-900 rounded-md shadow-xl border border-gray-200 z-[60]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4">
                        <div className="border-b border-gray-200 pb-3 mb-3">
                          <p className="font-medium text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <Link
                            to="/account"
                            className="block px-3 py-2 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-3 py-2 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Orders
                          </Link>
                          <Link
                            to="/wishlist"
                            className="block px-3 py-2 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Your Wishlist{" "}
                            {wishlistItems > 0 && `(${wishlistItems})`}
                          </Link>
                          <Link
                            to="/contact-admin"
                            className="block px-3 py-2 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                            onClick={(e) => handleMenuItemClick(e)}
                          >
                            Contact Support
                          </Link>
                          <hr className="my-2 border-gray-200" />
                          <button
                            onClick={(e) =>
                              handleMenuItemClick(e, handleLogout)
                            }
                            className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="flex items-center text-sm text-white hover:text-white/80 hover:bg-white/5 px-3 py-2 rounded-md transition-colors"
                >
                  <User className="w-5 h-5 mr-2" />
                  <span>Hello, Sign in</span>
                </Link>
              )}

              {/* Orders */}
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className="flex items-center text-sm text-white hover:bg-white/10 hover:text-white px-3 py-2 rounded-md transition-colors"
                >
                  <div className="text-left">
                    <div className="text-xs">Returns</div>
                    <div className="font-medium">& Orders</div>
                  </div>
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="flex items-center text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors relative"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
                <span className="ml-2 font-medium">Cart</span>
              </Link>
            </div>
          </div>

          {/* Mobile/Tablet Search Bar */}
          <div className="lg:hidden">
            <form onSubmit={handleSearch} className="w-full">
              <div className="flex rounded-md overflow-hidden bg-white">
                {/* Category Dropdown - Mobile */}
                <div className="relative flex-shrink-0 bg-primary">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-primary text-primary-foreground px-2 sm:px-3 py-2 text-xs sm:text-sm appearance-none pr-6 sm:pr-8 min-w-[80px] w-auto font-normal h-full border-0 outline-none"
                  >
                    {categories.slice(0, 6).map((category) => (
                      <option key={category} value={category}>
                        {category.length > 8
                          ? category.substring(0, 8) + "..."
                          : category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground pointer-events-none" />
                </div>

                {/* Search Input - Mobile */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-2 sm:px-4 py-2 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DEB6E] min-w-0"
                />

                {/* Search Button - Mobile */}
                <button
                  type="submit"
                  className="px-2 sm:px-4 text-primary-foreground py-2 bg-primary hover:bg-primary/90 flex-shrink-0 transition-colors font-medium"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className="lg:hidden bg-[#1a3441] border-t border-gray-600 relative z-40"
          ref={mobileMenuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Delivery Location */}
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Deliver to Nigeria</span>
            </div>

            {/* ARCHIVED: Mobile Language - commented out until language switching is supported */}
            {/* <div className="flex items-center text-sm">
              <Globe className="w-4 h-4 mr-2" />
              <span>English</span>
            </div> */}

            {/* Mobile Navigation Links */}
            <div className="border-t border-gray-600 pt-3 space-y-2">
              {/* ARCHIVED: Services link - commented out
              <Link
                to="/services"
                className="block py-3 hover:text-primary transition-colors min-h-[44px] flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                Services
              </Link>
              */}
              <Link
                to="/products"
                className="block py-3 hover:text-primary transition-colors min-h-[44px] flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                All Products
              </Link>
              <Link
                to="/products"
                className="block py-3 hover:text-primary transition-colors min-h-[44px] flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                Categories
              </Link>
              <Link
                to="/contact"
                className="block py-3 hover:text-primary transition-colors min-h-[44px] flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                Customer Service
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default NewHeader;
