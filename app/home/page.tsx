"use client";
import HeroBanner from "@/components/modules/home/HeroBanner";
import { HomeRecommendations } from "@/components/modules/recommendations/HomeRecommendations";
import CategorySidebar from "@/components/modules/trending/CategorySidebar";
import Footer from "@/components/shared/Footer";
import React from "react";
import { HomeCategorySection } from "./_components/HomeCategorySection";
import { HomeDealOfTheDay } from "./_components/HomeDealOfTheDay";
import { HomeProductSection } from "./_components/HomeProductSection";
import { HomePromo } from "./_components/HomePromo";
import { useHomeData } from "./_components/useHomeData";

function HomePage() {
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

      {/* <TrendingCategories /> */}

      {/* Deal of the Day — BuyGroup products */}
      <HomeDealOfTheDay
        products={memoizedBuyGroupProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
      />

      {/* Best Sellers */}
      <HomeProductSection
        title="Best Sellers"
        subtitle="Our most popular products"
        products={memoizedBestSellers}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        showSold
        sectionClass="bg-card"
      />

      {/* New Arrivals */}
      <HomeProductSection
        title="New Arrivals"
        subtitle="Latest products added to our store"
        products={memoizedNewArrivals}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-muted/40"
      />

      {/* Top Rated */}
      <HomeProductSection
        title="Top Rated"
        subtitle="Highest customer satisfaction"
        products={memoizedTopRatedProducts}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-card"
      />

      {/* Hot Deals */}
      <HomeProductSection
        title="Hot Deals"
        subtitle="Best discounts available now"
        products={memoizedHotDeals}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-warning/5"
      />

      {/* Categories section */}
      {/* <HomeCategories /> */}

      {/* Consumer Electronics */}
      <HomeCategorySection
        title="Consumer Electronics"
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
        title="Home & Decor"
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
        title="Fashion & Beauty"
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

      {/* Highly Reviewed */}
      <HomeProductSection
        title="Highly Reviewed"
        subtitle="Products with most customer reviews"
        products={memoizedHighlyReviewed}
        cartList={cartList}
        haveAccessToken={haveAccessToken}
        onWishlist={handleAddToWishlist}
        sectionClass="bg-info/5"
      />

      <HomeRecommendations />

      <Footer />
    </>
  );
}

export default HomePage;
