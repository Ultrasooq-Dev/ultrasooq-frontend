"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { useCompanyProfile } from "./_components/useCompanyProfile";
import CompanyBasicInfo from "./_components/CompanyBasicInfo";
import CompanyAddress from "./_components/CompanyAddress";
import CompanyMoreInfo from "./_components/CompanyMoreInfo";
import CompanyBranchItem from "./_components/CompanyBranchItem";

export default function CompanyProfilePage() {
  const {
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
  } = useCompanyProfile();

  // Show loading while account data is being fetched
  if (currentAccount.isLoading || !currentTradeRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
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
      <div className="container relative z-10 m-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
          >
            <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
              <h2
                className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10"
                dir={langDir}
                translate="no"
              >
                {t("company_profile")}
              </h2>
            </div>

            <div className="flex w-full flex-wrap">
              <CompanyBasicInfo
                form={form}
                langDir={langDir}
                imageFile={imageFile}
                crFile={crFile}
                setImageFile={setImageFile}
                setCrFile={setCrFile}
                businessTypeModalOpen={businessTypeModalOpen}
                businessTypeModalField={businessTypeModalField}
                setBusinessTypeModalOpen={setBusinessTypeModalOpen}
                setBusinessTypeModalField={setBusinessTypeModalField}
                memoizedCountries={memoizedCountries}
                memoizedLastTwoHundredYears={memoizedLastTwoHundredYears}
              />

              <CompanyAddress
                langDir={langDir}
                memoizedCountries={memoizedCountries}
              />

              <CompanyMoreInfo
                langDir={langDir}
                memoizedLastTwoHundredYears={memoizedLastTwoHundredYears}
              />
            </div>

            {/* Branches section header */}
            <div className="mb-3.5 w-full">
              <div className="mb-4 flex w-full items-center justify-between border-y border-solid border-border py-2.5">
                <label
                  className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
                  dir={langDir}
                  translate="no"
                >
                  {t("branch")}
                </label>
                <Button
                  type="button"
                  onClick={appendBranchList}
                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                  dir={langDir}
                  translate="no"
                >
                  <Image
                    src="/images/add-icon.svg"
                    className="mr-1"
                    width={14}
                    height={14}
                    alt="add-icon"
                  />
                  <span>{t("add_new_branch")}</span>
                </Button>
              </div>
            </div>

            {fieldArray.fields.map((field, index) => (
              <CompanyBranchItem
                key={field.id}
                form={form}
                index={index}
                langDir={langDir}
                memoizedCountries={memoizedCountries}
                businessTypeModalOpen={businessTypeModalOpen}
                businessTypeModalField={businessTypeModalField}
                setBusinessTypeModalOpen={setBusinessTypeModalOpen}
                setBusinessTypeModalField={setBusinessTypeModalField}
                categoryModalOpen={categoryModalOpen}
                categoryModalField={categoryModalField}
                setCategoryModalOpen={setCategoryModalOpen}
                setCategoryModalField={setCategoryModalField}
                handleUploadedFile={handleUploadedFile}
                removeBranchList={removeBranchList}
              />
            ))}

            <Button
              disabled={createCompanyProfile.isPending || upload.isPending}
              type="submit"
              className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
              dir={langDir}
              translate="no"
            >
              {createCompanyProfile.isPending || upload.isPending ? (
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
                t("save_changes")
              )}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
