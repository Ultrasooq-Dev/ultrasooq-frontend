import { useGetAllServices } from "@/apis/queries/services.queries";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import ServiceCard from "../trending/ServiceCard";
import AddServiceToCartModal from "../serviceDetails/AddServiceToCartModal";
import { Dialog } from "@/components/ui/dialog";

type SearchedServicesType = {
    searchTerm?: string;
    haveAccessToken: boolean;
    cartList: any[];
    setRecordsCount: (count: number) => void;
    hideHeader?: boolean;
};

const SearchedServices: React.FC<SearchedServicesType> = ({
    searchTerm,
    haveAccessToken,
    cartList,
    setRecordsCount,
    hideHeader = false
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const [isServiceAddToCartModalOpen, setIsServiceAddToCartModalOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<any>(null);

    const handleServiceToCartModal = () => {
        setIsServiceAddToCartModalOpen((prev) => !prev)
    }

    const allServicesQuery = useGetAllServices({
        page: 1,
        limit: 20,
        term: searchTerm,
        sort: "desc",
        ownService: false
    }, !!searchTerm && haveAccessToken);

    const memoizedServices = useMemo(() => {
        return allServicesQuery?.data?.data?.services || [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        allServicesQuery?.data?.data,
        allServicesQuery?.data?.data?.length,
    ]);

    useEffect(() => {
        setRecordsCount(memoizedServices.length);
    }, [allServicesQuery?.isFetched, memoizedServices.length]);

    if (allServicesQuery?.isFetched && memoizedServices.length == 0) {
        return null;
    }

    if (hideHeader) {
        return (
            <>
                {allServicesQuery.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index: number) => (
                            <SkeletonProductCardLoader key={index} />
                        ))}
                    </div>
                ) : null}

                {!memoizedServices.length && !allServicesQuery.isLoading ? null : null}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                {(() => {
                    if (!selectedServiceId) return null;

                    return (
                        <Dialog open={isServiceAddToCartModalOpen} onOpenChange={handleServiceToCartModal}>
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
                                        relatedCart={relatedCart}
                                        handleClose={() => {
                                            setSelectedServiceId(undefined);
                                            setIsServiceAddToCartModalOpen(false)
                                        }}
                                    />
                                );
                            })()}
                        </Dialog>
                    )
                })()}
            </>
        );
    }

    return (
        <section className="w-full pb-8 pt-0">
            <div className="container m-auto">
                <div className="flex flex-wrap">
                    <div className="flex w-full flex-wrap items-center justify-between border-b border-solid border-border bg-neutral-100 px-3.5 py-3.5">
                        <div className="flex flex-wrap items-center justify-start">
                            <h4 className="mr-3 whitespace-nowrap text-xl font-normal capitalize text-color-dark md:mr-6 md:text-2xl" translate="no">
                                {t("services")}
                            </h4>
                        </div>
                        <div className="flex flex-wrap items-center justify-end">
                            <Link
                                href={`/services?term=${searchTerm}`}
                                className="mr-3.5 text-sm font-normal text-foreground underline sm:mr-0"
                                translate="no"
                            >
                                {t("view_all")}
                            </Link>
                        </div>
                    </div>
                </div>

                {allServicesQuery.isLoading ? (
                    <div className="grid grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, index: number) => (
                            <SkeletonProductCardLoader key={index} />
                        ))}
                    </div>
                ) : null}

                {!memoizedServices.length && !allServicesQuery.isLoading ? (
                    <p
                        className="text-center text-sm font-medium mt-2"
                        dir={langDir}
                        translate="no"
                    >
                        {t("no_data_found")}
                    </p>
                ) : null}

                <div className="product-list-s1 w-full">
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
            </div>
            {(() => {
                if (!selectedServiceId) return null;

                return (
                    <Dialog open={isServiceAddToCartModalOpen} onOpenChange={handleServiceToCartModal}>
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
                                    relatedCart={relatedCart}
                                    handleClose={() => {
                                        setSelectedServiceId(undefined);
                                        setIsServiceAddToCartModalOpen(false)
                                    }}
                                />
                            );
                        })()}
                    </Dialog>
                )
            })()}
        </section>
    );
};

export default SearchedServices;