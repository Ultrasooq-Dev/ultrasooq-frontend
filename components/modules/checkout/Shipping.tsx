import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { useGetServicesByOtherSeller, useGetServicesBySeller } from "@/apis/queries/services.queries";
import Pagination from "@/components/shared/Pagination";

type ShippingProps = {
    sellerId?: number;
    type: "own" | "other";
    fromCityId?: number;
    toCityId?: number;
    onClose: () => void;
    onSelect: (sellerId: number, item: any) => void;
};

const Shipping: React.FC<ShippingProps> = ({
    sellerId,
    type,
    fromCityId,
    toCityId,
    onClose,
    onSelect
}) => {
    const t = useTranslations();
    const { langDir, currency } = useAuth();

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [services, setServices] = useState<any[]>([]);

    const servicesBySeller = useGetServicesBySeller({
        page: page,
        limit: limit,
        sellerId: sellerId || 0,
        fromCityId: fromCityId,
        toCityId: toCityId
    }, !!sellerId && type == "own");

    const servicesByOtherSeller = useGetServicesByOtherSeller({
        page: page,
        limit: limit,
        sellerId: sellerId || 0,
        fromCityId: fromCityId,
        toCityId: toCityId
    }, !!sellerId && type == "other");

    useEffect(() => {
        if (servicesBySeller?.data?.data && type == 'own') {
            setServices(servicesBySeller?.data?.data?.map((item: any) => item) || []);
        } else if (servicesByOtherSeller?.data?.data && type == 'other') {
            setServices(servicesByOtherSeller?.data?.data?.map((item: any) => item) || []);
        } else {
            setServices([]);
        }
    }, [
        servicesBySeller?.data?.data,
        servicesByOtherSeller?.data?.data,
        sellerId,
        fromCityId,
        toCityId,
        type,
    ]);

    return (
        <>
            <div className="modal-header justify-between!" dir={langDir}>
                <DialogTitle className="text-center text-xl font-bold" translate="no">
                    {t("shipping")}
                </DialogTitle>
                <Button
                    onClick={() => {
                        setServices([]);
                        onClose();
                    }}
                    className={`${langDir == 'ltr' ? 'absolute' : ''} right-2 top-2 z-10 bg-white! text-black! shadow-none`}
                >
                    <IoCloseSharp size={20} />
                </Button>
            </div>

            <div className="team_members_table w-full">
                {!servicesBySeller?.isLoading && !servicesByOtherSeller?.isLoading && services.length ? (
                    <>
                        <table cellPadding={0} cellSpacing={0} border={0}>
                            <thead>
                                <tr>
                                    <th dir={langDir} translate="no">{t("name")}</th>
                                    <th dir={langDir} translate="no">{t("price")}</th>
                                    <th dir={langDir} translate="no">{t("action")}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {services?.map((item: any) => (
                                    <>
                                        <tr key={item.id}>
                                            <td>{item.serviceName}</td>
                                            <td>{currency.symbol}{item.serviceFeatures?.[0]?.serviceCost}</td>
                                            <td>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        onSelect(Number(sellerId), item);
                                                        onClose();
                                                    }}
                                                    translate="no"
                                                >
                                                    {t("select")}
                                                </Button>
                                            </td>
                                        </tr>
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : null}

                {!servicesBySeller?.isLoading && !servicesByOtherSeller?.isLoading && !services.length ? (
                    <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                        {t("no_data_found")}
                    </p>
                ) : null}

                {servicesBySeller.data?.totalCount > limit ? (
                    <Pagination
                        page={page}
                        setPage={setPage}
                        totalCount={servicesBySeller.data?.totalCount}
                        limit={limit}
                    />
                ) : null}

                {servicesByOtherSeller.data?.totalCount > limit ? (
                    <Pagination
                        page={page}
                        setPage={setPage}
                        totalCount={servicesByOtherSeller.data?.totalCount}
                        limit={limit}
                    />
                ) : null}
            </div>
        </>
    );
}

export default Shipping;