import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  bg: string;
  image: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  height?: string;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ 
  slides, 
  height = 'h-[240px] sm:h-[300px] md:h-[360px] lg:h-[420px]' 
}) => {
  const [active, setActive] = useState(0);

  const goPrev = () => setActive((i) => (i === 0 ? slides.length - 1 : i - 1));
  const goNext = () => setActive((i) => (i === slides.length - 1 ? 0 : i + 1));

  // Auto-advance slides
  React.useEffect(() => {
    const timer = setInterval(() => {
      goNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <section className="lg:col-span-3 xl:col-span-4 relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      {/* Slides */}
      <div className={`relative ${height} overflow-hidden`}>
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              idx === active ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            aria-hidden={idx !== active}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Content Side */}
              <div 
                className="flex flex-col justify-center px-4 sm:px-6 lg:px-10 py-6 sm:py-8 h-full" 
                style={{ backgroundColor: slide.bg }}
              >
                <div className="max-w-md">
                  <div className="text-xs sm:text-sm text-gray-800 mb-2 font-medium uppercase tracking-wide">
                    {slide.title}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    {slide.subtitle}
                  </h2>
                  <button className="inline-flex items-center gap-2 mt-2 text-gray-900 font-semibold text-sm sm:text-base hover:gap-3 transition-all duration-300 group">
                    {slide.cta}
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </button>
                </div>
              </div>
              
              {/* Image Side */}
              <div className="relative bg-gradient-to-br from-gray-900 to-black overflow-hidden h-full">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover hover:scale-110 transition-transform duration-700"
                  loading={idx === active ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-10"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-10"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
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

      {/* Slide Counter */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
        {active + 1} / {slides.length}
      </div>
    </section>
  );
};

export default HeroCarousel;