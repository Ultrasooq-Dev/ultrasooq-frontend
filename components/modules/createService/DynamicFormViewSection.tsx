import DynamicForm from "@/components/shared/DynamicForm";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import React from "react";

type DynamicFormViewSectionProps = {
  dynamicFormList: any;
};

const DynamicFormViewSection: React.FC<DynamicFormViewSectionProps> = ({
  dynamicFormList,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="grid w-full grid-cols-1 gap-x-5">
      <div className="col-span-3 mb-3 w-full rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-4 lg:p-8">
        {!dynamicFormList?.length ? (
          <p className="text-center" dir={langDir} translate="no">{t("no_form_found")}</p>
        ) : null}

        <div className="space-y-5">
          {dynamicFormList?.map(
            (form: {
              categoryId: number;
              // categoryLocation: null;
              createdAt: string;
              deletedAt: string | null;
              formId: number;
              formIdDetail: any;
              id: number;
              status: string;
              updatedAt: string;
            }) => <DynamicForm key={form.id} form={form} />,
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicFormViewSection;
