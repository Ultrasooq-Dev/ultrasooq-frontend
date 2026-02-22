"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

const CheckoutCompletePage = () => {
    const t = useTranslations();
    const { langDir, currency } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const accessToken = getCookie(PUREMOON_TOKEN_KEY);
    const [haveAccessToken, setHaveAccessToken] = useState<boolean>(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (accessToken) {
            setHaveAccessToken(true);
        }
    }, [accessToken]);

    const success = searchParams?.get('success');
    const transactionId = searchParams?.get('id');
    const orderId = searchParams?.get('order');

    const copyToClipboard = async (text: string, type: string) => {
        try {
            if (
                typeof navigator !== "undefined" &&
                (navigator as any).clipboard &&
                (window as any).isSecureContext
            ) {
                await (navigator as any).clipboard.writeText(text);
            } else {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopiedId(type);
            toast({
                title: t("copied_to_clipboard") || "Copied!",
                variant: "success",
            });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (_) {
            toast({
                title: t("failed_to_copy") || "Failed to copy",
                variant: "danger",
            });
        }
    };

    if (!success || success !== 'true') {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center px-4">
                <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-destructive/10 p-4">
                            <XCircle className="h-16 w-16 text-destructive" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4" dir={langDir} translate="no">
                        {t("order_failed") || "Order Failed"}
                    </h1>
                    <p className="text-muted-foreground mb-6" dir={langDir} translate="no">
                        {t("order_failed_message") || "We're sorry, but your order could not be processed. Please try again or contact support."}
                    </p>
                    <div className="space-y-3">
                        {transactionId && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span dir={langDir} translate="no">{t("transaction_id")}:</span>
                                <span className="font-mono font-medium">{transactionId}</span>
                            </div>
                        )}
                        {orderId && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span dir={langDir} translate="no">{t("order_id")}:</span>
                                <span className="font-mono font-medium">{orderId}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex gap-4 justify-center">
                        <Button
                            onClick={() => router.push("/trending")}
                            className="bg-warning hover:bg-warning text-foreground"
                        >
                            {t("continue_shopping") || "Continue Shopping"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/cart")}
                        >
                            {t("view_cart") || "View Cart"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Success Header Card */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-8 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="rounded-full bg-success/10 p-3">
                                <CheckCircle2 className="h-12 w-12 text-success" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground mb-2" dir={langDir} translate="no">
                                {t("order_placed_successfully") || "Order Placed Successfully!"}
                            </h1>
                            <p className="text-lg text-muted-foreground mb-4" dir={langDir} translate="no">
                                {t("order_confirmation_message") || "Thank you for your order. We've received your order and will begin processing it right away."}
                            </p>
                            
                            {/* Order & Transaction IDs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {orderId && (
                                    <div className="bg-muted rounded-lg p-4 border border-border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1" dir={langDir} translate="no">
                                                    {t("order_id")}
                                                </p>
                                                <p className="text-lg font-semibold text-foreground font-mono">
                                                    #{orderId}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(orderId, 'order')}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Copy className={`h-4 w-4 ${copiedId === 'order' ? 'text-success' : 'text-muted-foreground'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {transactionId && (
                                    <div className="bg-muted rounded-lg p-4 border border-border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1" dir={langDir} translate="no">
                                                    {t("transaction_id")}
                                                </p>
                                                <p className="text-lg font-semibold text-foreground font-mono text-sm">
                                                    {transactionId}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(transactionId, 'transaction')}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Copy className={`h-4 w-4 ${copiedId === 'transaction' ? 'text-success' : 'text-muted-foreground'}`} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <p className="text-sm text-primary" dir={langDir} translate="no">
                                    <strong>{t("important") || "Important:"}</strong> {t("transaction_note") || "Please keep the order ID & transaction ID for future reference."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {haveAccessToken ? (
                            <Button
                                asChild
                                className="flex-1 bg-warning hover:bg-warning text-foreground font-medium"
                            >
                                <Link href="/my-orders">
                                    {t("track_your_order") || "Track Your Order"}
                                </Link>
                            </Button>
                        ) : null}
                        <Button
                            variant="outline"
                            onClick={() => router.push("/trending")}
                            className="flex-1 border-border"
                        >
                            {t("continue_shopping") || "Continue Shopping"}
                        </Button>
                        {haveAccessToken && orderId && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/my-orders/${orderId}`)}
                                className="flex-1 border-border"
                            >
                                {t("view_order_details") || "View Order Details"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Help Section */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2" dir={langDir} translate="no">
                        {t("need_help") || "Need help?"}
                    </p>
                    <Link
                        href="/help-center"
                        className="text-sm text-primary hover:text-primary font-medium"
                    >
                        {t("contact_support") || "Contact Support"}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutCompletePage;
