import React, { useEffect, useMemo, useState } from "react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useAddServiceToCart, useServiceById } from "@/apis/queries/services.queries";
import { useToast } from "@/components/ui/use-toast";
import { useAddServiceToCartWithProduct } from "@/apis/queries/cart.queries";
import { DatePicker, TimePicker } from "./service-features/CommanUtils";



type AddServiceToCartModalProps = {
    id?: number;
    open: boolean;
    features: { id: number; quantity: number }[];
    cartId?: number;
    productId?: number;
    productPriceId?: number;
    productCartId?: number;
    relatedCart?: any;
    handleClose: () => void;
};

const AddServiceToCartModal: React.FC<AddServiceToCartModalProps> = ({
    id,
    open,
    features,
    cartId,
    handleClose,
    productId,
    productPriceId,
    productCartId,
    relatedCart
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const { toast } = useToast();
    const [selectedFeatures, setSelectedFeatures] = useState<any[]>(features);

    const serviceQueryById = useServiceById(
        {
            serviceid: id ? String(id) : "",
        },
        !!id
    );

    const addServiceToCart = useAddServiceToCart();
    const addServiceToCartWithProduct = useAddServiceToCartWithProduct();

    const toggleFeature = (id: number, quantity: number, checked: boolean) => {
        setSelectedFeatures((prev) => {
            if (checked) {
                // Add or update the feature if checked
                const existingFeature = prev.find((item) => item.id === id);
                if (existingFeature) {
                    return prev.map((item) =>
                        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
                    );
                }
                // return [...prev, { id, quantity: Math.max(1, quantity) }];
                return [
                    ...prev,
                    {
                        id,
                        quantity: Math.max(1, quantity),
                        date: "", // or new Date() if you want to default to today
                        time: "",
                    },
                ];
            } else {
                // Remove the feature if unchecked
                return prev.filter((item) => item.id !== id);
            }
        });
    };
    const updateFeatureField = (id: number, field: string, value: any) => {
        setSelectedFeatures((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };
    const updateQuantity = (id: number, quantity: number) => {
        setSelectedFeatures((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
            )
        );
    };

    const incrementQuantity = (id: number) => {
        setSelectedFeatures((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    const decrementQuantity = (id: number) => {
        setSelectedFeatures((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
            )
        );
    };

    const serviceDetails = useMemo(() => {
        if (serviceQueryById?.data?.data) {
            return serviceQueryById.data.data;
        }
        return null;
    }, [serviceQueryById?.data?.data]);

    useEffect(() => {
        setSelectedFeatures(features);
    }, [features]);

    useEffect(() => {
        if (!open) {
            setSelectedFeatures([]);
        }
    }, [open]);

    const handleAddToCart = async () => {
        let linkProduct = false;
        if (cartId && relatedCart) {
            linkProduct = true;
        } else if (!cartId && productId && productPriceId && productCartId) {
            linkProduct = true;
        }
        try {
            if (linkProduct) {
                const payload: any = {
                    serviceId: Number(id),
                    features: selectedFeatures.map((f) => {
                        return {
                            serviceFeatureId: f.id,
                            quantity: f.quantity,
                            bookingDateTime:
                                f.date && f.time
                                    ? new Date(
                                        `${f.date instanceof Date ? f.date.toISOString().split('T')[0] : f.date}T${f.time}:00Z`
                                      ).toISOString()
                                    : undefined,
                        }
                    }),
                    productId: relatedCart?.productId || productId,
                    productPriceId: relatedCart?.productPriceId || productPriceId,
                    cartId: relatedCart?.id || productCartId,
                    cartType: "PRODUCT",
                    relatedCartType: "SERVICE"
                };
                
                const response = await addServiceToCartWithProduct.mutateAsync(payload);
                if (response.success) {
                    toast({
                        title: t("service_added_to_cart"),
                        description: response.message,
                        variant: "success",
                    });
                    handleClose();
                } else {
                    toast({
                        title: t("failed_to_add"),
                        description: response.message,
                        variant: "danger",
                    });
                };

            } else {
                const payload: any = {
                    serviceId: Number(id),
                    features: selectedFeatures.map((f) => {
                        return {
                            serviceFeatureId: f.id,
                            quantity: f.quantity,
                            bookingDateTime:
                                f.date && f.time
                                    ? new Date(
                                        `${f.date instanceof Date ? f.date.toISOString().split('T')[0] : f.date}T${f.time}:00Z`
                                      ).toISOString()
                                    : undefined,
                        }
                    })
                };
                const response = await addServiceToCart.mutateAsync(payload);
                if (response.success) {
                    toast({
                        title: t("service_added_to_cart"),
                        description: response.message,
                        variant: "success",
                    });
                    handleClose();
                } else {
                    toast({
                        title: t("failed_to_add"),
                        description: response.message,
                        variant: "danger",
                    });
                };
            }
        } catch (error: any) {
            toast({
                title: t("failed_to_add"),
                description: error.message,
                variant: "danger",
            });
        }
    };
    return (
        <DialogContent className="custom-action-type-chose-picker">
            <div className="modal-headerpart">
                <DialogTitle
                    dir={langDir}
                    className="text-lg font-semibold text-gray-800"
                    translate="no"
                >
                    {t("select_services")}
                </DialogTitle>
            </div>
            <div className="modal-bodypart">
                <div
                    className="import-pickup-type-selector-lists"
                    dir={langDir}
                    style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                >
                    {serviceQueryById.isLoading ? (
                        <span className="text-center">Please wait...</span>
                    ) : (
                        serviceDetails?.serviceFeatures?.map((feature: any) => {
                            const selectedFeature = selectedFeatures.find(
                                (item) => item.id === feature.id
                            );
                            const isSelected = !!selectedFeature;
                            const quantity = selectedFeature ? selectedFeature.quantity : 1;

                            return (
                                <div
                                    key={feature.id}
                                    className="import-pickup-type-selector-item"
                                    style={{ maxWidth: "100%" }}
                                >
                                    <div
                                        className={`import-pickup-type-selector-box flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${isSelected
                                            ? "bg-success/5 border-success"
                                            : "bg-white border-gray-200"
                                            }`}
                                        style={{
                                            minHeight: "0px",
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "start",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) =>
                                                toggleFeature(feature.id, quantity, e.target.checked)
                                            }
                                            className="h-5 w-5 text-success focus:ring-success"
                                        />
                                        <div className="text-container flex-1">
                                            <h5 dir={langDir} className="text-sm text-gray-800">
                                                {feature.name}
                                            </h5>
                                            <p className="text-xs text-gray-500">
                                                {feature.serviceCostType.toLowerCase()} — ₹
                                                {feature.serviceCost}
                                            </p>
                                        </div>
                                        {isSelected ? (
                                            <div className="quantity-container flex items-center gap-2">
                                                <label className="text-sm text-gray-600">Qty:</label>
                                                <button
                                                    onClick={() => decrementQuantity(feature.id)}
                                                    className="w-8 h-8 flex items-center justify-center border rounded-md text-gray-600 hover:bg-gray-100"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(
                                                            feature.id,
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    }
                                                    className="w-16 p-1 border rounded-md text-center"
                                                />
                                                <button
                                                    onClick={() => incrementQuantity(feature.id)}
                                                    className="w-8 h-8 flex items-center justify-center border rounded-md text-gray-600 hover:bg-gray-100"
                                                >
                                                    +
                                                </button>
                                                {/* Date Picker */}
                                                <div className="ml-4">
                                                    <DatePicker
                                                        selectedFeature={selectedFeature}
                                                        updateFeatureField={updateFeatureField}
                                                        feature={feature}
                                                        langDir={langDir}
                                                        t={t}
                                                    />
                                                </div>
                                                {/* Time Picker */}
                                                <div className="ml-2">
                                                    <TimePicker
                                                        selectedFeature={selectedFeature}
                                                        updateFeatureField={updateFeatureField}
                                                        feature={feature}
                                                        langDir={langDir}
                                                        t={t}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {
                    !serviceQueryById.isLoading ? (
                        <div
                            className="modal-footerpart cart_button"
                            style={{ marginTop: "1rem", textAlign: "center", justifyContent: "center" }}
                        >
                            <button
                                onClick={handleAddToCart}
                                className="add_to_cart_button"
                                disabled={
                                    selectedFeatures.length === 0 ||
                                    addServiceToCart.isPending ||
                                    addServiceToCartWithProduct?.isPending
                                }
                                dir={langDir}
                                translate="no"
                            >
                                {
                                    addServiceToCart.isPending || addServiceToCartWithProduct?.isPending ?
                                        t("please_wait") + "..."
                                        :
                                        t("add_to_cart")
                                }
                            </button>
                        </div>) : null
                }

            </div>
        </DialogContent >
    );
};

export default AddServiceToCartModal;