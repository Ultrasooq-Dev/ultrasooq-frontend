import { z } from "zod";

export const formSchema = (t: any) => {
  return z.object({
    uploadImage: z.any().optional(),
    uploadCR: z.any().optional(),
    crDocument: z.string().trim().optional(),
    logo: z.string().trim().optional(),
    companyName: z
      .string()
      .trim()
      .min(2, { message: t("company_name_required") })
      .max(50, { message: t("company_name_must_be_less_than_50_chars") }),
    businessTypeList: z
      .array(z.object({ categoryId: z.number(), categoryLocation: z.string().optional() }))
      .min(1, { message: t("business_type_required") })
      .optional()
      .default([]),
    annualPurchasingVolume: z
      .string()
      .trim()
      .min(2, { message: t("annual_purchasing_volume_required") })
      .max(50, {
        message: t("annual_purchasing_volume_must_be_less_than_20_digits"),
      }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("address_required") })
      .max(50, {
        message: t("address_must_be_less_than_n_chars", { n: 50 }),
      }),
    city: z
      .string()
      .trim()
      .min(2, { message: t("city_required") }),
    province: z
      .string()
      .trim()
      .min(2, { message: t("province_required") }),
    country: z
      .string()
      .trim()
      .min(2, { message: t("country_required") }),
    yearOfEstablishment: z
      .string()
      .trim()
      .min(2, { message: t("year_of_establishment_required") })
      .transform((value) => Number(value)),
    totalNoOfEmployee: z
      .string()
      .trim()
      .min(2, { message: t("total_no_of_employees_required") }),
    aboutUs: z.string().trim().optional(),
    aboutUsJson: z.array(z.any()).optional().or(z.literal("")),
    branchList: z.array(
      z
        .object({
          branchFrontPicture: z.string().trim().optional(),
          proofOfAddress: z.string().trim().optional(),
          businessTypeList: z
            .array(
              z.object({
                categoryId: z.number(),
                categoryLocation: z.string().optional(),
              }),
              {
                error: t("business_type_required"),
              },
            )
            .min(1, {
              message: t("business_type_required"),
            })
            .transform((value) => {
              return value;
            }),
          address: z
            .string()
            .trim()
            .min(2, { message: t("address_required") })
            .max(50, {
              message: t("address_must_be_less_than_n_chars", { n: 50 }),
            }),
          city: z
            .string()
            .trim()
            .min(2, { message: t("city_required") }),
          province: z
            .string()
            .trim()
            .min(2, { message: t("province_required") }),
          country: z
            .string()
            .trim()
            .min(2, { message: t("country_required") }),
          cc: z.string().trim(),
          contactNumber: z
            .string()
            .trim()
            .min(2, { message: t("branch_contact_number_required") })
            .min(8, {
              message: t("branch_contact_number_must_be_min_n_digits", {
                n: 8,
              }),
            })
            .max(20, {
              message: t("branch_contact_number_cant_be_nore_than_n_digits", {
                n: 20,
              }),
            }),
          contactName: z
            .string()
            .trim()
            .min(2, { message: t("branch_contact_name_required") }),
          startTime: z
            .string()
            .trim()
            .min(1, {
              message: t("start_time_required"),
            }),
          endTime: z
            .string()
            .trim()
            .min(1, {
              message: t("end_time_required"),
            }),
          workingDays: z
            .object({
              sun: z.number(),
              mon: z.number(),
              tue: z.number(),
              wed: z.number(),
              thu: z.number(),
              fri: z.number(),
              sat: z.number(),
            })
            .refine((value) => {
              return (
                value.sun !== 0 ||
                value.mon !== 0 ||
                value.tue !== 0 ||
                value.wed !== 0 ||
                value.thu !== 0 ||
                value.fri !== 0 ||
                value.sat !== 0
              );
            }),
          categoryList: z.any().optional(),
          mainOffice: z
            .boolean()
            .transform((value) => (value ? 1 : 0))
            .optional(),
        })
        .superRefine(({ startTime, endTime }, ctx) => {
          if (startTime && endTime && startTime >= endTime) {
            ctx.addIssue({
              code: "custom",
              message: t("start_time_must_be_less_than_end_time"),
              path: ["startTime"],
            });
          }
        }),
    ),
  });
};
