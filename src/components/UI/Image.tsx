import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import logoImage from "../../assets/logo.png";
import { getCachedImageUrl, getMemoryCachedBlob } from "../../lib/imageCache";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  placeholder?: string;
  lazy?: boolean;
  cache?: boolean;
  aspectRatio?: "square" | "16/9" | "4/3" | "3/2" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  blur?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

function getSafeSrc(src: string): string {
  return typeof src === "string" && src.trim().length > 0 ? src.trim() : "";
}

/**
 * Initial src resolution for eager images:
 *  1. Memory blob cache → instant on navigate-back (no async required)
 *  2. Raw URL → browser HTTP cache or network (reload / first visit)
 *  3. Fallback
 */
function resolveEagerInitialSrc(safeSrc: string, fallback: string): string {
  if (!safeSrc) return fallback;
  const memoryCached = getMemoryCachedBlob(safeSrc);
  return memoryCached || safeSrc || fallback;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fallback = "/placeholder-image.jpg",
  placeholder,
  lazy = true,
  cache = true,
  aspectRatio = "auto",
  objectFit = "cover",
  blur = true,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const safeSrc = getSafeSrc(src);

  // Eager: resolve from memory blob cache (navigate-back) or raw URL (reload).
  // Lazy: start with placeholder until in view.
  const [currentSrc, setCurrentSrc] = useState(
    !lazy ? resolveEagerInitialSrc(safeSrc, fallback) : (placeholder || "")
  );
  const [isLoading, setIsLoading] = useState(lazy);
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When src prop changes (e.g. carousel / reused component), reset state
  const prevSrcRef = useRef(src);
  useEffect(() => {
    if (prevSrcRef.current === src) return;
    prevSrcRef.current = src;
    const newSafe = getSafeSrc(src);
    setHasError(false);
    setIsLoading(lazy);
    if (!lazy) setCurrentSrc(resolveEagerInitialSrc(newSafe, fallback));
  }, [src, lazy, fallback]);

  // Delay spinner so fast-loading images never briefly flash a spinner
  useEffect(() => {
    if (!isLoading) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), 150);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Intersection Observer for lazy loading — observe container div, not img
  // (img may not be mounted yet when currentSrc is empty)
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Load / upgrade image src when in view
  useEffect(() => {
    if (!isInView || hasError) return;

    const validSrc = getSafeSrc(src) || fallback;

    // No caching needed: set directly and return
    if (!cache || !validSrc.startsWith("http")) {
      setCurrentSrc(validSrc);
      return;
    }

    let cancelled = false;

    // For eager images: raw URL (or memory blob) is already set from useState.
    // Call getCachedImageUrl to:
    //   • Warm the Cache API on first visit so reloads are fast
    //   • Upgrade currentSrc to blob URL if it isn't already (reload scenario)
    // For lazy images: initial src is placeholder; getCachedImageUrl provides the real image.
    getCachedImageUrl(validSrc).then(({ url }) => {
      if (cancelled) return;
      if (url && url !== validSrc) {
        // url is a blob URL from memory cache or Cache API — use it
        setCurrentSrc(url);
      } else if (url === validSrc) {
        // Cache API returned the raw URL (cache not supported or fetch fallback)
        setCurrentSrc(url);
      }
      // If url is empty string, the fallback is already shown; don't overwrite
    });

    return () => { cancelled = true; };
  }, [isInView, src, hasError, fallback, cache, lazy]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    // Ignore errors from empty/transitional src values
    if (!currentSrc) return;
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallback);
    onError?.();
  };

  const aspectRatioClasses = {
    square: "aspect-square",
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "3/2": "aspect-[3/2]",
    auto: "",
  };

  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Loading spinner — delayed, only visible for lazy images that truly need to load */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Main image — only rendered when we have a real src */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-full transition-all duration-300",
            objectFitClasses[objectFit],
            lazy && isLoading && blur ? "blur-sm scale-105" : "blur-0 scale-100",
            lazy && isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
          {...props}
        />
      )}

      {/* Error fallback */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <img
              src={logoImage}
              alt="Logo"
              className="w-32 h-32 mx-auto mb-2 grayscale opacity-80 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { Image };
