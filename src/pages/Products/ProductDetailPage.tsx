import React, { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  Check,
  Sun,
  Sparkles,
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
import { RelatedProductCard } from "@/components/Product";
import RecentlyViewedProductsSection from "@/components/HomePage/RecentlyViewedProductsSection";
import { useNotificationContext } from "../../providers/NotificationProvider";
import visaLogo from "@/assets/payment-logos/visa-logo.png";
import mastercardLogo from "@/assets/payment-logos/mastercard-logo.png";
import verveLogo from "@/assets/payment-logos/verve-logo.png";
import applePayLogo from "@/assets/payment-logos/apple-pay-logo.png";
import googlePayLogo from "@/assets/payment-logos/google-pay-logo.png";
import type { VariantType } from "../../types";

const PAYMENT_LOGOS = [
  { src: visaLogo, alt: "Visa" },
  { src: mastercardLogo, alt: "Mastercard" },
  { src: verveLogo, alt: "Verve" },
  { src: applePayLogo, alt: "Apple Pay" },
  { src: googlePayLogo, alt: "Google Pay" },
] as const;

const VARIANT_ROW_LABELS: Record<VariantType, string> = {
  size: "Available Sizes",
  color: "Available Colors",
  material: "Material",
  style: "Style",
  measurement: "Measurement",
};

const getFeatureLabel = (feature: unknown): string => {
  if (typeof feature === "string") return feature;
  if (feature && typeof feature === "object") {
    const f = feature as { name?: string; value?: string };
    const n = String(f.name ?? "").trim();
    const v = String(f.value ?? "").trim();
    return n && v ? `${n}: ${v}` : v || n || "";
  }
  return "";
};

const FEATURE_PILL_ICONS = [Sun, Sparkles, Heart] as const;

const THUMBNAIL_SIZE_PX = 72;
const THUMBNAIL_GAP_PX = 8;
const THUMBNAIL_VISIBLE_COUNT = 4;
const THUMBNAIL_STEP_PX = THUMBNAIL_SIZE_PX + THUMBNAIL_GAP_PX;
const THUMBNAIL_VIEWPORT_HEIGHT_PX =
  THUMBNAIL_VISIBLE_COUNT * THUMBNAIL_SIZE_PX +
  (THUMBNAIL_VISIBLE_COUNT - 1) * THUMBNAIL_GAP_PX;

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
  
  const hasRealReviews = Boolean(apiReviews && apiReviews.total > 0);
  const displayReviews = hasRealReviews ? apiReviews : null;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState<string>("description");
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const isWishlisted = product ? isItemInWishlist(product.id) : false;

  const scrollThumbnails = (direction: "up" | "down") => {
    const container = thumbnailRef.current;
    if (!container) return;
    container.scrollBy({
      top: direction === "up" ? -THUMBNAIL_STEP_PX : THUMBNAIL_STEP_PX,
      behavior: "smooth",
    });
  };

  const scrollRelated = (direction: "left" | "right") => {
    const container = relatedScrollRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === "left" ? -container.clientWidth * 0.8 : container.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  // Set default selections when product loads
  useEffect(() => {
    if (product?.variants) {
      const colorVariant = product.variants.find(
        (v) => v.type === "color"
      );
      if (colorVariant && colorVariant.options.length > 0) {
        setSelectedColor(colorVariant.options[0].id);
      }

      const sizeVariant = product.variants.find((v) => v.type === "size");
      const measurementVariant = product.variants.find((v) => v.type === "measurement");
      const selectVariant = sizeVariant ?? measurementVariant;
      if (selectVariant && selectVariant.options.length > 0) {
        setSelectedSize(selectVariant.options[0].id);
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
      const selectVariant =
        product.variants?.find((v) => v.type === "size") ??
        product.variants?.find((v) => v.type === "measurement");
      if (selectVariant && selectedSize) {
        const opt = selectVariant.options.find((o) => o.id === selectedSize);
        if (opt) selectedVariants[selectVariant.type] = opt.value;
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
      const selectVariant =
        product.variants?.find((v) => v.type === "size") ??
        product.variants?.find((v) => v.type === "measurement");
      if (selectVariant && selectedSize) {
        const opt = selectVariant.options.find((o) => o.id === selectedSize);
        if (opt) selectedVariants[selectVariant.type] = opt.value;
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

    return finalList.slice(0, 8);
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
    ...(product.categoryName
      ? [{ label: product.categoryName, href: `/category/${product.categoryId}` }]
      : [{ label: "Products", href: "/products" }]),
    { label: product.name, isCurrentPage: true },
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

  const isNumericOnly = (text: string) => /^\d+(\.\d+)?$/.test(text.trim());
  const isSpecFeatureName = (name: string) =>
    /weight|size|storage|capacity|dimension|measure|ram|memory|volume|variant/i.test(name);

  const highlightPills: string[] = [];
  const featureVariationRows: { label: string; value: string }[] = [];

  (product.features ?? []).forEach((feature) => {
    if (feature && typeof feature === "object" && "name" in feature && "value" in feature) {
      const label = String((feature as { name?: string }).name ?? "").trim();
      const value = String((feature as { value?: string }).value ?? "").trim();
      if (label && value) {
        if (isSpecFeatureName(label) || isNumericOnly(value)) {
          featureVariationRows.push({ label, value });
          return;
        }
      }
    }
    const text = getFeatureLabel(feature);
    if (text && !isNumericOnly(text)) {
      highlightPills.push(text);
    }
  });

  const tagPills =
    highlightPills.length === 0
      ? (product.tags ?? []).filter((tag) => tag && !isNumericOnly(tag)).slice(0, 3)
      : [];
  const pillItems = [...highlightPills, ...tagPills].slice(0, 3);
  const shortDescription =
    product.shortDescription ||
    (product.description.length > 200
      ? `${product.description.slice(0, 200).trim()}...`
      : product.description);
  const estimatedDelivery =
    product.shipping.estimatedDelivery || "2 - 4 business days";
  const reviewCount = displayReviews?.total ?? 0;

  const variationRows: { label: string; value: string }[] = [...featureVariationRows];
  product.variants?.forEach((variant) => {
    const values = variant.options
      .map((option) =>
        variant.type === "color" ? option.name || option.value : option.value
      )
      .join(", ");
    if (!values) return;

    const optionGroupName = variant.options[0]?.name?.trim();
    const sharedOptionName =
      optionGroupName &&
      variant.options.every((option) => option.name === variant.options[0].name);
    const label =
      sharedOptionName && isSpecFeatureName(optionGroupName)
        ? optionGroupName
        : VARIANT_ROW_LABELS[variant.type];

    const existing = variationRows.find(
      (row) => row.label.toLowerCase() === label.toLowerCase()
    );
    if (existing) {
      existing.value = values;
    } else {
      variationRows.push({ label, value: values });
    }
  });
  const measurementVariant = product.variants?.find((v) => v.type === "measurement");
  const sidebarSelectVariant = sizeVariant ?? measurementVariant;
  const formattedWeight =
    product.shipping.weight != null && product.shipping.weight > 0
      ? `${product.shipping.weight.toFixed(2).replace(/\.00$/, "")} KG`
      : null;
  const formatSidebarOptionLabel = (value: string) => {
    const v = value.trim();
    if (v.startsWith("(") && v.endsWith(")")) return v;
    return `(${v})`;
  };

  const showThumbnailArrows = imageGallery.length > THUMBNAIL_VISIBLE_COUNT;
  const thumbnailViewportHeight = THUMBNAIL_VIEWPORT_HEIGHT_PX;

  return (
    <div className="min-h-screen bg-white max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <div className="mx-auto px-4 py-4 sm:py-6 min-h-[70vh]">
        <Breadcrumb items={breadcrumbItems} className="mb-4 sm:mb-6 text-gray-500" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 mb-8">
          {/* Image gallery */}
          <div className="xl:col-span-5">
            <div className="flex gap-3 sm:gap-4">
              {imageGallery.length > 1 && (
                <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
                  {showThumbnailArrows && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails("up")}
                      className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      aria-label="Scroll thumbnails up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                  <div
                    ref={thumbnailRef}
                    style={{ height: thumbnailViewportHeight }}
                    className={cn(
                      "flex w-[72px] flex-col gap-2",
                      showThumbnailArrows ? "overflow-y-auto scrollbar-hide" : "overflow-hidden"
                    )}
                  >
                    {imageGallery.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "flex-shrink-0 rounded-lg border-2 overflow-hidden bg-white",
                          selectedImage === index
                            ? "border-[#28a745]"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={{ width: THUMBNAIL_SIZE_PX, height: THUMBNAIL_SIZE_PX }}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-contain"
                          aspectRatio="auto"
                          objectFit="contain"
                          lazy={false}
                        />
                      </button>
                    ))}
                  </div>
                  {showThumbnailArrows && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails("down")}
                      className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      aria-label="Scroll thumbnails down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="aspect-square w-full max-w-[520px] mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden relative">
                  {discount && (
                    <Badge className="absolute top-3 right-3 z-10 bg-[#28a745] text-white">
                      -{formatDiscountPercentage(discount.percentage)}%
                    </Badge>
                  )}
                  <Image
                    src={imageGallery[selectedImage] || product.images.main}
                    alt={product.images.alt}
                    className="w-full h-full object-contain p-4"
                    aspectRatio="auto"
                    objectFit="contain"
                    lazy={false}
                  />
                  <div className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 border border-gray-200 text-gray-600">
                    <ZoomIn className="w-4 h-4" aria-hidden />
                  </div>
                </div>

                {imageGallery.length > 1 && (
                  <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    {imageGallery.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-white",
                          selectedImage === index ? "border-[#28a745]" : "border-gray-200"
                        )}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-contain"
                          aspectRatio="auto"
                          objectFit="contain"
                          lazy={false}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product information */}
          <div className="xl:col-span-4">
            <div className="space-y-4">
              {product.flags?.bestseller && (
                <Badge className="bg-[#e8f5e9] text-[#1E4700] hover:bg-[#e8f5e9] border-0 font-medium">
                  Best Seller
                </Badge>
              )}
              {!product.flags?.bestseller && product.flags?.featured && (
                <Badge className="bg-[#e8f5e9] text-[#1E4700] hover:bg-[#e8f5e9] border-0 font-medium">
                  Featured
                </Badge>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              <div>
                {product.vendorId ? (
                  <Link
                    to={`/vendor/${product.vendorId}`}
                    className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {product.vendorLogo ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                        <Image
                          src={product.vendorLogo}
                          alt={product.storeName || "Vendor"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 bg-[#004d2c] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {product.storeName
                            ? product.storeName.charAt(0).toUpperCase()
                            : "9J"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 hover:text-primary transition-colors flex items-center gap-1">
                        {product.storeName || "9jaCart"}
                        <BadgeCheck className="w-4 h-4 text-[#28a745]" />
                      </p>
                      <p className="text-xs text-gray-500">Nigeria</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-600">{product.storeName || "9jaCart"}</p>
                )}
              </div>

              {hasRealReviews && displayReviews ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center">{renderStars(displayReviews.average)}</div>
                  <span className="font-medium text-gray-900">
                    {displayReviews.average.toFixed(1)}
                  </span>
                  <span className="text-gray-500">({displayReviews.total} Reviews)</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Be the first to review</p>
              )}

              <div className="space-y-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-[#28a745]">
                    {formatPrice(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-[#28a745] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#28a745]" />
                    {product.inventory.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                  {product.inventory.inStock && (
                    <span className="text-gray-500">Ready to ship</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">{shortDescription}</p>

              {pillItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pillItems.map((pill, index) => {
                    const Icon = FEATURE_PILL_ICONS[index % FEATURE_PILL_ICONS.length];
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#28a745]" />
                        {pill}
                      </span>
                    );
                  })}
                </div>
              )}

              {variationRows.length > 0 && (
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                  {variationRows.map((row) => (
                    <div key={row.label} className="flex px-4 py-2.5">
                      <span className="w-36 flex-shrink-0 text-gray-500">{row.label}</span>
                      <span className="text-gray-900 font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                {product.categoryName && (
                  <div className="flex px-4 py-2.5">
                    <span className="w-36 flex-shrink-0 text-gray-500">Category</span>
                    <Link
                      to={`/category/${product.categoryId}`}
                      className="text-gray-900 font-medium hover:text-primary"
                    >
                      {product.categoryName}
                    </Link>
                  </div>
                )}
                {product.brand && (
                  <div className="flex px-4 py-2.5">
                    <span className="w-36 flex-shrink-0 text-gray-500">Brand</span>
                    <span className="text-gray-900 font-medium">{product.brand}</span>
                  </div>
                )}
                <div className="flex px-4 py-2.5">
                  <span className="w-36 flex-shrink-0 text-gray-500">Country of Origin</span>
                  <span className="text-gray-900 font-medium">Nigeria</span>
                </div>
                {product.sku && (
                  <div className="flex px-4 py-2.5">
                    <span className="w-36 flex-shrink-0 text-gray-500">SKU</span>
                    <span className="text-gray-900 font-medium">{product.sku}</span>
                  </div>
                )}
              </div>

              {colorVariant && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Color</h3>
                  <div className="flex gap-2">
                    {colorVariant.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedColor(option.id)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          selectedColor === option.id ? "border-gray-900" : "border-gray-300"
                        )}
                        style={{ backgroundColor: option.hex }}
                        title={option.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Purchase sidebar */}
          <div className="xl:col-span-3 xl:sticky xl:top-4 xl:self-start">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-[#28a745]">{formatPrice(currentPrice)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Shop Now, Get It Now, Pay Later
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Estimated delivery: {estimatedDelivery}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Quantity</p>
                  <div className="flex gap-2">
                    <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        className="flex justify-center p-2.5 transition-colors hover:bg-gray-50"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="min-w-[2.5rem] px-2 py-2 text-center font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="flex justify-center p-2.5 transition-colors hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {sidebarSelectVariant ? (
                      <div className="min-w-0 flex-1">
                        <label htmlFor="product-variant" className="sr-only">
                          Select {sidebarSelectVariant.type}
                        </label>
                        <select
                          id="product-variant"
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="h-full w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {sidebarSelectVariant.options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {formatSidebarOptionLabel(option.value)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : formattedWeight ? (
                      <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700">
                        ({formattedWeight})
                      </div>
                    ) : null}
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#28a745] hover:bg-[#28a745]/90 text-white"
                  size="lg"
                  disabled={!product.inventory.inStock}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-[#004d2c] hover:bg-[#004d2c]/90 text-white"
                  size="lg"
                  disabled={!product.inventory.inStock}
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
                  className={cn(
                    "w-full border-gray-300",
                    isWishlisted && "text-red-500 border-red-500"
                  )}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isWishlisted && "fill-current")} />
                  Add to Wishlist
                </Button>

                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Guaranteed safe checkout</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PAYMENT_LOGOS.map(({ src, alt }) => (
                      <div
                        key={alt}
                        className="flex h-9 items-center justify-center rounded border border-gray-200 bg-white px-1"
                      >
                        <img
                          src={src}
                          alt={alt}
                          className="max-h-5 max-w-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: ShieldCheck, label: "Secure Checkout" },
                      { icon: RotateCcw, label: "7-Day Returns" },
                      { icon: Headset, label: "24/7 Support" },
                      { icon: BadgeCheck, label: "Trusted Seller" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <Icon className="w-3.5 h-3.5 text-[#28a745] flex-shrink-0" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 min-w-0">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {[
                      { id: "description", label: "Description" },
                      { id: "features", label: "Features" },
                      { id: "shipping", label: "Shipping & Returns" },
                      {
                        id: "rating",
                        label: reviewCount > 0 ? `Product Reviews (${reviewCount})` : "Product Reviews",
                      },
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
                      {product.features && product.features.length > 0 && (
                        <ul className="space-y-2.5 pt-2">
                          {product.features.slice(0, 6).map((feature, index) => {
                            const label = getFeatureLabel(feature);
                            if (!label) return null;
                            return (
                              <li key={index} className="flex items-start gap-2.5 text-gray-700">
                                <Check className="w-4 h-4 text-[#28a745] mt-0.5 flex-shrink-0" />
                                <span>{label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {product.specifications &&
                        Object.keys(product.specifications).length > 0 && (
                          <div className="pt-4 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-3">Specifications</h4>
                            <dl className="space-y-2 text-sm">
                              {Object.entries(product.specifications).map(([key, value]) => (
                                <div key={key} className="flex gap-4">
                                  <dt className="w-36 flex-shrink-0 text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </dt>
                                  <dd className="text-gray-900 font-medium">{String(value)}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                    </div>
                  )}

                  {activeDetailTab === "features" && (
                    <div className="space-y-4">
                      {product.features && product.features.length > 0 ? (
                        <ul className="space-y-3">
                          {product.features.map((feature, index) => {
                            const label = getFeatureLabel(feature);
                            if (!label) return null;
                            return (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="w-4 h-4 text-[#28a745] mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : product.tags && product.tags.length > 0 ? (
                        <ul className="space-y-3">
                          {product.tags.map((tag, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-[#28a745] mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{tag}</span>
                            </li>
                          ))}
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
                          <p className="text-gray-600 mb-4">Be the first to review</p>
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

          <div className="lg:col-span-5 min-w-0">
            {filteredRelatedProducts.length > 0 && (
              <Card className="border border-gray-200 shadow-sm h-full">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <h2 className="text-lg font-bold text-gray-900">You may also like</h2>
                    <Link
                      to="/products"
                      className="text-sm text-[#28a745] hover:underline font-medium whitespace-nowrap"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="relative">
                    {filteredRelatedProducts.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Scroll related products left"
                          onClick={() => scrollRelated("left")}
                          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Scroll related products right"
                          onClick={() => scrollRelated("right")}
                          className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <div
                      ref={relatedScrollRef}
                      className="overflow-x-auto scrollbar-hide px-6"
                    >
                      <div className="flex gap-3 w-max min-w-full pb-1">
                        {filteredRelatedProducts.map((relatedProduct) => (
                          <div
                            key={relatedProduct.id}
                            className="w-[220px] sm:w-[240px] flex-shrink-0"
                          >
                            <RelatedProductCard
                              product={normalizeProductImages(relatedProduct)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <RecentlyViewedProductsSection
          variant="inline"
          limit={5}
          showQuickAdd
          className="mt-6 pt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6 space-y-4"
        />

        <section className="mt-8 mb-4 rounded-xl border border-gray-200 bg-[#f8faf8] px-4 py-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {[
              {
                icon: Truck,
                title: "Shop Now, Get It Now, Pay Later",
                subtitle: "On orders over ₦20,000",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                subtitle: "7-day return policy",
              },
              {
                icon: ShieldCheck,
                title: "Secure Payments",
                subtitle: "100% secure payments",
              },
              {
                icon: Headset,
                title: "24/7 Support",
                subtitle: "Always ready to help",
              },
              {
                icon: BadgeCheck,
                title: "Trusted by Thousands",
                subtitle: "50,000+ happy customers",
              },
            ].map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white border border-gray-200">
                  <Icon className="w-5 h-5 text-[#28a745]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
