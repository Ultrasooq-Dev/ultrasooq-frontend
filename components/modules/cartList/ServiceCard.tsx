import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import MinusIcon from "@/public/images/upDownBtn-minus.svg";
import PlusIcon from "@/public/images/upDownBtn-plus.svg";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import {
    useAddServiceToCartWithProduct,
    useDeleteCartItem,
    useUpdateCartByDevice,
    useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IoCloseSharp } from "react-icons/io5";
import { useClickOutside } from "use-events";
import { useAddServiceToCart } from "@/apis/queries/services.queries";

type ServiceCardProps = {
    cartId: number;
    serviceId: number;
    serviceFeatureId: number;
    serviceFeatureName: string;
    serviceCost: number;
    cartQuantity: number;
    serviceFeatures: { id: number; serviceFeatureId: number; quantity: number; }[]
    relatedCart?: any;
    onRemove: () => void;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
    cartId,
    serviceId,
    serviceFeatureId,
    serviceFeatureName,
    serviceCost,
    cartQuantity,
    serviceFeatures,
    relatedCart,
    onRemove
}) => {
    const t = useTranslations();
    const { langDir, currency } = useAuth();

    const [quantity, setQuantity] = useState<number>(cartQuantity);

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
    const handleConfirmDialog = () => setIsConfirmDialogOpen(!isConfirmDialogOpen);
    const confirmDialogRef = useRef(null);
    const [isClickedOutsideConfirmDialog] = useClickOutside([confirmDialogRef], (event) => { onCancelRemove() });

    const addServiceToCart = useAddServiceToCart();
    const addServiceToCartWithProduct = useAddServiceToCartWithProduct();

    const onConfirmRemove = () => {
        if (cartId) onRemove();
        setIsConfirmDialogOpen(false);
    };

    const onCancelRemove = () => {
        setQuantity(cartQuantity);
        setIsConfirmDialogOpen(false);
    };

    const handleAddToCart = async (newQuantity: number) => {
        if (relatedCart) {
            const payload: any = {
                serviceId: serviceId,
                features: serviceFeatures.map((f) => {
                    return {
                        serviceFeatureId: f.serviceFeatureId,
                        quantity: f.serviceFeatureId == serviceFeatureId ? newQuantity : f.quantity
                    }
                }),
                productId: relatedCart?.productId,
                productPriceId: relatedCart?.productPriceId,
                cartId: relatedCart?.id,
                cartType: "PRODUCT",
                relatedCartType: "SERVICE"
            }
            const response = await addServiceToCartWithProduct.mutateAsync(payload);
            if (response.success) {
                toast({
                    title: t("service_added_to_cart"),
                    description: response.message,
                    variant: "success",
                });
            } else {
                toast({
                    title: t("failed_to_add"),
                    description: response.message,
                    variant: "danger",
                });
            };
        } else {
            const payload: any = {
                serviceId: serviceId,
                features: serviceFeatures.map((f) => {
                    return {
                        serviceFeatureId: f.serviceFeatureId,
                        quantity: f.serviceFeatureId == serviceFeatureId ? newQuantity : f.quantity
                    }
                })
            }
            const response = await addServiceToCart.mutateAsync(payload);
            if (response.success) {
                toast({
                    title: t("service_added_to_cart"),
                    description: response.message,
                    variant: "success",
                });
            } else {
                toast({
                    title: t("failed_to_add"),
                    description: response.message,
                    variant: "danger",
                });
            };
        }
    };

    useEffect(() => {
        setQuantity(cartQuantity);
    }, [cartQuantity]);

    return (
        <div className="cart-item-list-col">
            <figure>
                <div className="image-container">
                    <Image
                        src={PlaceholderImage}
                        alt="product-image"
                        height={108}
                        width={108}
                    />
                </div>
                <figcaption>
                    <h4 className="text-lg! font-bold!">{serviceFeatureName}</h4>
                    <div className="custom-form-group">
                        <label dir={langDir} translate="no">{t("quantity")}</label>
                        <div className="qty-up-down-s1-with-rgMenuAction">
                            <div className="flex items-center gap-x-1">
                                <Button
                                    variant="outline"
                                    className="relative border border-solid border-gray-300 hover:shadow-xs"
                                    onClick={() => {
                                        if (quantity - 1 > 0) {
                                            setQuantity(quantity - 1);
                                            handleAddToCart(quantity - 1);
                                        }
                                    }}
                                    disabled={quantity == 0 || 
                                        addServiceToCart?.isPending || 
                                        addServiceToCartWithProduct?.isPending
                                    }
                                >
                                    <Image
                                        src={MinusIcon}
                                        alt="minus-icon"
                                        fill
                                        className="p-3"
                                    />
                                </Button>
                                <input
                                    type="text"
                                    value={quantity}
                                    className="h-auto w-[35px] border-none bg-transparent text-center focus:border-none focus:outline-hidden"
                                    onChange={(e) => {
                                        let value = Number(e.target.value);
                                        value = isNaN(value) ? cartQuantity : value;
                                        if (value > 0) setQuantity(value);
                                    }}
                                    onBlur={() => {
                                        if (cartQuantity != quantity) handleAddToCart(quantity);
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    className="relative border border-solid border-gray-300 hover:shadow-xs"
                                    onClick={() => {
                                        setQuantity(quantity + 1);
                                        handleAddToCart(quantity + 1);
                                    }}
                                    disabled={addServiceToCart?.isPending || addServiceToCartWithProduct?.isPending}
                                >
                                    <Image src={PlusIcon} alt="plus-icon" fill className="p-3" />
                                </Button>
                            </div>
                            <ul className="rgMenuAction-lists">
                                <li>
                                    <Button
                                        variant="ghost"
                                        className="px-2 underline"
                                        onClick={() => setIsConfirmDialogOpen(true)}
                                        dir={langDir}
                                        translate="no"
                                    >
                                        {t("remove")}
                                    </Button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </figcaption>
            </figure>
            <div className="right-info">
                <h6 dir={langDir} translate="no">{t("price")}</h6>
                <h5 dir={langDir}>
                    {currency.symbol}{serviceCost}
                </h5>
            </div>
            <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
                <DialogContent
                    className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
                    ref={confirmDialogRef}
                >
                    <div className="modal-header justify-between!" dir={langDir}>
                        <DialogTitle className="text-center text-xl text-dark-orange font-bold"></DialogTitle>
                        <Button
                            onClick={onCancelRemove}
                            className={`${langDir == 'ltr' ? 'absolute' : ''} right-2 top-2 z-10 bg-white! text-black! shadow-none`}
                        >
                            <IoCloseSharp size={20} />
                        </Button>
                    </div>

                    <div className="text-center mt-4 mb-4">
                        <p className="text-dark-orange">Do you want to remove this item from cart?</p>
                        <div>
                            <Button
                                type="button"
                                className="bg-white text-destructive mr-2"
                                onClick={onCancelRemove}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-destructive"
                                onClick={onConfirmRemove}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ServiceCard; 