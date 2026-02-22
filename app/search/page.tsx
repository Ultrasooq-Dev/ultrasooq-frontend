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
import { Search, Sparkles, Tag, ArrowRight, Loader2 } from "lucide-react";
import { useAiSearch } from "@/apis/queries/product.queries";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SearchPageProps {
    searchParams?: Promise<{ term?: string }>;
}

const SORT_OPTIONS = [
    { value: "relevance", label: "Best Match" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "popularity", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
];

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
    const [sortBy, setSortBy] = useState("relevance");
    const [didYouMean, setDidYouMean] = useState<string | null>(null);
    const [totalServerCount, setTotalServerCount] = useState(0);
    const [aiMode, setAiMode] = useState(false);
    const [autoCorrection, setAutoCorrection] = useState<{ from: string; to: string } | null>(null);

    // AI Search query
    const aiSearchQuery = useAiSearch(
        { q: searchParams?.term || '', page: 1, limit: 20 },
        aiMode && !!searchParams?.term && searchParams.term.length >= 3,
    );

    const parsedQuery = aiSearchQuery.data?.parsedQuery;
    const aiProducts = aiSearchQuery.data?.data || [];
    const aiTotalCount = aiSearchQuery.data?.totalCount || 0;

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

    // Reset didYouMean and autoCorrection when search term changes
    useEffect(() => {
        setDidYouMean(null);
        setAutoCorrection(null);
    }, [searchParams?.term]);

    const hasResults = aiMode
        ? aiProducts.length > 0
        : (storeProductsCount || 0) + (buygroupProductsCount || 0) + (factoryProductsCount || 0) + (servicesCount || 0) > 0;

    const handleDidYouMeanClick = (suggestion: string) => {
        router.replace(`/search?term=${encodeURIComponent(suggestion)}`);
    };

    return (
        <div className="min-h-screen bg-muted">
            <div className="w-full px-6 lg:px-12 py-6">
                {/* Search Header with Sort + AI Toggle */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${aiMode ? 'bg-violet-600' : 'bg-foreground'}`}>
                            {aiMode ? (
                                <Sparkles className="h-5 w-5 text-white" />
                            ) : (
                                <Search className="h-5 w-5 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-foreground" dir={langDir}>
                                {aiMode ? 'AI Search Results' : 'Search Results'}
                            </h1>
                            <p className="text-muted-foreground text-xs mt-1" dir={langDir}>
                                {searchParams?.term
                                    ? aiMode
                                        ? `${aiTotalCount > 0 ? aiTotalCount : ''} results for "${searchParams.term}"`
                                        : `${totalServerCount > 0 ? totalServerCount : ''} results for "${searchParams.term}"`
                                    : 'Searching...'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* AI Search Toggle */}
                            <button
                                onClick={() => setAiMode(!aiMode)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    aiMode
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                        : 'bg-card border border-border text-muted-foreground hover:border-violet-400 hover:text-info'
                                }`}
                            >
                                <Sparkles className="h-4 w-4" />
                                {aiMode ? 'AI On' : 'AI Search'}
                            </button>

                            {!aiMode && (
                                <Select
                                    onValueChange={(value) => setSortBy(value)}
                                    value={sortBy}
                                >
                                    <SelectTrigger className="h-9 w-[170px] border-border bg-card text-sm">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {SORT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {/* AI Parsed Query Interpretation */}
                    {aiMode && parsedQuery && (
                        <div className="mt-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-info" />
                                <span className="text-sm font-medium text-violet-800">AI understood your search as:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {parsedQuery.searchTerm && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-800 text-xs font-medium rounded-full">
                                        <Search className="h-3 w-3" />
                                        {parsedQuery.searchTerm}
                                    </span>
                                )}
                                {parsedQuery.categoryHint && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                        <Tag className="h-3 w-3" />
                                        {parsedQuery.categoryHint}
                                    </span>
                                )}
                                {parsedQuery.priceRange?.min != null && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                                        Min: ${parsedQuery.priceRange.min}
                                    </span>
                                )}
                                {parsedQuery.priceRange?.max != null && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                                        Max: ${parsedQuery.priceRange.max}
                                    </span>
                                )}
                                {parsedQuery.sortBy && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning/10 text-amber-800 text-xs font-medium rounded-full">
                                        Sort: {parsedQuery.sortBy.replace('_', ' ')}
                                    </span>
                                )}
                                {parsedQuery.expandedTerms?.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                                        <ArrowRight className="h-3 w-3" />
                                        +{parsedQuery.expandedTerms.join(', ')}
                                    </span>
                                )}
                                {parsedQuery.specFilters && Object.keys(parsedQuery.specFilters).length > 0 && (
                                    Object.entries(parsedQuery.specFilters).map(([key, val]) => (
                                        <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                                            {key}: {String(val)}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Loading State */}
                    {aiMode && aiSearchQuery.isLoading && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-info">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI is analyzing your search...
                        </div>
                    )}

                    {/* Auto-correction banner (standard mode - when search was automatically corrected) */}
                    {!aiMode && autoCorrection && (
                        <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-sm text-primary">
                                Showing results for{" "}
                                <span className="font-semibold text-primary">
                                    &ldquo;{autoCorrection.to}&rdquo;
                                </span>
                                .{" "}
                                <button
                                    onClick={() => handleDidYouMeanClick(autoCorrection.from)}
                                    className="text-primary underline hover:text-primary"
                                >
                                    Search instead for &ldquo;{autoCorrection.from}&rdquo;
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Did You Mean suggestion (standard mode only) */}
                    {!aiMode && didYouMean && !hasResults && !autoCorrection && (
                        <div className="mt-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                            <p className="text-sm text-amber-800">
                                Did you mean{" "}
                                <button
                                    onClick={() => handleDidYouMeanClick(didYouMean)}
                                    className="font-semibold text-amber-900 underline hover:text-amber-700"
                                >
                                    &ldquo;{didYouMean}&rdquo;
                                </button>
                                ?
                            </p>
                        </div>
                    )}
                </div>

                {/* AI Mode Results */}
                {aiMode ? (
                    <>
                        {aiProducts.length > 0 ? (
                            <SearchedStoreProducts
                                searchTerm={parsedQuery?.searchTerm || searchParams?.term}
                                haveAccessToken={haveAccessToken}
                                cartList={cartList}
                                setRecordsCount={() => {}}
                                hideHeader={true}
                                sort={parsedQuery?.sortBy || 'relevance'}
                                overrideProducts={aiProducts}
                            />
                        ) : !aiSearchQuery.isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="h-8 w-8 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2" dir={langDir}>
                                    No AI Results Found
                                </h3>
                                <p className="text-muted-foreground text-sm text-center max-w-md mb-4" dir={langDir}>
                                    The AI couldn&apos;t find matching products. Try rephrasing your query or switch to standard search.
                                </p>
                                <button
                                    onClick={() => setAiMode(false)}
                                    className="text-sm text-info hover:text-violet-800 underline"
                                >
                                    Switch to standard search
                                </button>
                            </div>
                        ) : null}
                    </>
                ) : (
                    /* Standard Mode Results */
                    <>
                        {/* Store Products */}
                        <SearchedStoreProducts
                            searchTerm={searchParams?.term}
                            haveAccessToken={haveAccessToken}
                            cartList={cartList}
                            setRecordsCount={(count) => setStoreProductsCount(count)}
                            hideHeader={true}
                            sort={sortBy}
                            onDidYouMean={setDidYouMean}
                            onTotalCount={setTotalServerCount}
                            onAutoCorrection={setAutoCorrection}
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
                )}

                {/* No Results Message (standard mode only) */}
                {!aiMode && !hasResults && !didYouMean && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2" dir={langDir}>
                            No Results Found
                        </h3>
                        <p className="text-muted-foreground text-sm text-center max-w-md mb-3" dir={langDir}>
                            We couldn&apos;t find any results for &ldquo;{searchParams?.term}&rdquo;. Try searching with different keywords.
                        </p>
                        <button
                            onClick={() => setAiMode(true)}
                            className="inline-flex items-center gap-2 text-sm text-info hover:text-violet-800 font-medium"
                        >
                            <Sparkles className="h-4 w-4" />
                            Try AI-powered search
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
};

export default SearchPage;
