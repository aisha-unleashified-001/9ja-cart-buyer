import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headset,
  BadgeCheck,
  ShoppingCart,
} from "lucide-react";
import {
  Breadcrumb,
  Button,
  Badge,
  Card,
  CardContent,
  Alert,
  Image,
} from "../../components/UI";
import SectionHeader from "@/components/UI/SectionHeader";
import { useLayoutContext } from "@/contexts/LayoutContext";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useRealProduct, useRealProductsList } from "../../hooks/api/useRealProducts";
import { useProductRatings } from "../../hooks/api/useProductRatings";
import { productsApi } from "../../api/products";
// import type { Product } from "../../types";
import { cn, normalizeProductImages } from "../../lib/utils";
import { formatPrice, formatDiscountPercentage } from "../../lib/productUtils";
import { ProductCard } from "@/components/Product";
import RecentlyViewedProductsSection from "@/components/HomePage/RecentlyViewedProductsSection";
import { useNotificationContext } from "../../providers/NotificationProvider";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setHideFooter } = useLayoutContext();
  const { addToCart } = useCart();
  const { showNotification } = useNotificationContext();
  const { isAuthenticated } = useAuthStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();

  // Use real API hook
  const { product, loading, error } = useRealProduct(id || null);

  // Hide footer until product is ready so the page "just shows up" with content (no footer flash)
  useEffect(() => {
    if (loading && !product) {
      setHideFooter(true);
    } else {
      setHideFooter(false);
    }
    return () => setHideFooter(false);
  }, [loading, product, setHideFooter]);
  
  // Fetch a broader pool of products for better tag-based matching across categories
  // We'll filter by categoryName and tags in the filtering logic
  const { products: relatedProducts } = useRealProductsList({ 
    page: 1, 
    // Fetch more products to have a good pool for filtering by categoryName and tags
    perPage: 50,
  });

  // Fetch ratings from API
  const { reviews: apiReviews } = useProductRatings(id || null);
  
  // Use API reviews first, then fallback to product reviews
  const displayReviews = apiReviews || product?.reviews;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState<string>("description");
  
  const isWishlisted = product ? isItemInWishlist(product.id) : false;

  // Set default selections when product loads
  useEffect(() => {
    if (product?.variants) {
      const colorVariant = product.variants.find(
        (v) => v.type === "color"
      );
      if (colorVariant && colorVariant.options.length > 0) {
        setSelectedColor(colorVariant.options[0].id);
      }

      const sizeVariant = product.variants.find(
        (v) => v.type === "size"
      );
      if (sizeVariant && sizeVariant.options.length > 0) {
        setSelectedSize(sizeVariant.options[0].id);
      }
    }
  }, [product]);

  // Track product view for Recently Viewed (Bearer auth; fire-and-forget)
  useEffect(() => {
    if (!product?.id || !isAuthenticated) return;
    productsApi.trackProductView(product.id).catch((err) => {
      console.warn("Failed to track product view:", err);
    });
  }, [product?.id, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const selectedVariants: Record<string, string> = {};
      if (colorVariant && selectedColor) {
        const opt = colorVariant.options.find((o) => o.id === selectedColor);
        if (opt) selectedVariants.color = opt.value;
      }
      if (sizeVariant && selectedSize) {
        const opt = sizeVariant.options.find((o) => o.id === selectedSize);
        if (opt) selectedVariants.size = opt.value;
      }

      await addToCart(
        product,
        quantity,
        Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
      );
      showNotification(
        `${product.name} has been added to cart`,
        'success',
        3000
      );
    } catch (error) {

      console.error(error)
      showNotification(
        'Failed to add product to cart. Please try again.',
        'error',
        3000
      );
    }
  };
  
  const handleCheckout = async () => {
    if (!product) return;
    try {
      const selectedVariants: Record<string, string> = {};
      if (colorVariant && selectedColor) {
        const opt = colorVariant.options.find((o) => o.id === selectedColor);
        if (opt) selectedVariants.color = opt.value;
      }
      if (sizeVariant && selectedSize) {
        const opt = sizeVariant.options.find((o) => o.id === selectedSize);
        if (opt) selectedVariants.size = opt.value;
      }

      await addToCart(
        product,
        quantity,
        Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
      );
      showNotification(
        `${product.name} has been added to cart`,
        'success',
        3000
      );
      navigate("/checkout");
    } catch (error) {
      console.error(error)
      showNotification(
        'Failed to add product to cart. Please try again.',
        'error',
        3000
      );
    }
  };

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  // Filter related items based on:
  // 1. Same categoryName (as indicated by vendor)
  // 2. Matching productTags (at least one tag in common, supports multiple tags)
  const filteredRelatedProducts = React.useMemo(() => {
    if (!product || !relatedProducts.length) return [];

    // Exclude current product
    const candidates = relatedProducts.filter(
      (relatedProduct) => relatedProduct.id !== product.id
    );

    if (candidates.length === 0) return [];

    const productCategoryName = product.categoryName;
    const productTags = product.tags ?? [];

    // Filter products that match by categoryName OR have at least one matching tag
    const matched = candidates.filter((relatedProduct) => {
      // Match by categoryName (exact match)
      const categoryMatch = 
        productCategoryName && 
        relatedProduct.categoryName && 
        relatedProduct.categoryName.toLowerCase() === productCategoryName.toLowerCase();

      // Match by tags (at least one tag in common)
      const tagMatch = 
        productTags.length > 0 &&
        relatedProduct.tags &&
        relatedProduct.tags.length > 0 &&
        relatedProduct.tags.some((tag) => 
          productTags.some((productTag) => 
            tag.toLowerCase() === productTag.toLowerCase()
          )
        );

      return categoryMatch || tagMatch;
    });

    // If we have matches, use them; otherwise fall back to candidates from same categoryId
    let finalList = matched.length > 0 
      ? matched 
      : candidates.filter((relatedProduct) => 
          relatedProduct.categoryId === product.categoryId
        );

    // Final fallback: show any other products if no category/tag matches
    if (finalList.length === 0) {
      finalList = candidates;
    }

    return finalList.slice(0, 4);
  }, [product, relatedProducts]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        )}
      />
    ));
  };

  // Tall white space only (no spinner); footer hidden via context so it stays below viewport
  if (loading && !product) {
    return <div className="min-h-[100vh] w-full" aria-hidden />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen p-6">
        <div className=" mx-auto">
          <Alert variant="destructive" title="Error">
            {error || "Product not found"}
          </Alert>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Products", href: "/products" },
    ...(product ? [{ label: product.name, isCurrentPage: true }] : []),
  ];

  const colorVariant = product.variants?.find((v) => v.type === "color");
  const sizeVariant = product.variants?.find((v) => v.type === "size");
  const currentPrice =
    typeof product.price === "number" ? product.price : product.price.current;
  const originalPrice =
    typeof product.price === "object" ? product.price.original : undefined;
  const discount =
    typeof product.price === "object" ? product.price.discount : undefined;
  const imageGallery =
    product.images.gallery && product.images.gallery.length > 0
      ? product.images.gallery
      : [product.images.main];

  return (
    <div className="min-h-screen bg-gray-50 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <div className=" mx-auto px-4 py-6 min-h-[70vh]">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          <div className="xl:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-4">
              <div className="order-2 md:order-1">
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[520px]">
                  {imageGallery.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 md:w-full md:h-20 rounded-lg border-2 overflow-hidden bg-white",
                        selectedImage === index ? "border-primary" : "border-gray-200"
                      )}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-top"
                        aspectRatio="auto"
                        objectFit="contain"
                        lazy={false}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="order-1 md:order-2 aspect-square w-full bg-white rounded-lg border overflow-hidden relative">
                {discount && (
                  <Badge className="absolute top-3 right-3 z-10 bg-primary text-white">
                    -{formatDiscountPercentage(discount.percentage)}%
                  </Badge>
                )}
                <Image
                  src={imageGallery[selectedImage] || product.images.main}
                  alt={product.images.alt}
                  className="w-full h-full object-top"
                  aspectRatio="auto"
                  objectFit="contain"
                  lazy={false}
                />
              </div>
            </div>
          </div>

          <div className="xl:col-span-3">
            <Card className="h-full">
              <CardContent className="p-5 space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  <div className="mt-2">
                    {product.vendorId ? (
                      <Link
                        to={`/vendor/${product.vendorId}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        {product.vendorLogo ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                            <Image
                              src={product.vendorLogo}
                              alt={product.storeName || "Vendor"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {product.storeName
                                ? product.storeName.charAt(0).toUpperCase()
                                : "9J"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 hover:text-primary transition-colors">
                            {product.storeName || "9jaCart"}
                          </p>
                          <p className="text-xs text-gray-500">Nigeria</p>
                        </div>
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-600">{product.storeName || "9jaCart"}</p>
                    )}
                  </div>
                </div>

                {displayReviews && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center">{renderStars(displayReviews.average)}</div>
                    <span className="text-gray-600">({displayReviews.total} Reviews)</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(currentPrice)}
                    </span>
                    {originalPrice && (
                      <span className="text-base text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-700">
                    {product.inventory.inStock ? "In Stock" : "Out of Stock"}
                  </p>
                </div>

                {sizeVariant && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Storage Capacity</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizeVariant.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedSize(option.id)}
                          className={cn(
                            "px-3 py-1.5 border rounded-md text-xs font-medium transition-colors",
                            selectedSize === option.id
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 text-gray-700 hover:border-gray-400"
                          )}
                        >
                          {option.value.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {colorVariant && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Color</h3>
                    <div className="flex gap-2">
                      {colorVariant.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedColor(option.id)}
                          className={cn(
                            "w-7 h-7 rounded border-2 transition-all",
                            selectedColor === option.id ? "border-gray-900" : "border-gray-300"
                          )}
                          style={{ backgroundColor: option.hex }}
                          title={option.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.features && product.features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Highlights</p>
                    <ul className="space-y-1.5">
                      {product.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>
                            {(() => {
                              if (typeof feature === "string") return feature;
                              if (feature && typeof feature === "object") {
                                const f = feature as { name?: string; value?: string };
                                const n = String(f.name ?? "").trim();
                                const v = String(f.value ?? "").trim();
                                return n && v ? `${n}: ${v}` : v || n || "";
                              }
                              return "";
                            })()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-2">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">On orders over ₦20,000</p>
                  <p className="text-3xl font-bold text-[#1E4700] mt-1">{formatPrice(currentPrice)}</p>
                </div>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#2f7d32] hover:bg-[#2f7d32]/90 text-white"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 text-white"
                  size="lg"
                >
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isWishlisted) {
                      removeFromWishlist(product.id);
                    } else {
                      addToWishlist(product);
                    }
                  }}
                  className={cn("w-full", isWishlisted && "text-red-500 border-red-500")}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isWishlisted && "fill-current")} />
                  Add to Wishlist
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Secure Checkout</p>
                    <p className="text-xs text-gray-600">100% secure payments</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">7-Day Returns</p>
                    <p className="text-xs text-gray-600">Easy return & refund</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Headset className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">24/7 Support</p>
                    <p className="text-xs text-gray-600">Always here to help</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    {[
                      { id: "description", label: "Description" },
                      { id: "features", label: "Features" },
                      { id: "shipping", label: "Shipping & Returns" },
                      { id: "rating", label: "Product Rating" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={cn(
                          "px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                          activeDetailTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {activeDetailTab === "description" && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {activeDetailTab === "features" && (
                    <div className="space-y-4">
                      {product.features && product.features.length > 0 ? (
                        <ul className="space-y-3">
                          {product.features.map((feature, index) => {
                            let label = "";
                            if (typeof feature === "string") {
                              label = feature;
                            } else if (feature && typeof feature === "object") {
                              const f = feature as { name?: string; value?: string };
                              const n = String(f.name ?? "").trim();
                              const v = String(f.value ?? "").trim();
                              label = n && v ? `${n}: ${v}` : v || n || "";
                            }
                            if (!label) return null;
                            return (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-gray-700">{label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-600">No features listed for this product.</p>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "shipping" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Truck className="w-5 h-5 text-primary" />
                          Shipping Information
                        </h3>
                        <div className="space-y-3 text-gray-700">
                          <p>
                            We partner with trusted carriers to deliver orders across Nigeria and
                            to select international destinations.
                          </p>
                          {product.shipping.freeShipping && <Badge variant="success">Free Shipping</Badge>}
                          <p>
                            <span className="font-medium">Delivery fees:</span> All fees are shown clearly at checkout.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <RotateCcw className="w-5 h-5 text-primary" />
                          Returns & Warranty
                        </h3>
                        <div className="space-y-3 text-gray-700">
                          <p>
                            <span className="font-medium">Returnable:</span>{" "}
                            {product.returns.returnable ? "Yes" : "No"}
                          </p>
                          {product.returns.free && <Badge variant="success">Free Returns</Badge>}
                          {product.warranty && (
                            <p>
                              <span className="font-medium">Warranty:</span> {product.warranty.period}{" "}
                              {product.warranty.unit} ({product.warranty.type})
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-[#2ac12a] text-gray-900 hover:bg-[#8DEB6E] hover:text-[#1E4700] hover:border-[#2ac12a]"
                            onClick={() => navigate("/shipping-return-policy")}
                          >
                            View full Shipping & Return policy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "rating" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Rating</h2>
                      {displayReviews ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-gray-200 pr-6">
                            <div className="text-5xl font-bold text-gray-900 mb-2">
                              {displayReviews.average.toFixed(1)}
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {renderStars(displayReviews.average)}
                            </div>
                            <div className="text-sm text-gray-600">{displayReviews.total} ratings</div>
                          </div>
                          <div className="md:col-span-2 space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                              const count =
                                displayReviews.breakdown?.[
                                  stars as keyof typeof displayReviews.breakdown
                                ] || 0;
                              const percentage =
                                displayReviews.total > 0
                                  ? (count / displayReviews.total) * 100
                                  : 0;
                              return (
                                <div key={stars} className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700 w-12">
                                    {stars} star
                                  </span>
                                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-yellow-400 transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-4">No ratings yet</p>
                          {isAuthenticated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate("/orders")}
                              className="bg-white border-[#2ac12a] text-gray-900 hover:bg-[#8DEB6E] hover:text-[#1E4700] hover:border-[#2ac12a]"
                            >
                              View My Orders
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {filteredRelatedProducts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader text="Related Items" subtitle="You may also like these" />
                    <Link to="/products" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredRelatedProducts.slice(0, 2).map((relatedProduct) => (
                      <ProductCard
                        key={relatedProduct.id}
                        product={normalizeProductImages(relatedProduct)}
                        showQuickAdd
                        className="group cursor-pointer"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <RecentlyViewedProductsSection
              variant="inline"
              limit={2}
              gridClassName="grid grid-cols-2 gap-3"
              className="!mt-0 pt-0 border-0 rounded-lg border bg-white p-4 space-y-3"
              showQuickAdd
            />
          </div>
        </div>

        <section className="mt-8 mb-4 rounded-lg border bg-white px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Free Delivery</p>
                <p className="text-xs text-gray-500">On orders over ₦20,000</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Easy Returns</p>
                <p className="text-xs text-gray-500">7-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Secure Payments</p>
                <p className="text-xs text-gray-500">100% secure payments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Headset className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">24/7 Support</p>
                <p className="text-xs text-gray-500">Always ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Trusted by Thousands</p>
                <p className="text-xs text-gray-500">50,000+ happy customers</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
