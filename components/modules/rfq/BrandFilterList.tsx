import React, { useState, useMemo, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { useBrands } from "@/apis/queries/masters.queries";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type BrandFilterListTypes = {
  selectAllBrands?: boolean;
  selectedBrandsCount?: number;
  onSelectBrands?: (brandIds: number[]) => void;
};

const BrandFilterList: React.FC<BrandFilterListTypes> = ({
  selectAllBrands = false,
  selectedBrandsCount,
  onSelectBrands,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const brandsQuery = useBrands({
    term: searchTerm,
  });

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const handleBrandChange = (
    checked: boolean | string,
    item: ISelectOptions,
  ) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }

    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setSelectedBrandIds(tempArr);
    onSelectBrands && onSelectBrands(tempArr);
  };

  useEffect(() => {
    if (selectAllBrands) {
      setSelectedBrandIds(
        brandsQuery?.data?.data.map((item: IBrands) => {
          return item.id;
        }) || [],
      );

      onSelectBrands &&
        onSelectBrands(
          brandsQuery?.data?.data.map((item: IBrands) => {
            return item.id;
          }) || [],
        );
    } else {
      setSelectedBrandIds([]);
    }
  }, [selectAllBrands]);

  useEffect(() => {
    if (selectedBrandsCount == 0 && !selectAllBrands) {
      setSelectedBrandIds([]);
    }
  }, [selectedBrandsCount]);

  return (
    <div className="trending-search-sec mt-0">
      <div className="container m-auto">
        <div className="left-filter">
          <Accordion
            type="multiple"
            defaultValue={["brand"]}
            className="filter-col"
          >
            <AccordionItem value="brand">
              <AccordionTrigger className="px-3 text-base hover:no-underline!" dir={langDir} translate="no">
                {t("by_brand")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="filter-sub-header">
                  <Input
                    type="text"
                    placeholder={t("search_brand")}
                    className="custom-form-control-s1 searchInput rounded-none"
                    onChange={handleDebounce}
                    dir={langDir}
                    translate="no"
                  />
                </div>
                <div className="filter-body-part">
                  <div className="filter-checklists">
                    {!memoizedBrands.length ? (
                      <p className="text-center text-sm font-medium" dir={langDir} translate="no">
                        {t("no_data_found")}
                      </p>
                    ) : null}
                    {memoizedBrands.map((item: ISelectOptions) => (
                      <div key={item.value} className="div-li">
                        <Checkbox
                          id={item.label}
                          className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                          onCheckedChange={(checked) =>
                            handleBrandChange(checked, item)
                          }
                          checked={selectedBrandIds.includes(item.value)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={item.label}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default BrandFilterList;
