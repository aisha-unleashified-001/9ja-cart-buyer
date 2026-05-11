import React from "react";
import { Link } from "react-router-dom";
import { useBuyerActiveProductsList } from "@/hooks/api/useRealProducts";
import { normalizeProductImages } from "@/lib/utils";
import { formatDiscountPercentage, formatPrice } from "@/lib/productUtils";
import { Badge, Button } from "../UI";

/** How often the featured deal cycles to the next product (ms). */
const DEAL_ROTATE_MS = 3500;

const TopDealsPanel: React.FC = () => {
  const { allProducts, loading } = useBuyerActiveProductsList({});

  const flashDeals = React.useMemo(() => {
    const flashSaleProducts = allProducts.filter((product) => {
      const price = typeof product.price === "object" ? product.price : null;
      if (!price) return false;
      const hasDiscountBadge = price.discount && price.discount.percentage > 0;
      const hasPriceReduction =
        price.original != null && price.current < price.original;
      return hasDiscountBadge || hasPriceReduction;
    });

    return Array.from(
      new Map(flashSaleProducts.map((product) => [product.id, product])).values()
    );
  }, [allProducts]);

  const [dealIndex, setDealIndex] = React.useState(0);

  React.useEffect(() => {
    const n = flashDeals.length;
    if (n === 0) return;
    setDealIndex((i) => i % n);
  }, [flashDeals.length]);

  React.useEffect(() => {
    if (flashDeals.length <= 1) return;
    const id = window.setInterval(() => {
      setDealIndex((i) => (i + 1) % flashDeals.length);
    }, DEAL_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [flashDeals.length]);

  const activeDeal = flashDeals[dealIndex] ?? flashDeals[0];

  if (loading || !activeDeal) {
    return (
      <aside className="hidden lg:block lg:col-span-1">
        <div className="h-[460px] rounded-lg border border-gray-200 bg-white p-4">
          <div className="h-full animate-pulse rounded-md bg-gray-100" />
        </div>
      </aside>
    );
  }

  const product = normalizeProductImages(activeDeal);
  const currentPrice =
    typeof product.price === "number" ? product.price : product.price.current;
  const originalPrice =
    typeof product.price === "object" ? product.price.original : undefined;
  const discount =
    typeof product.price === "object" ? product.price.discount : undefined;

  return (
    <aside className="hidden lg:block lg:col-span-1">
      <div className="h-[460px] rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-800">
          Top Deals Today
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-gray-50 py-2">
            <p className="text-base font-bold text-gray-900">08</p>
            <p className="text-[10px] uppercase text-gray-500">HRS</p>
          </div>
          <div className="rounded-md bg-gray-50 py-2">
            <p className="text-base font-bold text-gray-900">34</p>
            <p className="text-[10px] uppercase text-gray-500">MINS</p>
          </div>
          <div className="rounded-md bg-gray-50 py-2">
            <p className="text-base font-bold text-gray-900">19</p>
            <p className="text-[10px] uppercase text-gray-500">SECS</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary/40">
          <Link to={`/products/${product.id}`} className="block">
            <div className="relative aspect-square overflow-hidden rounded-md bg-gray-50">
              {discount && discount.percentage > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute left-2 top-2 z-10 bg-primary text-white text-[10px] font-semibold px-2 py-1 rounded-md"
                >
                  -{formatDiscountPercentage(discount.percentage)}%
                </Badge>
              )}
              <img
                src={Array.isArray(product.images) ? product.images[0] : product.images.main}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-medium text-gray-900">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-semibold text-primary">
                {formatPrice(currentPrice)}
              </span>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </Link>

          <Link to="/products" className="mt-4 block">
            <Button className="w-full border-0 bg-primary text-white hover:bg-primary/90">
              Shop Now
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default TopDealsPanel;
