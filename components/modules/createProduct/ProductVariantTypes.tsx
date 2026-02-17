import React from "react";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import AddIcon from "@/public/images/add-icon.svg";
import TrashIcon from "@/public/images/social-delete-icon.svg";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ProductVariants from "./ProductVariants";

const ProductVariantTypes = () => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const formContext = useFormContext();

    const fieldArrayForProductVariants = useFieldArray({
        control: formContext.control,
        name: "productVariants",
    });

    const appendProductVariant = () =>
        fieldArrayForProductVariants.append({
            type: "",
            variants: [
                {
                    value: "",
                    image: null,
                }
            ]
        });

    const removeProductVariant = (index: number) => fieldArrayForProductVariants.remove(index);

    return (
        <>
            <div className="flex w-full items-center justify-end">
                <Button
                    type="button"
                    onClick={appendProductVariant}
                    className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                    dir={langDir}
                    translate="no"
                >
                    <Image src={AddIcon} className="mr-1" alt="add-icon" />
                    <span>{t("add_variant_type")}</span>
                </Button>
            </div>

            {fieldArrayForProductVariants.fields.map((field, index) => (
                <React.Fragment key={field.id}>
                    {index != 0 ? <div className="mt-5 w-full"><hr/></div> : null}

                    <div className="mt-2 w-full">
                        <label
                            className="text-sm font-medium leading-none text-color-dark"
                            dir={langDir}
                            translate="no"
                        >
                            {t("variant_type")}
                        </label>
                        <ControlledTextInput
                            name={`productVariants.${index}.type`}
                            label={t("variant_type")}
                            dir={langDir}
                            translate="no"
                        />
                    </div>

                    <ProductVariants index={index} />

                    {index !== 0 ? (<div className="flex w-full items-center justify-end">
                        <Button
                            type="button"
                            onClick={() => removeProductVariant(index)}
                            className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                            dir={langDir}
                            translate="no"
                        >
                            <Image src={TrashIcon} className="mr-1" alt="add-icon" />
                            <span>{t("delete_variant_type")}</span>
                        </Button>
                    </div>) : null}
                </React.Fragment>
            ))}
        </>
    )
};

export default ProductVariantTypes;