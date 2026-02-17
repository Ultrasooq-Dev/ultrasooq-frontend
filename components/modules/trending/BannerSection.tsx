import React from "react";
import Image from "next/image";
import TrendingBannerImage from "@/public/images/trending-product-inner-banner.png";
import ChevronRightIcon from "@/public/images/nextarow.svg";
import InnerBannerImage from "@/public/images/trending-product-inner-banner-pic.png";
import Link from "next/link";

const BannerSection = () => {
  return (
    <div className="custom-inner-banner-s1">
      <div className="container m-auto px-3">
        <div className="custom-inner-banner-s1-captionBox relative">
          <Image
            src={TrendingBannerImage}
            alt="trending-banner"
            className="bg-image"
            fill
          />
          <div className="text-container">
            <ul className="page-indicator">
              <li>
                <Link href="/home">Home</Link>
                <Image
                  src={ChevronRightIcon}
                  alt="next-icon"
                  width={8}
                  height={12}
                />
              </li>
              <li>
                <Link href="/trending">Shop</Link>
                <Image
                  src={ChevronRightIcon}
                  alt="next-icon"
                  width={8}
                  height={12}
                />
              </li>
              <li>Phones & Accessories</li>
            </ul>
            <h2>sed do eiusmod tempor incididunt</h2>
            <h5>Only 2 days:</h5>
            <h4>21/10 & 22/10</h4>
            <div className="action-btns">
              <button type="button" className="theme-primary-btn custom-btn">
                Shop Now
              </button>
            </div>
          </div>
          <div className="relative h-[250px] w-full md:h-[360px] md:w-[548px]">
            <Image
              src={InnerBannerImage}
              alt="inner-banner"
              fill
              className="h-auto md:h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSection;
