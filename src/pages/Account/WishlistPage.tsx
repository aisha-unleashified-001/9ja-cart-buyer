import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, SortAsc, Grid, List } from "lucide-react";
import { Button } from "../../components/UI/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/UI/Card";
import { Badge } from "../../components/UI/Badge";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useCartStore } from "../../store/useCartStore";
import WishlistItem from "../../components/Wishlist/WishlistItem";
import EmptyWishlist from "../../components/Wishlist/EmptyWishlist";
import { cn } from "../../lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name";
type ViewMode = "grid" | "list";

const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();
  const { isAuthenticated, isLoading } = useAuthStore();

  const { addItem: addToCart } = useCartStore();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter and sort items
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "oldest":
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case "price-low": {
        const priceA =
          typeof a.product.price === "number"
            ? a.product.price
            : a.product.price.current;
        const priceB =
          typeof b.product.price === "number"
            ? b.product.price
            : b.product.price.current;
        return priceA - priceB;
      }
      case "price-high": {
        const priceA2 =
          typeof a.product.price === "number"
            ? a.product.price
            : a.product.price.current;
        const priceB2 =
          typeof b.product.price === "number"
            ? b.product.price
            : b.product.price.current;
        return priceB2 - priceA2;
      }
      case "name":
        return a.product.name.localeCompare(b.product.name);
      default:
        return 0;
    }
  });

  const inStockItems = sortedItems.filter(
    (item) => item.product.inventory.inStock
  );
  const outOfStockItems = sortedItems.filter(
    (item) => !item.product.inventory.inStock
  );

  // const handleAddAllToCart = () => {
  //   inStockItems.forEach(item => {
  //     addToCart(item.product);
  //   });
  // };

  const handleAddAllToCart = async () => {
    try {
      await Promise.all(
        inStockItems.map((item) => addToCart(item.product, 1, isAuthenticated))
      );
      console.log("All items added to cart");
    } catch (err) {
      console.error("Failed to add all items:", err);
    }
  };

  const handleClearWishlist = () => {
    clearWishlist();
    setShowClearConfirm(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-muted-foreground space-x-2">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">Wishlist</span>
            </div>
          </div>

          <div className="py-12">
            <EmptyWishlist />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground space-x-2">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Wishlist</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {inStockItems.length > 0 && (
              <Button
                onClick={handleAddAllToCart}
                disabled={isLoading || inStockItems.length === 0}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add All to Cart ({inStockItems.length})
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground">
                    {items.length}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inStockItems.length}
                  </p>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Available
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {outOfStockItems.length}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Unavailable
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-input rounded-md p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Wishlist Items */}
        <div
          className={cn(
            "space-y-4",
            viewMode === "grid" &&
              "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0"
          )}
        >
          {sortedItems.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Clear Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to remove all {items.length} items from
                  your wishlist? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleClearWishlist}
                    className="flex-1"
                  >
                    Yes, Clear All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
