import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  
  ShoppingCart,
} from "lucide-react";
import {
  Breadcrumb,
  Button,
  Badge,
  Card,
  CardContent,
  Loading,
  Alert,
  Image,
} from "../../components/UI";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useRealProduct, useRealProductsList } from "../../hooks/api/useRealProducts";
// import type { Product } from "../../types";
import { cn, normalizeProductImages } from "../../lib/utils";
import { ProductCard } from "@/components/Product";
import { useNotificationContext } from "../../providers/NotificationProvider";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showNotification } = useNotificationContext();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();

  // Use real API hook
  const { product, loading, error } = useRealProduct(id || null);
  
  // Fetch a broader pool of products for better tag-based matching across categories
  // We'll filter by categoryName and tags in the filtering logic
  const { products: relatedProducts } = useRealProductsList({ 
    page: 1, 
    // Fetch more products to have a good pool for filtering by categoryName and tags
    perPage: 50,
  });

  // Use product reviews (API ratings archived)
  const displayReviews = product?.reviews;

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

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, quantity);
      showNotification(
        `${product.name} has been added to cart`,
        'success',
        3000
      );
    } catch (error) {
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
      await addToCart(product, quantity);
      showNotification(
        `${product.name} has been added to cart`,
        'success',
        3000
      );
      navigate("/checkout");
    } catch (error) {
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
    const finalList = matched.length > 0 
      ? matched 
      : candidates.filter((relatedProduct) => 
          relatedProduct.categoryId === product.categoryId
        );

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg border overflow-hidden relative">
              {/* Discount Badge Overlay */}
              {discount && (
                <div className="absolute top-4 right-4 z-10">
                  <div 
                    className="relative"
                    style={{
                      transform: 'rotate(-5deg)',
                      transformOrigin: 'center',
                    }}
                  >
                    {/* Bottle Cap Shape */}
                    <div 
                      className="relative w-20 h-20 flex items-center justify-center text-white font-bold text-xs shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #8DEB6E 0%, #7DD85D 50%, #6BC54C 100%)',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {/* Inner rim effect */}
                      <div 
                        className="absolute inset-2 rounded-full"
                        style={{
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      {/* Text */}
                      <div className="relative z-10 text-center leading-tight">
                        <div className="font-bold">{discount.percentage}%</div>
                        <div className="text-[10px] font-semibold">OFF</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Image
                src={
                  product.images.gallery[selectedImage] || product.images.main
                }
                alt={product.images.alt}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-2 overflow-x-auto">
              {product.images.gallery.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 bg-white rounded-lg border-2 overflow-hidden",
                    selectedImage === index
                      ? "border-primary"
                      : "border-gray-200"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Seller */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                {product.vendorId ? (
                  <Link 
                    to={`/vendor/${product.vendorId}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {product.vendorLogo ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                        <Image
                          src={product.vendorLogo}
                          alt={product.storeName || 'Vendor'}
                          className="w-full h-full object-cover"
                          onError={() => {
                            console.warn('Vendor logo failed to load:', product.vendorLogo);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {product.storeName ? product.storeName.charAt(0).toUpperCase() : '9J'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 hover:text-primary transition-colors">
                        {product.storeName || '9jaCart'}
                      </p>
                      <p className="text-sm text-gray-500">Nigeria</p>
                    </div>
                  </Link>
                ) : (
                  <>
                    {product.vendorLogo ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                        <Image
                          src={product.vendorLogo}
                          alt={product.storeName || 'Vendor'}
                          className="w-full h-full object-cover"
                          onError={() => {
                            console.warn('Vendor logo failed to load:', product.vendorLogo);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {product.storeName ? product.storeName.charAt(0).toUpperCase() : '9J'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.storeName || '9jaCart'}
                      </p>
                      <p className="text-sm text-gray-500">Nigeria</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Reviews */}
            {displayReviews && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {renderStars(displayReviews.average)}
                </div>
                <span className="text-sm text-gray-600">
                  ({displayReviews.total} Reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {product.shortDescription ||
                  product.description.substring(0, 100) + "..."}
              </p>
            </div>

            {/* Colors */}
            {colorVariant && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Colours:</h3>
                <div className="flex gap-2">
                  {colorVariant.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedColor(option.id)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        selectedColor === option.id
                          ? "border-gray-900 scale-110"
                          : "border-gray-300"
                      )}
                      style={{ backgroundColor: option.hex }}
                      title={option.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizeVariant && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Size:</h3>
                <div className="flex gap-2">
                  {sizeVariant.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSize(option.id)}
                      className={cn(
                        "px-4 py-2 border rounded-md text-sm font-medium transition-colors",
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

            {/* Quantity and Actions */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Row 1 (Mobile): Quantity + Add to Cart */}
              <div className="flex items-center gap-3 md:contents">
                {/* Quantity Selector */}
                <div className="flex items-center border rounded-md md:order-1">
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

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary md:order-2 md:flex-1 border border-[#2ac12a]"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>

              {/* Row 2 (Mobile): Like + Checkout */}
              <div className="flex items-center gap-3 md:contents">
                {/* Like Icon */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (product) {
                      if (isWishlisted) {
                        removeFromWishlist(product.id);
                      } else {
                        addToWishlist(product);
                      }
                    }
                  }}
                  className={cn(
                    "px-4 md:order-4",
                    isWishlisted && "text-red-500 border-red-500"
                  )}
                >
                  <Heart
                    className={cn("w-5 h-5", isWishlisted && "fill-current")}
                  />
                </Button>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="flex-1 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary md:order-3 md:flex-1 border border-[#2ac12a]"
                  size="lg"
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Delivery Info */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-gray-600">
                      Delivery fees will be paid upon product arrival.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Return Item</p>
                    <p className="text-sm text-gray-600">
                      A dispute for a dissatisfied item must be opened within 3 days of delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Section */}
        <Card className="mt-8">
          <CardContent className="p-0">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {[
                  { id: "description", label: "Description" },
                  { id: "features", label: "Features" },
                  { id: "shipping", label: "Shipping & Returns" },
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
              {/* Description Tab */}
              {activeDetailTab === "description" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Product Details</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  {(product.brand || product.model || product.categoryName) && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.brand && (
                          <>
                            <dt className="font-medium text-gray-700">Brand:</dt>
                            <dd className="text-gray-600">{product.brand}</dd>
                          </>
                        )}
                        {product.model && (
                          <>
                            <dt className="font-medium text-gray-700">Model:</dt>
                            <dd className="text-gray-600">{product.model}</dd>
                          </>
                        )}
                        {product.categoryName && (
                          <div className="col-span-2 md:col-span-1">
                            <span className="font-medium text-gray-700">Category:</span>
                            <span className="text-gray-600 ml-2">{product.categoryName}</span>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              )}

              {/* Features Tab */}
              {activeDetailTab === "features" && (
                <div className="space-y-4">
                  {product.features && product.features.length > 0 ? (
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No features listed for this product.</p>
                  )}
                </div>
              )}

              {/* Shipping & Returns Tab */}
              {activeDetailTab === "shipping" && (
                <div className="space-y-6">
                  {/* Shipping Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      Shipping Information
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      {product.shipping.freeShipping && (
                        <p className="flex items-center gap-2">
                          <Badge variant="success">Free Shipping</Badge>
                        </p>
                      )}
                      {product.shipping.weight && (
                        <p>
                          <span className="font-medium">Weight:</span> {product.shipping.weight} {product.shipping.dimensions?.unit || 'kg'}
                        </p>
                      )}
                      {product.shipping.dimensions && (
                        <p>
                          <span className="font-medium">Dimensions:</span> {product.shipping.dimensions.length} × {product.shipping.dimensions.width} × {product.shipping.dimensions.height} {product.shipping.dimensions.unit}
                        </p>
                      )}
                      {product.shipping.shippingClass && (
                        <p>
                          <span className="font-medium">Shipping Class:</span> {product.shipping.shippingClass}
                        </p>
                      )}
                      {product.shipping.restrictions && product.shipping.restrictions.length > 0 && (
                        <div>
                          <span className="font-medium">Restrictions:</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {product.shipping.restrictions.map((restriction, idx) => (
                              <li key={idx}>{restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p>
                        <span className="font-medium">Delivery:</span> Delivery fees will be paid upon product arrival.
                      </p>
                    </div>
                  </div>

                  {/* Returns Information */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-primary" />
                      Returns & Warranty
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      {product.returns.returnable ? (
                        <>
                          <p>
                            <span className="font-medium">Returnable:</span> Yes
                          </p>
                          <p>
                            <span className="font-medium">Return Period:</span> {product.returns.period} {product.returns.unit}
                          </p>
                          {product.returns.free && (
                            <p>
                              <Badge variant="success">Free Returns</Badge>
                            </p>
                          )}
                          {product.returns.conditions && product.returns.conditions.length > 0 && (
                            <div>
                              <span className="font-medium">Return Conditions:</span>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {product.returns.conditions.map((condition, idx) => (
                                  <li key={idx}>{condition}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p>This product is not returnable.</p>
                      )}
                      <p className="pt-2 border-t border-gray-100">
                        A dispute for a dissatisfied item must be opened within 3 days of delivery.
                      </p>
                      {product.warranty && (
                        <div className="pt-2 border-t border-gray-100">
                          <p>
                            <span className="font-medium">Warranty:</span> {product.warranty.period} {product.warranty.unit} ({product.warranty.type})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Rating Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Rating</h2>
            
            {displayReviews && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rating Summary */}
                <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-gray-200 pr-6">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {displayReviews.average.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(displayReviews.average)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {displayReviews.total} rating{displayReviews.total !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Ratings from purchases
                    </p>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="md:col-span-2 space-y-3">
                  {displayReviews.breakdown && (
                    <>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = displayReviews.breakdown?.[stars as keyof typeof displayReviews.breakdown] || 0;
                        const percentage = displayReviews.total > 0 
                          ? (count / displayReviews.total) * 100 
                          : 0;
                      
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 w-12">
                            {stars} star{stars > 1 ? 's' : ''}
                          </span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                </div>
              </div>
            )}
            
            {!displayReviews && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 text-gray-300"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">No ratings yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Be the first to rate this product after purchase.
                </p>
              </div>
            )}
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                <strong>Rate this product:</strong> After purchasing and receiving this item, 
                you can rate and review your experience in your order history.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/orders')}
              >
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Related Items */}
        {filteredRelatedProducts.length > 0 && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-4 h-8 bg-primary rounded"></div>
              <h2 className="text-2xl font-bold text-gray-900">Related Items</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredRelatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={normalizeProductImages(relatedProduct)}
                    className="group cursor-pointer hover:shadow-lg transition-shadow"
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
