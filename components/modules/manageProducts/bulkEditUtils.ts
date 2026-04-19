import { SELL_TYPE_LIST, CONSUMER_TYPE_LIST, PRODUCT_CONDITION_LIST } from "@/utils/constants";

export const getSellTypes = (t: (key: string) => string) =>
  SELL_TYPE_LIST.map((item) => ({ label: t(item.label), value: item.value }));

export const getConsumerTypes = (t: (key: string) => string) =>
  CONSUMER_TYPE_LIST.map((item) => ({ label: t(item.label), value: item.value }));

export const getDiscountTypes = (t: (key: string) => string) => [
  { label: t("percentage"), value: "PERCENTAGE" },
  { label: t("flat"), value: "FLAT" },
];

export const getProductConditions = (t: (key: string) => string) =>
  PRODUCT_CONDITION_LIST.map((item) => ({ label: t(item.label), value: item.value }));

export const reactSelectCustomStyles = {
  control: (provided: any) => ({
    ...provided,
    minHeight: "32px",
    height: "32px",
    fontSize: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    "&:hover": {
      border: "1px solid #d1d5db",
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: "12px",
    padding: "4px 8px",
    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f3f4f6" : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  groupHeading: (base: any) => ({
    ...base,
    fontSize: "10px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    padding: "4px 8px 2px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  }),
  group: (base: any) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
  }),
};
