import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingCart, Star } from "lucide-react";
import { Button, Badge, Card, CardContent, Image } from "../UI";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
import type { Product, ProductSummary } from "../../types";
import { cn } from "../../lib/utils";

interface ProductCardProps {
  product: ProductSummary | Product;
  showQuickAdd?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showQuickAdd = true,
  className,
}) => {
  const { addToCart, isOperating } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isItemInWishlist,
  } = useWishlistStore();
  const [imageLoading, setImageLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  const isWishlisted = isItemInWishlist(product.id);

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
      await addToCart(productForCart, 1);
      setAddedToCart(true); // Show feedback
      setTimeout(() => setAddedToCart(false), 1500); // Hide after 1.5s
    } catch (error) {
      console.error("Failed to add to cart:", error);
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

  const renderStars = (rating: number, total: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "w-3 h-3 sm:w-4 sm:h-4",
                i < fullStars
                  ? "fill-yellow-400 text-yellow-400"
                  : i === fullStars && hasHalfStar
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          ({total})
        </span>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
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
        "group relative bg-white border-none border-0 rounded-none overflow-hidden cursor-pointer w-full",
        className
      )}
    >
      <CardContent className="p-0">
        <Link to={`/products/${product.id}`} className="block">
          <div className="relative">
            {/* Discount Badge */}
            {discount && discount.percentage > 0 && (
              <Badge
                variant="destructive"
                className="absolute top-2 left-2 z-20 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-md"
              >
                -{discount.percentage}%
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
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}
              <Image
                src={
                  Array.isArray(product.images)
                    ? product.images[0]
                    : product.images.main
                }
                alt={product.name || "Product image"}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300",
                  "group-hover:scale-105",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />

              {/* Quick Add Button Overlay */}
              {showQuickAdd && product.inventory.inStock && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent  transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Button
                    variant="ghost"
                    className="w-full text-white bg-black hover:bg-black hover:text-white backdrop-blur-sm font-medium rounded-none"
                    onClick={handleAddToCart}
                    disabled={isOperating || addedToCart}
                  >
                    {addedToCart ? (
                      <> Added to Cart</>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isOperating ? "Adding..." : "Add To Cart"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {/* Store Name */}
            {product.storeName && (
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {product.storeName}
              </p>
            )}

            {/* Brand (fallback if no store name) */}
            {!product.storeName && "brand" in product && product.brand && (
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {product.brand}
              </p>
            )}

            {/* Product Name */}
            <h3 className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
              {product.name}
            </h3>

            {/* Reviews */}
            {product.reviews.total > 0 && (
              <div className="flex items-center">
                {renderStars(product.reviews.average, product.reviews.total)}
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-red-400 text-md">
                {formatPrice(currentPrice)}
              </span>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-gray-400 line-through text-xs">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
