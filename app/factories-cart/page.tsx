"use client";
import { useAllUserAddress } from "@/apis/queries/address.queries";
import {
  useAddFactoriesRequestQuotes,
  useAddRfqQuotes,
  useDeleteFactoriesCartItem,
  useDeleteRfqCartItem,
  useFactoriesCartListByUserId,
  useRfqCartListByUserId,
  useUpdateFactoriesCartWithLogin,
  useUpdateRfqCartWithLogin,
} from "@/apis/queries/rfq.queries";
import { useMe } from "@/apis/queries/user.queries";
import RfqProductCard from "@/components/modules/rfqCart/RfqProductCard";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AddressItem } from "@/utils/types/address.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineChevronLeft } from "react-icons/md";
import { z } from "zod";
import BannerImage from "@/public/images/rfq-sec-bg.png";
import Footer from "@/components/shared/Footer";
import FactoriesCustomizedProductCard from "@/components/modules/factoriesCart/FactoriesCustomizedProductCard";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
// @ts-ignore
import  { startDebugger }  from "remove-child-node-error-debugger";

const formSchema = (t: any) => {
  return z.object({
    address: z.string().trim().min(1, { message: t("address_required") }),
    factoriesDate: z
      .date({ required_error: t("delivery_date_required") })
      .transform((val) => val.toISOString()),
  });
};

const FactoriesCartPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      address: "",
      factoriesDate: undefined as unknown as string,
    },
  });

  const me = useMe();
  const allUserAddressQuery = useAllUserAddress({
    page: 1,
    limit: 10,
  });
  const factoriesCartListByUser = useFactoriesCartListByUserId({
    page: 1,
    limit: 100,
  });
  const updateFactoriesCartWithLogin = useUpdateFactoriesCartWithLogin();
  const deleteFactoriesCartItem = useDeleteFactoriesCartItem();
  const addQuotes = useAddRfqQuotes();
  const addFactoriesRequestQuotes = useAddFactoriesRequestQuotes();

  const memoziedAddressList = useMemo(() => {
    return (
      allUserAddressQuery.data?.data.map((item: AddressItem) => ({
        label: [item.address, item.town, item.cityDetail?.name, item?.stateDetail?.name, item.postCode, item.countryDetail?.name].filter(el => el).join(', '),
        value: [item.address, item.town, item.cityDetail?.name, item?.stateDetail?.name, item.postCode, item.countryDetail?.name].filter(el => el).join(', '),
      })) || []
    );
  }, [allUserAddressQuery.data?.data]);

  const memoizedFactoriseCartList = useMemo(() => {
    if (factoriesCartListByUser.data?.data) {
      return factoriesCartListByUser.data?.data || [];
    }
    return [];
  }, [factoriesCartListByUser.data?.data]);

  const handleAddToCart = async (
    quantity: number,
    customizeProductId: number,
    productId: number,
  ) => {
    const response = await updateFactoriesCartWithLogin.mutateAsync({
      productId,
      quantity,
      customizeProductId,
    });

    if (response.status) {
      toast({
        title: t("item_added_to_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleRemoveItemFromFactoriesCart = async (factoriesCartId: number) => {
    const response = await deleteFactoriesCartItem.mutateAsync({ factoriesCartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const onSubmit = async (formData: any) => {
    const address = formData.address;
    const addressParts = address.split(";");
    const addressObj = {
      address: addressParts[0],
      city: addressParts[1],
      province: addressParts[2],
      postCode: addressParts[3],
      country: addressParts[4],
    };
    const updatedFormData = {
      ...addressObj,
      firstName: me.data?.data?.firstName,
      lastName: me.data?.data?.lastName,
      phoneNumber: me.data?.data?.phoneNumber,
      cc: me.data?.data?.cc,
      factoriesCartIds: memoizedFactoriseCartList.map((item: any) => item.id),
      factoriesDate: formData.factoriesDate,
    };
    const response = await addFactoriesRequestQuotes.mutateAsync(updatedFormData);
    if (response.status) {
      toast({
        title: t("quotes_added_successfully"),
        description: t("check_your_quotes_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["rfq-cart-by-user", { page: 1, limit: 20 }],
      });
      form.reset();
      // router.push("/rfq-quotes");
    } else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  startDebugger();

  return (
    <>
      <section className="rfq_section">
        <div className="sec-bg relative">
          <Image src={BannerImage} alt="background-banner" fill />
        </div>
        <div className="container mx-auto px-3">
          <div className="rfq-cart-wrapper">
            <div className="headerPart">
              <button
                type="button"
                className="back-btn"
                onClick={() => router.back()}
              >
                <MdOutlineChevronLeft />
              </button>
              <h3 dir={langDir} translate="no">{t("customize_cart_items")}</h3>
            </div>
            <div className="bodyPart">
              <div className="add-delivery-card">
                <h3 dir={langDir} translate="no">{t("add_delivery_address_date")}</h3>
                <Form {...form}>
                  <form className="grid grid-cols-2 gap-x-5 bg-white! p-5">
                    <ControlledSelectInput
                      label={t("address")}
                      name="address"
                      options={memoziedAddressList}
                    />

                    <div>
                      <Label dir={langDir} translate="no">{t("date")}</Label>
                      <ControlledDatePicker name="factoriesDate" isFuture />
                    </div>
                  </form>
                </Form>
              </div>

              <div className="rfq-cart-item-lists">
                <h4 dir={langDir} translate="no">{t("customize_cart_items")}</h4>
                <div className="rfq-cart-item-ul">
                  {memoizedFactoriseCartList.map((item: any) => (
                    <FactoriesCustomizedProductCard
                      key={item?.id}
                      factoriesCartId={item?.id}
                      customizeProductId={item?.customizeProductId}
                      productId={item?.productId}
                      productName={item?.productDetails?.productName}
                      productQuantity={item.quantity}
                      productImages={
                        item?.productDetails?.productImages
                      }
                      customizeProductImages={
                        item?.customizeProductDetail?.customizeProductImageDetail
                      }
                      offerFromPrice={item?.customizeProductDetail?.fromPrice}
                      offerToPrice={item?.customizeProductDetail?.toPrice}
                      onAdd={handleAddToCart}
                      onRemove={handleRemoveItemFromFactoriesCart}
                      note={item?.customizeProductDetail?.note}
                    />
                  ))}

                  {!memoizedFactoriseCartList.length ? (
                    <div className="my-10 text-center">
                      <h4 dir={langDir} translate="no">{t("no_cart_items")}</h4>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="submit-action">
                <Button
                  disabled={!memoizedFactoriseCartList.length || addFactoriesRequestQuotes.isPending}
                  className="theme-primary-btn submit-btn"
                  onClick={form.handleSubmit(onSubmit)}
                  dir={langDir}
                  translate="no"
                >
                  {addFactoriesRequestQuotes.isPending ? (
                    <>
                      <Image
                        src="/images/load.png"
                        alt="loader-icon"
                        width={20}
                        height={20}
                        className="mr-2 animate-spin"
                      />
                      {t("please_wait")}
                    </>
                  ) : (
                    t("request_for_customize")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default FactoriesCartPage;
