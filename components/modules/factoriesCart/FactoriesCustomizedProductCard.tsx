import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
// import { useCartStore } from "@/lib/rfqStore";

type FactoriesProductCardProps = {
  factoriesCartId: number;
  productId: number;
  customizeProductId: number;
  productName: string;
  productQuantity: number;
  productImages: {
    image: string;
  }[];
  customizeProductImages: {
    link: string;
  }[];
  offerFromPrice: string;
  offerToPrice: string;
  onAdd: (
    args0: number,
    args1: number,
    args3: number,
  ) => void;
  onRemove: (args0: number) => void;
  note: string;
};

const FactoriesCustomizedProductCard: React.FC<FactoriesProductCardProps> = ({
  factoriesCartId,
  productId,
  customizeProductId,
  productName,
  productQuantity,
  productImages,
  customizeProductImages,
  offerFromPrice,
  offerToPrice,
  onAdd,
  onRemove,
  note,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const [quantity, setQuantity] = useState(1);
  // const cart = useCartStore();


  useEffect(() => {
    setQuantity(productQuantity);
  }, [productQuantity]);

  return (
    <div className="rfq-cart-item-li">
      <figure>
        <div className="image-container relative">
            {customizeProductImages?.[0]?.link
             ? 
             <Image
             src={
                customizeProductImages?.[0]?.link &&
               validator.isURL(customizeProductImages?.[0]?.link)
                 ? customizeProductImages[0].link
                 : PlaceholderImage
             }
             alt="pro-6"
             fill
           /> 
            : 
            <Image
            src={
              productImages?.[0]?.image &&
              validator.isURL(productImages?.[0]?.image)
                ? productImages[0].image
                : PlaceholderImage
            }
            alt="pro-6"
            fill
          />
            }
        </div>
        <figcaption>
          <h5>{productName}</h5>
          <label dir={langDir} translate="no">{t("quantity")}</label>
          <div className="qty-with-remove">
            <div className="qty-up-down-s1-with-rgMenuAction">
              <div className="flex items-center gap-x-4">
                <Button
                  variant="outline"
                  className="relative hover:shadow-xs"
                  onClick={() => {
                    setQuantity(quantity - 1);
                    onAdd(
                      quantity - 1,
                      customizeProductId,
                      productId
                    );
                  }}
                  disabled={quantity === 1}
                >
                  <Image
                    src="/images/upDownBtn-minus.svg"
                    alt="minus-icon"
                    fill
                    className="p-3"
                  />
                </Button>
                <p className="text-black!">{quantity}</p>
                <Button
                  variant="outline"
                  className="relative hover:shadow-xs"
                  onClick={() => {
                    setQuantity(quantity + 1);
                    onAdd(
                      quantity + 1,
                      customizeProductId,
                      productId
                    );
                  }}
                >
                  <Image
                    src="/images/upDownBtn-plus.svg"
                    alt="plus-icon"
                    fill
                    className="p-3"
                  />
                </Button>
              </div>
            </div>
            <Button
              variant="link"
              className="relative hover:shadow-xs"
              onClick={() => {
                onRemove(factoriesCartId);
                // cart.deleteCartItem(rfqProductId);
              }}
              dir={langDir}
              translate="no"
            >
              {t("remove")}
            </Button>
          </div>
        </figcaption>
      </figure>
      <p>
        <span>Note:</span> {note}
      </p>
      <div className="price-info">
        <h5 dir={langDir} translate="no">{t("price")}</h5>
        {/* <p>${offerFromPrice ? Number(offerFromPrice) * quantity : 0}</p> */}
        <p dir={langDir}> {offerFromPrice ? `${currency.symbol}${Number(offerFromPrice)} - ${currency.symbol}${Number(offerToPrice)}` : '0'}</p>
      </div>
    </div>
  );
};

export default FactoriesCustomizedProductCard;
