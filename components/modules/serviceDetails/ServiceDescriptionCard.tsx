import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import SecurePaymentIcon from "@/public/images/securePaymenticon.svg";
import SupportIcon from "@/public/images/support-24hr.svg";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";
import { DatePicker, TimePicker } from "./service-features/CommanUtils";

const ServiceDescriptionCard: React.FC<any> = ({
    selectedFeatures,
    decrementQuantity,
    incrementQuantity,
    updateQuantity,
    toggleFeature,
    updateFeatureField,
    serviceDetails,
    productReview,
    isLoading,
}) => {
    const t = useTranslations();
    const { langDir, currency } = useAuth();

    const calculateAvgRating = useMemo(() => {
        const totalRating = productReview?.reduce(
            (acc: number, item: { rating: number }) => {
                return acc + item.rating;
            },
            0,
        );

        const result = totalRating / productReview?.length;
        return !isNaN(result) ? Math.floor(result) : 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productReview?.length]);

    const calculateRatings = useMemo(
        () => (rating: number) => {
            const stars: Array<React.ReactNode> = [];
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars.push(<FaStar key={i} color="#FFC107" size={20} />);
                } else {
                    stars.push(<FaRegStar key={i} color="#FFC107" size={20} />);
                }
            }
            return stars;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [productReview?.length],
    );

    return (
        <div className="product-view-s1-right">
            {isLoading ? <Skeleton className="mb-2 h-10 w-full" /> : null}
            <div className="info-col">
                <h2>{serviceDetails?.serviceName}</h2>
            </div>
            {isLoading ? (
                <Skeleton className="mb-2 h-28 w-full" />
            ) : (
                <div className="info-col mb-2">
                    <div className="space-y-4">
                        <h5 className="text-lg font-semibold" translate="no">{t("select_services")}</h5>
                        {
                            serviceDetails?.serviceFeatures?.map((feature: any) => {
                                const selectedFeature = selectedFeatures.find(
                                    (item: any) => item.id === feature.id
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
                                            className={`import-pickup-type-selector-box flex flex-wrap items-center gap-3 p-4 border rounded-xl cursor-pointer ${isSelected
                                                ? "bg-success/5 border-success"
                                                : "bg-card border-border"
                                                }`}
                                            style={{
                                                minHeight: "0px",
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "start",
                                                flexWrap: "wrap", // allow wrapping
                                                overflow: "visible", // prevent clipping
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
                                            <div className="text-container flex-1 min-w-0">
                                                <h5 dir={langDir} className="text-sm text-foreground truncate">
                                                    {feature.name}
                                                </h5>
                                                <p className="text-xs text-muted-foreground" dir={langDir}>
                                                    {feature.serviceCostType.toLowerCase()} —
                                                    <span translate="no">
                                                        {currency.symbol}
                                                        {feature.serviceCost}
                                                    </span>
                                                </p>
                                            </div>
                                            {isSelected ? (
                                                <div className="quantity-container flex flex-wrap items-center gap-2 min-w-0">
                                                    <label className="text-sm text-muted-foreground">Qty:</label>
                                                    <button
                                                        onClick={() => decrementQuantity(feature.id)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded-md text-muted-foreground hover:bg-muted"
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
                                                        style={{ minWidth: "3rem" }}
                                                    />
                                                    <button
                                                        onClick={() => incrementQuantity(feature.id)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded-md text-muted-foreground hover:bg-muted"
                                                    >
                                                        +
                                                    </button>
                                                    {/* Date Picker */}
                                                    <div className="ml-4 min-w-[140px]">
                                                        <DatePicker
                                                            selectedFeature={selectedFeature}
                                                            updateFeatureField={updateFeatureField}
                                                            feature={feature}
                                                            langDir={langDir}
                                                            t={t}
                                                        />
                                                    </div>
                                                    {/* Time Picker */}
                                                    <div className="ml-2 min-w-[90px]">
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
                        }
                    </div>
                </div>
            )}

            {isLoading ? (
                <Skeleton className="h-44 w-full" />
            ) : (
                <div className="info-col">
                    <div className="row">
                        <div className="col-12 col-md-12">
                            <div className="form-group mb-0">
                                <p>
                                    <span className="color-text" dir={langDir} translate="no">
                                        {t("working_days")}:
                                    </span>{" "}
                                    <b>{serviceDetails?.workingDays}</b>
                                </p>
                                <p>
                                    <span className="color-text" dir={langDir} translate="no">
                                        {t("off_days")}:
                                    </span>{" "}
                                    <b>{serviceDetails?.offDays}</b>
                                </p>
                                <p>
                                    <span className="color-text" dir={langDir} translate="no">
                                        {t("service_type")}:
                                    </span>{" "}
                                    <b>{serviceDetails?.serviceType}</b>
                                </p>
                                {serviceDetails?.openTime ? (
                                    <p>
                                        <span className="color-text" dir={langDir} translate="no">
                                            {t("open_time")}:
                                        </span>{" "}
                                        <b>{moment.utc(serviceDetails?.openTime).format('hh:mm A')}</b>
                                    </p>
                                ) : null}
                                {serviceDetails?.closeTime ? (
                                    <p>
                                        <span className="color-text" dir={langDir} translate="no">
                                            {t("close_time")}:
                                        </span>{" "}
                                        <b>{moment.utc(serviceDetails?.closeTime).format('hh:mm A')}</b>
                                    </p>
                                ) : null}
                                {serviceDetails?.breakTimeFrom ? (
                                    <p>
                                        <span className="color-text" dir={langDir} translate="no">
                                            {t("break_time_from")}:
                                        </span>{" "}
                                        <b>{moment.utc(serviceDetails?.breakTimeFrom).format('hh:mm A')}</b>
                                    </p>
                                ) : null}
                                {serviceDetails?.breakTimeTo ? (
                                    <p>
                                        <span className="color-text" dir={langDir} translate="no">
                                            {t("break_time_to")}:
                                        </span>{" "}
                                        <b>{moment.utc(serviceDetails?.breakTimeTo).format('hh:mm A')}</b>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="info-col top-btm-border">
                <div className="form-group mb-0">
                    <div className="quantity-with-right-payment-info">
                        <div className="right-payment-info">
                            <ul>
                                <li>
                                    <Image
                                        src={SecurePaymentIcon}
                                        alt="secure-payment-icon"
                                        width={28}
                                        height={22}
                                    />
                                    <span dir={langDir} translate="no">{t("secure_payment")}</span>
                                </li>
                                <li>
                                    <Image
                                        src={SupportIcon}
                                        alt="support-24hr-icon"
                                        width={28}
                                        height={28}
                                    />
                                    <span dir={langDir} translate="no">{t("secure_payment")}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDescriptionCard;
