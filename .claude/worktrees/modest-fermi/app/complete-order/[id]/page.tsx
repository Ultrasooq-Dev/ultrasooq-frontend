"use client";
import React, { useEffect, useState } from "react";
import { useCreatePaymentIntent, useOrderByIdUnAuth } from "@/apis/queries/orders.queries";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import PhoneIcon from "@/public/images/phoneicon.svg";
import LocationIcon from "@/public/images/locationicon.svg";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const CompleteOrderPage = () => {
    const t = useTranslations();
    const { langDir, currency } = useAuth();
    const params = useParams();
    const [itemsTotal, setItemsTotal] = useState<number>(0);
    const [fee, setFee] = useState<number>(0);
    const [shippingCharge, setShippingCharge] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [paymentType, setPaymentType] = useState<"DIRECT" | "ADVANCE">("DIRECT");
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);
    const [isRedirectingToPaymob, setIsRedirectingToPaymob] = useState<boolean>(false);
    const orderByIdQuery = useOrderByIdUnAuth({ orderId: Number(params?.id) });
    const orderDetails = orderByIdQuery?.data?.data;
    const createPaymentIntent = useCreatePaymentIntent();

    useEffect(() => {
        if (orderDetails) {
            let subTotal = 0;
            let totalFee = 0;
            let totalShippingCharge = 0;
            orderDetails?.order_orderProducts?.forEach((item: any) => {
                if (item.orderProductType == 'PRODUCT') {
                    subTotal += Number(item?.breakdown?.customer?.purchasedPrice) || 0;
                } else {
                    item.breakdown?.serviceFeatures?.forEach((feature: any) => {
                        subTotal += Number(feature.cost) || 0;
                    });
                }
                totalFee += Number(item?.breakdown?.customer?.chargedFee) || 0;
                totalShippingCharge += Number(item?.orderShippingDetail?.shippingCharge) || 0;
            });
            setItemsTotal(subTotal);
            setFee(totalFee);
            setShippingCharge(totalShippingCharge);
            setTotal(Number(orderDetails?.totalCustomerPay) + totalShippingCharge);
        }
    }, [orderDetails]);

    const referenceOrderId = (orderId: number) => {
        const date = new Date();

        return [
            orderId,
            date.getHours() < 10 ? `0${date.getHours()}` : String(date.getHours()),
            date.getMinutes() < 10
                ? `0${date.getMinutes()}`
                : String(date.getMinutes()),
            date.getDate() < 10 ? `0${date.getDate()}` : String(date.getDate()),
            date.getMonth() < 10 ? `0${date.getMonth()}` : String(date.getMonth()),
            date.getFullYear() < 10
                ? `0${date.getFullYear()}`
                : String(date.getFullYear()),
        ].join("-");
    };

    const makePayment = async () => {
        const address = orderDetails?.order_orderAddress?.find((item: any) => item.addressType == 'BILLING');
        const data: { [key: string]: any } = {
            amount: paymentType == "ADVANCE" ? advanceAmount * 1000 : total * 1000,
            billing_data: {
                first_name: address?.firstName || 'NA',
                last_name: address?.lastName || 'NA',
                email: address?.email || 'NA',
                phone_number: address?.phone || 'NA',
                apartment: address?.address || 'NA',
                building: 'NA',
                street: 'NA',
                floor: 'NA',
                city: address?.city || 'NA',
                state: address?.province || 'NA',
                country: address?.country || 'NA',
            },
            extras: {
                orderId: orderDetails?.id,
                paymentType: paymentType,
            },
            special_reference: referenceOrderId(orderDetails?.id ?? 0)
        };

        const response = await createPaymentIntent.mutateAsync(data);

        if (response?.status) {
            setIsRedirectingToPaymob(true);
            window.location.assign(
                `${process.env.NEXT_PUBLIC_PAYMOB_PAYMENT_URL}?publicKey=${process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY}&clientSecret=${response.data.client_secret}`,
            );
        } else {
            toast({
                title: t("something_went_wrong"),
                description: response.message,
                variant: "danger",
            });
        }
    };

    return (
        <>
            {orderByIdQuery.isLoading ? (
                <section className="w-full pt-4">
                    <div className="container m-auto">
                        <div className="grid grid-cols-4 gap-5">
                            {Array.from({ length: 8 }).map((_, index: number) => (
                                <SkeletonProductCardLoader key={index} />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {!orderByIdQuery.isLoading && !orderByIdQuery?.data?.data ? (
                <section className="w-full pt-4">
                    <div className="container m-auto">
                        <p
                            className="text-center text-sm font-medium mt-2"
                            dir={langDir}
                            translate="no"
                        >
                            {t("no_data_found")}
                        </p>
                    </div>
                </section>
            ) : null}

            {!orderByIdQuery.isLoading && orderByIdQuery?.data?.data ? (
                <div className="cart-page">
                    <div className="container m-auto px-3">
                        <div className="cart-page-wrapper">
                            <div className="cart-page-left">
                                <div className="bodyPart">
                                    <div className="card-item cart-items">
                                        <div className="card-inner-headerPart" dir={langDir}>
                                            <div className="lediv">
                                                <h3 translate="no">{t("cart_items")}</h3>
                                            </div>
                                        </div>

                                        {orderDetails?.order_orderProducts?.filter((item: any) => item.productId)?.length ? (
                                            <>
                                                <div className="card-inner-headerPart mt-5" dir={langDir}>
                                                    <div className="lediv">
                                                        <h3 translate="no">{t("products")}</h3>
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}

                                        <div className="cart-item-lists">
                                            {orderDetails?.order_orderProducts
                                                ?.filter(((item: any) => item.orderProductType == 'PRODUCT'))
                                                ?.map((item: any) => {
                                                    const image = item?.orderProduct_product?.productImages?.[0];
                                                    return (
                                                        <div className="cart-item-list-col" key={item.id}>
                                                            <figure>
                                                                <div className="image-container">
                                                                    <Image
                                                                        src={image || PlaceholderImage}
                                                                        alt="product-image"
                                                                        height={108}
                                                                        width={108}
                                                                    />
                                                                </div>
                                                                <figcaption>
                                                                    <h4 className="text-lg! font-bold!">
                                                                        {item.orderProduct_product.productName}
                                                                    </h4>
                                                                    <div className="custom-form-group">
                                                                        <label dir={langDir} translate="no">
                                                                            {t("quantity")}: {item.orderQuantity}
                                                                        </label>
                                                                    </div>
                                                                </figcaption>
                                                            </figure>
                                                            <div className="right-info">
                                                                <h6 dir={langDir} translate="no">{t("price")}</h6>
                                                                <h5 dir={langDir}>
                                                                    {currency.symbol}{item.breakdown.customer.purchasedPrice}
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    );
                                                }) || null}
                                        </div>

                                        {orderDetails?.order_orderProducts?.filter((item: any) => item.serviceId)?.length ? (
                                            <div className="card-inner-headerPart mt-5" dir={langDir}>
                                                <div className="lediv">
                                                    <h3 translate="no">{t("services")}</h3>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="cart-item-lists">
                                            {orderDetails?.order_orderProducts
                                                ?.filter(((item: any) => item.orderProductType == 'SERVICE'))
                                                ?.map((item: any) => {
                                                    return (
                                                        item.breakdown?.serviceFeatures?.map((feature: any) => (
                                                            <div className="cart-item-list-col" key={`${item.id}${feature.id}`}>
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
                                                                        <h4 className="text-lg! font-bold!">
                                                                            {feature.name}
                                                                        </h4>
                                                                        <div className="custom-form-group">
                                                                            <label dir={langDir} translate="no">
                                                                                {t("quantity")}: {feature.quantity}
                                                                            </label>
                                                                        </div>
                                                                    </figcaption>
                                                                </figure>
                                                                <div className="right-info">
                                                                    <h6 dir={langDir} translate="no">{t("price")}</h6>
                                                                    <h5 dir={langDir}>
                                                                        {currency.symbol}{feature.cost}
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                        )) || null
                                                    );
                                                }) || null}
                                        </div>
                                    </div>

                                    <div className="card-item selected-address">
                                        <div className="card-inner-headerPart" dir={langDir}>
                                            <div className="lediv">
                                                <h3 translate="no">
                                                    {t("billing_address")}
                                                </h3>
                                            </div>
                                        </div>
                                        {orderDetails?.order_orderAddress?.find((item: any) => item.addressType == 'BILLING') ? (
                                            <div className="selected-address-lists">
                                                {(() => {
                                                    const {
                                                        firstName,
                                                        lastName,
                                                        phone,
                                                        address,
                                                        town,
                                                        city,
                                                        province,
                                                        postCode,
                                                        country
                                                    } = orderDetails?.order_orderAddress?.find((item: any) => item.addressType == 'BILLING') ?? {} as any
                                                    return (
                                                        <div className="selected-address-item flex gap-x-3">
                                                            <div dir={langDir}>
                                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 infocardbox">
                                                                    <div className="left-address-with-right-btn">
                                                                        <div>
                                                                            <h4 className="mt-0!">
                                                                                {firstName} {lastName}
                                                                            </h4>
                                                                            <ul>
                                                                                <li>
                                                                                    <p>
                                                                                        <span className="icon-container">
                                                                                            <Image src={PhoneIcon} alt="phone-icon" />
                                                                                        </span>
                                                                                        <span className="text-container">{phone}</span>
                                                                                    </p>
                                                                                </li>
                                                                                <li>
                                                                                    <p>
                                                                                        <span className="icon-container">
                                                                                            <Image src={LocationIcon} alt="location-icon" />
                                                                                        </span>
                                                                                        <span className="text-container">
                                                                                            {[address, town, city, province, postCode, country].filter(el => el).join(', ')}
                                                                                        </span>
                                                                                    </p>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            </div>

                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="card-item selected-address">
                                        <div className="card-inner-headerPart" dir={langDir}>
                                            <div className="lediv">
                                                <h3 translate="no">
                                                    {t("shipping_address")}
                                                </h3>
                                            </div>
                                        </div>
                                        {orderDetails?.order_orderAddress?.find((item: any) => item.addressType == 'SHIPPING') ? (
                                            <div className="selected-address-lists">
                                                {(() => {
                                                    const {
                                                        firstName,
                                                        lastName,
                                                        phone,
                                                        address,
                                                        town,
                                                        city,
                                                        state,
                                                        postCode,
                                                        country
                                                    } = orderDetails?.order_orderAddress?.find((item: any) => item.addressType == 'SHIPPING') ?? {} as any
                                                    return (
                                                        <div className="selected-address-item flex gap-x-3">
                                                            <div dir={langDir}>
                                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 infocardbox">
                                                                    <div className="left-address-with-right-btn">
                                                                        <div>
                                                                            <h4 className="mt-0!">
                                                                                {firstName} {lastName}
                                                                            </h4>
                                                                            <ul>
                                                                                <li>
                                                                                    <p>
                                                                                        <span className="icon-container">
                                                                                            <Image src={PhoneIcon} alt="phone-icon" />
                                                                                        </span>
                                                                                        <span className="text-container">{phone}</span>
                                                                                    </p>
                                                                                </li>
                                                                                <li>
                                                                                    <p>
                                                                                        <span className="icon-container">
                                                                                            <Image src={LocationIcon} alt="location-icon" />
                                                                                        </span>
                                                                                        <span className="text-container">
                                                                                            {[address, town, (city as any)?.name, (state as any)?.name, postCode, (country as any)?.name].filter(el => el).join(', ')}
                                                                                        </span>
                                                                                    </p>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            </div>

                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div className="cart-page-right">
                                <div className="card-item priceDetails">
                                    <div className="card-inner-headerPart" dir={langDir}>
                                        <div className="lediv">
                                            <h3 translate="no">{t("price_details")}</h3>
                                        </div>
                                    </div>
                                    <div className="priceDetails-body">
                                        <ul>
                                            <li dir={langDir}>
                                                <p translate="no">{t("subtotal")}</p>
                                                <h5>
                                                    {currency.symbol}
                                                    {itemsTotal}
                                                </h5>
                                            </li>
                                            <li dir={langDir}>
                                                <p translate="no">{t("shipping")}</p>
                                                {shippingCharge > 0 ? (
                                                    <h5>
                                                        {currency.symbol}
                                                        {shippingCharge}
                                                    </h5>
                                                ) : (
                                                    <h5 translate="no">{t("free")}</h5>
                                                )}
                                            </li>
                                            <li dir={langDir}>
                                                <p translate="no">{t("fee")}</p>
                                                <h5>
                                                    {currency.symbol}
                                                    {fee}
                                                </h5>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="priceDetails-footer" dir={langDir}>
                                        <h4 translate="no">{t("total_amount")}</h4>
                                        <h4 className="amount-value">
                                            {currency.symbol}{total}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center justify-start gap-2 sm:grid">
                                    <Label translate="no">{t("direct_payment")}</Label>
                                    <Switch
                                        checked={paymentType == "DIRECT"}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setPaymentType("DIRECT");
                                                setAdvanceAmount(0);
                                            }
                                        }}
                                        className="m-0 data-[state=checked]:bg-dark-orange!"
                                    />
                                </div>
                                <div className="mt-0 flex items-center justify-start gap-2 sm:grid">
                                    <Label translate="no">{t("advance_payment")}</Label>
                                    <Switch
                                        checked={paymentType == "ADVANCE"}
                                        onCheckedChange={(checked) => {
                                            if (checked) setPaymentType("ADVANCE");
                                        }}
                                        className="m-0 data-[state=checked]:bg-dark-orange!"
                                    />
                                </div>
                                {paymentType == "ADVANCE" ? (
                                    <div className="mt-0 sm:grid sm:grid-cols-1">
                                        <Input
                                            onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                                            style={{ border: '1px solid black' }}
                                        />
                                    </div>
                                ) : null}
                                <div className="order-action-btn">
                                    <Button
                                        onClick={makePayment}
                                        disabled={createPaymentIntent?.isPending || isRedirectingToPaymob}
                                        className="theme-primary-btn order-btn"
                                        translate="no"
                                    >
                                        {createPaymentIntent?.isPending || isRedirectingToPaymob ? (
                                            <LoaderWithMessage message={t("please_wait")} />
                                        ) : (
                                            t("make_payment")
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            ) : null}
        </>
    );
};

export default CompleteOrderPage;