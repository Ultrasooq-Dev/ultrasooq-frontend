import React, { useMemo, useState } from "react";
import { useGetServicesByProductCategory } from "@/apis/queries/services.queries";
import ServiceCard from "./ServiceCard";
import { Dialog } from "@/components/ui/dialog";
import AddServiceToCartModal from "../serviceDetails/AddServiceToCartModal";
import Pagination from "@/components/shared/Pagination";

type RelatedServicesProps = {
    productId: number;
    productPriceId?: number;
    productCategoryId: string;
    cartList: any[];
    isChildCart: boolean;
    productCartId?: number;
};

const RelatedServices: React.FC<RelatedServicesProps> = ({
    productId,
    productPriceId,
    productCategoryId,
    cartList,
    isChildCart,
    productCartId
}) => {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(8);
    const [isServiceAddToCartModalOpen, setIsServiceAddToCartModalOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<any>(null);

    const handleServiceToCartModal = () => {
        setIsServiceAddToCartModalOpen((prev) => !prev)
    }

    const servicesByProductCategory = useGetServicesByProductCategory({
        categoryId: productCategoryId,
        page,
        limit
    }, !!productCategoryId)

    const memoizedServices = useMemo(() => {
        return servicesByProductCategory?.data?.data || [];
    }, [
        servicesByProductCategory?.data?.data,
        productCategoryId,
        page,
        limit
    ]);

    return (
        <>
            <div className="product-list-s1">
                {memoizedServices.map((item: any) => {
                    return (
                        <ServiceCard
                            key={item.id}
                            item={item}
                            handleServiceToCartModal={() => {
                                setSelectedServiceId(item.id.toString());
                                handleServiceToCartModal();
                            }}
                        />
                    );
                })}
            </div>

            {servicesByProductCategory.data?.totalCount > limit ? (<Pagination
                page={page}
                setPage={setPage}
                totalCount={servicesByProductCategory.data?.totalCount}
                limit={limit}
            />) : null}

            {selectedServiceId ? (<Dialog open={isServiceAddToCartModalOpen} onOpenChange={handleServiceToCartModal}>
                {(() => {
                    let relatedCart: any = null;
                    const cartItem = cartList.find((item: any) => item.serviceId == selectedServiceId);
                    if (cartItem) {
                        relatedCart = cartList
                            ?.filter((item: any) => item.productId && item.cartProductServices?.length)
                            .find((item: any) => {
                                return !!item.cartProductServices
                                    .find((c: any) => c.relatedCartType == 'SERVICE' && c.serviceId == selectedServiceId);
                            });
                    }
                    return (
                        <AddServiceToCartModal
                            id={selectedServiceId}
                            open={isServiceAddToCartModalOpen}
                            // features={
                            //     cartList.find((item: any) => item.serviceId == selectedServiceId)
                            //         ?.cartServiceFeatures
                            //         ?.map((feature: any) => ({
                            //             id: feature.serviceFeatureId,
                            //             quantity: feature.quantity,
                            //             date: feature?.date || "",
                            //             time: feature?.time || "",
                            //         })) || []
                            // }
                            features={
                                cartList.find((item: any) => item.serviceId == selectedServiceId)
                                    ?.cartServiceFeatures
                                    ?.map((feature: any) => {
                                        const bookingDateTime = feature.bookingDateTime;
                                        let date: any = "";
                                        let time = "";

                                        if (bookingDateTime) {
                                            const dateObj = new Date(bookingDateTime);
                                            date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                                            time = dateObj.toISOString().split("T")[1]?.substring(0, 5); // 'HH:MM'
                                        }

                                        return {
                                            id: feature.serviceFeatureId,
                                            quantity: feature.quantity,
                                            date,
                                            time,
                                        };
                                    }) || []
                            }
                            cartId={cartList.find((item: any) => item.serviceId == selectedServiceId)?.id}
                            productId={!isChildCart ? productId : undefined}
                            productPriceId={!isChildCart ? productPriceId : undefined}
                            productCartId={!isChildCart ? productCartId : undefined}
                            relatedCart={relatedCart}
                            handleClose={() => {
                                setSelectedServiceId(undefined);
                                setIsServiceAddToCartModalOpen(false)
                            }}
                        />
                    );
                })()}
            </Dialog>) : null}
        </>
    );
};

export default RelatedServices;