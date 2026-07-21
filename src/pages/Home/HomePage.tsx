import HeroSection from "@/components/HomePage/HeroSection";
import FlashSales from "@/components/HomePage/FlashSales";
import LiveProducts from "@/components/HomePage/LiveProducts";
import CategoryShowcase from "@/components/HomePage/CategoryShowcase";
import FastSelling from "@/components/HomePage/FastSelling";
import RecentlyViewedProductsSection from "@/components/HomePage/RecentlyViewedProductsSection";
import { useAuthStore } from "@/store/useAuthStore";
import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
// Archived: FeaturedProducts (replaced by FastSelling displayed as "Featured Picks")

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, pendingVerification } = useAuthStore();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const [showFixedBnplBadge, setShowFixedBnplBadge] = React.useState(false);

  React.useEffect(() => {
    const verifyAfterPaymentFlag = sessionStorage.getItem(
      "checkout_verify_email_after_payment"
    );

    if (!verifyAfterPaymentFlag) return;

    if (pendingVerification && !isAuthenticated) {
      sessionStorage.removeItem("checkout_verify_email_after_payment");
      navigate("/auth/verify-email");
      return;
    }

    // Clear stale flag so normal homepage behavior is preserved.
    sessionStorage.removeItem("checkout_verify_email_after_payment");
  }, [isAuthenticated, navigate, pendingVerification]);

  // Show the fixed BNPL badge only after the hero/banner leaves the viewport
  // (mobile + desktop). Banner seal and other BNPL flows are unaffected.
  React.useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFixedBnplBadge(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white min-h-screen max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <Helmet>
        <title>9ja-cart - Buy and Sell Online in Nigeria</title>
        <meta name="description" content="Shop top deals on food, gadgets, electronics, fashion & lifestyle products at 9jaCart.ng — Nigeria's trusted Buy Now Pay Later online store. Fast delivery, secure checkout & affordable prices" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="9ja-cart - Buy and Sell Online in Nigeria" />
        <meta property="og:description" content="Shop top deals on food, gadgets, electronics, fashion & lifestyle products at 9jaCart.ng — Nigeria's trusted Buy Now Pay Later online store. Fast delivery, secure checkout & affordable prices" />
        <meta property="og:url" content="https://www.9jacart.ng" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="9ja-cart - Buy and Sell Online in Nigeria" />
        <meta name="twitter:description" content="Shop top deals on food, gadgets, electronics, fashion & lifestyle products at 9jaCart.ng — Nigeria's trusted Buy Now Pay Later online store. Fast delivery, secure checkout & affordable prices" />
        <link rel="icon" type="image/svg+xml" href="/9Jacart Icon SVG.svg" />
      </Helmet>
      <div ref={heroRef}>
        <HeroSection />
      </div>
      <FlashSales />
      <CategoryShowcase />
      <FastSelling />
      {isAuthenticated && (
        <RecentlyViewedProductsSection variant="section" />
      )}
      <LiveProducts />

      {/* Fixed BNPL badge — homepage only after scrolling past banner; does not intercept clicks */}
      {showFixedBnplBadge && (
        <img
          src="/banners/9jacart%20BNPL%20seal.png"
          alt="Buy Now Pay Later — Powered by 9ja-cart"
          className="pointer-events-none fixed bottom-4 right-4 z-50 h-40 w-40 sm:bottom-6 sm:right-6 sm:h-44 sm:w-44 md:h-[200px] md:w-[200px] object-contain drop-shadow-lg opacity-60"
        />
      )}
    </div>
  );
};

export default HomePage;
