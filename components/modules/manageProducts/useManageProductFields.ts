import { useState, useEffect } from "react";

type UseManageProductFieldsOptions = {
  initialProductPrice: string;
  initialPrice: string;
  initialDelivery: number;
  initialTimeOpen: number | null;
  initialTimeClose: number | null;
  initialVendorDiscount: number | null;
  initialVendorDiscountType: string | null;
  initialConsumerDiscount: number | null;
  initialConsumerDiscountType: string | null;
  initialMinQuantity: number | null;
  initialMaxQuantity: number | null;
  initialMinCustomer: number | null;
  initialMaxCustomer: number | null;
  initialMinQuantityPerCustomer: number | null;
  initialMaxQuantityPerCustomer: number | null;
  initialStock: number;
};

export function useManageProductFields({
  initialProductPrice,
  initialPrice,
  initialDelivery,
  initialTimeOpen,
  initialTimeClose,
  initialVendorDiscount,
  initialVendorDiscountType,
  initialConsumerDiscount,
  initialConsumerDiscountType,
  initialMinQuantity,
  initialMaxQuantity,
  initialMinCustomer,
  initialMaxCustomer,
  initialMinQuantityPerCustomer,
  initialMaxQuantityPerCustomer,
  initialStock,
}: UseManageProductFieldsOptions) {
  // Price part
  const [offerPrice, setPrice] = useState<number>(Number(initialPrice));
  const [productPrice, setProductPrice] = useState<number>(Number(initialProductPrice));
  const decreasePrice = () => {
    setPrice((prev) => Math.max(Number(prev) - 1, 0));
    setProductPrice((prev) => Math.max(Number(prev) - 1, 0));
  };
  const increasePrice = () => {
    setPrice((prev) => Math.min(prev + 1, 1000000));
    setProductPrice((prev) => Math.min(prev + 1, 1000000));
  };

  // Delivery After
  const [deliveryAfter, setDelivery] = useState<number>(Number(initialDelivery));
  useEffect(() => { setDelivery(Number(initialDelivery)); }, [initialDelivery]);
  const decreaseDeliveryDay = () => setDelivery((prev) => Math.max(Number(prev) - 1, 0));
  const increaseDeliveryDay = () => setDelivery((prev) => Math.min(prev + 1, 50));

  // Time open & close
  const [timeOpen, setTimeOpen] = useState<number>(Number(initialTimeOpen));
  const decreaseTimeOpen = () => setTimeOpen((prev) => Math.max(prev - 1, 0));
  const increaseTimeOpen = () => setTimeOpen((prev) => Math.min(prev + 1, 50));

  const [timeClose, setTimeClose] = useState<number>(Number(initialTimeClose));
  const decreaseTimeClose = () => setTimeClose((prev) => Math.max(prev - 1, 0));
  const increaseTimeClose = () => setTimeClose((prev) => Math.min(prev + 1, 50));

  // Vendor discount
  const [vendorDiscount, setVendor] = useState<number>(Number(initialVendorDiscount));
  const [vendorDiscountType, setVendorDiscountType] = useState<string | null>(initialVendorDiscountType);
  useEffect(() => { setVendor(Number(initialVendorDiscount)); }, [initialVendorDiscount]);
  useEffect(() => { setVendorDiscountType(initialVendorDiscountType); }, [initialVendorDiscountType]);
  const decreaseVendorDiscount = () => setVendor((prev) => Math.max(Number(prev) - 1, 0));
  const increaseVendorDiscount = () => setVendor((prev) => Math.min(prev + 1, 100));

  // Consumer discount
  const [consumerDiscount, setConsumerDiscount] = useState<number>(Number(initialConsumerDiscount));
  const [consumerDiscountType, setConsumerDiscountType] = useState<string | null>(initialConsumerDiscountType);
  useEffect(() => { setConsumerDiscount(Number(initialConsumerDiscount)); }, [initialConsumerDiscount]);
  useEffect(() => { setConsumerDiscountType(initialConsumerDiscountType); }, [initialConsumerDiscountType]);
  const decreaseConsumerDiscount = () => setConsumerDiscount((prev) => Math.max(Number(prev) - 1, 0));
  const increaseConsumerDiscount = () => setConsumerDiscount((prev) => Math.min(prev + 1, 100));

  // Min/Max Quantity
  const [minQuantity, setMinQuantity] = useState<number>(Number(initialMinQuantity));
  const decreaseMinQuantity = () => setMinQuantity((prev) => Math.max(Number(prev) - 1, 0));
  const increaseMinQuantity = () => setMinQuantity((prev) => Math.min(prev + 1, 1000));

  const [maxQuantity, setMaxQuantity] = useState<number>(Number(initialMaxQuantity));
  const decreaseMaxsQuantity = () => setMaxQuantity((prev) => Math.max(Number(prev) - 1, 0));
  const increaseMaxQuantity = () => setMaxQuantity((prev) => Math.min(prev + 1, 1000));

  // Min/Max Customer
  const [minCustomer, setMinCustomer] = useState<number>(Number(initialMinCustomer));
  const decreaseMinCustomer = () => setMinCustomer((prev) => Math.max(Number(prev) - 1, 0));
  const increaseMinCustomer = () => setMinCustomer((prev) => Math.min(prev + 1, 1000));

  const [maxCustomer, setMaxCustomer] = useState<number>(Number(initialMaxCustomer));
  const decreaseMaxCustomer = () => setMaxCustomer((prev) => Math.max(Number(prev) - 1, 0));
  const increaseMaxCustomer = () => setMaxCustomer((prev) => Math.min(prev + 1, 1000));

  // Min/Max Quantity Per Customer
  const [minQuantityCustomer, setMinQuantityCustomer] = useState<number>(
    initialMinQuantity ? Number(initialMinQuantity) : 1,
  );
  const [maxQuantityCustomer, setMaxQuantityCustomer] = useState<number>(
    Number(initialStock) || Number(initialMaxQuantityPerCustomer) || 0,
  );
  const decreaseMaxQuantityCustomer = () => setMaxQuantityCustomer((prev) => Math.max(prev - 1, 0));
  const increaseMaxQuantityCustomer = () => setMaxQuantityCustomer((prev) => Math.min(prev + 1, 10000));

  const resetFields = (initial: UseManageProductFieldsOptions) => {
    setPrice(Number(initial.initialPrice));
    setProductPrice(Number(initial.initialProductPrice));
    setDelivery(Number(initial.initialDelivery));
    setTimeOpen(Number(initial.initialTimeOpen));
    setTimeClose(Number(initial.initialTimeClose));
    setVendor(Number(initial.initialVendorDiscount));
    setVendorDiscountType(initial.initialVendorDiscountType);
    setConsumerDiscount(Number(initial.initialConsumerDiscount));
    setConsumerDiscountType(initial.initialConsumerDiscountType);
    setMinQuantity(Number(initial.initialMinQuantity));
    setMaxQuantity(Number(initial.initialMaxQuantity));
    setMinCustomer(Number(initial.initialMinCustomer));
    setMaxCustomer(Number(initial.initialMaxCustomer));
    setMinQuantityCustomer(Number(initial.initialMinQuantityPerCustomer));
    setMaxQuantityCustomer(Number(initial.initialMaxQuantityPerCustomer));
  };

  return {
    offerPrice, setPrice,
    productPrice, setProductPrice,
    decreasePrice, increasePrice,
    deliveryAfter, setDelivery,
    decreaseDeliveryDay, increaseDeliveryDay,
    timeOpen, setTimeOpen,
    decreaseTimeOpen, increaseTimeOpen,
    timeClose, setTimeClose,
    decreaseTimeClose, increaseTimeClose,
    vendorDiscount, setVendor,
    vendorDiscountType, setVendorDiscountType,
    decreaseVendorDiscount, increaseVendorDiscount,
    consumerDiscount, setConsumerDiscount,
    consumerDiscountType, setConsumerDiscountType,
    decreaseConsumerDiscount, increaseConsumerDiscount,
    minQuantity, setMinQuantity,
    decreaseMinQuantity, increaseMinQuantity,
    maxQuantity, setMaxQuantity,
    decreaseMaxsQuantity, increaseMaxQuantity,
    minCustomer, setMinCustomer,
    decreaseMinCustomer, increaseMinCustomer,
    maxCustomer, setMaxCustomer,
    decreaseMaxCustomer, increaseMaxCustomer,
    minQuantityCustomer, setMinQuantityCustomer,
    maxQuantityCustomer, setMaxQuantityCustomer,
    decreaseMaxQuantityCustomer, increaseMaxQuantityCustomer,
    resetFields,
  };
}
