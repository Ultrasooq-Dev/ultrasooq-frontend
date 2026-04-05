import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type AddImageContentProps = {
  description: string;
};

const AddImageContent: React.FC<AddImageContentProps> = ({ description }) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
      <div className="flex h-full flex-col items-center justify-center">
        <Image
          src="/images/upload.png"
          className="mb-3"
          width={30}
          height={30}
          alt="camera"
        />
        <span>{description}</span>
        <span className="text-primary">browse</span>
        <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" dir={langDir} translate="no">
          ({t("company_logo_spec")})
        </p>
      </div>
    </div>
  );
};

export default AddImageContent;
