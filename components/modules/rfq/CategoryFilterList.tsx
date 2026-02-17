import React from "react";
import SymbolIcon from "@/public/images/symbol.svg";
import Image from "next/image";

const CategoryFilterList = () => {
  return (
    <div className="product_filter_box">
      <div className="product_filter_box_head">
        <h4>Categories</h4>
        <Image src={SymbolIcon} alt="symbol-icon" />
      </div>
      <div className="check_filter">
        <div className="categori_list">
          <a href="">Clothing & Apparel</a>
        </div>
        <div className="categori_list">
          <a href="">Garden & Kitchen</a>
        </div>
        <div className="categori_list">
          <a href="">Consumer Electrics</a>
        </div>
        <div className="categori_list">
          <a href="">Health & Beauty</a>
        </div>
        <div className="categori_list">
          <a href="">Computers & Technologies</a>
        </div>
        <div className="categori_list">
          <a href="">Jewelry & Watches</a>
        </div>
        <div className="categori_list">
          <a href="">Phones & Accessories</a>
        </div>
        <div className="categori_list">
          <a href="">Sport & Outdoor</a>
        </div>
        <div className="categori_list">
          <a href="">Babies and Moms</a>
        </div>
        <div className="categori_list">
          <a href="">Books & Office</a>
        </div>
        <div className="categori_list">
          <a href="">Cars & Motocycles</a>
        </div>
        <div className="categori_list">
          <a href="">Fruits</a>
        </div>
        <div className="categori_list">
          <a href="">Meat</a>
        </div>
        <div className="categori_list">
          <a href="">Book</a>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterList;
