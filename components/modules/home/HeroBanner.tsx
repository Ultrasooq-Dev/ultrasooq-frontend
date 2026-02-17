"use client";
import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useActiveBanners } from "@/apis/queries/banner.queries";
import { useTrackBannerView, useTrackBannerClick } from "@/apis/queries/banner.queries";
import { IBanner } from "@/apis/requests/banner.requests";

const HeroBanner: React.FC = () => {
  // Fetch banners for different positions (using backend enum values)
  const { data: mainBannersData, isLoading: mainLoading } = useActiveBanners('MAIN');
  const { data: sideTopBannersData, isLoading: sideTopLoading } = useActiveBanners('SIDE_TOP');
  const { data: sideBottomBannersData, isLoading: sideBottomLoading } = useActiveBanners('SIDE_BOTTOM');
  
  const trackView = useTrackBannerView();
  const trackClick = useTrackBannerClick();

  const mainBanners = useMemo(() => {
    if (!mainBannersData || !Array.isArray(mainBannersData)) return [];
    // Sort by priority (higher priority first)
    return [...mainBannersData].sort((a: IBanner, b: IBanner) => (b.priority || 0) - (a.priority || 0));
  }, [mainBannersData]);

  const sideTopBanners = useMemo(() => {
    if (!sideTopBannersData || !Array.isArray(sideTopBannersData)) return [];
    return [...sideTopBannersData].sort((a: IBanner, b: IBanner) => (b.priority || 0) - (a.priority || 0));
  }, [sideTopBannersData]);

  const sideBottomBanners = useMemo(() => {
    if (!sideBottomBannersData || !Array.isArray(sideBottomBannersData)) return [];
    return [...sideBottomBannersData].sort((a: IBanner, b: IBanner) => (b.priority || 0) - (a.priority || 0));
  }, [sideBottomBannersData]);

  const isLoading = mainLoading || sideTopLoading || sideBottomLoading;

  // Track views when banners load
  useEffect(() => {
    const allBanners = [...mainBanners, ...sideTopBanners, ...sideBottomBanners];
    allBanners.forEach((banner: IBanner) => {
      if (banner.id) {
        trackView.mutate(banner.id);
      }
    });
  }, [mainBanners.length, sideTopBanners.length, sideBottomBanners.length]);

  // Show loading state
  if (isLoading) {
    return (
      <section className="w-full py-6 sm:py-10 lg:py-12 px-4 sm:px-8 lg:px-12 bg-gray-50">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-1 h-[404px] sm:h-[376px] lg:h-[432px] bg-gray-200 animate-pulse rounded-3xl" />
            <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6 lg:gap-8">
              <div className="h-48 sm:h-44 lg:h-[200px] bg-gray-200 animate-pulse rounded-3xl" />
              <div className="h-48 sm:h-44 lg:h-[200px] bg-gray-200 animate-pulse rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no banners, don't render
  if (mainBanners.length === 0 && sideTopBanners.length === 0 && sideBottomBanners.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-6 sm:py-10 lg:py-12 px-4 sm:px-8 lg:px-12 bg-gray-50">
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          {/* Main Banner Carousel */}
          {mainBanners.length > 0 && (
            <div className="lg:col-span-1 order-1">
              <BannerCarousel banners={mainBanners} onBannerClick={trackClick} />
            </div>
          )}

          {/* Side Banners */}
          <div className="lg:col-span-1 order-2 flex flex-col gap-5 sm:gap-6 lg:gap-8">
            {sideTopBanners.length > 0 && (
              <BannerList banners={sideTopBanners} onBannerClick={trackClick} />
            )}
            {sideBottomBanners.length > 0 && (
              <BannerList banners={sideBottomBanners} onBannerClick={trackClick} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Carousel for main banners
const BannerCarousel: React.FC<{ 
  banners: IBanner[];
  onBannerClick: (id: number) => void;
}> = ({ banners, onBannerClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleBannerClick = () => {
    if (currentBanner.link && currentBanner.id) {
      onBannerClick(currentBanner.id);
    }
  };

  if (!currentBanner || !currentBanner.image) return null;

  return (
    <div className="group relative h-[404px] sm:h-[376px] lg:h-[432px] w-full overflow-hidden rounded-3xl border border-gray-200">
      <Image
        src={currentBanner.image}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        alt={currentBanner.title || 'Banner'}
        fill
        priority
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative h-full flex items-center p-8 sm:p-10 lg:p-12">
        <div className="max-w-lg">
          {currentBanner.subtitle && (
            <span className="inline-block px-4 py-1.5 bg-white text-gray-900 text-xs sm:text-sm font-bold rounded-full mb-4 tracking-wide">
              {currentBanner.subtitle}
            </span>
          )}
          {currentBanner.title && (
            <h3 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 leading-tight">
              {currentBanner.title}
            </h3>
          )}
          {currentBanner.description && (
            <div className="mb-6 sm:mb-8">
              <p className="text-white/80 text-sm sm:text-base mb-2 font-medium">
                {currentBanner.description}
              </p>
            </div>
          )}
          {currentBanner.link && (
            <Link
              href={currentBanner.link}
              onClick={handleBannerClick}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:bg-gray-100 transition-colors"
            >
              {currentBanner.buttonText || "Shop Now"}
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}
      
      {/* Carousel Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// List for side banners
const BannerList: React.FC<{ 
  banners: IBanner[];
  onBannerClick: (id: number) => void;
}> = ({ banners, onBannerClick }) => {
  return (
    <>
      {banners.map((banner) => (
        <BannerCard 
          key={banner.id} 
          banner={banner} 
          onBannerClick={onBannerClick}
        />
      ))}
    </>
  );
};

// Single banner card
const BannerCard: React.FC<{ 
  banner: IBanner;
  onBannerClick: (id: number) => void;
}> = ({ banner, onBannerClick }) => {
  const handleClick = () => {
    if (banner.link && banner.id) {
      onBannerClick(banner.id);
    }
  };

  if (!banner.image) return null;

  const content = (
    <div className="group relative h-48 sm:h-44 lg:h-[200px] w-full overflow-hidden rounded-3xl border border-gray-200">
      <Image
        src={banner.image}
        className="absolute inset-0 h-full w-full object-cover"
        alt={banner.title || 'Banner'}
        fill
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
      <div className="relative h-full flex items-center p-6 sm:p-8">
        <div className="max-w-sm">
          {banner.subtitle && (
            <span className="inline-block px-3 py-1 bg-white text-gray-900 text-xs sm:text-sm font-bold rounded-full mb-3 tracking-wide">
              {banner.subtitle}
            </span>
          )}
          {banner.title && (
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
              {banner.title}
            </h3>
          )}
          {banner.description && (
            <p className="text-white/70 text-sm sm:text-base mb-2 font-medium">
              {banner.description}
            </p>
          )}
          {banner.buttonText && (
            <span className="inline-flex items-center gap-2 text-white hover:text-yellow-300 transition-colors text-sm sm:text-base font-semibold cursor-pointer">
              {banner.buttonText || "Shop Now"}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return banner.link ? (
    <Link href={banner.link} onClick={handleClick} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};

export default HeroBanner;

