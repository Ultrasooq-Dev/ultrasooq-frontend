import { UseFormReturn } from "react-hook-form";
import { OptionProps } from "@/utils/types/common.types";

export interface CompanyProfileFormValues {
  uploadImage?: any;
  uploadCR?: any;
  crDocument?: string;
  logo?: string;
  companyName: string;
  businessTypeList?: Array<{ categoryId: number; categoryLocation?: string; name?: string }>;
  annualPurchasingVolume: string;
  address: string;
  city: string;
  province: string;
  country: string;
  yearOfEstablishment: string;
  totalNoOfEmployee: string;
  aboutUs?: string;
  aboutUsJson?: any[] | "";
  branchList: BranchItem[];
}

export interface BranchItem {
  profileType?: string;
  businessTypeList?: Array<{ categoryId: number; categoryLocation?: string; name?: string }>;
  branchFrontPicture?: string;
  proofOfAddress?: string;
  address: string;
  city: string;
  province: string;
  country: string;
  cc: string;
  contactNumber: string;
  contactName: string;
  startTime: string;
  endTime: string;
  workingDays: {
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
  };
  categoryList?: any;
  mainOffice?: boolean;
}

export interface CompanyBasicInfoProps {
  form: UseFormReturn<any>;
  langDir: string;
  imageFile: FileList | null | undefined;
  crFile: FileList | null | undefined;
  setImageFile: (files: FileList | null) => void;
  setCrFile: (files: FileList | null) => void;
  businessTypeModalOpen: boolean;
  businessTypeModalField: string;
  setBusinessTypeModalOpen: (open: boolean) => void;
  setBusinessTypeModalField: (field: string) => void;
  memoizedCountries: OptionProps[];
  memoizedLastTwoHundredYears: any[];
}

export interface CompanyAddressProps {
  langDir: string;
  memoizedCountries: OptionProps[];
}

export interface CompanyMoreInfoProps {
  langDir: string;
  memoizedLastTwoHundredYears: any[];
}

export interface CompanyBranchItemProps {
  form: UseFormReturn<any>;
  index: number;
  langDir: string;
  memoizedCountries: OptionProps[];
  businessTypeModalOpen: boolean;
  businessTypeModalField: string;
  setBusinessTypeModalOpen: (open: boolean) => void;
  setBusinessTypeModalField: (field: string) => void;
  categoryModalOpen: boolean;
  categoryModalField: string;
  setCategoryModalOpen: (open: boolean) => void;
  setCategoryModalField: (field: string) => void;
  handleUploadedFile: (files: FileList | null) => Promise<string | undefined>;
  removeBranchList: (index: number) => void;
}
