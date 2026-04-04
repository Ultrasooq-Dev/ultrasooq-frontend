"use client";
import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTags } from "@/apis/queries/tags.queries";
import BasicInformationSection from "@/components/modules/editProduct/BasicInformationSection";
import ProductDetailsSection from "@/components/modules/createProduct/ProductDetailsSection";
import DescriptionAndSpecificationSection from "@/components/modules/createProduct/DescriptionAndSpecificationSection";
import {
  useOneProductByProductCondition,
  useUpdateProduct,
  useUpdateProductPriceByProductCondition,
} from "@/apis/queries/product.queries";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import { imageExtensions, videoExtensions } from "@/utils/constants";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { handleDescriptionParse } from "@/utils/helper";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { DialogTitle } from "@/components/ui/dialog";
import { IoCloseSharp } from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const baseProductPriceItemSchema = z.object({
  consumerType: z.string().trim().optional(),
  sellType: z.string().trim().optional(),
  consumerDiscount: z.coerce.number().optional(),
  vendorDiscount: z.coerce.number().optional(),
  minCustomer: z.coerce.number().optional(),
  maxCustomer: z.coerce.number().optional(),
  minQuantityPerCustomer: z.coerce.number().optional(),
  maxQuantityPerCustomer: z.coerce.number().optional(),
  minQuantity: z.coerce.number().optional(),
  maxQuantity: z.coerce.number().optional(),
  timeOpen: z.coerce.number().optional(),
  timeClose: z.coerce.number().optional(),
  deliveryAfter: z.coerce.number().optional(),
});


type EditFormProps = {
  onClose: () => void;
  selectedProductId?: number;
  onProductUpdateSuccess: () => void;
};

const formSchema = (t: any) => {
  return z.object({
    productName: z
      .string()
      .trim()
      .min(2, { message: t("product_name_is_required") })
      .max(50, { message: t("product_name_must_be_less_than_50_characters") }),
    productImagesList: z.any().optional(),
    productShortDescriptionList: z.array(
      z.object({
        shortDescription: z
          .string()
          .trim()
          .min(2, {
            message: t("short_description_is_required"),
          })
          .max(200, {
            message: t("short_description_must_be_less_than_200_characters"),
          }),
      }),
    ),
    productSpecificationList: z.array(
      z.object({
        label: z
          .string()
          .trim()
          .min(2, { message: t("label_is_required") })
          .max(20, {
            message: t("label_must_be_less_than_20_characters"),
          }),
        specification: z
          .string()
          .trim()
          .min(2, { message: t("specification_is_required") })
          .max(20, {
            message: t("specification_must_be_less_than_20_characters"),
          }),
      }),
    ),
    description: z.string().trim().optional(),
    descriptionJson: z.array(z.any()).optional(),
    productPriceList: z.array(baseProductPriceItemSchema).optional(),
    setUpPrice: z.boolean().optional(),
  });
};

const defaultValues = {
  productName: "",
  productImagesList: undefined,
  productShortDescriptionList: [
    {
      shortDescription: "",
    },
  ],
  productSpecificationList: [
    {
      label: "",
      specification: "",
    },
  ],
  description: "",
  descriptionJson: undefined,
  productImages: [],
  productSellerImageList: [
    {
      productPriceId: "",
      imageName: "",
      image: "",
      videoName: "",
      video: "",
    },
  ],
};

const ProductEditForm: React.FC<EditFormProps> = ({
  onClose,
  selectedProductId,
  onProductUpdateSuccess
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useParams();
  const searchQuery = useSearchParams();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema(t)) as any,
    defaultValues,
  });
  const productPriceId = selectedProductId;

  const uploadMultiple = useUploadMultipleFile();
  const tagsQuery = useTags();
  // const updateProduct = useUpdateProduct();
  // const productQueryById = useProductById(
  //   {
  //     productId: searchParams?.id ? (searchParams?.id as string) : "",
  //   },
  //   !!searchParams?.id,
  // );
  const updateProductPriceByProductCondition =
    useUpdateProductPriceByProductCondition();
  const updateProduct = useUpdateProduct();
  const productByConditionQuery = useOneProductByProductCondition(
    {
      productId: searchParams?.id ? Number(searchParams?.id) : 0,
      productPriceId: productPriceId ? Number(productPriceId) : 0,
    },
    !!searchParams?.id && !!productPriceId,
  );
  const watchProductImages = form.watch("productImages");

  const memoizedTags = useMemo(() => {
    return (
      tagsQuery?.data?.data.map((item: { id: string; tagName: string }) => {
        return { label: item.tagName, value: item.id };
      }) || []
    );
  }, [tagsQuery?.data]);

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

  const onSubmit = async (formData: any) => {
    const updatedFormData = {
      ...formData,
    };
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
              const videoName = item?.path.split("/").pop() ?? "";
              return {
                video: item?.path,
                videoName,
              };
            } else if (imageExtensions.includes(extension)) {
              const imageName = item?.path.split("/").pop() ?? "";
              return {
                image: item?.path,
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
              video: item,
              videoName,
            };
          } else if (imageExtensions.includes(extension)) {
            const imageName: string = item.split("/").pop()!;
            return {
              image: item,
              imageName,
            };
          }
        }

        return {
          image: item,
          imageName: item,
        };
      });
      updatedFormData.productImages = [
        ...stringTypeArrays,
        ...formattedimageUrlArrays,
      ];

      if (updatedFormData.productImages.length) {
        updatedFormData.productImagesList = updatedFormData.productImages;
      }
    }

    // delete updatedFormData.productName;
    delete updatedFormData.productImages;

    let productImagesList: any = [];
    if (updatedFormData.productImagesList.length) {
      productImagesList = updatedFormData.productImagesList.map(
        (item: any) => ({
          ...item,
          productPriceId: Number(productPriceId),
        }),
      );
    }

    delete updatedFormData.productImagesList;

    const finalData = {
      ...updatedFormData,
      productImagesList,
      productId: Number(searchParams?.id),
      description: updatedFormData?.descriptionJson
        ? JSON.stringify(updatedFormData?.descriptionJson)
        : "",
    };

    delete finalData.descriptionJson;

    const response = await updateProduct.mutateAsync(finalData);
    if (response.status && response.data) {
      toast({
        title: t("product_update_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();

      // queryClient.invalidateQueries({
      //   queryKey: [
      //     "product-condition-by-id",
      //     Number(searchParams?.id),
      //     Number(productPriceId),
      //   ],
      // });
      // productByConditionQuery.refetch();

      // router.push(`/trending/${Number(searchParams?.id)}` );

      //Refetch Parent Id Data
      // ✅ Refetch product details after update
      onProductUpdateSuccess();

      onClose();
    } else {
      toast({
        title: t("product_update_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (productByConditionQuery?.data?.data) {
      const product = productByConditionQuery?.data?.data;

      const productSellerImages = product?.product_productPrice?.[0]
        ?.productPrice_productSellerImage?.length
        ? product?.product_productPrice?.[0]?.productPrice_productSellerImage
        : product?.productImages?.length
          ? product?.productImages
          : [];

      const productImages = productSellerImages?.map((item: any) => {
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
      });

      const productImagesList = productImages?.map((item: any) => {
        if (item?.video) {
          return {
            video: item?.video,
            videoName: item?.videoName,
          };
        } else if (item?.image) {
          return {
            image: item?.image,
            imageName: item?.imageName,
          };
        }
      });

      const productShortDescriptionList = product
        ?.product_productShortDescription?.length
        ? product?.product_productShortDescription.map((item: any) => ({
          shortDescription: item?.shortDescription,
        }))
        : [
          {
            shortDescription: "",
          },
        ];

      const productSpecificationList = product?.product_productSpecification
        ?.length
        ? product?.product_productSpecification.map((item: any) => ({
          label: item?.label,
          specification: item?.specification,
        }))
        : [
          {
            label: "",
            specification: "",
          },
        ];

      form.reset({
        productName: product?.productName,
        productImages: productImages || [],
        productImagesList: productImagesList || undefined,
        productShortDescriptionList: productShortDescriptionList,
        productSpecificationList: productSpecificationList,
        description: product?.description || "",
        descriptionJson: product?.description
          ? handleDescriptionParse(product?.description)
          : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productByConditionQuery.data?.data, searchParams?.id]);





  return (
    <>
      <div className="modal-header justify-between!">
        <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
          {t("edit_product")}
        </DialogTitle>
        <Button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 bg-card! text-foreground! shadow-none"
        >
          <IoCloseSharp size={20} />
        </Button>
      </div>

      <section className="relative w-full py-7">
        <div className="absolute left-0 top-0 -z-10 h-full w-full">
          <Image
            src={BackgroundImage}
            className="h-full w-full object-cover object-center"
            alt="background"
            fill
            priority
          />
        </div>
        <div className="container relative z-10 m-auto mx-auto max-w-[950px] px-3">
          <div className="flex flex-wrap">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <BasicInformationSection
                  tagsList={memoizedTags}
                  // isEditable={!!form.getValues("categoryLocation")}
                  isEditable={false}
                  hasId={!!searchParams?.id}
                />

                {!searchParams?.id ? <ProductDetailsSection /> : null}

                <div className="grid w-full grid-cols-4 gap-x-5">
                  <div className="col-span-4 mb-3 w-full rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-4 lg:p-8">
                    <div className="form-groups-common-sec-s1">
                      <DescriptionAndSpecificationSection />
                    </div>
                    <div className="mb-4 mt-4 inline-flex w-full items-center justify-end">
                      {/* <button className="rounded-sm bg-transparent px-4 py-4 text-lg font-bold leading-6 text-[#7F818D]">
                        Save as Draft
                      </button> */}

                      <Button
                        disabled={
                          updateProduct.isPending ||
                          uploadMultiple.isPending
                        }
                        type="submit"
                        className="h-12 rounded bg-dark-orange px-10 text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
                        dir={langDir}
                        translate="no"
                      >
                        {updateProduct.isPending ||
                          uploadMultiple.isPending ? (
                          <LoaderWithMessage message={t("please_wait")} />
                        ) : (
                          t("update")
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductEditForm;


