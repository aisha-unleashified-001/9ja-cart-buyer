import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Star, Eye } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { cn } from '../../lib/utils';
import { useWishlistStore, type WishlistItem } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';

interface WishlistItemProps {
  item: WishlistItem;
}

const WishlistItemComponent: React.FC<WishlistItemProps> = ({ item }) => {
  const { removeItem, moveToCart } = useWishlistStore();
  const { addItem: addToCart, isItemInCart } = useCartStore();

  const { product } = item;
  const currentPrice = typeof product.price === 'number' ? product.price : product.price.current;
  const originalPrice = typeof product.price === 'number' ? undefined : product.price.original;
  const discount = typeof product.price === 'number' ? undefined : product.price.discount;
  const isOnSale = originalPrice && originalPrice > currentPrice;
  const isInCart = isItemInCart(product.id, false); // Default to guest cart for wishlist

  const handleRemoveFromWishlist = () => {
    removeItem(product.id);
  };

  const handleMoveToCart = () => {
    moveToCart(product.id, addToCart);
  };

  const handleAddToCart = () => {
    addToCart(product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Product Image */}
          <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
            <Link to={`/products/${product.id}`}>
              <img
                src={product.images.main}
                alt={product.images.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
            
            {/* Stock Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant={product.inventory.inStock ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  product.inventory.inStock 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-red-100 text-red-800 border-red-200"
                )}
              >
                {product.inventory.inStock ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>

            {/* Sale Badge */}
            {isOnSale && discount && (
              <div className="absolute top-3 right-3">
                <Badge variant="destructive" className="text-xs bg-primary">
                  -{discount.percentage}%
                </Badge>
              </div>
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  asChild
                >
                  <Link to={`/products/${product.id}`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                {product.inventory.inStock && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddToCart}
                    disabled={isInCart}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/products/${product.id}`}
                      className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wide">
                        {product.brand}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFromWishlist}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-red-400">
                    {formatPrice(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {product.reviews.total > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(product.reviews.average)}
                    <span className="text-sm text-muted-foreground">
                      {product.reviews.average} ({product.reviews.total} reviews)
                    </span>
                  </div>
                )}

                {/* Description */}
                {product.shortDescription && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.shortDescription}
                  </p>
                )}

                {/* Added Date */}
                <p className="text-xs text-muted-foreground mb-4">
                  Added on {formatDate(item.addedAt)}
                </p>

                {/* Stock Status Message */}
                {!product.inventory.inStock && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-800">
                      This item is currently out of stock. We'll notify you when it becomes available.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                {product.inventory.inStock ? (
                  <>
                    <Button
                      onClick={handleMoveToCart}
                      disabled={isInCart}
                      className="flex items-center gap-2 flex-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isInCart ? 'Already in Cart' : 'Move to Cart'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddToCart}
                      disabled={isInCart}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="flex items-center gap-2 flex-1"
                  >
                    Notify When Available
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  asChild
                  className="flex items-center gap-2"
                >
                  <Link to={`/products/${product.id}`}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistItemComponent;