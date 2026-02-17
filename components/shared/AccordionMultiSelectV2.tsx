import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { OptionProps } from "@/utils/types/common.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type AccordionMultiSelectV2Props = {
  label: string;
  name: string;
  options?: OptionProps[];
  placeholder?: string;
  canCreate?: boolean;
  createOption?: (option: string) => void;
  error?: string;
};

const AccordionMultiSelectV2: React.FC<AccordionMultiSelectV2Props> = ({
  label,
  name,
  options = [],
  placeholder,
  canCreate = false,
  createOption = null,
  error,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const formContext = useFormContext();

  const watcher = formContext.watch(name);

  const [search, setSearch] = useState("");

  let filteredOptions: OptionProps[] = [...options];
  if (search) {
    filteredOptions = filteredOptions.filter((item) =>
      item.label
        .toString()
        .toLowerCase()
        .includes(search.toString().toLocaleLowerCase()),
    );
  }

  const addNew = (option: string) => {
    if (createOption) {
      createOption(option);
      setSearch("");
    }
  };

  return (
    <>
      <label
        className={cn(
          "mb-3 block",
          langDir == "rtl" ? "text-right" : "text-left",
          "text-sm font-medium leading-5 text-color-dark",
        )}
      >
        {label}
      </label>

      <Accordion
        type="single"
        collapsible
        className="mb-4 w-full rounded border border-solid border-gray-300 bg-white"
      >
        <AccordionItem value="item-1" className="border-b-0 px-2 md:px-3">
          <AccordionTrigger
            className="flex h-auto min-h-[48px] justify-between py-0 hover:no-underline!"
            dir={langDir}
          >
            <div className="my-2 flex flex-wrap">
              {(watcher || [])?.map((item: OptionProps) => (
                <p
                  key={item.value}
                  className="my-1 mr-1 inline-flex items-center justify-between rounded bg-zinc-100 px-2 py-2 text-sm font-normal capitalize leading-4 text-dark-cyan"
                >
                  {item.label}
                </p>
              ))}
              {!(watcher || [])?.length ? (
                <p className="capitalize" translate="no">
                  {t("select")} {placeholder}
                </p>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormItem
              className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0"
              dir={langDir}
            >
              <FormControl>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                ></Input>
              </FormControl>
            </FormItem>
            {canCreate && filteredOptions.length == 0 ? (
              <div className="mb-4">
                <a
                  href="javascript:void(0)"
                  onClick={(e) => addNew(search)}
                  style={{ cursor: "pointer" }}
                >
                  Add {`"${search}"`}
                </a>
              </div>
            ) : null}
            <div className="flex flex-col" dir={langDir}>
              {filteredOptions.map((item) => (
                <FormField
                  key={item.value}
                  control={formContext.control}
                  name={name}
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.value}
                        className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={
                              field.value?.filter(
                                (ele: OptionProps) => ele.value === item.value,
                              ).length > 0
                            }
                            onCheckedChange={(checked) => {
                              let tempArr = field.value || [];
                              // if true and does not exist in array then push
                              if (
                                checked &&
                                !tempArr.find(
                                  (ele: OptionProps) =>
                                    ele.value === item.value,
                                )
                              ) {
                                tempArr = [...tempArr, item];
                              }
                              // if false and exists in array then remove
                              if (
                                !checked &&
                                tempArr.find(
                                  (ele: OptionProps) =>
                                    ele.value === item.value,
                                )
                              ) {
                                tempArr = tempArr.filter(
                                  (ele: OptionProps) =>
                                    ele.value !== item.value,
                                );
                              }
                              field.onChange(tempArr);
                            }}
                            className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="mb-3 text-sm text-red-500" dir={langDir}>
        {error}
      </p>
    </>
  );
};

export default AccordionMultiSelectV2;
