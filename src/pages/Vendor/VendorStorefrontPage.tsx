import React, { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loading, Alert } from "../../components/UI";
import { ProductCard } from "@/components/Product";
import { useRealProductsList } from "../../hooks/api/useRealProducts";
import { useAllRealCategories } from "../../hooks/api/useRealCategories";
import { normalizeProductImages } from "../../lib/utils";
import { useNotificationContext } from "../../providers/NotificationProvider";
import { 
  Star, 
  Search, 
  ChevronDown, 
  ArrowUpDown, 
  Copy, 
  CheckCircle,
  MapPin
} from "lucide-react";

const PromoBanner = () => {
  return (
    <div className="bg-black rounded-sm p-10 md:p-14 my-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[400px]">
      <div className="z-10 text-white space-y-8 max-w-lg">
        <span className="text-[#00FF66] font-semibold text-sm">Categories</span>
        <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
          Enhance Your <br /> Music Experience
        </h2>

        {/* Countdown */}
        <div className="flex gap-4">
          {[
            { val: 23, label: "Hours" },
            { val: 5, label: "Days" },
            { val: 59, label: "Mins" },
            { val: 35, label: "Secs" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white text-black rounded-full w-16 h-16 flex flex-col items-center justify-center"
            >
              <span className="font-bold text-sm leading-none">{item.val}</span>
              <span className="text-[10px] leading-none mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button className="bg-[#8DEB6E] text-primary px-8 py-3 rounded-sm font-medium hover:bg-[#8DEB6E]/90 transition-colors border border-[#2ac12a]">
          Buy Now!
        </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 mt-8 md:mt-0 max-w-lg">
        <img
          src="https://pngimg.com/d/jbl_speaker_PNG31.png"
          alt="JBL Speaker"
          className="w-full drop-shadow-2xl"
        />
      </div>
    </div>
  );
};

const VendorStorefrontPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const { showNotification } = useNotificationContext();
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Fetch all products (we'll filter by vendorId client-side)
  const { products, loading, error } = useRealProductsList({ 
    page: 1, 
    perPage: 1000, // Fetch a large number to get all vendor products
  });

  // Fetch categories from API
  const { getMainCategories } = useAllRealCategories();
  const mainCategories = getMainCategories();

  // Filter products by vendorId and get vendor info from first product
  const { vendorProducts, vendorInfo, bestSellers } = useMemo(() => {
    if (!vendorId || !products.length) {
      return { vendorProducts: [], vendorInfo: null, bestSellers: [] };
    }

    const filtered = products.filter((product) => product.vendorId === vendorId);
    
    if (filtered.length === 0) {
      return { vendorProducts: [], vendorInfo: null, bestSellers: [] };
    }

    // Get vendor info from the first product
    const firstProduct = filtered[0];
    const vendorInfo = {
      name: firstProduct.storeName || 'Unknown Vendor',
      businessName: firstProduct.storeName || 'Unknown Vendor',
      logo: firstProduct.vendorLogo,
      avatarUrl: firstProduct.vendorLogo,
      location: 'Nigeria', // Default location
    };

    // Get best sellers - first 4 products (or products with bestseller flag)
    const bestSellersList = filtered
      .filter((p) => p.flags?.bestseller)
      .slice(0, 4);
    const bestSellers = bestSellersList.length >= 4 
      ? bestSellersList 
      : filtered.slice(0, 4);

    return { vendorProducts: filtered, vendorInfo, bestSellers };
  }, [vendorId, products]);

  const sortProducts = (items: any[], sort: string) => {
    const arr = [...items];

    if (sort === "price-low") {
      arr.sort((a, b) => (a.price?.current || 0) - (b.price?.current || 0));
    } else if (sort === "price-high") {
      arr.sort((a, b) => (b.price?.current || 0) - (a.price?.current || 0));
    } else if (sort === "name") {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return arr;
  };

  // Apply sorting to best sellers grid (above banner) too
  const sortedBestSellers = useMemo(() => {
    if (sortBy === "default") return bestSellers;
    return sortProducts(bestSellers, sortBy);
  }, [bestSellers, sortBy]);

  // Filter and sort products based on search, category, and sort options
  // Show all products that match the filters (including best sellers if they match)
  const filteredProducts = useMemo(() => {
    let filtered = [...vendorProducts];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((product) => 
        product.categoryId === selectedCategory
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered = sortProducts(filtered, sortBy);

    return filtered;
  }, [vendorProducts, searchQuery, selectedCategory, sortBy]);

  // Helper to find category name for display
  const currentCategoryName =
    mainCategories.find((c) => c.id === selectedCategory)?.name ||
    "All Categories";

  const handleCategorySelect = (catId: string) => {
    const newCat = selectedCategory === catId ? "" : catId;
    setSelectedCategory(newCat);
    setIsCategoryDropdownOpen(false);
  };

  // Copy store link to clipboard
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showNotification("Store link copied to clipboard!", "success", 3000);
    }).catch(() => {
      showNotification("Failed to copy link. Please try again.", "error", 3000);
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
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
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" title="Error">
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vendor Not Found
          </h2>
          <p className="text-gray-600">Invalid store link.</p>
        </div>
      </div>
    );
  }

  if (vendorProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-20 font-sans relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found for this vendor</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans relative">
      {/* --- Container --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
        {/* 1. Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-8 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-200 flex items-center justify-center">
              {vendorInfo?.avatarUrl || vendorInfo?.logo ? (
                <img
                  src={vendorInfo.avatarUrl || vendorInfo.logo}
                  alt="Vendor Avatar"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.warn('Vendor logo failed to load:', vendorInfo?.avatarUrl || vendorInfo?.logo);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                  {(vendorInfo?.businessName ||
                    vendorInfo?.name ||
                    "V")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#182F38]">
                {vendorInfo?.businessName ||
                  vendorInfo?.name ||
                  "Vendor Store"}
              </h1>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {vendorInfo?.location || "Nigeria"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="font-bold">5.0</span>
                  <Star className="w-3 h-3 fill-current" />
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">144 Reviews</span>
                <span className="text-gray-400">|</span>
                <div className="flex items-center gap-1 text-[#1E4700]">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="bg-[#8DEB6E] text-primary px-6 py-2.5 rounded text-sm font-medium hover:bg-[#8DEB6E]/90 transition-colors self-start md:self-center flex items-center gap-2 border border-[#2ac12a]"
          >
            <Copy className="w-4 h-4" />
            Copy Store Link
          </button>
        </header>

        {/* 2. Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 relative z-50">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-[#182F38]">
              Products{" "}
              <span className="text-gray-400 text-base">
                ({filteredProducts.length})
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Dropdown */}
            <div className="relative" ref={catDropdownRef}>
              <button
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className={`flex items-center justify-between px-4 py-2 border rounded text-sm min-w-[160px] ${
                  selectedCategory
                    ? "border-[#1E4700] text-[#1E4700] bg-green-50"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                <span className="truncate max-w-[120px]">
                  {currentCategoryName}
                </span>
                <ChevronDown
                  className={`w-4 h-4 opacity-50 transition-transform ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleCategorySelect("")}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      !selectedCategory
                        ? "text-[#1E4700] font-semibold bg-gray-50"
                        : "text-gray-600"
                    }`}
                  >
                    All Categories
                  </button>
                  {mainCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        selectedCategory === cat.id
                          ? "text-[#1E4700] font-semibold bg-gray-50"
                          : "text-gray-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1E4700]"
              />
              {loading ? (
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Sort Button */}
            <button 
              onClick={() => {
                const options = ["default", "price-low", "price-high", "name"];
                const currentIndex = options.indexOf(sortBy);
                setSortBy(options[(currentIndex + 1) % options.length]);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort by
            </button>
          </div>
        </div>

        {/* 3. Best Sellers Grid (Top) - Only show when no filters are applied */}
        {bestSellers.length > 0 && !selectedCategory && !searchQuery.trim() && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-[#182F38] mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              Best Sellers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {sortedBestSellers.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={normalizeProductImages(product)} />
              ))}
            </div>
          </div>
        )}

        {/* 4. Promo Banner */}
        <PromoBanner />

        {/* 5. Main Product Grid */}
        <div className="mb-14">
          {filteredProducts.length === 0 && !loading ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No products found
              </h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                }}
                className="mt-4 text-[#1E4700] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={normalizeProductImages(product)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorStorefrontPage;

