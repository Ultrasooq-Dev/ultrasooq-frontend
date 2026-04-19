"use client";
import HeroBanner from "@/components/modules/home/HeroBanner";
import { HomeRecommendations } from "@/components/modules/recommendations/HomeRecommendations";
import CategorySidebar from "@/components/modules/trending/CategorySidebar";
import Footer from "@/components/shared/Footer";
import { useTranslations } from "next-intl";
import React from "react";
import { HomeCategorySection } from "./_components/HomeCategorySection";
import { HomeDealOfTheDay } from "./_components/HomeDealOfTheDay";
import { HomeFeatures } from "./_components/HomeFeatures";
import { HomeProductSection } from "./_components/HomeProductSection";
import { HomePromo } from "./_components/HomePromo";
import { HomeStats } from "./_components/HomeStats";
import { HomeTestimonials } from "./_components/HomeTestimonials";
import { HomeWaysToShop } from "./_components/HomeWaysToShop";
import { useHomeData } from "./_components/useHomeData";

function HomePage() {
  const t = useTranslations();
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] =
    React.useState(false);

  const {
    currency,
    cartList,
    haveAccessToken,
    handleAddToWishlist,
    memoizedBuyGroupProducts,
    memoizedHomeDecorProducts,
    memoizedFashionBeautyProducts,
    memoizedConsumerElectronicsProducts,
    memoizedTopRatedProducts,
    memoizedBestSellers,
    memoizedNewArrivals,
    memoizedHotDeals,
    memoizedHighlyReviewed,
  } = useHomeData();

  return (
    <>
      <CategorySidebar
        isOpen={isCategorySidebarOpen}
        onClose={() => setIsCategorySidebarOpen(false)}
      />

      <HeroBanner />

      <HomeFeatures />

      {/* Deal of the Day — BuyGroup products */}
      <HomeDealOfTheDay
        products={memoizedBuyGroupProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
      />

      {/* Best Sellers */}
      <HomeProductSection
        title={t("best_sellers")}
        subtitle={t("our_most_popular_products")}
        products={memoizedBestSellers}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        showSold
        sectionClass="bg-card"
      />

      {/* New Arrivals */}
      <HomeProductSection
        title={t("new_arrivals")}
        subtitle={t("latest_products_added_to_store")}
        products={memoizedNewArrivals}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-muted/40"
      />

      {/* Top Rated */}
      <HomeProductSection
        title={t("top_rated")}
        subtitle={t("highest_customer_satisfaction")}
        products={memoizedTopRatedProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-card"
      />

      {/* Hot Deals */}
      <HomeProductSection
        title={t("hot_deals")}
        subtitle={t("best_discounts_available")}
        products={memoizedHotDeals}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-warning/5"
      />

      <HomeWaysToShop />

      {/* Consumer Electronics */}
      <HomeCategorySection
        title={t("consumer_electronics")}
        products={memoizedConsumerElectronicsProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        navConfig={{
          categoryId: 464,
          categoryIds: "464,468,472",
          colorClass: "bg-info/5",
        }}
        sectionClass="bg-card"
      />

      {/* Home Decor */}
      <HomeCategorySection
        title={t("home_and_decor")}
        products={memoizedHomeDecorProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        navConfig={{
          categoryId: 496,
          categoryIds: "496,513",
          colorClass: "bg-success/5",
        }}
        sectionClass="bg-muted/40"
      />

      {/* Fashion & Beauty */}
      <HomeCategorySection
        title={t("fashion_and_beauty")}
        products={memoizedFashionBeautyProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        navConfig={{
          categoryId: 477,
          categoryIds: "477,482,488,499",
          colorClass: "bg-warning/5",
        }}
        sectionClass="bg-card"
      />

      <HomePromo />

      <HomeStats />

      {/* Highly Reviewed */}
      <HomeProductSection
        title={t("highly_reviewed")}
        subtitle={t("products_with_most_reviews")}
        products={memoizedHighlyReviewed}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-info/5"
      />

      <HomeTestimonials />

      <HomeRecommendations />

      <Footer />
    </>
  );
}

export default HomePage;
