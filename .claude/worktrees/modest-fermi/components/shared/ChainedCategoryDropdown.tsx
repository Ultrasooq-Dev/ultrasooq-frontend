import {
  LINK_CATEGORY_ONE_LIST,
  LINK_CATEGORY_THREE_LIST,
  LINK_CATEGORY_TWO_LIST,
} from "@/utils/dummyDatas";
import React, { useState } from "react";
import ReactSelect from "react-select";

const customStyles = {
  control: (base: any) => ({
    ...base,
    // height: 48,
    minHeight: 48,
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
  }),
};

type OptionType = {
  label: string;
  value: string;
};

const ChainedCategoryDropdown = () => {
  const [categoryListOne, setCategoryListOne] = useState<OptionType[]>([]);
  const [categoryListTwo, setCategoryListTwo] = useState<OptionType[]>([]);
  const [categoryListThree, setCategoryListThree] = useState<OptionType[]>([]);

  const formatLinkCategoryTwoList = () => {
    if (!categoryListOne) return;

    const tempList: any = [];

    categoryListOne.map((item: { label: string; value: string }) => {
      if (LINK_CATEGORY_TWO_LIST[item.value]) {
        tempList.push(LINK_CATEGORY_TWO_LIST[item.value]);
      }
    });

    return tempList?.flat();
  };

  const formatLinkCategoryThreeList = () => {
    if (!categoryListTwo) return;

    const tempList: any = [];

    categoryListTwo.map((item: { label: string; value: string }) => {
      if (LINK_CATEGORY_THREE_LIST[item.value]) {
        tempList.push(LINK_CATEGORY_THREE_LIST[item.value]);
      }
    });

    return tempList?.flat();
  };

  return (
    <div className="my-3 w-full space-y-2">
      <p>Select Linked Category</p>
      {/* <div className="grid grid-cols-3 gap-x-3"> */}
      <div className="space-y-2">
        <ReactSelect
          options={LINK_CATEGORY_ONE_LIST}
          value={categoryListOne}
          onChange={(selectedOptions) => {
            setCategoryListOne(selectedOptions as OptionType[]);
          }}
          styles={customStyles}
          isMulti
          instanceId="link_1"
        />
        <ReactSelect
          options={formatLinkCategoryTwoList() || []}
          value={categoryListTwo}
          onChange={(selectedOptions) => {
            setCategoryListTwo(selectedOptions as OptionType[]);
          }}
          isMulti
          styles={customStyles}
          instanceId="link_2"
        />
        <ReactSelect
          options={formatLinkCategoryThreeList() || []}
          value={categoryListThree}
          onChange={(selectedOptions) => {
            setCategoryListThree(selectedOptions as OptionType[]);
          }}
          isMulti
          styles={customStyles}
          instanceId="link_3"
        />
      </div>
    </div>
  );
};

export default ChainedCategoryDropdown;
