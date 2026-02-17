"use client";
import React, { useEffect, useState, use } from "react";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import SearchedStoreProducts from "@/components/modules/serach/SearchedStoreProducts";
import SearchedBuygroupProducts from "@/components/modules/serach/SearchedBuygroupProducts";
import SearchedFactoryProducts from "@/components/modules/serach/SearchedFactoryProducts";
import { useCartListByDevice, useCartListByUserId } from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import SearchedServices from "@/components/modules/serach/SearchedServices";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Search } from "lucide-react";

interface SearchPageProps {
    searchParams?: Promise<{ term?: string }>;
}

const SearchPage = (props: SearchPageProps) => {
    const searchParams = props.searchParams ? use(props.searchParams) : { term: undefined };
    const t = useTranslations();
    const { langDir } = useAuth();
    const router = useRouter();
    const [haveAccessToken, setHaveAccessToken] = useState(false);
    const accessToken = getCookie(PUREMOON_TOKEN_KEY);
    const [cartList, setCartList] = useState<any[]>([]);
    const deviceId = getOrCreateDeviceId() || '';
    const [storeProductsCount, setStoreProductsCount] = useState<number>();
    const [buygroupProductsCount, setBuygroupProductsCount] = useState<number>();
    const [factoryProductsCount, setFactoryProductsCount] = useState<number>();
    const [servicesCount, setServicesCount] = useState<number>();

    const cartListByDeviceQuery = useCartListByDevice(
        {
            page: 1,
            limit: 100,
            deviceId,
        },
        !haveAccessToken,
    );

    const cartListByUser = useCartListByUserId(
        {
            page: 1,
            limit: 100,
        },
        haveAccessToken,
    );

    useEffect(() => {
        if (cartListByUser.data?.data) {
            setCartList((cartListByUser.data?.data || []).map((item: any) => item));
        } else if (cartListByDeviceQuery.data?.data) {
            setCartList(
                (cartListByDeviceQuery.data?.data || []).map((item: any) => item),
            );
        }
    }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

    useEffect(() => {
        if (accessToken) {
            setHaveAccessToken(true);
        } else {
            setHaveAccessToken(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (!searchParams?.term) router.push("/trending");
    }, []);

    const hasResults = (storeProductsCount || 0) + (buygroupProductsCount || 0) + (factoryProductsCount || 0) + (servicesCount || 0) > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 lg:px-12 py-6">
                {/* Search Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                            <Search className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-gray-900" dir={langDir}>
                                Search Results
                            </h1>
                            <p className="text-gray-500 text-xs mt-1" dir={langDir}>
                                {searchParams?.term ? `Results for "${searchParams.term}"` : 'Searching...'}
                            </p>
                        </div>
                        {searchParams?.term && hasResults && (
                            <div className="hidden md:block">
                                <span className="text-xs text-gray-600">
                                    {(storeProductsCount || 0) + (buygroupProductsCount || 0) + (factoryProductsCount || 0) + (servicesCount || 0)} results
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Combined Product Grid */}
                <>
                    {/* Store Products */}
                    <SearchedStoreProducts
                        searchTerm={searchParams?.term}
                        haveAccessToken={haveAccessToken}
                        cartList={cartList}
                        setRecordsCount={(count) => setStoreProductsCount(count)}
                        hideHeader={true}
                    />

                    {/* Buygroup Products */}
                    <SearchedBuygroupProducts
                        searchTerm={searchParams?.term}
                        haveAccessToken={haveAccessToken}
                        cartList={cartList}
                        setRecordsCount={(count) => setBuygroupProductsCount(count)}
                        hideHeader={true}
                    />

                    {/* Factory Products (only for logged in users) */}
                    {haveAccessToken && (
                        <SearchedFactoryProducts
                            searchTerm={searchParams?.term}
                            haveAccessToken={haveAccessToken}
                            cartList={cartList}
                            setRecordsCount={(count) => setFactoryProductsCount(count)}
                            hideHeader={true}
                        />
                    )}

                    {/* Services (only for logged in users) */}
                    {haveAccessToken && (
                        <SearchedServices
                            searchTerm={searchParams?.term}
                            haveAccessToken={haveAccessToken}
                            cartList={cartList}
                            setRecordsCount={(count) => setServicesCount(count)}
                            hideHeader={true}
                        />
                    )}
                </>

                {/* No Results Message */}
                {!hasResults && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" dir={langDir}>
                            No Results Found
                        </h3>
                        <p className="text-gray-500 text-sm text-center max-w-md" dir={langDir}>
                            We couldn't find any results for "{searchParams?.term}". Try searching with different keywords.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
};

export default SearchPage;