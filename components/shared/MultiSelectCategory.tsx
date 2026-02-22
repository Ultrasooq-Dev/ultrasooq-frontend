import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { useCategory } from "@/apis/queries/category.queries";
import { Checkbox } from "../ui/checkbox";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { useTranslations } from "use-intl";
import { useAuth } from "@/context/AuthContext";
import { BUSINESS_TYPE_CATEGORY_ID } from "@/utils/constants";

type CategoryProps = {
  id: number;
  parentId: number;
  name: string;
  icon: string;
  children: CategoryProps[];
};

type FormCategoryProps = {
  categoryId: number;
  categoryLocation: string;
};

type MultiSelectCategoryProps = {
  name: string;
  branchId?: string | undefined | null;
};

const MultiSelectCategory: React.FC<MultiSelectCategoryProps> = ({
  name,
  branchId,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formContext = useFormContext();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subCategoryIndex, setSubCategoryIndex] = useState(0);
  const [subSubCategoryIndex, setSubSubCategoryIndex] = useState(0);
  const [subSubSubCategoryIndex, setSubSubSubCategoryIndex] = useState(0);
  const [multiSubCategoryList, setMultiSubCategoryList] = useState<CategoryProps[]>([]);
  const [multiSubSubCategoryList, setMultiSubSubCategoryList] = useState<CategoryProps[]>([]);
  const [multiSubSubSubCategoryList, setMultiSubSubSubCategoryList] = useState<CategoryProps[]>(
    [],
  );

  const watcher = formContext.watch(name);

  const categoryQuery = useCategory(BUSINESS_TYPE_CATEGORY_ID.toString());
  const subCategoryQuery = useCategory(
    categoryId ? String(categoryId) : "",
    !!categoryId,
  );

  const memoizedMenu = useMemo(() => {
    if (categoryQuery.data?.data) {
      return categoryQuery.data.data?.children || [];
    }
  }, [categoryQuery.data?.data]);

  const memoizedSubCategory = useMemo(() => {
    if (subCategoryQuery.data?.data) {
      return subCategoryQuery.data.data?.children || [];
    }
  }, [subCategoryQuery.data?.data]);

  useEffect(() => {
    if (branchId && (watcher ?? []).length) {
      const id = watcher[0]?.categoryLocation?.split(",")[0];
      if (id) setCategoryId(Number(id));
    }
  }, [branchId, watcher]);

  useEffect(() => {
    if (branchId && (watcher ?? []).length && categoryId) {
      const tempArr: CategoryProps[] = [];
      memoizedMenu?.forEach((item: CategoryProps) => {
        if (watcher.find((ele: FormCategoryProps) => ele.categoryId === item.id))
          tempArr.push(item);
      });

      setMultiSubCategoryList(tempArr);
    }
  }, [branchId, watcher, categoryId, memoizedMenu]);

  useEffect(() => {
    if (
      branchId &&
      (watcher ?? []).length &&
      categoryId &&
      multiSubCategoryList.length
    ) {
      const tempArr: CategoryProps[] = [];
      const tempArr2: CategoryProps[] = multiSubCategoryList
        .map((item: CategoryProps) => item.children)
        .flat();
      tempArr2.forEach((item: CategoryProps) => {
        if (watcher.find((ele: FormCategoryProps) => ele.categoryId === item.id))
          tempArr.push(item);
      });

      setMultiSubSubCategoryList(tempArr);
    }
  }, [branchId, watcher, categoryId, multiSubCategoryList]);

  useEffect(() => {
    if (
      branchId &&
      (watcher ?? []).length &&
      categoryId &&
      multiSubCategoryList.length &&
      multiSubSubCategoryList.length
    ) {
      const tempArr: CategoryProps[] = [];
      const tempArr2: CategoryProps[] = multiSubSubCategoryList
        .map((item: CategoryProps) => item.children)
        .flat();
      tempArr2.forEach((item: CategoryProps) => {
        if (watcher.find((ele: FormCategoryProps) => ele.categoryId === item.id))
          tempArr.push(item);
      });

      setMultiSubSubSubCategoryList(tempArr);
    }
  }, [
    branchId,
    watcher,
    categoryId,
    multiSubCategoryList,
    multiSubSubCategoryList,
  ]);

  return (
    <div className="my-3 space-y-2"dir={langDir}>
      <Label translate="no">{t("categories")}</Label>

      <div className="flex flex-wrap md:grid md:grid-cols-3">
        {memoizedMenu?.length ? (
          <div className="w-full overflow-y-auto md:max-h-[300px]">
            {memoizedMenu?.map((item: CategoryProps, index: number) => (
              <div
                key={item?.id}
                className="dropdown-content-child flex cursor-pointer items-center justify-start gap-x-2 p-3"
                onMouseEnter={() => setSubCategoryIndex(index)}
                onClick={() => {
                  setSubCategoryIndex(index);
                }}
              >
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  checked={
                    multiSubCategoryList?.filter(
                      (ele: CategoryProps) => ele.id === item.id,
                    ).length > 0
                  }
                  onCheckedChange={(checked) => {
                    let tempArr: CategoryProps[] = multiSubCategoryList || [];
                    // if true and does not exist in array then push
                    if (
                      checked &&
                      !tempArr.find((ele: CategoryProps) => ele.id === item.id)
                    ) {
                      tempArr = [...tempArr, item];

                      formContext.setValue(name, [
                        ...(watcher ?? []),
                        {
                          categoryId: item.id,
                          categoryLocation: `${item.id.toString()}`,
                        },
                      ]);
                    }

                    // if false and exist in array then remove
                    if (
                      !checked &&
                      tempArr.find((ele: CategoryProps) => ele.id === item.id)
                    ) {
                      tempArr = tempArr.filter(
                        (ele: CategoryProps) => ele.id !== item.id,
                      );

                      formContext.setValue(
                        name,
                        watcher?.filter((ele: FormCategoryProps) => {
                          if (ele.categoryId !== item.id) {
                            return ele;
                          }
                        }),
                      );
                    }
                    // formContext.setValue(
                    //   name,
                    //   tempArr.map((ele: any) => ({
                    //     categoryId: ele.id,
                    //     categoryLocation: `${ele.id.toString()}`,
                    //   })),
                    // );
                    setMultiSubCategoryList(tempArr);
                  }}
                />
                {item?.icon ? (
                  <Image
                    src={item.icon}
                    alt={item?.name}
                    height={24}
                    width={24}
                  />
                ) : (
                  <MdOutlineImageNotSupported size={24} />
                )}
                <p title={item?.name} className="text-beat text-start text-sm">
                  {item?.name}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {multiSubCategoryList
          ?.map(
            (item: CategoryProps) =>
              item?.children,
          )
          ?.flat()?.length ? (
          <div className="w-full overflow-y-auto md:max-h-[300px]">
            {multiSubCategoryList
              ?.map((item: CategoryProps) => item?.children)
              ?.flat()
              ?.map((item: CategoryProps, index: number) => (
                <div
                  key={item?.id}
                  className="dropdown-content-child flex cursor-pointer items-center justify-start gap-x-2 p-3"
                  onMouseEnter={() => setSubSubCategoryIndex(index)}
                  onClick={() => {
                    setSubSubCategoryIndex(index);
                  }}
                >
                  <Checkbox
                    className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                    checked={
                      multiSubSubCategoryList?.filter(
                        (ele: CategoryProps) => ele.id === item.id,
                      ).length > 0
                    }
                    onCheckedChange={(checked) => {
                      let tempArr: CategoryProps[] = multiSubSubCategoryList || [];
                      // if true and does not exist in array then push
                      if (
                        checked &&
                        !tempArr.find(
                          (ele: CategoryProps) => ele.id === item.id,
                        )
                      ) {
                        tempArr = [...tempArr, item];

                        formContext.setValue(name, [
                          ...(watcher ?? []),
                          {
                            categoryId: item.id,
                            categoryLocation: `${item.parentId.toString()},${item.id.toString()}`,
                          },
                        ]);
                      }

                      // if false and exist in array then remove
                      if (
                        !checked &&
                        tempArr.find((ele: CategoryProps) => ele.id === item.id)
                      ) {
                        tempArr = tempArr.filter(
                          (ele: CategoryProps) => ele.id !== item.id,
                        );

                        formContext.setValue(
                          name,
                          watcher?.filter((ele: FormCategoryProps) => {
                            if (ele.categoryId !== item.id) {
                              return ele;
                            }
                          }),
                        );
                      }

                      setMultiSubSubCategoryList(tempArr);
                    }}
                  />

                  {item?.icon ? (
                    <Image
                      src={item.icon}
                      alt={item?.name}
                      height={24}
                      width={24}
                    />
                  ) : (
                    <MdOutlineImageNotSupported size={24} />
                  )}
                  <p
                    title={item?.name}
                    className="text-beat text-start text-sm"
                  >
                    {item?.name}
                  </p>
                </div>
              ))}
          </div>
        ) : null}

        {multiSubSubCategoryList
          ?.map(
            (item: CategoryProps) =>
              item?.children,
          )
          ?.flat()?.length ? (
          <div className="w-full overflow-y-auto md:max-h-[300px]">
            {multiSubSubCategoryList
              ?.map((item: CategoryProps) => item?.children)
              ?.flat()
              ?.map((item: CategoryProps, index: number) => (
                <div
                  key={item?.id}
                  className="dropdown-content-child flex cursor-pointer items-start justify-start gap-x-2 p-3"
                  onMouseEnter={() => setSubSubSubCategoryIndex(index)}
                  onClick={() => {
                    setSubSubSubCategoryIndex(index);
                  }}
                >
                  <Checkbox
                    className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                    checked={
                      multiSubSubSubCategoryList?.filter(
                        (ele: CategoryProps) => ele.id === item.id,
                      ).length > 0
                    }
                    onCheckedChange={(checked) => {
                      let tempArr: CategoryProps[] = multiSubSubSubCategoryList || [];
                      // if true and does not exist in array then push
                      if (
                        checked &&
                        !tempArr.find(
                          (ele: CategoryProps) => ele.id === item.id,
                        )
                      ) {
                        tempArr = [...tempArr, item];

                        let grandParentId;
                        watcher?.map((ele: FormCategoryProps) => {
                          if (ele.categoryId === item.parentId) {
                            const tempId = ele.categoryLocation.split(",")?.[0];

                            grandParentId = tempId;
                          }
                        });

                        formContext.setValue(name, [
                          ...(watcher ?? []),
                          {
                            categoryId: item.id,
                            categoryLocation: `${grandParentId},${item.parentId.toString()},${item.id.toString()}`,
                          },
                        ]);
                      }

                      // if false and exist in array then remove
                      if (
                        !checked &&
                        tempArr.find((ele: CategoryProps) => ele.id === item.id)
                      ) {
                        tempArr = tempArr.filter(
                          (ele: CategoryProps) => ele.id !== item.id,
                        );

                        formContext.setValue(
                          name,
                          watcher?.filter((ele: FormCategoryProps) => {
                            if (ele.categoryId !== item.id) {
                              return ele;
                            }
                          }),
                        );
                      }

                      setMultiSubSubSubCategoryList(tempArr);
                    }}
                  />

                  {item?.icon ? (
                    <Image
                      src={item.icon}
                      alt={item?.name}
                      height={24}
                      width={24}
                    />
                  ) : (
                    <MdOutlineImageNotSupported size={24} />
                  )}

                  <p
                    title={item?.name}
                    className="text-beat text-start text-sm"
                  >
                    {item?.name}
                  </p>
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MultiSelectCategory;
