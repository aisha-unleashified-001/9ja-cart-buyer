import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { Button, Badge, Card, CardContent, Image } from "../UI";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
// Ratings imports temporarily disabled while rating display is commented out
// import { useProductRatingsStore } from "../../store/useProductRatingsStore";
// import { useProductRatings } from "../../hooks/api/useProductRatings";
import type { Product, ProductSummary } from "../../types";
import { cn } from "../../lib/utils";
import { formatPrice, formatDiscountPercentage } from "../../lib/productUtils";
import { preloadProductDetailPage } from "../../lib/preloadProductDetail";

interface ProductCardProps {
  product: ProductSummary | Product;
  showQuickAdd?: boolean;
  eagerImages?: boolean;
  highlightAsFlashSale?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showQuickAdd = true,
  eagerImages = false,
  // highlightAsFlashSale accepted via props for future use; not destructured to avoid unused-variable error
  className,
}) => {
  const { addToCart } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isItemInWishlist,
  } = useWishlistStore();
  const [imageLoading, setImageLoading] = useState(!eagerImages);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isItemInWishlist(product.id);

  // On homepage (eagerImages), skip live ratings API call — product already has review data
  // from the products list response. This prevents 20-80 concurrent requests on homepage load.
  // Ratings hooks currently unused while rating display is disabled
  // const { reviews: apiReviews } = useProductRatings(product.id, !eagerImages);
  // const productRatingFromStore = useProductRatingsStore((s) => s.getRating(product.id));

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Convert ProductSummary to Product for cart
    const productForCart: Product = {
      ...product,
      description:
        "shortDescription" in product ? product.shortDescription || "" : "",
      shortDescription:
        "shortDescription" in product ? product.shortDescription : undefined,
      features: "features" in product ? product.features : [],
      specifications: "specifications" in product ? product.specifications : {},
      inventory: {
        ...product.inventory,
        quantity:
          "quantity" in product.inventory ? product.inventory.quantity : 100,
        lowStockThreshold:
          "lowStockThreshold" in product.inventory
            ? product.inventory.lowStockThreshold
            : 10,
        trackQuantity:
          "trackQuantity" in product.inventory
            ? product.inventory.trackQuantity
            : true,
      },
      images: {
        ...product.images,
        gallery:
          "gallery" in product.images
            ? product.images.gallery
            : [product.images.main],
        videos: "videos" in product.images ? product.images.videos : [],
      },
      sellerId: "sellerId" in product ? product.sellerId : "default-seller",
      shipping:
        "shipping" in product
          ? product.shipping
          : {
              freeShipping: true,
              estimatedDelivery: "2-3 business days",
            },
      returns:
        "returns" in product
          ? product.returns
          : {
              returnable: true,
              period: 30,
              unit: "days",
              free: true,
            },
      status: "status" in product ? product.status : "active",
      createdAt: "createdAt" in product ? product.createdAt : new Date(),
      updatedAt: "updatedAt" in product ? product.updatedAt : new Date(),
      tags: "tags" in product ? product.tags : [],
    } as Product;

    try {
      setIsAddingToCart(true);
      await addToCart(productForCart, 1);
      setAddedToCart(true); // Show feedback
      setTimeout(() => setAddedToCart(false), 1500); // Hide after 1.5s
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Convert ProductSummary to Product for wishlist
    const productForWishlist: Product = {
      ...product,
      description:
        "shortDescription" in product ? product.shortDescription || "" : "",
      shortDescription:
        "shortDescription" in product ? product.shortDescription : undefined,
      features: "features" in product ? product.features : [],
      specifications: "specifications" in product ? product.specifications : {},
      inventory: {
        ...product.inventory,
        quantity:
          "quantity" in product.inventory ? product.inventory.quantity : 100,
        lowStockThreshold:
          "lowStockThreshold" in product.inventory
            ? product.inventory.lowStockThreshold
            : 10,
        trackQuantity:
          "trackQuantity" in product.inventory
            ? product.inventory.trackQuantity
            : true,
      },
      images: {
        ...product.images,
        gallery:
          "gallery" in product.images
            ? product.images.gallery
            : [product.images.main],
        videos: "videos" in product.images ? product.images.videos : [],
      },
      sellerId: "sellerId" in product ? product.sellerId : "default-seller",
      shipping:
        "shipping" in product
          ? product.shipping
          : {
              freeShipping: true,
              estimatedDelivery: "2-3 business days",
            },
      returns:
        "returns" in product
          ? product.returns
          : {
              returnable: true,
              period: 30,
              unit: "days",
              free: true,
            },
      status: "status" in product ? product.status : "active",
      createdAt: "createdAt" in product ? product.createdAt : new Date(),
      updatedAt: "updatedAt" in product ? product.updatedAt : new Date(),
      tags: "tags" in product ? product.tags : [],
    } as Product;

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(productForWishlist);
    }
  };

  // const renderStars = (rating: number, total: number) => {
  //   const fullStars = Math.floor(rating);
  //   const hasHalfStar = rating % 1 !== 0;
  //
  //   return (
  //     <div className="flex items-center gap-1">
  //       <div className="flex">
  //         {Array.from({ length: 5 }, (_, i) => (
  //           <Star
  //             key={i}
  //             className={cn(
  //               "w-3 h-3 sm:w-4 sm:h-4",
  //               i < fullStars
  //                 ? "fill-yellow-400 text-yellow-400"
  //                 : i === fullStars && hasHalfStar
  //                 ? "fill-yellow-400/50 text-yellow-400"
  //                 : "fill-gray-200 text-gray-200"
  //             )}
  //           />
  //         ))}
  //       </div>
  //       <span className="text-xs sm:text-sm text-gray-600 font-medium">
  //         ({total})
  //       </span>
  //     </div>
  //   );
  // };

  // Helper function to truncate description to a certain word count
  const truncateDescription = (text: string, wordCount: number = 12): string => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(" ") + "...";
  };

  // Get description text (prefer shortDescription, fallback to description)
  const getDescriptionText = (): string => {
    if ("shortDescription" in product && product.shortDescription) {
      return product.shortDescription;
    }
    if ("description" in product && product.description) {
      return product.description;
    }
    return "";
  };

  const currentPrice =
    typeof product.price === "number" ? product.price : product.price.current;
  const originalPrice =
    typeof product.price === "object" ? product.price.original : undefined;
  const discount =
    typeof product.price === "object" ? product.price.discount : undefined;

  return (
    <Card
      className={cn(
        "group relative bg-white border-none border-0 rounded-md overflow-hidden cursor-pointer w-full h-full",
        className
      )}
    >
      <CardContent className="p-0 h-full flex flex-col">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <Link
            to={`/products/${product.id}`}
            className="block shrink-0"
            onMouseEnter={preloadProductDetailPage}
            onFocus={preloadProductDetailPage}
          >
            <div className="relative">
              {/* Discount Badge */}
              {discount && discount.percentage > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-2 left-2 z-20 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-md hover:text-white"
                >
                  -{formatDiscountPercentage(discount.percentage)}%
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                <Button
                  size="icon"
                  variant="outline"
                  className="w-10 h-10 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm touch-target-sm"
                  onClick={handleWishlist}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
                    )}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-10 h-10 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm touch-target-sm"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </Button>
              </div>

              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-md bg-gray-50">
                {imageLoading && !eagerImages && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}
                <Image
                  src={
                    Array.isArray(product.images)
                      ? product.images[0]
                      : product.images.main
                  }
                  alt={product.name || "Product image"}
                  lazy={!eagerImages}
                  className={cn(
                    "h-full w-full object-cover transition-all duration-300",
                    "group-hover:scale-105",
                    !eagerImages && imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </div>
            </div>
          </Link>

          {/* One gradient panel: text link + CTA sit on the same flowing background */}
          <div
            className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4"
            style={{
              background:
                "linear-gradient(to bottom, #ffffff 0%, #ffffff 22%, rgba(141, 235, 110, 0.12) 72%, rgba(141, 235, 110, 0.22) 100%)",
            }}
          >
            <Link
              to={`/products/${product.id}`}
              className="flex min-h-0 flex-1 flex-col space-y-1 sm:space-y-1.5"
              onMouseEnter={preloadProductDetailPage}
              onFocus={preloadProductDetailPage}
            >
              {/* Product Name */}
              <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors group-hover:text-primary sm:text-base">
                {product.name}
              </h3>

              {/* Description Snippet - Fixed 2-line height for uniform card layout */}
              <div className="min-h-[2.5rem] sm:min-h-[2.75rem]">
                {getDescriptionText() && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 sm:text-sm">
                    {truncateDescription(getDescriptionText(), 12)}
                  </p>
                )}
              </div>

              {/* Reviews (temporarily disabled non-dynamic display) */}
              {/*
            {displayReviews && displayReviews.total > 0 && (
              <div className="flex items-center -mt-0.5">
                {renderStars(displayReviews.average, displayReviews.total)}
              </div>
            )}
            */}

              {/* Price */}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <span className="text-md font-medium text-red-400">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && originalPrice > currentPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
            </Link>

            {showQuickAdd && product.inventory.inStock && (
              <Button
                className="mt-3 h-10 w-full shrink-0 border-0 bg-[#182F38] px-4 font-medium text-white shadow-none hover:bg-[#182F38]/90 hover:text-white focus-visible:ring-2 focus-visible:ring-[#182F38]/40 focus-visible:ring-offset-2"
                onClick={handleAddToCart}
                disabled={isAddingToCart || addedToCart}
              >
                {addedToCart ? (
                  "Added to Cart"
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
