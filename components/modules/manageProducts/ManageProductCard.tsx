import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ManageProductCardProps } from "./manageProductCardTypes";
import { useManageProductCard } from "./useManageProductCard";
import ManageProductInfo from "./ManageProductInfo";
import ManageProductActions from "./ManageProductActions";
import ManageProductExpandedFields from "./ManageProductExpandedFields";

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
  miniStats,
  onRemove,
  hideCheckbox = false,
  hideEyeIcon = false,
  hideCopyButton = false,
  hideActionButtons = false,
  disableFields = false,
  productType,
  isDropshipped = false,
}) => {
  const {
    isExpanded, setIsExpanded,
    status, updateStatus,
    stock, setStock, decreaseStock, increaseStock,
    productCondition, setCondition,
    consumerType, setConsumer,
    sellType, setSell,
    offerPrice, productPrice, setProductPrice, decreasePrice, increasePrice,
    deliveryAfter, setDelivery, decreaseDeliveryDay, increaseDeliveryDay,
    timeOpen, setTimeOpen, decreaseTimeOpen, increaseTimeOpen,
    timeClose, setTimeClose, decreaseTimeClose, increaseTimeClose,
    vendorDiscount, setVendor, vendorDiscountType, setVendorDiscountType,
    decreaseVendorDiscount, increaseVendorDiscount,
    consumerDiscount, setConsumerDiscount, consumerDiscountType, setConsumerDiscountType,
    decreaseConsumerDiscount, increaseConsumerDiscount,
    minQuantity, setMinQuantity, decreaseMinQuantity, increaseMinQuantity,
    maxQuantity, setMaxQuantity, decreaseMaxsQuantity, increaseMaxQuantity,
    minCustomer, setMinCustomer, decreaseMinCustomer, increaseMinCustomer,
    maxCustomer, setMaxCustomer, decreaseMaxCustomer, increaseMaxCustomer,
    minQuantityCustomer, maxQuantityCustomer, setMaxQuantityCustomer,
    decreaseMaxQuantityCustomer, increaseMaxQuantityCustomer,
    handleUpdate, handleRemoveProduct, handleEditProduct, handleReset,
  } = useManageProductCard({
    id,
    productId,
    status: initialStatus,
    askForPrice,
    askForStock,
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
  });

  return (
    <div className="mb-4 w-full rounded-lg border border-border bg-card shadow-xs">
      {/* Compact View - Always Visible */}
      <div className="flex items-center justify-between p-4">
        {/* Left Section - Product Info */}
        <ManageProductInfo
          id={id}
          productName={productName}
          productImage={productImage}
          productPrice={productPrice}
          stock={stock}
          productCondition={productCondition}
          deliveryAfter={deliveryAfter}
          status={status}
          askForPrice={askForPrice}
          askForStock={askForStock}
          miniStats={miniStats}
          selectedIds={selectedIds}
          hideCheckbox={hideCheckbox}
          hideEyeIcon={hideEyeIcon}
          offerPrice={offerPrice}
          consumerType={consumerType}
          sellType={sellType}
          timeOpen={timeOpen}
          timeClose={timeClose}
          vendorDiscount={vendorDiscount}
          vendorDiscountType={vendorDiscountType}
          consumerDiscount={consumerDiscount}
          consumerDiscountType={consumerDiscountType}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          minCustomer={minCustomer}
          maxCustomer={maxCustomer}
          minQuantityPerCustomer={minQuantityCustomer}
          maxQuantityPerCustomer={maxQuantityCustomer}
          onSelectedId={onSelectedId}
          onSelect={onSelect}
          onUpdateStatus={updateStatus}
        />

        {/* Right Section - Action Buttons */}
        <ManageProductActions
          id={id}
          productId={productId}
          isExpanded={isExpanded}
          hideCopyButton={hideCopyButton}
          hideActionButtons={hideActionButtons}
          onRemove={handleRemoveProduct}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {/* Expanded View - Editable Fields */}
      {isExpanded && (
        <ManageProductExpandedFields
          disableFields={disableFields}
          hideActionButtons={hideActionButtons}
          stock={stock}
          askForStock={askForStock}
          askForPrice={askForPrice}
          productPrice={productPrice}
          productCondition={productCondition}
          deliveryAfter={deliveryAfter}
          consumerType={consumerType}
          sellType={sellType}
          timeOpen={timeOpen}
          timeClose={timeClose}
          vendorDiscount={vendorDiscount}
          vendorDiscountType={vendorDiscountType}
          consumerDiscount={consumerDiscount}
          consumerDiscountType={consumerDiscountType}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          minCustomer={minCustomer}
          maxCustomer={maxCustomer}
          minQuantityCustomer={minQuantityCustomer}
          maxQuantityCustomer={maxQuantityCustomer}
          setStock={setStock}
          setProductPrice={setProductPrice}
          setCondition={setCondition}
          setConsumer={setConsumer}
          setSell={setSell}
          setDelivery={setDelivery}
          setTimeOpen={setTimeOpen}
          setTimeClose={setTimeClose}
          setVendor={setVendor}
          setVendorDiscountType={setVendorDiscountType}
          setConsumerDiscount={setConsumerDiscount}
          setConsumerDiscountType={setConsumerDiscountType}
          setMinQuantity={setMinQuantity}
          setMaxQuantity={setMaxQuantity}
          setMinCustomer={setMinCustomer}
          setMaxCustomer={setMaxCustomer}
          setMaxQuantityCustomer={setMaxQuantityCustomer}
          decreaseStock={decreaseStock}
          increaseStock={increaseStock}
          decreasePrice={decreasePrice}
          increasePrice={increasePrice}
          decreaseDeliveryDay={decreaseDeliveryDay}
          increaseDeliveryDay={increaseDeliveryDay}
          decreaseTimeOpen={decreaseTimeOpen}
          increaseTimeOpen={increaseTimeOpen}
          decreaseTimeClose={decreaseTimeClose}
          increaseTimeClose={increaseTimeClose}
          decreaseVendorDiscount={decreaseVendorDiscount}
          increaseVendorDiscount={increaseVendorDiscount}
          decreaseConsumerDiscount={decreaseConsumerDiscount}
          increaseConsumerDiscount={increaseConsumerDiscount}
          decreaseMinQuantity={decreaseMinQuantity}
          increaseMinQuantity={increaseMinQuantity}
          decreaseMaxsQuantity={decreaseMaxsQuantity}
          increaseMaxQuantity={increaseMaxQuantity}
          decreaseMinCustomer={decreaseMinCustomer}
          increaseMinCustomer={increaseMinCustomer}
          decreaseMaxCustomer={decreaseMaxCustomer}
          increaseMaxCustomer={increaseMaxCustomer}
          decreaseMaxQuantityCustomer={decreaseMaxQuantityCustomer}
          increaseMaxQuantityCustomer={increaseMaxQuantityCustomer}
          onUpdate={handleUpdate}
          onReset={handleReset}
          onEditProduct={handleEditProduct}
        />
      )}
    </div>
  );
};

export default ManageProductCard;
