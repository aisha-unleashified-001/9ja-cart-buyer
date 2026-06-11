import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Button, Image } from "../UI";
import { useCart } from "../../hooks/useCart";
import type { Product, ProductSummary } from "../../types";
import { cn } from "../../lib/utils";
import { formatPrice } from "../../lib/productUtils";
import { preloadProductDetailPage } from "../../lib/preloadProductDetail";

interface RelatedProductCardProps {
  product: ProductSummary | Product;
  className?: string;
}

const toProductForCart = (product: ProductSummary | Product): Product =>
  ({
    ...product,
    description: "shortDescription" in product ? product.shortDescription || "" : "",
    shortDescription: "shortDescription" in product ? product.shortDescription : undefined,
    features: "features" in product ? product.features : [],
    specifications: "specifications" in product ? product.specifications : {},
    inventory: {
      ...product.inventory,
      quantity: "quantity" in product.inventory ? product.inventory.quantity : 100,
      lowStockThreshold:
        "lowStockThreshold" in product.inventory ? product.inventory.lowStockThreshold : 10,
      trackQuantity:
        "trackQuantity" in product.inventory ? product.inventory.trackQuantity : true,
    },
    images: {
      ...product.images,
      gallery: "gallery" in product.images ? product.images.gallery : [product.images.main],
      videos: "videos" in product.images ? product.images.videos : [],
    },
    sellerId: "sellerId" in product ? product.sellerId : "default-seller",
    shipping:
      "shipping" in product
        ? product.shipping
        : { freeShipping: true, estimatedDelivery: "2-3 business days" },
    returns:
      "returns" in product
        ? product.returns
        : { returnable: true, period: 30, unit: "days", free: true },
    status: "status" in product ? product.status : "active",
    createdAt: "createdAt" in product ? product.createdAt : new Date(),
    updatedAt: "updatedAt" in product ? product.updatedAt : new Date(),
    tags: "tags" in product ? product.tags : [],
  }) as Product;

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        "w-3 h-3",
        i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
      )}
    />
  ));

const RelatedProductCard: React.FC<RelatedProductCardProps> = ({ product, className }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const currentPrice =
    typeof product.price === "number" ? product.price : product.price.current;
  const reviews = product.reviews;
  const hasReviews = reviews && reviews.total > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAdding(true);
      await addToCart(toProductForCart(product), 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white",
        className
      )}
    >
      <Link
        to={`/products/${product.id}`}
        className="flex flex-1 gap-2.5 p-3"
        onMouseEnter={preloadProductDetailPage}
        onFocus={preloadProductDetailPage}
      >
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50 sm:h-20 sm:w-20">
          <Image
            src={product.images.main}
            alt={product.images.alt || product.name}
            className="h-full w-full object-contain p-1"
            aspectRatio="auto"
            objectFit="contain"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="mb-1 line-clamp-2 text-left text-xs font-medium leading-snug text-gray-900 sm:text-sm">
            {product.name}
          </h3>
          {hasReviews ? (
            <div className="mb-1 flex items-center gap-1">
              <div className="flex items-center">{renderStars(reviews.average)}</div>
              <span className="text-[10px] text-gray-600 sm:text-xs">
                {reviews.average.toFixed(1)} ({reviews.total})
              </span>
            </div>
          ) : (
            <p className="mb-1 text-[10px] italic text-gray-500 sm:text-xs">
              Be the first to review
            </p>
          )}
          <p className="text-sm font-bold text-[#28a745]">{formatPrice(currentPrice)}</p>
        </div>
      </Link>
      {product.inventory.inStock && (
        <div className="px-3 pb-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full border-gray-300 bg-white text-xs font-medium text-gray-900 hover:bg-gray-50"
            onClick={handleAddToCart}
            disabled={isAdding || added}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5 text-[#28a745]" />
            {added ? "Added" : isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RelatedProductCard;
