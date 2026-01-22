import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Heart, Star } from "lucide-react";
import { Button, Badge, Image } from "../UI";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/useWishlistStore";
import type { CartItem as CartItemType } from "../../types";
import { cn } from "../../lib/utils";

interface CartItemProps {
  item: CartItemType;
  onRemove?: (productId: string) => void;
  isRemoving?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  isRemoving = false,
}) => {
  const { updateCartItemQuantity, isOperating } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();
  const [quantityInput, setQuantityInput] = useState<string>(item.quantity.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Sync input with item quantity when it changes externally
  useEffect(() => {
    if (!isEditing) {
      setQuantityInput(item.quantity.toString());
    }
  }, [item.quantity, isEditing]);

  const product = item.product;
  const isWishlisted = isItemInWishlist(product.id);
  const currentPrice =
    typeof product.price === "number" ? product.price : product.price.current;
  const originalPrice =
    typeof product.price === "object" ? product.price.original : undefined;
  const discount =
    typeof product.price === "object" ? product.price.discount : undefined;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove?.(product.id);
      return;
    }
    await updateCartItemQuantity(product.id, newQuantity);
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and prevent negative numbers
    if (value === "" || /^\d+$/.test(value)) {
      setQuantityInput(value);
    }
  };

  const handleQuantityInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(quantityInput, 10);
    
    if (isNaN(numValue) || numValue < 1) {
      // Reset to current quantity if invalid
      setQuantityInput(item.quantity.toString());
      if (numValue === 0) {
        onRemove?.(product.id);
      }
    } else if (numValue !== item.quantity) {
      // Only update if the value actually changed
      handleQuantityChange(numValue);
    }
  };

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setQuantityInput(item.quantity.toString());
      setIsEditing(false);
      e.currentTarget.blur();
    }
  };

  const handleQuantityInputFocus = () => {
    setIsEditing(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-4 p-4 sm:p-6 transition-all duration-300",
        isRemoving && "opacity-50 scale-95"
      )}
    >
      {/* Product Image */}
      <div className="flex-shrink-0 sm:w-24">
        <Link to={`/products/${product.id}`}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden mx-auto sm:mx-0">
            <Image
              src={product.images.main}
              alt={product.images.alt}
              className="w-full h-full object-contain hover:scale-105 transition-transform"
            />
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Link
                to={`/products/${product.id}`}
                className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 flex-1"
              >
                {product.name}
              </Link>
              {product.isSubaccountSet === false && (
                <Badge variant="destructive" className="text-xs flex-shrink-0">
                  Product not available
                </Badge>
              )}
            </div>
            {product.storeName && (
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{product.storeName}</span>
              </p>
            )}
            {!product.storeName && product.brand && (
              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove?.(product.id)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Reviews */}
        <div className="flex items-center gap-1 mb-3">
          {renderStars(product.reviews.average)}
          <span className="text-sm text-gray-600 ml-1">
            ({product.reviews.total})
          </span>
        </div>

        {/* Price and Quantity */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="font-bold text-lg text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            {discount && (
              <Badge variant="destructive" className="text-xs">
                -{discount.percentage}%
              </Badge>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-center sm:justify-end gap-3">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-none touch-target-sm"
                disabled={item.quantity <= 1 || isOperating}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <input
                type="text"
                inputMode="numeric"
                value={quantityInput}
                onChange={handleQuantityInputChange}
                onBlur={handleQuantityInputBlur}
                onFocus={handleQuantityInputFocus}
                onKeyDown={handleQuantityInputKeyDown}
                className="w-12 sm:w-10 px-2 py-2 sm:py-1 text-sm font-medium text-center border-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset bg-transparent"
                disabled={isOperating}
                aria-label="Quantity"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-none touch-target-sm"
                disabled={isOperating}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isWishlisted) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist(product);
                }
              }}
              className={cn(
                "h-10 w-10 sm:h-8 sm:w-8 text-gray-400 hover:text-red-500 touch-target-sm",
                isWishlisted && "text-red-500"
              )}
            >
              <Heart
                className={cn("w-4 h-4", isWishlisted && "fill-current")}
              />
            </Button>
          </div>
        </div>

        {/* Item Total */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Subtotal ({item.quantity} {item.quantity === 1 ? "item" : "items"}
              )
            </span>
            <span className="font-semibold text-gray-900">
              {formatPrice(currentPrice * item.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
