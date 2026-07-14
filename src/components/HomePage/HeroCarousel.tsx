import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

export interface CarouselSlide {
  id: string;
  titlePrimary: string;
  titleAccent?: string;
  titleAccentColor?: string;
  ctaColor?: string;
  subtitle: string;
  cta: string;
  image: string;
  categoryId?: string;
  categoryName?: string;
}

const DEFAULT_ACCENT_COLOR = '#22C55E';
const DEFAULT_CTA_COLOR = '#1E4700';
const BNPL_SEAL_SRC = '/banners/9jacart%20BNPL%20seal.png';

interface HeroCarouselProps {
  slides: CarouselSlide[];
  height?: string;
}

const SLIDE_INTERVAL_MS = 5000;

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  height = 'h-[240px] sm:h-[300px] md:h-[360px] lg:h-[460px]',
}) => {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const goPrev = useCallback(
    () => setActive((i) => (i === 0 ? slides.length - 1 : i - 1)),
    [slides.length]
  );
  const goNext = useCallback(
    () => setActive((i) => (i === slides.length - 1 ? 0 : i + 1)),
    [slides.length]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  React.useEffect(() => {
    const timer = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [goNext]);

  return (
    <section className="lg:col-span-3 xl:col-span-4 relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div
        className={`relative ${height} overflow-hidden touch-pan-y`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, idx) => {
          const isActive = idx === active;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              {/* Background image with Ken Burns zoom */}
              <div className="absolute inset-0 overflow-hidden bg-[#0a0f0a]">
                <img
                  src={slide.image}
                  alt=""
                  aria-hidden
                  className={`h-full w-full object-cover ${
                    isActive ? 'animate-hero-zoom' : 'scale-100'
                  }`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : undefined}
                />
              </div>

              {/* Left gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

              {/* Text overlay */}
              <div className="relative z-10 flex h-full flex-col justify-center px-5 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8 max-w-xl">
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.1] tracking-tight">
                    <span className="block text-white">{slide.titlePrimary}</span>
                    {slide.titleAccent && (
                      <span
                        className="block"
                        style={{ color: slide.titleAccentColor ?? DEFAULT_ACCENT_COLOR }}
                      >
                        {slide.titleAccent}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm sm:text-base text-white/85 max-w-md leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>

                {slide.categoryId ? (
                  <Link
                    to={`/category/${slide.categoryId}`}
                    state={{ categoryName: slide.categoryName }}
                    style={{ backgroundColor: slide.ctaColor ?? DEFAULT_CTA_COLOR }}
                    className="hero-banner-cta mt-5 sm:mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-[transform,filter] duration-300 hover:brightness-95 hover:gap-3 group"
                  >
                    <span>{slide.cta}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                ) : (
                  <span
                    style={{ backgroundColor: slide.ctaColor ?? DEFAULT_CTA_COLOR }}
                    className="hero-banner-cta mt-5 sm:mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold"
                  >
                    {slide.cta}
                    <span>→</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BNPL seal — always visible on the banner container */}
      <img
        src={BNPL_SEAL_SRC}
        alt="Buy Now Pay Later — Powered by 9ja-cart"
        className="pointer-events-none absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 object-contain drop-shadow-md"
      />

      {/* Progress dots only */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === active
                ? 'bg-white w-8 shadow-lg'
                : 'bg-white/60 w-2 hover:bg-white/80'
            }`}
            onClick={() => setActive(idx)}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
