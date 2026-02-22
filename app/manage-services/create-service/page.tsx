"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTags } from "@/apis/queries/tags.queries";
import BasicInformationSection from "@/components/modules/createService/BasicInformationSection";
import dynamic from "next/dynamic";

const DescriptionAndSpecificationSection = dynamic(
  () => import("@/components/modules/createService/DescriptionAndSpecificationSection"),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
    ssr: false,
  },
);
import Footer from "@/components/shared/Footer";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import {
  imageExtensions,
  videoExtensions,
} from "@/utils/constants";
import BackgroundImage from "@/public/images/before-login-bg.png";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { WEEKDAYS_LIST } from "@/utils/constants";
import ReactSelect from "react-select";
import { IOption, IState, ICity } from "@/utils/types/common.types";
import {
  useAllCountries,
  useFetchCitiesByState,
  useFetchStatesByCountry,
} from "@/apis/queries/masters.queries";
import ControlledTimePicker from "@/components/shared/Forms/ControlledTimePicker";
import {
  useCreateService,
  useServiceById,
  useUpdateService,
} from "@/apis/queries/services.queries";
import moment from "moment";
import { useSearchParams } from "next/navigation";

const formSchema = (t: any) =>
  z
    .object({
      serviceName: z
        .string()
        .trim()
        .min(1, { message: t("service_name_is_required") }),

      description: z
        .array(z.any(), { required_error: t("description_is_required") })
        .min(1, { message: t("description_is_required") }),

      categoryId: z
        .number({ required_error: t("category_is_required") })
        .positive({ message: t("category_id_must_be_positive") }),

      categoryLocation: z.string().trim().optional(),

      workingDays: z
        .string()
        .trim()
        .min(1, { message: t("working_days_required") }),

      offDays: z.string().trim().optional(),

      renewEveryWeek: z.boolean().optional(),

      oneTime: z.boolean().optional(),

      openTime: z.string().trim().optional(),
      closeTime: z.string().trim().optional(),
      breakTimeFrom: z.string().trim().optional(),
      breakTimeTo: z.string().trim().optional(),

      shippingType: z.enum(["DIRECTION", "RANG"]).optional(),
      countryId: z
        .number({ invalid_type_error: t("country_is_required") })
        .min(1, { message: t("country_is_required") }),
      stateId: z
        .number({ invalid_type_error: t("state_is_required") })
        .min(1, { message: t("state_is_required") }),
      fromCityId: z.number().positive().nullable().optional(),
      toCityId: z.number().positive().nullable().optional(),
      rangeCityId: z.number().positive().nullable().optional(),

      eachCustomerTime: z
        .string()
        .trim()
        .min(1, { message: t("each_customer_time_is_required") }),
      customerPerPeiod: z.coerce
        .number()
        .min(1, { message: t("customer_per_period_is_required") })
        .max(100, { message: t("customer_per_period_must_be_less_than_or_equal_to_100") }),

      serviceType: z.enum(["BOOKING", "MOVING"], {
        required_error: t("service_type_is_required"),
      }),

      serviceConfirmType: z.enum(["AUTO", "MANUAL"]).optional(),

      serviceFor: z.enum(["OWNER", "EVERYONE"]).optional(),

      tags: z
        .array(
          z.object({
            label: z.string().trim(),
            value: z.number(),
          }),
        )
        .min(1, { message: t("at_least_one_tag_required") }),

      features: z
        .array(
          z.object({
            id: z.number().optional(),
            serviceId: z.number().optional(),
            name: z
              .string()
              .trim()
              .min(1, { message: t("feature_name_required") }),
            serviceCostType: z.enum(["FLAT", "HOURLY"], {
              required_error: t("cost_type_required"),
            }),
            serviceCost: z.coerce
              .number({ invalid_type_error: t("cost_required") })
              .positive({ message: t("cost_required") }),
          }),
        )
        .min(1, { message: t("at_least_one_feature_required") }),

      images: z.any().optional(),
    })
    .superRefine((data: any, ctx) => {
      // Validate fromCityId & toCityId when shippingType = 'DIRECTION'
      if (data.shippingType == 'DIRECTION') {
        if (!data.fromCityId) {
          ctx.addIssue({
            code: "custom",
            message: t("from_city_is_required"),
            path: ["fromCityId"],
          });
        }

        if (!data.toCityId) {
          ctx.addIssue({
            code: "custom",
            message: t("to_city_is_required"),
            path: ["toCityId"],
          });
        }
      }

      // Validate rangeCityId when shippingType = 'RANG'
      if (data.shippingType == 'RANG') {
        if (!data.rangeCityId) {
          ctx.addIssue({
            code: "custom",
            message: t("city_is_required"),
            path: ["rangeCityId"],
          });
        }
      }

      // Validate that closeTime is after openTime
      if (data.openTime && data.closeTime && data.openTime >= data.closeTime) {
        ctx.addIssue({
          code: "custom",
          message: t("close_time_must_be_after_open_time"),
          path: ["closeTime"],
        });
      }

      // Validate that breakTimeFrom is within openTime and closeTime
      if (
        data.breakTimeFrom &&
        (data.breakTimeFrom < data.openTime ||
          data.breakTimeFrom >= data.closeTime)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("break_time_from_must_be_within_open_and_close_time"),
          path: ["breakTimeFrom"],
        });
      }

      // Validate that breakTimeTo is within openTime and closeTime
      if (
        data.breakTimeTo &&
        (data.breakTimeTo <= data.openTime || data.breakTimeTo > data.closeTime)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("break_time_to_must_be_within_open_and_close_time"),
          path: ["breakTimeTo"],
        });
      }

      // Validate that breakTimeFrom is before breakTimeTo
      if (
        data.breakTimeFrom &&
        data.breakTimeTo &&
        data.breakTimeFrom >= data.breakTimeTo
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("break_time_from_must_be_before_break_time_to"),
          path: ["breakTimeFrom"],
        });
      }
    });

const defaultServiceValues = {
  serviceName: "",
  description: [
    {
      type: "p",
      children: [{ text: "" }],
    },
  ],
  categoryId: 0,
  categoryLocation: "",
  workingDays: "",
  offDays: "",
  renewEveryWeek: true,
  oneTime: false,
  openTime: "",
  closeTime: "",
  breakTimeFrom: "",
  breakTimeTo: "",
  shippingType: "RANG",
  countryId: null,
  stateId: null,
  fromCityId: null,
  toCityId: null,
  rangeCityId: null,
  eachCustomerTime: undefined,
  customerPerPeiod: undefined,
  serviceType: "BOOKING", // default could be "BOOKING" or "MOVING"
  serviceConfirmType: "AUTO",
  serviceFor: "OWNER",
  tags: [],
  features: [
    {
      name: "",
      serviceCostType: "FLAT",
      serviceCost: "",
    },
  ],
  images: [],
};

const customStyles = {
  control: (base: any) => ({
    ...base,
    height: 48,
    minHeight: 48,
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
  }),
};

const CreateServicePage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams: any = useSearchParams();
  const editId = searchParams.get("editId");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [states, setStates] = useState<IOption[]>([]);
  const [cities, setCities] = useState<IOption[]>([]);
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultServiceValues,
  });
  const fetchCitiesByState = useFetchCitiesByState();
  const uploadMultiple = useUploadMultipleFile();
  const tagsQuery = useTags();
  const countriesNewQuery = useAllCountries();
  const fetchStatesByCountry = useFetchStatesByCountry();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const watchServiceType = form.watch("serviceType");
  const watchShippingType = form.watch("shippingType");
  const watchServiceImages = form.watch("images");
  const serviceQueryById = useServiceById(
    {
      serviceid: editId ? (editId as string) : "",
    },
    !!editId,
  );

  const memoizedTags = useMemo(() => {
    return (
      tagsQuery?.data?.data.map((item: { id: string; tagName: string }) => {
        return { label: item.tagName, value: item.id };
      }) || []
    );
  }, [tagsQuery?.data]);

  const memoizedAllCountries = useMemo(() => {
    return (
      countriesNewQuery?.data?.data.map((item: any) => {
        return { label: item.name, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesNewQuery?.data?.data?.length]);

  const fetchStates = async (countryId: number) => {
    try {
      const response = await fetchStatesByCountry.mutateAsync({ countryId }); // Call your API
      setStates(
        response.data.map((state: IState) => ({
          label: state.name,
          value: state.id,
        })),
      );
    } catch (error) {
    }
  };

  const fetchCities = async (stateId: number) => {
    try {
      const response = await fetchCitiesByState.mutateAsync({ stateId }); // ✅ Pass as an object
      setCities(
        response.data.map((city: ICity) => ({
          label: city.name,
          value: city.id,
        })),
      );
    } catch (error) {
    }
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

  function convertTimeToISO(inputTime: string) {
    return moment
      .utc()
      .set({
        hour: parseInt(inputTime.split(":")[0], 10),
        minute: parseInt(inputTime.split(":")[1], 10),
        second: 0,
        millisecond: 0,
      })
      .toISOString();
  }

  const onSubmit = async (formData: any) => {
    if (!formData.categoryLocation) {
      toast({
        title: editId ? t("service_edit_failed") : t("service_create_failed"),
        description: t("please_select_category"),
        variant: "danger",
      });
      return;
    }

    try {
      let updatedFormData = {
        ...formData,
        openTime: convertTimeToISO(formData?.openTime),
        closeTime: convertTimeToISO(formData?.closeTime),
        breakTimeFrom: convertTimeToISO(formData?.breakTimeFrom),
        breakTimeTo: convertTimeToISO(formData?.breakTimeTo),
        eachCustomerTime: Number(formData?.eachCustomerTime || 0),
        customerPerPeiod: Number(formData?.customerPerPeiod || 0),
        description: JSON.stringify(formData?.description),
      };

      if (watchServiceImages.length) {
        const fileTypeArrays = watchServiceImages.filter(
          (item: any) => typeof item.path === "object",
        );
        const oldFiles = watchServiceImages.filter(
          (item: any) => typeof item.path !== "object",
        );

        const imageUrlArray: any = fileTypeArrays?.length
          ? await handleUploadedFile(fileTypeArrays)
          : [];
        let newFiles = [];
        if (imageUrlArray.length) {
          newFiles = imageUrlArray.map((item: string) => {
            const extension = item.split(".").pop()?.toLowerCase();

            if (extension) {
              const fileName: string = item.split("/").pop()!;
              if (videoExtensions.includes(extension)) {
                return {
                  url: item,
                  fileName: fileName,
                  fileType: "VIDEO",
                };
              } else if (imageExtensions.includes(extension)) {
                return {
                  url: item,
                  fileName: fileName,
                  fileType: "IMAGE",
                };
              }
            }

            return {
              url: item,
              fileName: item,
              fileType: "IMAGE",
            };
          });
        }
        if (oldFiles.length > 0) {
          updatedFormData.images = [...oldFiles, ...newFiles];
        } else {
          updatedFormData.images = newFiles;
        }
      }

      updatedFormData.tags = updatedFormData.tags.map((v: any) => {
        return {
          id:
            serviceQueryById?.data?.data?.serviceTags?.find(
              (sv: any) => sv.tagId === v.value,
            )?.id || undefined,
          tagId: v.value,
        };
      });

      updatedFormData.features = updatedFormData.features.map((v: any) => {
        return {
          ...v,
          serviceCost: Number(v?.serviceCost || 0),
        };
      });

      let response: any = {};
      if (editId) {
        updatedFormData.serviceId = editId;
        response = await updateService.mutateAsync(updatedFormData);
      } else {
        response = await createService.mutateAsync(updatedFormData);
      }

      if (response?.success || (response.status && response.data)) {
        toast({
          title: t(
            editId ? "service_updated_successful" : "service_create_successful",
          ),
          description: response.message,
          variant: "success",
        });
        form.reset();
        router.push("/manage-services");
      } else {
        toast({
          title: t(editId ? "service_update_failed" : "service_create_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    } catch (error: any) {
      toast({
        title: t(editId ? "service_update_failed" : "service_create_failed"),
        description: error.message,
        variant: "danger",
      });
    }
  };

  const handleRenewFun = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value === "every_week") {
      form.setValue("renewEveryWeek", true);
      form.setValue("oneTime", false);
    } else if (value === "one_time") {
      form.setValue("oneTime", true);
      form.setValue("renewEveryWeek", false);
    }
  };

  useEffect(() => {
    if (watchServiceType == "BOOKING") {
      form.setValue("shippingType", "RANG");
    }
  }, [watchServiceType]);
  
  useEffect(() => {
    const countryId = form.watch("countryId") as any;
    if (form.watch("countryId")) {
      fetchStates(countryId);
    }
  }, [form.watch("countryId")]);

  useEffect(() => {
    const stateId = form.watch("stateId") as any;
    if (stateId) {
      fetchCities(stateId);
    }
  }, [form.watch("stateId")]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (serviceQueryById?.data?.data && !hasInitialized.current) {
      hasInitialized.current = true;
      const responseData = serviceQueryById?.data?.data;

      setSelectedCategoryIds(
        responseData?.categoryLocation?.split(',')?.filter((item: string) => item) || []
      );

      const populatedFormData = {
        ...responseData,
        categoryLocation: responseData?.categoryLocation,
        openTime: moment.utc(responseData.openTime).format("HH:mm"),
        closeTime: moment.utc(responseData.closeTime).format("HH:mm"),
        breakTimeFrom: moment.utc(responseData.breakTimeFrom).format("HH:mm"),
        breakTimeTo: moment.utc(responseData.breakTimeTo).format("HH:mm"),
        eachCustomerTime: responseData.eachCustomerTime?.toString() || "",
        customerPerPeiod: responseData.customerPerPeiod?.toString() || "",
        description: JSON.parse(responseData.description || "[]"),
        tags: responseData.serviceTags.map((tag: any) => ({
          label:
            memoizedTags.find((t: any) => t.value === tag.tagId)?.label || "",
          value: tag.tagId,
        })),
        features: responseData.serviceFeatures.map((feature: any) => ({
          ...feature,
          serviceCost: feature.serviceCost?.toString() || "",
        })),
        images: responseData.images.map((image: any) => ({
          path: image.url,
          url: image.url,
          fileName: image.fileName,
          fileType: image.fileType,
          id: image.id,
        })),
      };

      form.reset(populatedFormData);
      if (responseData.stateId) {
        fetchCities(responseData.stateId);
      }
    }
  }, [serviceQueryById]);

  const resetCities = () => {
    form.setValue("fromCityId", null);
    form.setValue("toCityId", null);
    form.setValue("rangeCityId", null);
  };

  return (
    <>
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
                  editId={editId}
                  tagsList={memoizedTags}
                  selectedCategoryIds={selectedCategoryIds}
                />
                <div className="grid w-full grid-cols-4 gap-x-5">
                  <div className="col-span-4 mx-auto mb-3 w-full max-w-[950px] rounded-lg border border-solid border-gray-300 bg-white p-2 shadow-xs sm:p-3 lg:p-4">
                    <div className="flex w-full flex-wrap">
                      <div className=" w-full">
                        <div className="flex flex-wrap">
                          <div className="form-groups-common-sec-s1">
                            <h3 dir={langDir} translate="no">
                              {t("other_details")}
                            </h3>
                            <Label dir={langDir} translate="no">
                              {t("working_days")}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAYS_LIST.map((day) => (
                                <label
                                  key={day}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    value={day}
                                    checked={form
                                      .watch("workingDays")
                                      ?.split(",")
                                      .includes(day)}
                                    disabled={form
                                      .watch("offDays")
                                      ?.split(",")
                                      .includes(day)} // Disable if selected in offDays
                                    onChange={(e) => {
                                      const currentDays =
                                        form.watch("workingDays") || "";
                                      const updatedDays = e.target.checked
                                        ? [
                                            ...currentDays.split(","),
                                            day,
                                          ].filter(Boolean)
                                        : currentDays
                                            .split(",")
                                            .filter((d) => d !== day);
                                      form.setValue(
                                        "workingDays",
                                        updatedDays.join(","),
                                      );
                                      form.clearErrors("workingDays");
                                    }}
                                  />
                                  {day}
                                </label>
                              ))}
                            </div>
                            {form.formState.errors.workingDays ? (
                              <p className="mt-1 text-sm text-destructive">
                                {form.formState.errors.workingDays.message}
                              </p>
                            ) : null}
                            <div className="my-2">
                              <Label dir={langDir}>{t("off_days")}</Label>
                              <div className="flex flex-wrap gap-2">
                                {WEEKDAYS_LIST.map((day) => (
                                  <label
                                    key={day}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="checkbox"
                                      value={day}
                                      checked={form
                                        .watch("offDays")
                                        ?.split(",")
                                        .includes(day)}
                                      disabled={form
                                        .watch("workingDays")
                                        ?.split(",")
                                        .includes(day)} // Disable if selected in workingDays
                                      onChange={(e) => {
                                        const currentDays =
                                          form.watch("offDays") || "";
                                        const updatedDays = e.target.checked
                                          ? [
                                              ...currentDays.split(","),
                                              day,
                                            ].filter(Boolean)
                                          : currentDays
                                              .split(",")
                                              .filter((d) => d !== day);
                                        form.setValue(
                                          "offDays",
                                          updatedDays.join(","),
                                        );
                                      }}
                                    />
                                    {day}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="my-2">
                              <Label dir={langDir} translate="no">
                                {t("service_for")}
                              </Label>
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="me"
                                    name="serviceFor"
                                    value="OWNER"
                                    checked={
                                      form.watch("serviceFor") === "OWNER"
                                    }
                                    onChange={(e: any) =>
                                      form.setValue(
                                        "serviceFor",
                                        e.target.value,
                                      )
                                    }
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="me"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("me")}
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="everyone"
                                    name="serviceFor"
                                    value="EVERYONE"
                                    checked={
                                      form.watch("serviceFor") === "EVERYONE"
                                    }
                                    onChange={(e: any) =>
                                      form.setValue(
                                        "serviceFor",
                                        e.target.value,
                                      )
                                    }
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="everyone"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("everyone")}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="my-2">
                              <Label dir={langDir} translate="no">
                                {t("service_type")}
                              </Label>
                              <div className="my-2 flex flex-wrap gap-2">
                                <select
                                  className="w-full rounded border border-gray-300 p-2"
                                  value={form.watch("serviceType")}
                                  onChange={(e) =>
                                    form.setValue("serviceType", e.target.value)
                                  }
                                  translate="no"
                                >
                                  <option value="BOOKING">
                                    {t("booking")}
                                  </option>
                                  <option value="MOVING">{t("moving")}</option>
                                </select>
                              </div>
                            </div>
                            {form.formState.errors.serviceType ? (
                              <p className="mt-1 text-sm text-destructive">
                                {form.formState.errors.serviceType.message}
                              </p>
                            ) : null}
                            <div className="my-2">
                              <Label dir={langDir} translate="no">
                                {t("confirm_order_type")}
                              </Label>
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="auto"
                                    name="serviceConfirmType"
                                    value="AUTO"
                                    checked={
                                      form.watch("serviceConfirmType") ===
                                      "AUTO"
                                    }
                                    onChange={(e: any) =>
                                      form.setValue(
                                        "serviceConfirmType",
                                        e.target.value,
                                      )
                                    }
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="auto"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("auto_confirm")}
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="manual"
                                    name="serviceConfirmType"
                                    value="MANUAL"
                                    checked={
                                      form.watch("serviceConfirmType") ===
                                      "MANUAL"
                                    }
                                    onChange={(e: any) =>
                                      form.setValue(
                                        "serviceConfirmType",
                                        e.target.value,
                                      )
                                    }
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="manual"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("manual")}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="my-2">
                              <Label dir={langDir} translate="no">
                                {t("renew")}
                              </Label>
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="auto"
                                    name="renew"
                                    value="every_week"
                                    checked={
                                      form.watch("renewEveryWeek") === true
                                    }
                                    onChange={handleRenewFun}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="auto"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("every_week")}
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id="auto"
                                    name="renew"
                                    value="one_time"
                                    checked={form.watch("oneTime") === true}
                                    onChange={handleRenewFun}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor="manual"
                                    className="ml-2 text-sm text-gray-700"
                                    translate="no"
                                  >
                                    {t("one_by_general_tool")}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="my-2">
                              <div className="flex flex-col space-y-4">
                                {watchServiceType == "MOVING" ? (
                                  <>
                                    <Label dir={langDir} translate="no">
                                      {t("shipping")}
                                    </Label>
                                    <div className="flex items-center space-x-6">
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          id="direction"
                                          name="shippingType"
                                          value="DIRECTION"
                                          checked={form.watch("shippingType") === "DIRECTION"}
                                          onChange={(e: any) =>
                                            form.setValue(
                                              "shippingType",
                                              e.target.value
                                            )
                                          }
                                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label
                                          htmlFor="direction"
                                          className="ml-2 text-sm text-gray-700"
                                          translate="no"
                                        >
                                          {t("direction")}
                                        </label>
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          id="rang"
                                          name="shippingType"
                                          value="RANG"
                                          checked={
                                            form.watch("shippingType") === "RANG"
                                          }
                                          onChange={(e: any) =>
                                            form.setValue(
                                              "shippingType",
                                              e.target.value,
                                            )
                                          }
                                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                          translate="no"
                                        />
                                        <label
                                          htmlFor="rang"
                                          className="ml-2 text-sm text-gray-700"
                                          translate="no"
                                        >
                                          {t("range")}
                                        </label>
                                      </div>
                                    </div>
                                  </>
                                ) : null}
                                <div className="mt-2 flex flex-col gap-y-3">
                                  <Label dir={langDir} translate="no">
                                    {t("select_country")}
                                  </Label>
                                  <ReactSelect
                                    onChange={(newValue: any) => {
                                      form.setValue(
                                        "countryId",
                                        newValue?.value,
                                      );
                                      form.setValue("stateId", null); // Reset state when country changes
                                      resetCities();
                                      setStates([]);
                                      setCities([]); // Clear cities when country changes
                                    }}
                                    value={memoizedAllCountries.find(
                                      (item: any) =>
                                        item.value === form.watch("countryId"),
                                    )}
                                    options={memoizedAllCountries}
                                    styles={customStyles}
                                    instanceId="countryId"
                                    placeholder={t("select")}
                                  />
                                  <p className="text-[13px] text-destructive" dir={langDir} translate="no">
                                    {
                                      form.formState.errors["countryId"]?.message || ''
                                    }
                                  </p>
                                </div>
                                <div className="mt-2 flex flex-col gap-y-3">
                                  {/* State Dropdown - Visible only if country is selected */}
                                  {form.watch("countryId") ? (
                                    <>
                                      <Label dir={langDir} translate="no">
                                        {t("select_state")}
                                      </Label>
                                      <ReactSelect
                                        onChange={(newValue: any) => {
                                          form.setValue(
                                            "stateId",
                                            newValue?.value,
                                          );
                                          resetCities();
                                          setCities([]); // Clear cities when state changes
                                        }}
                                        value={
                                          states.find(
                                            (item) =>
                                              item.value ===
                                              form.watch("stateId"),
                                          ) || null
                                        }
                                        options={states}
                                        styles={customStyles}
                                        instanceId="stateId"
                                        placeholder={t("select")}
                                      />
                                      <p className="text-[13px] text-destructive" dir={langDir} translate="no">
                                        {
                                          form.formState.errors["stateId"]?.message || ''
                                        }
                                      </p>
                                    </>
                                  ) : null}
                                </div>
                                {form.watch("stateId") &&
                                  (form.watch("shippingType") === "DIRECTION" ? (
                                    <div className="space-y-4">
                                      <div>
                                        <Label dir={langDir} translate="no">
                                          {t("from_city")}
                                        </Label>
                                        <ReactSelect
                                          onChange={(newValue: any) => {
                                            form.setValue(
                                              "fromCityId",
                                              newValue?.value,
                                            ); // Set the value for fromCityId
                                          }}
                                          options={cities}
                                          value={
                                            cities.find(
                                              (item) =>
                                                item.value ===
                                                form.watch("fromCityId"),
                                            ) || null
                                          } // Watch the value for fromCityId
                                          styles={customStyles}
                                          instanceId="fromCityId"
                                          placeholder={t("select")}
                                        />
                                        {form.formState.errors.fromCityId ? (
                                          <p className="mt-1 text-sm text-destructive" dir={langDir} translate="no">
                                            {
                                              form.formState.errors.fromCityId.message || ''
                                            }
                                          </p>
                                        ) : null}
                                      </div>

                                      <div>
                                        <Label dir={langDir} translate="no">
                                          {t("to_city")}
                                        </Label>
                                        <ReactSelect
                                          onChange={(newValue: any) => {
                                            form.setValue(
                                              "toCityId",
                                              newValue?.value,
                                            ); // Set the value for toCityId
                                          }}
                                          options={cities}
                                          value={
                                            cities.find(
                                              (item) =>
                                                item.value ===
                                                form.watch("toCityId"),
                                            ) || null
                                          } // Watch the value for toCityId
                                          styles={customStyles}
                                          instanceId="toCityId"
                                          placeholder={t("select")}
                                        />
                                        {form.formState.errors.toCityId ? (
                                          <p className="mt-1 text-sm text-destructive" dir={langDir} translate="no">
                                            {
                                              form.formState.errors.toCityId.message || ''
                                            }
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <Label dir={langDir} translate="no">
                                        {t("range_city")}
                                      </Label>
                                      <ReactSelect
                                        onChange={(newValue: any) => {
                                          form.setValue(
                                            "rangeCityId",
                                            newValue?.value,
                                          ); // Set the value for rangeCityId
                                        }}
                                        options={cities}
                                        value={
                                          cities.find(
                                            (item) =>
                                              item.value ===
                                              form.watch("rangeCityId"),
                                          ) || null
                                        } // Watch the value for rangeCityId
                                        styles={customStyles}
                                        instanceId="rangeCityId"
                                        placeholder={t("select")}
                                      />
                                      {form.formState.errors.rangeCityId ? (
                                        <p className="mt-1 text-sm text-destructive" dir={langDir} translate="no">
                                          {
                                            form.formState.errors.rangeCityId.message || ''
                                          }
                                        </p>
                                      ) : null}
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div className="my-4 grid grid-cols-2 gap-4">
                              {/* Each Customer Input */}
                              <div>
                                <Label dir={langDir} translate="no">
                                  {t("each_customer")}
                                </Label>
                                <input
                                  type="text"
                                  className="w-full rounded border border-gray-300 p-2"
                                  min={0}
                                  placeholder={t("enter_minutes")}
                                  {...form.register("eachCustomerTime")}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(
                                      /[^\d]/g,
                                      "",
                                    );
                                    form.setValue(
                                      "eachCustomerTime",
                                      cleaned
                                        ? parseInt(cleaned, 10)
                                        : (undefined as any),
                                    );
                                    if (cleaned) {
                                      form.clearErrors("eachCustomerTime");
                                    }
                                  }}
                                  value={form.watch("eachCustomerTime") || ""}
                                  translate="no"
                                />
                                {form.formState.errors.eachCustomerTime ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {
                                      form.formState.errors.eachCustomerTime
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>

                              {/* Customer/Period Input */}
                              <div>
                                <Label dir={langDir} translate="no">
                                  {t("customer_per_period")}
                                </Label>
                                <input
                                  type="text"
                                  min={0}
                                  className="w-full rounded border border-gray-300 p-2"
                                  placeholder={t("enter_number")}
                                  {...form.register("customerPerPeiod")}
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(
                                      /[^\d]/g,
                                      "",
                                    );
                                    form.setValue(
                                      "customerPerPeiod",
                                      cleaned
                                        ? parseInt(cleaned, 10)
                                        : (undefined as any),
                                    );
                                    if (cleaned) {
                                      form.clearErrors("customerPerPeiod");
                                    }
                                  }}
                                  value={form.watch("customerPerPeiod") || ""}
                                  translate="no"
                                />
                                {form.formState.errors.customerPerPeiod ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {
                                      form.formState.errors.customerPerPeiod
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="my-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div className="col-span-1">
                                <ControlledTimePicker
                                  label={t("open_time")}
                                  name="openTime"
                                />
                                {form.formState.errors.openTime ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {form.formState.errors.openTime.message}
                                  </p>
                                ) : null}
                              </div>
                              <div className="col-span-1">
                                <ControlledTimePicker
                                  label={t("close_time")}
                                  name="closeTime"
                                />
                                {form.formState.errors.closeTime ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {form.formState.errors.closeTime.message}
                                  </p>
                                ) : null}
                              </div>
                              <div className="col-span-1">
                                <ControlledTimePicker
                                  label={t("break_time_from")}
                                  name="breakTimeFrom"
                                />
                                {form.formState.errors.breakTimeFrom ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {
                                      form.formState.errors.breakTimeFrom
                                        .message
                                    }
                                  </p>
                                ) : null}
                              </div>
                              <div className="col-span-1">
                                <ControlledTimePicker
                                  label={t("break_time_to")}
                                  name="breakTimeTo"
                                />
                                {form.formState.errors.breakTimeTo ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {form.formState.errors.breakTimeTo.message}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <ProductDetailsSection /> */}

                <div className="grid w-full grid-cols-4 gap-x-5">
                  <div className="col-span-4 mb-3 w-full rounded-lg border border-solid border-gray-300 bg-white p-2 shadow-xs sm:p-3 lg:p-4">
                    <div className="form-groups-common-sec-s1">
                      <DescriptionAndSpecificationSection />
                      <div className="mb-4 mt-4 inline-flex w-full items-center justify-end gap-2">
                        <Button
                          disabled={
                            createService.isPending ||
                            updateService.isPending ||
                            uploadMultiple.isPending
                          }
                          type="submit"
                          className="h-10 rounded bg-dark-orange px-6 text-center text-sm font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90 md:h-12 md:px-10 md:text-lg"
                          dir={langDir}
                          translate="no"
                        >
                          {createService.isPending ||
                          updateService.isPending ||
                          uploadMultiple.isPending ? (
                            <LoaderWithMessage message={t("please_wait")} />
                          ) : editId ? (
                            t("update")
                          ) : (
                            t("submit")
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreateServicePage;
