import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Zap } from "lucide-react";

const VENDOR_SELL_URL = "http://vendors.9jacart.ng";

const linkClass =
  "whitespace-nowrap text-sm text-white/90 hover:text-white transition-colors py-1.5 relative";
const activeUnderline =
  "text-[#8DEB6E] font-medium after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-[#8DEB6E]";

const HomeSubNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/products") return location.pathname === "/products";
    if (path === "/deals") return location.pathname === "/deals";
    if (path === "/new-arrivals")
      return location.pathname === "/new-arrivals";
    if (path === "/bestsellers") return location.pathname === "/bestsellers";
    if (path === "/orders")
      return (
        location.pathname.startsWith("/orders") ||
        location.pathname.startsWith("/track-order")
      );
    return false;
  };

  return (
    <nav
      className="w-full border-b border-gray-200 border-t border-t-[#8DEB6E]/40 bg-[#182F38]/95 backdrop-blur-md text-white"
      aria-label="Home quick links"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:max-w-7xl lg:px-8 2xl:max-w-[1550px]">
        <div className="grid grid-cols-1 gap-2 gap-y-2 py-2 sm:gap-3 sm:py-2 lg:grid-cols-5 xl:grid-cols-6 lg:items-stretch lg:gap-x-6 lg:gap-y-0 lg:py-0 lg:min-h-[56px]">
          {/* Same width as categories column; All Categories fills cell top→bottom */}
          <div className="flex min-h-touch w-full lg:col-span-1 lg:h-full lg:min-h-0">
            <Link
              to="/products"
              className={`flex w-full flex-1 items-center gap-2 border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 rounded-t-lg rounded-b-none lg:h-full lg:min-h-[56px] lg:border-0 lg:border-r lg:border-white/20 lg:px-3 lg:py-0 ${
                isActive("/products")
                  ? "border-[#8DEB6E]/50 bg-white/15 lg:border-r-white/20"
                  : ""
              }`}
            >
              <Menu className="h-4 w-4 shrink-0" aria-hidden />
              All Categories
            </Link>
          </div>

          <div className="flex min-h-touch flex-wrap items-center justify-start gap-x-4 gap-y-1 border-t border-white/20 pt-2 sm:gap-x-5 lg:col-span-3 lg:h-full lg:min-h-0 lg:flex-nowrap lg:justify-center lg:border-t-0 lg:pt-0 xl:col-span-4 lg:px-1">
            <Link
              to="/deals"
              className={`${linkClass} ${isActive("/deals") ? activeUnderline : ""}`}
            >
              Today&apos;s Deals
            </Link>
            <Link
              to="/new-arrivals"
              className={`${linkClass} ${
                isActive("/new-arrivals") ? activeUnderline : ""
              }`}
            >
              New Arrivals
            </Link>
            <Link
              to="/bestsellers"
              className={`${linkClass} ${
                isActive("/bestsellers") ? activeUnderline : ""
              }`}
            >
              Best Sellers
            </Link>
            <Link
              to="/orders"
              className={`${linkClass} ${
                isActive("/orders") ? activeUnderline : ""
              }`}
            >
              Track Order
            </Link>
            <a
              href={VENDOR_SELL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} after:hidden`}
            >
              Sell on 9ja Cart
            </a>
          </div>

          <div className="flex min-h-touch justify-start border-t border-white/20 pt-2 lg:col-span-1 lg:h-full lg:min-h-0 lg:items-center lg:justify-end lg:border-t-0 lg:pt-0">
            <Link
              to="/#flash-deals"
              className="inline-flex min-h-touch items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#FACC15] transition-colors hover:bg-white/15 lg:min-h-0 lg:py-2"
            >
              <Zap className="h-4 w-4 shrink-0 fill-[#FACC15]" aria-hidden />
              Flash Deals
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeSubNav;
