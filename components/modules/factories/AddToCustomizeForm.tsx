import {
  useCreateProduct,
  useRfqProductById,
  useUpdateForCustomize,
  useUpdateProduct,
} from "@/apis/queries/product.queries";
import {
  useAddProductDuplicateRfq,
  useUpdateFactoriesCartWithLogin,
} from "@/apis/queries/rfq.queries";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import ControlledTextareaInput from "@/components/shared/Forms/ControlledTextareaInput";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { imageExtensions, videoExtensions } from "@/utils/constants";
import { isBrowser, isImage, isVideo } from "@/utils/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { IoCloseSharp } from "react-icons/io5";
import ReactPlayer from "react-player";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

type AddToCustomizeFormProps = {
  selectedProductId?: number;
  onClose: () => void;
  onAddToFactory?: () => void;
  onAddToCart?: () => void;
};

const addFormSchema = (t: any) => {
  return z
    .object({
      fromPrice: z.coerce
        .number({ invalid_type_error: t("offer_price_from_required") })
        .min(1, {
          message: t("offer_price_from_required"),
        })
        .max(1000000, {
          message: t("offer_price_from_must_be_less_than_price", {
            price: 1000000,
          }),
        }),
      toPrice: z.coerce
        .number({ invalid_type_error: t("offer_price_to_required") })
        .min(1, {
          message: t("offer_price_to_required"),
        })
        .max(1000000, {
          message: t("offer_price_to_must_be_less_than_price", {
            price: 1000000,
          }),
        }),
      note: z
        .string()
        .trim()
        .max(100, {
          message: t("description_must_be_less_than_n_chars", { n: 100 }),
        })
        .optional(),
      customizeproductImageList: z.any().optional(),
    })
    .refine(
      ({ fromPrice, toPrice }) => {
        return Number(fromPrice) < Number(toPrice);
      },
      {
        message: t("offer_price_from_must_be_less_than_offer_price_to"),
        path: ["fromPrice"],
      },
    );
};

const editFormSchema = (t: any) => {
  return z.object({
    note: z
      .string()
      .trim()
      .max(100, {
        message: t("description_must_be_less_than_n_chars", { n: 100 }),
      })
      .optional(),
    customizeproductImageList: z.any().optional(),
  });
};

const addDefaultValues = {
  note: "",
  customizeproductImageList: undefined,
  productImages: [] as { path: File; id: string }[],
};

const editDefaultValues = {
  note: "",
  customizeproductImageList: undefined,
  productImages: [] as { path: File; id: string }[],
};

const AddToCustomizeForm: React.FC<AddToCustomizeFormProps> = ({
  selectedProductId,
  onClose,
  onAddToFactory,
  onAddToCart,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(addFormSchema(t)),
    defaultValues: addDefaultValues,
  });
  const photosRef = useRef<HTMLInputElement>(null);

  const watchProductImages = form.watch("productImages");

  const uploadMultiple = useUploadMultipleFile();
  const createProduct = useCreateProduct();
  const addDuplicateProduct = useAddProductDuplicateRfq();
  const updateProduct = useUpdateProduct();
  const updateForCustomize = useUpdateForCustomize();
  const productQueryById = useRfqProductById(
    {
      productId: selectedProductId ? selectedProductId.toString() : "",
    },
    !!selectedProductId,
  );

  const updateFactoriesCartWithLogin = useUpdateFactoriesCartWithLogin();

  const handleEditPreviewImage = (id: string, item: FileList) => {
    const tempArr = watchProductImages || [];
    const filteredFormItem = tempArr.filter((item: any) => item?.id === id);
    if (filteredFormItem.length) {
      filteredFormItem[0].path = item[0];
      form.setValue("productImages", [...tempArr]);
    }
  };

  const handleRemovePreviewImage = (id: string) => {
    form.setValue("productImages", [
      ...(watchProductImages || []).filter((item: any) => item?.id !== id),
    ]);
  };

  const handleUploadedFile = async (list: any[]) => {
    if (list?.length) {
      const formData = new FormData();

      list.forEach((item: { path: File; id: string }) => {
        formData.append("content", item.path);
      });

      const response = await uploadMultiple.mutateAsync(formData);
      if (response.status && response.data) {
        return response.data;
      }
    }
  };

  const handleAddToCart = async (
    quantity: number,
    productId: number,
    customizeProductId: number,
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
      if (onAddToCart) onAddToCart();
      onClose();
    } else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const onSubmit = async (formData: any) => {
    const updatedFormData = { ...formData };
    if (watchProductImages.length) {
      const fileTypeArrays = watchProductImages.filter(
        (item: any) => typeof item.path === "object",
      );

      const imageUrlArray: any = fileTypeArrays?.length
        ? await handleUploadedFile(fileTypeArrays)
        : [];

      const stringTypeArrays = watchProductImages
        .filter((item: any) => typeof item.path !== "object")
        .map((item: any) => {
          const extension = item.path.split(".").pop()?.toLowerCase();

          if (extension) {
            if (videoExtensions.includes(extension)) {
              const videoName: string = item?.path.split("/").pop()!;
              return {
                link: item?.path,
                linkType: "video",
                videoName,
              };
            } else if (imageExtensions.includes(extension)) {
              const imageName: string = item?.path.split("/").pop()!;
              return {
                link: item?.path,
                linktype: "image",
                imageName,
              };
            }
          }
        });

      const formattedimageUrlArrays = imageUrlArray?.map((item: any) => {
        const extension = item.split(".").pop()?.toLowerCase();

        if (extension) {
          if (videoExtensions.includes(extension)) {
            const videoName: string = item.split("/").pop()!;
            return {
              link: item,
              linkType: "video",
              videoName,
            };
          } else if (imageExtensions.includes(extension)) {
            const imageName: string = item.split("/").pop()!;
            return {
              link: item,
              linkType: "image",
              imageName,
            };
          }
        }

        return {
          link: item,
          linkType: "",
          imageName: item,
        };
      });

      updatedFormData.productImages = [...formattedimageUrlArrays];

      if (updatedFormData.productImages.length) {
        updatedFormData.customizeproductImageList =
          updatedFormData.productImages;
      }
    }

    delete updatedFormData.productImages;

    if (selectedProductId) {
      const response = await updateForCustomize.mutateAsync({
        productId: selectedProductId,
        ...updatedFormData,
      });
      if (response.status) {
        toast({
          title: t("customize_product_update_successful"),
          description: response.message,
          variant: "success",
        });

        if (onAddToFactory) onAddToFactory();

        await handleAddToCart(1, Number(selectedProductId), response?.data.id);
      } else {
        toast({
          title: t("customize_product_update_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    }

    if (isBrowser())
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
  };

  useEffect(() => {
    if (productQueryById?.data?.data) {
      const product = productQueryById?.data?.data;

      const productImages = product?.productImages?.length
        ? product?.productImages?.map((item: any) => {
            if (item?.image) {
              return {
                path: item?.image,
                id: uuidv4(),
              };
            } else if (item?.video) {
              return {
                path: item?.video,
                id: uuidv4(),
              };
            }
          })
        : [];

      const customizeproductImageList = product?.productImages
        ? product?.productImages?.map((item: any) => {
            if (item?.video) {
              return {
                link: item?.video,
                linkType: "video",
                videoName: item?.videoName,
              };
            } else if (item?.image) {
              return {
                link: item?.image,
                linkType: "image",
                imageName: item?.imageName,
              };
            }
          })
        : undefined;

      form.reset({
        note: productQueryById?.data?.data?.note,
        productImages: productImages || [],
        customizeproductImageList: customizeproductImageList || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, productQueryById?.data]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6 px-6 pt-6">
        <DialogTitle
          className="text-2xl font-bold text-foreground"
          dir={langDir}
          translate="no"
        >
          {t("add_customize_cart")}
        </DialogTitle>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted rounded-full"
        >
          <IoCloseSharp size={20} />
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 px-6 pb-6"
        >
          {/* Product Images Section */}
          <div className="space-y-3">
            <label
              className="text-base font-semibold text-foreground block"
              dir={langDir}
              translate="no"
            >
              {t("product_image")}
            </label>
            <div className="flex w-full flex-wrap">
              <div className="grid grid-cols-3 gap-3 w-full">
                {watchProductImages?.map((item: any, index: number) => (
                  <FormField
                    control={form.control}
                    name="productImages"
                    key={index}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative w-full aspect-square">
                            <div className="relative w-full h-full rounded-lg border border-border overflow-hidden bg-muted group">
                              {watchProductImages?.length ? (
                                <button
                                  type="button"
                                  className="absolute top-2 right-2 z-10 bg-destructive hover:bg-destructive text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    handleRemovePreviewImage(item?.id);
                                    if (photosRef.current)
                                      photosRef.current.value = "";
                                  }}
                                >
                                  <IoCloseSharp size={16} />
                                </button>
                              ) : null}
                              {item?.path && isImage(item.path) ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={
                                      typeof item.path === "object"
                                        ? URL.createObjectURL(item.path)
                                        : typeof item.path === "string"
                                          ? item.path
                                          : "/images/no-image.jpg"
                                    }
                                    alt="product-image"
                                    fill
                                    className="object-cover"
                                    priority
                                  />
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple={false}
                                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                    onChange={(event) => {
                                      if (event.target.files) {
                                        if (
                                          event.target.files[0].size >
                                          524288000
                                        ) {
                                          toast({
                                            title: t(
                                              "one_of_file_should_be_less_than_size",
                                              { size: "500MB" },
                                            ),
                                            variant: "danger",
                                          });
                                          return;
                                        }
                                        handleEditPreviewImage(
                                          item?.id,
                                          event.target.files,
                                        );
                                      }
                                    }}
                                    id="productImages"
                                  />
                                </div>
                              ) : item?.path && isVideo(item.path) ? (
                                <div className="relative w-full h-full">
                                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    <ReactPlayer
                                      url={
                                        typeof item.path === "object"
                                          ? URL.createObjectURL(item.path)
                                          : typeof item.path === "string"
                                            ? item.path
                                            : "/images/no-image.jpg"
                                      }
                                      width="100%"
                                      height="100%"
                                      controls
                                    />
                                  </div>
                                  <Input
                                    type="file"
                                    accept="video/*"
                                    multiple={false}
                                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                    onChange={(event) => {
                                      if (event.target.files) {
                                        if (
                                          event.target.files[0].size >
                                          524288000
                                        ) {
                                          toast({
                                            title: t(
                                              "one_of_file_should_be_less_than_size",
                                              { size: "500MB" },
                                            ),
                                            variant: "danger",
                                          });
                                          return;
                                        }

                                        handleEditPreviewImage(
                                          item?.id,
                                          event.target.files,
                                        );
                                      }
                                    }}
                                    id="productImages"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                  <div className="text-center">
                                    <Image
                                      src="/images/upload.png"
                                      className="mb-2 mx-auto opacity-60"
                                      width={32}
                                      height={32}
                                      alt="upload"
                                    />
                                    <span className="text-sm text-muted-foreground block">{t("drop_your_file")}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                <div className="relative w-full aspect-square">
                  <div className="absolute m-auto flex h-full w-full cursor-pointer flex-wrap items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-muted hover:border-primary/70 transition-colors">
                    <div
                      className="text-muted-foreground text-sm font-medium flex flex-col items-center gap-2"
                      dir={langDir}
                    >
                      <Image
                        src="/images/plus.png"
                        className="opacity-60"
                        alt="add-icon"
                        width={32}
                        height={32}
                      />
                      <span translate="no">{t("add_more")}</span>
                    </div>
                  </div>

                  <Input
                    type="file"
                    accept="image/*, video/*"
                    multiple
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    onChange={(event) =>
                      {
                        if (event.target.files) {
                          const filesArray = Array.from(event.target.files);
                          if (
                            filesArray.some((file) => file.size > 524288000)
                          ) {
                            toast({
                              title: t(
                                "one_of_file_should_be_less_than_size",
                                { size: "500MB" },
                              ),
                              variant: "danger",
                            });
                            return;
                          }

                          const newImages = filesArray.map((file) => ({
                            path: file,
                            id: uuidv4(),
                          }));
                          const updatedProductImages = [
                            ...(watchProductImages || []),
                            ...newImages,
                          ];

                          form.setValue(
                            "productImages",
                            updatedProductImages,
                          );
                        }
                      }
                    }
                    id="productImages"
                    ref={photosRef}
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-destructive" dir={langDir}>
              {!watchProductImages?.length
                ? form.formState.errors?.productImages?.message
                : ""}
            </p>
          </div>

          {/* Note Section */}
          <ControlledTextareaInput
            label={t("write_a_note")}
            name="note"
            placeholder={t("write_a_note")}
            rows={4}
            dir={langDir}
            translate="no"
          />

          {/* Price Range Section */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledTextInput
              label={t("offer_price_from")}
              name="fromPrice"
              placeholder={t("offer_price_from")}
              type="number"
              dir={langDir}
              translate="no"
            />

            <ControlledTextInput
              label={t("offer_price_to")}
              name="toPrice"
              placeholder={t("offer_price_to")}
              type="number"
              dir={langDir}
              translate="no"
            />
          </div>

          {/* Submit Button */}
          <Button
            disabled={
              updateForCustomize?.isPending ||
              updateFactoriesCartWithLogin?.isPending
            }
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-base transition-colors"
            dir={langDir}
            translate="no"
          >
            {updateForCustomize.isPending ||
            updateFactoriesCartWithLogin.isPending ? (
              <LoaderWithMessage message={t("please_wait")} />
            ) : (
              t("add_to_cart")
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default AddToCustomizeForm;
