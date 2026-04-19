"use client";
/**
 * RfqCartTab — RFQ Cart content rendered as a tab inside /cart
 * Reuses the same logic and components as the standalone /rfq-cart page:
 * - RFQ cart items list (from useRfqCartListByUserId)
 * - Address form (country/state/city)
 * - Deadline date picker
 * - Submit RFQ button (calls useAddRfqQuotes)
 *
 * This component is imported dynamically in /cart/page.tsx
 */
import React, { useMemo, useState, useEffect } from "react";
import {
  useAddRfqQuotes,
  useDeleteRfqCartItem,
  useRfqCartListByUserId,
  useUpdateRfqCartWithLogin,
} from "@/apis/queries/rfq.queries";
import {
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { useAllUserAddress } from "@/apis/queries/address.queries";
import { useMe } from "@/apis/queries/user.queries";
import RfqProductCard from "@/components/modules/rfqCart/RfqProductCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ReactSelect from "react-select";
import { IAllCountries, IState, ICity } from "@/utils/types/common.types";
import { AddressItem } from "@/utils/types/address.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";

const formSchema = (t: any) =>
  z.object({
    address: z.string().trim().min(1, { message: t("address_required") || "Address is required" }),
    countryId: z.string().trim().min(1, { message: t("country_required") }),
    stateId: z.string().optional(),
    cityId: z.string().optional(),
    rfqDate: z.date().optional().nullable(),
  });

export default function RfqCartTab() {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: { address: "", countryId: "", stateId: "", cityId: "", rfqDate: undefined as Date | null | undefined },
  });

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const me = useMe();
  const allUserAddressesQuery = useAllUserAddress({ page: 1, limit: 100 });
  const allCountriesQuery = useAllCountries();
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();

  const rfqCartListByUser = useRfqCartListByUserId({ page: 1, limit: 20 });
  const updateRfqCartWithLogin = useUpdateRfqCartWithLogin();
  const deleteRfqCartItem = useDeleteRfqCartItem();
  const addQuotes = useAddRfqQuotes();

  const memoizedRfqCartList = useMemo(() => rfqCartListByUser.data?.data || [], [rfqCartListByUser.data]);
  const memoizedCountryList = useMemo(() => allCountriesQuery.data?.data?.map((i: IAllCountries) => ({ label: i.name, value: i.id })) || [], [allCountriesQuery.data]);
  const memoizedStateList = useMemo(() => states?.map((i: IState) => ({ label: i.name, value: i.id })) || [], [states]);
  const memoizedCityList = useMemo(() => cities?.map((i: ICity) => ({ label: i.name, value: i.id })) || [], [cities]);

  useEffect(() => {
    if (selectedCountry) fetchStates(selectedCountry.value);
    else { setStates([]); setSelectedState(null); setCities([]); setSelectedCity(null); }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) fetchCities(selectedState.value);
    else { setCities([]); setSelectedCity(null); }
  }, [selectedState]);

  const fetchStates = async (countryId: number) => {
    try { const res = await fetchStatesByCountry.mutateAsync({ countryId }); setStates((res?.data as any[]) || []); }
    catch { setStates([]); }
  };
  const fetchCities = async (stateId: number) => {
    try { const res = await fetchCitiesByState.mutateAsync({ stateId }); setCities((res?.data as any[]) || []); }
    catch { setCities([]); }
  };

  const handleUpdateQuantity = async (rfqCartId: number, quantity: number) => {
    try {
      await updateRfqCartWithLogin.mutateAsync({ productId: rfqCartId, quantity });
      queryClient.invalidateQueries({ queryKey: ["rfq-cart-by-user"] });
    } catch {}
  };

  const handleDeleteItem = async (rfqCartId: number) => {
    try {
      await deleteRfqCartItem.mutateAsync({ rfqCartId });
      queryClient.invalidateQueries({ queryKey: ["rfq-cart-by-user"] });
      toast({ title: t("item_removed"), variant: "success" });
    } catch {}
  };

  const onSubmit = async (formData: any) => {
    const updatedFormData = {
      firstName: me.data?.data?.firstName || "",
      lastName: me.data?.data?.lastName || "",
      phoneNumber: me.data?.data?.phoneNumber || "",
      cc: me.data?.data?.cc || "",
      address: formData.address || "",
      city: "", province: "", postCode: "", country: "",
      countryId: formData.countryId,
      stateId: formData.stateId || undefined,
      cityId: formData.cityId || undefined,
      rfqCartIds: memoizedRfqCartList.map((item: any) => item.id),
      rfqDate: formData.rfqDate ? formData.rfqDate.toISOString() : undefined,
    };

    const response = await addQuotes.mutateAsync(updatedFormData);
    if (response.status) {
      toast({ title: t("rfq_submitted_successfully"), description: t("vendors_will_respond_via_messages"), variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["rfq-cart-by-user"] });
      form.reset();
      router.push("/messages?channel=c_rfq");
    } else {
      toast({ title: t("something_went_wrong"), description: response.message, variant: "danger" });
    }
  };

  const savedAddresses = allUserAddressesQuery.data?.data?.addressList || [];

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 py-2">
        {/* Left: RFQ Items */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <h2 className="text-base font-bold" dir={langDir}>{t("rfq_cart_items") || "RFQ Cart Items"}</h2>
              <span className="text-xs text-muted-foreground">{memoizedRfqCartList.length} {t("items") || "items"}</span>
            </div>
            <div className="p-4">
              {!memoizedRfqCartList.length ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("no_cart_items") || "No RFQ items yet"}</p>
                  <Button variant="outline" className="mt-3" onClick={() => router.push("/product-hub")}>
                    {t("browse_products") || "Browse Products"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoizedRfqCartList.map((item: any) => (
                    <RfqProductCard
                      key={item.id}
                      id={item.id}
                      rfqProductId={item.productId}
                      productName={item.rfqCart_productDetails?.productName}
                      productQuantity={item.quantity}
                      productImages={item.rfqCart_productDetails?.productImages}
                      offerPriceFrom={item.offerPriceFrom}
                      offerPriceTo={item.offerPriceTo}
                      onAdd={(qty: number, productId: number, action: string) => handleUpdateQuantity(item.id, qty)}
                      onRemove={() => handleDeleteItem(item.id)}
                      note={item.note}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Delivery + Submit */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5 sticky top-6 space-y-4">
            <h3 className="text-base font-bold" dir={langDir}>{t("delivery_information") || "Delivery Information"}</h3>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("saved_addresses") || "Saved Addresses"}</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {savedAddresses.map((addr: AddressItem) => (
                    <button key={addr.id} type="button"
                      onClick={() => {
                        form.setValue("address", addr.address || "");
                        if (addr.countryId) { form.setValue("countryId", String(addr.countryId)); }
                      }}
                      className="w-full text-start text-xs p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors truncate">
                      {addr.address}{addr.town ? `, ${addr.town}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Address */}
            <ControlledTextInput label={t("address") || "Address"} name="address" placeholder={t("enter_address") || "Enter address"} dir={langDir} />

            {/* Country */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">{t("country") || "Country"} <span className="text-destructive">*</span></label>
              <ReactSelect
                options={memoizedCountryList}
                value={selectedCountry}
                onChange={(opt: any) => { setSelectedCountry(opt); form.setValue("countryId", opt ? String(opt.value) : ""); setSelectedState(null); setSelectedCity(null); }}
                placeholder={t("select_country") || "Select Country"}
                isClearable
                className="text-sm"
                styles={{ control: (base: any) => ({ ...base, minHeight: 42 }), menu: (base: any) => ({ ...base, zIndex: 20 }) }}
              />
            </div>

            {/* State */}
            {memoizedStateList.length > 0 && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">{t("state") || "State / Province"}</label>
                <ReactSelect
                  options={memoizedStateList}
                  value={selectedState}
                  onChange={(opt: any) => { setSelectedState(opt); form.setValue("stateId", opt ? String(opt.value) : ""); setSelectedCity(null); }}
                  placeholder={t("select_state") || "Select State"}
                  isClearable
                  className="text-sm"
                  styles={{ control: (base: any) => ({ ...base, minHeight: 42 }), menu: (base: any) => ({ ...base, zIndex: 20 }) }}
                />
              </div>
            )}

            {/* City */}
            {memoizedCityList.length > 0 && (
              <div>
                <label className="text-xs font-medium mb-1.5 block">{t("city") || "City"}</label>
                <ReactSelect
                  options={memoizedCityList}
                  value={selectedCity}
                  onChange={(opt: any) => { setSelectedCity(opt); form.setValue("cityId", opt ? String(opt.value) : ""); }}
                  placeholder={t("select_city") || "Select City"}
                  isClearable
                  className="text-sm"
                  styles={{ control: (base: any) => ({ ...base, minHeight: 42 }), menu: (base: any) => ({ ...base, zIndex: 20 }) }}
                />
              </div>
            )}

            {/* Deadline */}
            <ControlledDatePicker label={t("deadline") || "Deadline (optional)"} name="rfqDate" isFuture />

            {/* Submit */}
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={addQuotes.isPending || memoizedRfqCartList.length === 0}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold"
            >
              {addQuotes.isPending ? t("submitting") || "Submitting..." : t("submit_rfq") || "Submit RFQ"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              {t("rfq_submit_note") || "Your request will be sent to matching vendors in the selected location."}
            </p>
          </div>
        </div>
      </div>
    </Form>
  );
}
