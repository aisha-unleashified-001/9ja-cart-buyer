import React from "react";
import { Link } from "react-router-dom";
import { useBuyerActiveProductsList } from "@/hooks/api/useRealProducts";
import { normalizeProductImages } from "@/lib/utils";
import { formatDiscountPercentage, formatPrice } from "@/lib/productUtils";
import { Badge, Button } from "../UI";

/** How often the featured deal cycles to the next product (ms). */
const DEAL_ROTATE_MS = 3500;

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

function formatCountdownParts(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

const TopDealsPanel: React.FC = () => {
  const { allProducts, loading } = useBuyerActiveProductsList({});
  const [remainingMs, setRemainingMs] = React.useState(getMsUntilMidnight);

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

  React.useEffect(() => {
    setRemainingMs(getMsUntilMidnight());
    const id = window.setInterval(() => {
      setRemainingMs(getMsUntilMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = formatCountdownParts(remainingMs);
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
      <div className="flex h-[460px] flex-col rounded-lg border border-gray-200 bg-white p-4">
        <p className="flex items-center justify-center gap-1.5 text-center text-sm font-bold uppercase tracking-wide text-gray-800">
          Top Deals Today
          <span aria-hidden="true">🔥</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-md bg-[#8DEB6E]/20 p-2">
              <p className="text-xl font-bold leading-none text-primary tabular-nums">
                {countdown.hours}
              </p>
            </div>
            <p className="mt-2 text-[10px] uppercase text-gray-500">HRS</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-md bg-[#8DEB6E]/20 p-2">
              <p className="text-xl font-bold leading-none text-primary tabular-nums">
                {countdown.minutes}
              </p>
            </div>
            <p className="mt-2 text-[10px] uppercase text-gray-500">MINS</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-md bg-[#8DEB6E]/20 p-2">
              <p className="text-xl font-bold leading-none text-primary tabular-nums">
                {countdown.seconds}
              </p>
            </div>
            <p className="mt-2 text-[10px] uppercase text-gray-500">SECS</p>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <Link
            to={`/products/${product.id}`}
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2"
          >
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md bg-gray-50">
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
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            </div>
            <h3 className="line-clamp-2 w-full shrink-0 text-sm font-medium text-gray-900">
              {product.name}
            </h3>
            <div className="flex w-full shrink-0 items-center gap-2">
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

          <Link to="/products" className="mt-4 block shrink-0">
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
