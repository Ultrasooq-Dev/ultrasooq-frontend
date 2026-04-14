"use client";
import React, { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useCreateCompanyProfile } from "@/apis/queries/company.queries";
import { useRunCRPipeline } from "@/apis/queries/verification.queries";
import { useUploadFile } from "@/apis/queries/upload.queries";
import { useCountries } from "@/apis/queries/masters.queries";
import { ICountries } from "@/utils/types/common.types";
import { getLastTwoHundredYears } from "@/utils/helper";
import { formSchema } from "./companyProfileSchema";

const defaultBranch = {
  profileType: "COMPANY",
  businessTypeList: undefined,
  branchFrontPicture: "",
  proofOfAddress: "",
  address: "",
  city: "",
  province: "",
  country: "",
  cc: "",
  contactNumber: "",
  contactName: "",
  startTime: "",
  endTime: "",
  workingDays: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 },
  categoryList: undefined,
  mainOffice: false,
};

export function useCompanyProfile() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<FileList | null>();
  const [crFile, setCrFile] = useState<FileList | null>();
  const [businessTypeModalOpen, setBusinessTypeModalOpen] = useState(false);
  const [businessTypeModalField, setBusinessTypeModalField] = useState<string>("businessTypeList");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalField, setCategoryModalField] = useState<string>("");

  const currentAccount = useCurrentAccount();
  const countriesQuery = useCountries();
  const upload = useUploadFile();
  const createCompanyProfile = useCreateCompanyProfile();
  const runCRPipeline = useRunCRPipeline();

  const currentAccountData = currentAccount?.data?.data?.account;
  const currentTradeRole = currentAccountData?.tradeRole;

  const form = useForm({
    resolver: zodResolver(formSchema(t)) as any,
    defaultValues: {
      uploadImage: undefined,
      logo: "",
      profileType: "COMPANY",
      companyLogo: "",
      companyName: "",
      annualPurchasingVolume: "",
      businessTypeList: undefined,
      address: "",
      city: "",
      province: "",
      country: "",
      yearOfEstablishment: "",
      totalNoOfEmployee: "",
      aboutUs: "",
      aboutUsJson: undefined,
      branchList: [defaultBranch],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: "branchList",
  });

  const memoizedCountries = useMemo(() => {
    return (
      countriesQuery?.data?.data.map((item: ICountries) => ({
        label: item.countryName,
        value: item.countryName,
      })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesQuery?.data?.data?.length]);

  const memoizedLastTwoHundredYears = useMemo(() => {
    return getLastTwoHundredYears() || [];
  }, []);

  // Redirect if user is not on a COMPANY account
  React.useEffect(() => {
    if (currentTradeRole && currentTradeRole !== "COMPANY") {
      if (currentTradeRole === "BUYER") {
        router.replace("/buyer-profile-details");
      } else if (currentTradeRole === "FREELANCER") {
        router.replace("/freelancer-profile");
      }
    }
  }, [currentTradeRole, router]);

  const appendBranchList = () => fieldArray.append({ ...defaultBranch });

  const removeBranchList = (index: number) => fieldArray.remove(index);

  const handleUploadedFile = async (files: FileList | null) => {
    if (files) {
      const formData = new FormData();
      formData.append("content", files[0]);
      const response = await upload.mutateAsync(formData);
      if (response.status && response.data) {
        return response.data;
      }
    }
  };

  const onSubmit = async (formData: any) => {
    const data = {
      ...formData,
      aboutUs: formData.aboutUsJson?.length
        ? JSON.stringify(formData.aboutUsJson)
        : undefined,
      profileType: "COMPANY",
    };

    if (data.branchList) {
      if (data.branchList.filter((item: any) => item.mainOffice === 1).length < 1) {
        toast({ title: t("please_select_atleast_one_main_office"), variant: "danger" });
        return;
      }
      if (data.branchList.filter((item: any) => item.mainOffice === 1).length > 1) {
        toast({ title: t("please_select_only_one_main_office"), variant: "danger" });
        return;
      }
      data.branchList = data.branchList.map((item: any) => ({
        ...item,
        profileType: "COMPANY",
      }));
    }

    formData.uploadImage = imageFile;
    let getImageUrl;
    if (formData.uploadImage) {
      getImageUrl = await handleUploadedFile(formData.uploadImage);
    }
    delete data.uploadImage;
    if (getImageUrl) data.logo = getImageUrl;

    formData.uploadCR = crFile;
    let getCrUrl;
    if (formData.uploadCR) {
      getCrUrl = await handleUploadedFile(formData.uploadCR);
    }
    delete data.uploadCR;
    if (getCrUrl) data.crDocument = getCrUrl;

    delete data.aboutUsJson;

    const response = await createCompanyProfile.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("profile_create_successful"),
        description: response.message,
        variant: "success",
      });

      if (getCrUrl) {
        toast({
          title: "AI Processing CR Document...",
          description: "Auto-filling company details from your Commercial Registration.",
          variant: "default",
        });
        runCRPipeline.mutate(
          { crDocumentUrl: getCrUrl },
          {
            onSuccess: (result) => {
              if (result.status) {
                toast({
                  title: "CR Verified Successfully!",
                  description: `Company: ${result.data?.extraction?.companyName || "Extracted"} — Profile auto-filled, ${result.data?.categoryMatches?.length || 0} categories matched.`,
                  variant: "success",
                });
              }
            },
            onError: () => {
              toast({
                title: "CR processing failed",
                description: "You can fill your profile manually.",
                variant: "danger",
              });
            },
          },
        );
      }

      form.reset();
      router.push("/company-profile-details");
    } else {
      toast({
        title: t("profile_create_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return {
    t,
    langDir,
    form,
    fieldArray,
    imageFile,
    setImageFile,
    crFile,
    setCrFile,
    businessTypeModalOpen,
    setBusinessTypeModalOpen,
    businessTypeModalField,
    setBusinessTypeModalField,
    categoryModalOpen,
    setCategoryModalOpen,
    categoryModalField,
    setCategoryModalField,
    memoizedCountries,
    memoizedLastTwoHundredYears,
    currentAccount,
    currentTradeRole,
    createCompanyProfile,
    upload,
    handleUploadedFile,
    appendBranchList,
    removeBranchList,
    onSubmit,
  };
}
