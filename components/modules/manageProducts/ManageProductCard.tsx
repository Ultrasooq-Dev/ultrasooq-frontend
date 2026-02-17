import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import validator from "validator";
import EditIcon from "@/public/images/edit-rfq.png";
import Link from "next/link";
import { IoIosEyeOff, IoIosEye } from "react-icons/io";
import { 
  IoMdCreate, 
  IoMdCopy, 
  IoMdRefresh, 
  IoMdTrash,
  IoMdArrowDown,
  IoMdArrowUp,
  IoMdCreate as IoMdEdit
} from "react-icons/io";
import {
  useRemoveProduct,
  useUpdateProductStatus,
  useUpdateSingleProduct,
} from "@/apis/queries/product.queries";
import CounterTextInputField from "../createProduct/CounterTextInputField";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type ManageProductCardProps = {
  selectedIds?: number[];
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  onSelect?: (data: { [key: string]: any }) => void;
  id: number;
  productId: number;
  status: string;
  askForPrice: string;
  askForStock: string;
  productImage: string | null;
  productName: string;
  productPrice: string;
  offerPrice: string;
  deliveryAfter: number;
  stock: number;
  consumerType: string;
  sellType: string;
  timeOpen: number | null;
  timeClose: number | null;
  vendorDiscount: number | null;
  vendorDiscountType: string | null;
  consumerDiscount: number | null;
  consumerDiscountType: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  minCustomer: number | null;
  maxCustomer: number | null;
  minQuantityPerCustomer: number | null;
  maxQuantityPerCustomer: number | null;
  productCondition: string;
  onRemove: (id: number) => void;
  hideCheckbox?: boolean;
  hideEyeIcon?: boolean;
  hideCopyButton?: boolean;
  hideActionButtons?: boolean;
  disableFields?: boolean;
  productType?: string;
  isDropshipped?: boolean;
};

const ManageProductCard: React.FC<ManageProductCardProps> = ({
  selectedIds,
  onSelectedId,
  onSelect,
  id,
  productId,
  status: initialStatus,
  askForPrice,
  askForStock,
  productImage,
  productName,
  productPrice: initialProductPrice,
  offerPrice: initialPrice,
  deliveryAfter: initialDelivery,
  stock: initialStock,
  consumerType: initialConsumerType,
  sellType: initialSellType,
  timeOpen: initialTimeOpen,
  timeClose: initialTimeClose,
  vendorDiscount: initialVendorDiscount,
  vendorDiscountType: initialVendorDiscountType,
  consumerDiscount: initialConsumerDiscount,
  consumerDiscountType: initialConsumerDiscountType,
  minQuantity: initialMinQuantity,
  maxQuantity: initialMaxQuantity,
  minCustomer: initialMinCustomer,
  maxCustomer: initialMaxCustomer,
  minQuantityPerCustomer: initialMinQuantityPerCustomer,
  maxQuantityPerCustomer: initialMaxQuantityPerCustomer,
  productCondition: initialCondition,
  onRemove,
  hideCheckbox = false,
  hideEyeIcon = false,
  hideCopyButton = false,
  hideActionButtons = false,
  disableFields = false,
  productType,
  isDropshipped = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Status update part
  const [status, setStatus] = useState(initialStatus);
  const statusUpdate = useUpdateProductStatus();

  const updateStatus = async (status: string) => {
    try {
      // Toggle between ACTIVE and HIDDEN for customer visibility
      const newStatus = status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
      const response = await statusUpdate.mutateAsync({
        productPriceId: id,
        status: newStatus,
      });

      if (response.status) {
        setStatus(newStatus);
        toast({
          title: t("status_update_successful"),
          description: t("status_updated_successfully"),
          variant: "success",
        });
      } else {
        toast({
          title: t("status_update_failed"),
          description: t("something_went_wrong"),
          variant: "danger",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_update_status"),
        variant: "danger",
      });
    }
  };

  // Stock manage part
  const [stock, setStock] = useState(initialStock);
  const decreaseStock = () => {
    setStock((prevStock) => Math.max(prevStock - 1, 0));
  };

  const increaseStock = () => {
    setStock((prevStock) => Math.min(prevStock + 1, 1000));
  };

  // Price part
  const [offerPrice, setPrice] = useState<number>(Number(initialPrice));
  const [productPrice, setProductPrice] = useState<number>(
    Number(initialProductPrice),
  );
  const decreasePrice = () => {
    setPrice((prevPrice) => Math.max(Number(prevPrice) - 1, 0));
    setProductPrice((prevPrice) => Math.max(Number(prevPrice) - 1, 0));
  };

  const increasePrice = () => {
    setPrice((prevPrice) => Math.min(prevPrice + 1, 1000000));
    setProductPrice((prevPrice) => Math.min(prevPrice + 1, 1000000));
  };

  // Product condition part && customer type && sell type
  const [productCondition, setCondition] = useState<string>(initialCondition);
  const [consumerType, setConsumer] = useState<string>(initialConsumerType);
  const [sellType, setSell] = useState<string>(initialSellType);

  // Sync local state with props when they change (for bulk updates)
  useEffect(() => {
    setConsumer(initialConsumerType);
  }, [initialConsumerType]);

  useEffect(() => {
    setSell(initialSellType);
  }, [initialSellType]);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  useEffect(() => {
    setDelivery(Number(initialDelivery));
  }, [initialDelivery]);

  useEffect(() => {
    setVendor(Number(initialVendorDiscount));
  }, [initialVendorDiscount]);

  useEffect(() => {
    setVendorDiscountType(initialVendorDiscountType);
  }, [initialVendorDiscountType]);

  useEffect(() => {
    setConsumerDiscount(Number(initialConsumerDiscount));
  }, [initialConsumerDiscount]);

  useEffect(() => {
    setConsumerDiscountType(initialConsumerDiscountType);
  }, [initialConsumerDiscountType]);

  // set Deliver After
  const [deliveryAfter, setDelivery] = useState<number>(
    Number(initialDelivery),
  );
  const decreaseDeliveryDay = () => {
    setDelivery((prevDay) => Math.max(Number(prevDay) - 1, 0));
  };

  const increaseDeliveryDay = () => {
    setDelivery((prevDay) => Math.min(prevDay + 1, 50));
  };

  // set Time open & close
  const [timeOpen, setTimeOpen] = useState<number>(Number(initialTimeOpen));
  const decreaseTimeOpen = () => {
    setTimeOpen((prevDay) => Math.max(prevDay - 1, 0));
  };

  const increaseTimeOpen = () => {
    setTimeOpen((prevDay) => Math.min(prevDay + 1, 50));
  };

  const [timeClose, setTimeClose] = useState<number>(Number(initialTimeClose));
  const decreaseTimeClose = () => {
    setTimeClose((prevDay) => Math.max(prevDay - 1, 0));
  };

  const increaseTimeClose = () => {
    setTimeClose((prevDay) => Math.min(prevDay + 1, 50));
  };

  // Remaining part
  const [vendorDiscount, setVendor] = useState<number>(
    Number(initialVendorDiscount),
  );
  const [vendorDiscountType, setVendorDiscountType] = useState<string | null>(
    initialVendorDiscountType,
  );
  const decreaseVendorDiscount = () => {
    setVendor((prevDayDiscount) => Math.max(Number(prevDayDiscount) - 1, 0));
  };

  const increaseVendorDiscount = () => {
    setVendor((prevDayDiscount) => Math.min(prevDayDiscount + 1, 100));
  };

  const [consumerDiscount, setConsumerDiscount] = useState<number>(
    Number(initialConsumerDiscount),
  );
  const [consumerDiscountType, setConsumerDiscountType] = useState<string | null>(
    initialConsumerDiscountType,
  );
  const decreaseConsumerDiscount = () => {
    setConsumerDiscount((prevDayDiscount) => Math.max(Number(prevDayDiscount) - 1, 0));
  };

  const increaseConsumerDiscount = () => {
    setConsumerDiscount((prevDayDiscount) => Math.min(prevDayDiscount + 1, 100));
  };

  const [minQuantity, setMinQuantity] = useState<number>(
    Number(initialMinQuantity),
  );
  const decreaseMinQuantity = () => {
    setMinQuantity((prevDay) => Math.max(Number(prevDay) - 1, 0));
  };

  const increaseMinQuantity = () => {
    setMinQuantity((prevDay) => Math.min(prevDay + 1, 1000));
  };

  const [maxQuantity, setMaxQuantity] = useState<number>(
    Number(initialMaxQuantity),
  );
  const decreaseMaxsQuantity = () => {
    setMaxQuantity((prevDay) => Math.max(Number(prevDay) - 1, 0));
  };

  const increaseMaxQuantity = () => {
    setMaxQuantity((prevDay) => Math.min(prevDay + 1, 1000));
  };

  const [minCustomer, setMinCustomer] = useState<number>(
    Number(initialMinCustomer),
  );
  const decreaseMinCustomer = () => {
    setMinCustomer((prevDay) => Math.max(Number(prevDay) - 1, 0));
  };

  const increaseMinCustomer = () => {
    setMinCustomer((prevDay) => Math.min(prevDay + 1, 1000));
  };

  const [maxCustomer, setMaxCustomer] = useState<number>(
    Number(initialMaxCustomer),
  );
  const decreaseMaxCustomer = () => {
    setMaxCustomer((prevDay) => Math.max(Number(prevDay) - 1, 0));
  };

  const increaseMaxCustomer = () => {
    setMaxCustomer((prevDay) => Math.min(prevDay + 1, 1000));
  };

  const [minQuantityCustomer, setMinQuantityCustomer] = useState<number>(
    Number(initialMinQuantityPerCustomer),
  );
  const decreaseMinQuantityCustomer = () => {
    setMinQuantityCustomer((prevDay) => Math.max(prevDay - 1, 0));
  };

  const increaseMinQuantityCustomer = () => {
    setMinQuantityCustomer((prevDay) => Math.min(prevDay + 1, 1000));
  };

  const [maxQuantityCustomer, setMaxQuantityCustomer] = useState<number>(
    Number(initialMaxQuantityPerCustomer),
  );
  const decreaseMaxQuantityCustomer = () => {
    setMaxQuantityCustomer((prevDay) => Math.max(prevDay - 1, 0));
  };

  const increaseMaxQuantityCustomer = () => {
    setMaxQuantityCustomer((prevDay) => Math.min(prevDay + 1, 1000));
  };

  // call update single product
  const productUpdate = useUpdateSingleProduct();

  const handleUpdate = async (e: React.MouseEvent) => {
    // Prevent form submission
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      const response = await productUpdate.mutateAsync({
        productPriceId: id,
        stock,
        askForPrice,
        askForStock,
        offerPrice,
        productPrice,
        status,
        productCondition,
        consumerType,
        sellType,
        deliveryAfter,
        timeOpen,
        timeClose,
        vendorDiscount,
        vendorDiscountType,
        consumerDiscount,
        consumerDiscountType,
        minQuantity,
        maxQuantity,
        minCustomer,
        maxCustomer,
        minQuantityPerCustomer: minQuantityCustomer,
        maxQuantityPerCustomer: maxQuantityCustomer,
      });

      if (response.status) {
        toast({
          title: t("product_update_successful"),
          description: t("product_updated_successfully"),
          variant: "success",
        });
      } else {
        toast({
          title: t("product_update_failed"),
          description: response.message || t("something_went_wrong"),
          variant: "danger",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_update_product"),
        variant: "danger",
      });
    }
  };

  // For remove product
  const productRemove = useRemoveProduct();

  const handleRemoveProduct = async () => {
    try {
      const response = await productRemove.mutateAsync({
        productPriceId: id,
      });

      if (response.status) {
        toast({
          title: t("product_removed"),
          description: t("product_removed_successfully"),
          variant: "success",
        });
        // Call the function to remove the product from the UI
        onRemove(id);
      } else {
        toast({
          title: t("product_removed"),
          description: t("something_went_wrong"),
          variant: "danger",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_remove_product"),
        variant: "danger",
      });
    }
  };

  const handleEditProduct = () => {
    // Navigate to the add product page with product ID and productPriceId for editing
    router.push(`/product?edit=true&productId=${productId}&productPriceId=${id}`);
  };

  // Function to reset all values to initial state
  const handleReset = () => {
    setStock(Number(initialStock));
    setPrice(Number(initialPrice));
    setProductPrice(Number(initialProductPrice));
    setCondition(initialCondition);
    setConsumer(initialConsumerType);
    setSell(initialSellType);
    setDelivery(Number(initialDelivery));
    setTimeOpen(Number(initialTimeOpen));
    setTimeClose(Number(initialTimeClose));
    setVendor(Number(initialVendorDiscount));
    setVendorDiscountType(initialVendorDiscountType);
    setConsumerDiscount(Number(initialConsumerDiscount));
    setConsumerDiscountType(initialConsumerDiscountType);
    setMinQuantity(Number(initialMinQuantity));
    setMaxQuantity(Number(initialMaxQuantity));
    setMinCustomer(Number(initialMinCustomer));
    setMaxCustomer(Number(initialMaxCustomer));
    setMinQuantityCustomer(Number(initialMinQuantityPerCustomer));
    setMaxQuantityCustomer(Number(initialMaxQuantityPerCustomer));
  };

  return (
    <div className="mb-4 w-full rounded-lg border border-gray-200 bg-white shadow-xs">
      {/* Compact View - Always Visible */}
      <div className="flex items-center justify-between p-4">
        {/* Left Section - Product Info */}
        <div className="flex items-center space-x-4">
          {/* Checkbox and Eye Icon */}
          {!hideCheckbox && !hideEyeIcon && (
            <div className="flex flex-col items-center space-y-2">
              {!hideCheckbox && (
                <Checkbox
                  className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                  checked={selectedIds?.includes(id)}
                  onCheckedChange={(checked) => {
                    onSelectedId?.(checked, id);
                    if (checked) {
                      onSelect?.({
                        stock,
                        askForPrice,
                        askForStock,
                        offerPrice,
                        productPrice,
                        status,
                        productCondition,
                        consumerType,
                        sellType,
                        deliveryAfter,
                        timeOpen,
                        timeClose,
                        vendorDiscount,
                        vendorDiscountType,
                        consumerDiscount,
                        consumerDiscountType,
                        minQuantity,
                        maxQuantity,
                        minCustomer,
                        maxCustomer,
                        minQuantityPerCustomer: minQuantityCustomer,
                        maxQuantityPerCustomer: maxQuantityCustomer,
                      });
                    }
                  }}
                />
              )}
              {!hideEyeIcon && (
                <div
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => updateStatus(status)}
                >
                  {status === "ACTIVE" ? <IoIosEye size={20} /> : <IoIosEyeOff size={20} />}
                </div>
              )}
            </div>
          )}

          {/* Product Image */}
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
            {productImage && validator.isURL(productImage) ? (
              // Check if the image is from an allowed domain (S3 bucket)
              productImage.includes('puremoon.s3.amazonaws.com') ? (
                <Image
                  src={productImage}
                  alt="product-image"
                  fill
                  sizes="96px"
                  className="object-cover"
                  blurDataURL="/images/product-placeholder.png"
                  placeholder="blur"
                />
              ) : (
                // Use regular img tag for external URLs not in allowed domains
                <img
                  src={productImage}
                  alt="product-image"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PlaceholderImage.src;
                  }}
                />
              )
            ) : (
              <Image
                src={PlaceholderImage}
                alt="product-image"
                fill
                sizes="96px"
                className="object-cover"
                blurDataURL="/images/product-placeholder.png"
                placeholder="blur"
              />
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{productName || "-"}</h3>
              {/* Product Type Badges */}
              {/* {productType === 'D' && !isDropshipped && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {t("wholesale_product")}
                </span>
              )}
              {isDropshipped && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {t("dropship_product")}
                </span>
              )} */}
            </div>
            
            {/* Stock and Price Info */}
            <div className="flex space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t("stock")}:</span>
                <span className="text-green-600 font-semibold">
                  {askForStock === "false" || askForStock === "NO" || (askForStock as any) === false ? stock : t("ask_for_the_stock")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t("price")}:</span>
                <span className="text-blue-600 font-semibold">
                  {askForPrice === "false" || askForPrice === "NO" || (askForPrice as any) === false ? `$${productPrice}` : t("ask_for_the_price")}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>{t("condition")}:</span>
                <span className="font-medium">{productCondition || "-"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{t("delivery")}:</span>
                <span className="font-medium">{deliveryAfter} {t("days")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Action Buttons - Iconic Only */}
          {!hideCopyButton && !hideActionButtons && (
            <div className="flex space-x-2">
              {!hideCopyButton && (
                <Link href={`/product?copy=${productId}`}>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                    title={t("copy_product")}
                  >
                    <IoMdCopy size={18} />
                  </button>
                </Link>
              )}
              
              {!hideActionButtons && (
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  onClick={handleRemoveProduct}
                  title={t("remove")}
                >
                  <IoMdTrash size={18} />
                </button>
              )}
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? t("collapse") : t("expand")}
          >
            {isExpanded ? <IoMdArrowUp size={18} /> : <IoMdArrowDown size={18} />}
          </button>
        </div>
      </div>

             {/* Expanded View - Editable Fields */}
       {isExpanded && (
         <div className="border-t border-gray-200 bg-gray-50 p-4">
           <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${disableFields ? 'pointer-events-none opacity-60' : ''}`}>
             {/* Stock Management - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("stock")}</Label>
               <div className="flex items-center space-x-1">
                 <input
                   type="checkbox"
                   className="h-3 w-3"
                   defaultChecked={askForStock === "false" || askForStock === "NO" || (askForStock as any) === false}
                   disabled={disableFields}
                 />
                 <span className="text-xs text-gray-600">{t("manage_stock")}</span>
               </div>
               <div className="flex items-center space-x-1">
                 <button
                   type="button"
                   onClick={decreaseStock}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   value={stock}
                   onChange={(e) => setStock(Number(e.target.value))}
                   disabled={disableFields}
                   className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                 />
                 <button
                   type="button"
                   onClick={increaseStock}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   +
                 </button>
               </div>
             </div>

             {/* Price Management - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("price")}</Label>
               <div className="flex items-center space-x-1">
                 <input
                   type="checkbox"
                   className="h-3 w-3"
                   defaultChecked={askForPrice === "false" || askForPrice === "NO" || (askForPrice as any) === false}
                 />
                 <span className="text-xs text-gray-600">{t("manage_price")}</span>
               </div>
               <div className="flex items-center space-x-1">
                 <button
                   type="button"
                   onClick={(e) => { e.preventDefault(); decreasePrice(); }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   value={productPrice}
                   onChange={(e) => setProductPrice(Number(e.target.value))}
                   className="h-6 w-14 rounded border border-gray-300 text-center text-xs"
                 />
                 <button
                   type="button"
                   onClick={(e) => { e.preventDefault(); increasePrice(); }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   +
                 </button>
               </div>
             </div>

             {/* Product Condition - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("product_condition")}</Label>
               <select
                 value={productCondition}
                 onChange={(e) => setCondition(e.target.value)}
                 className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
               >
                 <option value="NEW">{t("new")}</option>
                 <option value="OLD">{t("old")}</option>
                 <option value="REFURBISHED">{t("refurbished")}</option>
               </select>
             </div>

             {/* Delivery After - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("deliver_after")}</Label>
               <div className="flex items-center space-x-1">
                 <button
                  onClick={(e) => { e.preventDefault(); decreaseDeliveryDay() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   value={deliveryAfter}
                   onChange={(e) => setDelivery(Number(e.target.value))}
                   className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                 />
                 <button
                   onClick={(e) => { e.preventDefault(); increaseDeliveryDay() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   +
                 </button>
               </div>
             </div>

             {/* Consumer Type - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("consumer_type")}</Label>
               <select
                 value={consumerType}
                 onChange={(e) => setConsumer(e.target.value)}
                 disabled={false}
                 className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
               >
                 <option value="CONSUMER">{t("consumer")}</option>
                 <option value="VENDORS">{t("vendor")}</option>
                 <option value="EVERYONE">{t("everyone")}</option>
               </select>
             </div>

             {/* Sell Type - Always Visible */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("sell_type")}</Label>
               <select
                 value={sellType}
                 onChange={(e) => {
                   const newSellType = e.target.value;
                   setSell(newSellType);
                 }}
                 className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
               >
                 <option value="NORMALSELL">{t("normal_sell")}</option>
                 <option value="BUYGROUP">{t("buy_group")}</option>
                 <option value="TRIAL_PRODUCT">{t("trial_product")}</option>
                 <option value="WHOLESALE_PRODUCT">{t("wholesale_product")}</option>
               </select>
             </div>

             {/* Time Open - Common for all sell types */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("time_open")}</Label>
               <div className="flex items-center space-x-1">
                 <button
                   onClick={(e) => { e.preventDefault(); decreaseTimeOpen() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   value={timeOpen}
                   onChange={(e) => setTimeOpen(Number(e.target.value))}
                   className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                 />
                 <button
                   onClick={(e) => { e.preventDefault(); increaseTimeOpen() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   +
                 </button>
               </div>
             </div>

             {/* Time Close - Common for all sell types */}
             <div className="space-y-1">
               <Label className="text-xs font-medium">{t("time_close")}</Label>
               <div className="flex items-center space-x-1">
                 <button
                   onClick={(e) => { e.preventDefault(); decreaseTimeClose() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   value={timeClose}
                   onChange={(e) => setTimeClose(Number(e.target.value))}
                   className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                 />
                 <button
                   onClick={(e) => { e.preventDefault(); increaseTimeClose() }}
                   className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                 >
                   +
                 </button>
               </div>
             </div>

            {/* Vendor Discount - Show for VENDORS/EVERYONE consumer type */}
            {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("vendor_discount")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseVendorDiscount() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={vendorDiscount}
                     onChange={(e) => setVendor(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseVendorDiscount() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

            {/* Vendor Discount Type - Show for VENDORS/EVERYONE consumer type and when discount > 0 */}
            {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (vendorDiscount > 0 || vendorDiscountType) && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("discount_type")}</Label>
                 <select
                   value={vendorDiscountType || ""}
                   onChange={(e) => setVendorDiscountType(e.target.value)}
                   className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                 >
                   {/* <option value="">{t("select_discount_type")}</option> */}
                   <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                   <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                 </select>
               </div>
             )}

            {/* Consumer Discount - Show for CONSUMER/EVERYONE consumer type */}
            {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("consumer_discount")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseConsumerDiscount() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={consumerDiscount}
                     onChange={(e) => setConsumerDiscount(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseConsumerDiscount() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

            {/* Consumer Discount Type - Show for CONSUMER/EVERYONE consumer type and when discount > 0 */}
            {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (consumerDiscount > 0 || consumerDiscountType) && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("discount_type")}</Label>
                 <select
                   value={consumerDiscountType || ""}
                   onChange={(e) => setConsumerDiscountType(e.target.value)}
                   className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                 >
                   {/* <option value="">{t("select_discount_type")}</option>
                   <option value="PERCENTAGE">{t("percentage")}</option>
                   <option value="FIXED">{t("fixed_amount")}</option> */}
                   <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                   <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                 </select>
               </div>
             )}

             {/* Min Quantity - Show only for BUYGROUP sell type */}
             {sellType === "BUYGROUP" && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("min_quantity")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMinQuantity() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={minQuantity}
                     onChange={(e) => setMinQuantity(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMinQuantity() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Max Quantity - Show only for BUYGROUP sell type */}
             {sellType === "BUYGROUP" && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("max_quantity")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMaxsQuantity() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={maxQuantity}
                     onChange={(e) => setMaxQuantity(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMaxQuantity() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Min Customer - Show only for BUYGROUP sell type */}
             {sellType === "BUYGROUP" && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("min_customer")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMinCustomer() }  }
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={minCustomer}
                     onChange={(e) => setMinCustomer(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMinCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Max Customer - Show only for BUYGROUP sell type */}
             {sellType === "BUYGROUP" && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("max_customer")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMaxCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={maxCustomer}
                     onChange={(e) => setMaxCustomer(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMaxCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Min Quantity Per Customer - Show for BUYGROUP or WHOLESALE_PRODUCT sell type */}
             {(sellType === "BUYGROUP" || sellType === "WHOLESALE_PRODUCT") && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("min_quantity_per_customer")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMinQuantityCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={minQuantityCustomer}
                     onChange={(e) => setMinQuantityCustomer(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMinQuantityCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Max Quantity Per Customer - Show for BUYGROUP or WHOLESALE_PRODUCT sell type */}
             {(sellType === "BUYGROUP" || sellType === "WHOLESALE_PRODUCT") && (
               <div className="space-y-1">
                 <Label className="text-xs font-medium">{t("max_quantity_per_customer")}</Label>
                 <div className="flex items-center space-x-1">
                   <button
                     onClick={(e) => { e.preventDefault(); decreaseMaxQuantityCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     -
                   </button>
                   <input
                     type="number"
                     value={maxQuantityCustomer}
                     onChange={(e) => setMaxQuantityCustomer(Number(e.target.value))}
                     className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                   />
                   <button
                     onClick={(e) => { e.preventDefault(); increaseMaxQuantityCustomer() }}
                     className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                   >
                     +
                   </button>
                 </div>
               </div>
             )}

             {/* Trial Product Fields - Show for TRIAL_PRODUCT sell type with any consumer type */}
             {sellType === "TRIAL_PRODUCT" && (
               <>
                 {/* Vendor Discount for Trial Product - Show for VENDORS/EVERYONE consumer type */}
                 {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("vendor_discount")}</Label>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={(e) => { e.preventDefault(); decreaseVendorDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         -
                       </button>
                       <input
                         type="number"
                         value={vendorDiscount}
                         onChange={(e) => setVendor(Number(e.target.value))}
                         className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                       />
                       <button
                         onClick={(e) => { e.preventDefault(); increaseVendorDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         +
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Consumer Discount for Trial Product - Show for CONSUMER/EVERYONE consumer type */}
                 {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("consumer_discount")}</Label>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={(e) => { e.preventDefault(); decreaseConsumerDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         -
                       </button>
                       <input
                         type="number"
                         value={consumerDiscount}
                         onChange={(e) => setConsumerDiscount(Number(e.target.value))}
                         className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                       />
                       <button
                         onClick={(e) => { e.preventDefault(); increaseConsumerDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         +
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Vendor Discount Type for Trial Product - Show for VENDORS/EVERYONE consumer type */}
                 {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (vendorDiscount > 0 || vendorDiscountType) && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("vendor_discount_type")}</Label>
                     <select
                       value={vendorDiscountType || ""}
                       onChange={(e) => setVendorDiscountType(e.target.value)}
                       className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                     >
                       <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                       <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                     </select>
                   </div>
                 )}

                 {/* Consumer Discount Type for Trial Product - Show for CONSUMER/EVERYONE consumer type */}
                 {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (consumerDiscount > 0 || consumerDiscountType) && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("consumer_discount_type")}</Label>
                     <select
                       value={consumerDiscountType || ""}
                       onChange={(e) => setConsumerDiscountType(e.target.value)}
                       className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                     >
                       <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                       <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                     </select>
                   </div>
                 )}

                 {/* Max Quantity Per Customer for Trial Product */}
                 <div className="space-y-1">
                   <Label className="text-xs font-medium">{t("max_quantity_per_customer")}</Label>
                   <div className="flex items-center space-x-1">
                     <button
                       onClick={(e) => { e.preventDefault(); decreaseMaxQuantityCustomer() }}
                       className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                     >
                       -
                     </button>
                     <input
                       type="number"
                       value={maxQuantityCustomer}
                       onChange={(e) => setMaxQuantityCustomer(Number(e.target.value))}
                       className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                     />
                     <button
                       onClick={(e) => { e.preventDefault(); increaseMaxQuantityCustomer() }}
                       className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                     >
                       +
                     </button>
                   </div>
                 </div>
               </>
             )}

             {/* Wholesale Product Fields - Show for WHOLESALE_PRODUCT sell type with any consumer type */}
             {sellType === "WHOLESALE_PRODUCT" && (
               <>
                 {/* Vendor Discount for Wholesale Product - Show for VENDORS/EVERYONE consumer type */}
                 {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("vendor_discount")}</Label>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={(e) => { e.preventDefault(); decreaseVendorDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         -
                       </button>
                       <input
                         type="number"
                         value={vendorDiscount}
                         onChange={(e) => setVendor(Number(e.target.value))}
                         className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                       />
                       <button
                         onClick={(e) => { e.preventDefault(); increaseVendorDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         +
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Consumer Discount for Wholesale Product - Show for CONSUMER/EVERYONE consumer type */}
                 {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("consumer_discount")}</Label>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={(e) => { e.preventDefault(); decreaseConsumerDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         -
                       </button>
                       <input
                         type="number"
                         value={consumerDiscount}
                         onChange={(e) => setConsumerDiscount(Number(e.target.value))}
                         className="h-6 w-12 rounded border border-gray-300 text-center text-xs"
                       />
                       <button
                         onClick={(e) => { e.preventDefault(); increaseConsumerDiscount() }}
                         className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                       >
                         +
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Vendor Discount Type for Wholesale Product - Show for VENDORS/EVERYONE consumer type */}
                 {(consumerType === "VENDORS" || consumerType === "EVERYONE") && (vendorDiscount > 0 || vendorDiscountType) && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("vendor_discount_type")}</Label>
                     <select
                       value={vendorDiscountType || ""}
                       onChange={(e) => setVendorDiscountType(e.target.value)}
                       className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                     >
                       <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                       <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                     </select>
                   </div>
                 )}

                 {/* Consumer Discount Type for Wholesale Product - Show for CONSUMER/EVERYONE consumer type */}
                 {(consumerType === "CONSUMER" || consumerType === "EVERYONE") && (consumerDiscount > 0 || consumerDiscountType) && (
                   <div className="space-y-1">
                     <Label className="text-xs font-medium">{t("consumer_discount_type")}</Label>
                     <select
                       value={consumerDiscountType || ""}
                       onChange={(e) => setConsumerDiscountType(e.target.value)}
                       className="h-6 w-full rounded border border-gray-300 px-1 text-xs"
                     >
                       <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
                       <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
                     </select>
                   </div>
                 )}

               </>
             )}

           </div>

           {/* Action Buttons Section */}
           {!hideActionButtons && (
             <div className="mt-4 flex justify-center space-x-3 border-t border-gray-300 pt-4">
               <button
                 type="button"
                 className="flex items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 transition-colors"
                 onClick={handleEditProduct}
               >
                 <IoMdEdit size={16} className="mr-1" />
                 {t("edit")}
               </button>

               <button
                 type="button"
                 className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors"
                 onClick={(e) => handleUpdate(e)}
               >
                 <IoMdCreate size={16} className="mr-1" />
                 {t("update")}
               </button>
                
               <button
                 type="button"
                 className="flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 transition-colors"
                 onClick={handleReset}
               >
                 <IoMdRefresh size={16} className="mr-1" />
                 {t("reset")}
               </button>
             </div>
           )}
         </div>
       )}
     </div>
   );
 };

export default ManageProductCard;
