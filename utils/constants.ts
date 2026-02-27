import HomeIcon from "@/public/images/menu-icon-home.svg";
import TrendingIcon from "@/public/images/menu-icon-trending.svg";
import BuyIcon from "@/public/images/menu-icon-buy.svg";
import PosIcon from "@/public/images/menu-icon-pos.svg";
import RfqIcon from "@/public/images/menu-icon-rfq.svg";
import ServiceIcon from "@/public/images/menu-icon-service.svg";

export const ULTRASOOQ_TOKEN_KEY: string = "ultrasooq_accessToken";
export const ULTRASOOQ_REFRESH_TOKEN_KEY: string = "ultrasooq_refreshToken";
export const ULTRASOOQ_TEMP_TOKEN_KEY: string = "ultrasooq_temp_accessToken";

export const DAYS_OF_WEEK: {
  label: string;
  value: string;
}[] = [
  {
    label: "day_sun",
    value: "sun",
  },
  {
    label: "day_mon",
    value: "mon",
  },
  {
    label: "day_tue",
    value: "tue",
  },
  {
    label: "day_wed",
    value: "wed",
  },
  {
    label: "day_thu",
    value: "thu",
  },
  {
    label: "day_fri",
    value: "fri",
  },
  {
    label: "day_sat",
    value: "sat",
  },
];

export const SOCIAL_MEDIA_LIST: {
  label: string;
  value: string;
  icon: string;
}[] = [
  {
    label: "Facebook",
    value: "facebook",
    icon: "/images/social-facebook-icon.svg",
  },
  {
    label: "Twitter",
    value: "twitter",
    icon: "/images/social-twitter-icon.svg",
  },
  {
    label: "Instagram",
    value: "instagram",
    icon: "/images/social-instagram-icon.svg",
  },
  {
    label: "LinkedIn",
    value: "linkedIn",
    icon: "/images/social-linkedin-icon.svg",
  },
];

export const SOCIAL_MEDIA_ICON: Record<string, string> = {
  facebook: "/images/social-facebook-icon.svg",
  twitter: "/images/social-twitter-icon.svg",
  instagram: "/images/social-instagram-icon.svg",
  linkedIn: "/images/social-linkedin-icon.svg",
};

export const TAG_LIST: { label: string; value: string }[] = [
  { label: "online shope", value: "online_shope" },
  { label: "manufacturer / factory", value: "manufacturer_factory" },
  { label: "trading company", value: "trading_company" },
  { label: "distributor / wholesaler", value: "distributor_wholesaler" },
  { label: "retailer", value: "retailer" },
  { label: "individual", value: "individual" },
  { label: "other", value: "other" },
  { label: "service provider", value: "service_provider" },
];

export const BUSINESS_TYPE_LIST: { label: string; value: string }[] = [
  { label: "individual", value: "individual" },
  { label: "other", value: "other" },
  { label: "service provider", value: "service_provider" },
];

export const DAYS_NAME_LIST: { [key: string]: string } = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};

export const FREELANCER_UNIQUE_ID = "PUREFW";
export const COMPANY_UNIQUE_ID = "PUREFC";
export const MEMBER_UNIQUE_ID = "PUREFM";

export const WEEKDAYS_LIST = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const EMAIL_REGEX_LOWERCASE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export const ALPHABETS_REGEX = /^[a-zA-Z\s]*$/;

export const ALPHANUMERIC_REGEX = /^[0-9a-zA-Z\s]*$/;

export const HOURS_24_FORMAT = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

export const menuBarIconList: string[] = [
  HomeIcon,
  TrendingIcon,
  BuyIcon,
  PosIcon,
  RfqIcon,
  ServiceIcon,
];

export const ADMIN_BEARER = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

export const TRADE_ROLE_LIST: { label: string; value: string }[] = [
  {
    label: "buyer",
    value: "BUYER",
  },
  {
    label: "freelancer",
    value: "FREELANCER",
  },
  {
    label: "company",
    value: "COMPANY",
  },
];

export const GENDER_LIST: { label: string; value: string }[] = [
  {
    label: "male",
    value: "MALE",
  },
  {
    label: "female",
    value: "FEMALE",
  },
];

export const NO_OF_EMPLOYEES_LIST: { label: string; value: string }[] = [
  {
    label: "1-10",
    value: "1-10",
  },
  {
    label: "10-50",
    value: "10-50",
  },
  {
    label: "50-100",
    value: "50-100",
  },
  {
    label: "100-500",
    value: "100-500",
  },
  {
    label: "500+",
    value: "500+",
  },
];

export const INPUT_TYPE_LIST: { label: string; value: string }[] = [
  {
    label: "text_input",
    value: "text",
  },
  {
    label: "number_input",
    value: "number",
  },
];

export const SIZE_LIST: { label: string; value: string }[] = [
  {
    label: "size_full",
    value: "full",
  },
  {
    label: "size_small",
    value: "small",
  },
];

export const DELIVERY_STATUS: { [key: string]: string } = {
  PLACED: "order_placed",
  CONFIRMED: "order_placed",
  SHIPPED: "order_shipped",
  OFD: "order_out_for_delivery",
  DELIVERED: "order_delivered",
  CANCELLED: "order_cancelled",
};

export const SELLER_DELIVERY_STATUS: { [key: string]: string } = {
  CONFIRMED: "order_placed",
  SHIPPED: "order_shipped",
  OFD: "order_out_for_delivery",
  DELIVERED: "order_delivered",
  CANCELLED: "order_cancelled",
};

export const STATUS_LIST: { label: string; value: string }[] = [
  {
    label: "status_confirmed",
    value: "CONFIRMED",
  },
  {
    label: "status_shipped",
    value: "SHIPPED",
  },
  {
    label: "status_on_the_way",
    value: "OFD",
  },
  {
    label: "status_delivered",
    value: "DELIVERED",
  },
  {
    label: "status_cancelled",
    value: "CANCELLED",
  },
];

export const formattedDate = (formatDate: string | undefined, locale?: string) =>
  formatDate ? new Date(formatDate).toLocaleDateString(locale || "ar", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) : "-";

export const videoExtensions: string[] = ["mp4", "mkv", "avi", "mov", "wmv"];
export const imageExtensions: string[] = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "webp",
];

export const CONSUMER_TYPE_LIST = [
  {
    label: "consumer",
    value: "CONSUMER",
  },
  {
    label: "vendor",
    value: "VENDORS",
  },
  {
    label: "everyone",
    value: "EVERYONE",
  },
];

export const SELL_TYPE_LIST = [
  {
    label: "normal_sell",
    value: "NORMALSELL",
  },
  {
    label: "buy_group",
    value: "BUYGROUP",
  },
  {
    label: "trial_product",
    value: "TRIAL_PRODUCT",
  },
  {
    label: "wholesale_product",
    value: "WHOLESALE_PRODUCT",
  },
];

export const DELIVER_AFTER_LIST = [
  {
    label: "1",
    value: 1,
  },
  {
    label: "2",
    value: 2,
  },
  {
    label: "3",
    value: 3,
  },
  {
    label: "4",
    value: 4,
  },
  {
    label: "5",
    value: 5,
  },
  {
    label: "6",
    value: 6,
  },
  {
    label: "7",
    value: 7,
  },
];

export const PRODUCT_CONDITION_LIST = [
  {
    label: "new",
    value: "NEW",
  },
  {
    label: "old",
    value: "OLD",
  },
  {
    label: "refurbished",
    value: "REFURBISHED",
  },
];

export const MONTHS: string[] = [
  "month_jan",
  "month_feb",
  "month_mar",
  "month_apr",
  "month_may",
  "month_jun",
  "month_jul",
  "month_aug",
  "month_sep",
  "month_oct",
  "month_nov",
  "month_dec",
];

export const CHAT_REQUEST_MESSAGE = {
  priceRequest: {
    value: "Requested for Offer Price ",
  },
};

export const STORE_MENU_ID = 8;
export const BUYGROUP_MENU_ID = 9;
export const FACTORIES_MENU_ID = 10;
export const RFQ_MENU_ID = 11;

export const PRODUCT_CATEGORY_ID = 4;
export const SERVICE_CATEGORY_ID = 6;
export const BUSINESS_TYPE_CATEGORY_ID = 5;

export const LANGUAGES = [
  { locale: "en", name: "English", direction: "ltr", flag: "🇺🇸" },
  { locale: "ar", name: "العربية", direction: "rtl", flag: "🇸🇦" },
  { locale: "zh", name: "中文", direction: "ltr", flag: "🇨🇳" },
  { locale: "es", name: "Español", direction: "ltr", flag: "🇪🇸" },
  { locale: "fr", name: "Français", direction: "ltr", flag: "🇫🇷" },
  { locale: "de", name: "Deutsch", direction: "ltr", flag: "🇩🇪" },
  { locale: "pt", name: "Português", direction: "ltr", flag: "🇧🇷" },
  { locale: "ru", name: "Русский", direction: "ltr", flag: "🇷🇺" },
  { locale: "ja", name: "日本語", direction: "ltr", flag: "🇯🇵" },
  { locale: "ko", name: "한국어", direction: "ltr", flag: "🇰🇷" },
  { locale: "hi", name: "हिन्दी", direction: "ltr", flag: "🇮🇳" },
  { locale: "tr", name: "Türkçe", direction: "ltr", flag: "🇹🇷" },
  { locale: "it", name: "Italiano", direction: "ltr", flag: "🇮🇹" },
  { locale: "nl", name: "Nederlands", direction: "ltr", flag: "🇳🇱" },
  { locale: "pl", name: "Polski", direction: "ltr", flag: "🇵🇱" },
  { locale: "th", name: "ไทย", direction: "ltr", flag: "🇹🇭" },
  { locale: "vi", name: "Tiếng Việt", direction: "ltr", flag: "🇻🇳" },
  { locale: "id", name: "Bahasa Indonesia", direction: "ltr", flag: "🇮🇩" },
  { locale: "ms", name: "Bahasa Melayu", direction: "ltr", flag: "🇲🇾" },
  { locale: "ur", name: "اردو", direction: "rtl", flag: "🇵🇰" },
];

export const CURRENCIES = [
  {
    code: "OMR",
    symbol: "OMR",
    symbolAr: "ر.ع",
    name: "Omani Rial",
    nameAr: "ريال عماني",
  },
  {
    code: "USD",
    symbol: "$",
    symbolAr: "$",
    name: "US Dollar",
    nameAr: "دولار أمريكي",
  },
  {
    code: "SAR",
    symbol: "﷼",
    symbolAr: "ر.س",
    name: "Saudi Riyal",
    nameAr: "ريال سعودي",
  },
  {
    code: "AED",
    symbol: "د.إ",
    symbolAr: "د.إ",
    name: "UAE Dirham",
    nameAr: "درهم إماراتي",
  },
  {
    code: "EUR",
    symbol: "€",
    symbolAr: "€",
    name: "Euro",
    nameAr: "يورو",
  },
  {
    code: "GBP",
    symbol: "£",
    symbolAr: "£",
    name: "British Pound",
    nameAr: "جنيه إسترليني",
  },
];

// User Status System Constants
export const USER_STATUS_LIST = [
  { value: "WAITING", label: "status_waiting" },
  { value: "ACTIVE", label: "status_active" },
  { value: "REJECT", label: "status_rejected" },
  { value: "INACTIVE", label: "status_inactive" },
  { value: "WAITING_FOR_SUPER_ADMIN", label: "status_waiting_for_super_admin" },
];

export const USER_STATUS_CONFIG = {
  WAITING: {
    label: "status_waiting",
    value: "WAITING",
    color: "#ffc107",
    bgColor: "#fff3cd",
    textColor: "#856404",
    icon: "clock-o",
    canApprove: true,
    canReject: true,
    canDeactivate: true,
  },
  ACTIVE: {
    label: "status_active",
    value: "ACTIVE",
    color: "#28a745",
    bgColor: "#d4edda",
    textColor: "#155724",
    icon: "check-circle",
    canApprove: false,
    canReject: true,
    canDeactivate: true,
  },
  REJECT: {
    label: "status_rejected",
    value: "REJECT",
    color: "#dc3545",
    bgColor: "#f8d7da",
    textColor: "#721c24",
    icon: "times-circle",
    canApprove: true,
    canReject: false,
    canDeactivate: true,
  },
  INACTIVE: {
    label: "status_inactive",
    value: "INACTIVE",
    color: "#6c757d",
    bgColor: "#e2e3e5",
    textColor: "#495057",
    icon: "ban",
    canApprove: true,
    canReject: false,
    canDeactivate: false,
  },
  WAITING_FOR_SUPER_ADMIN: {
    label: "status_waiting_for_super_admin",
    value: "WAITING_FOR_SUPER_ADMIN",
    color: "#17a2b8",
    bgColor: "#d1ecf1",
    textColor: "#0c5460",
    icon: "user-secret",
    canApprove: true,
    canReject: true,
    canDeactivate: true,
  },
};

// Default status for new sub-accounts
export const DEFAULT_SUB_ACCOUNT_STATUS = "WAITING";

// Product Types
export const PRODUCT_TYPES = {
  NORMAL: "P",
  RFQ: "R",
  FACTORY: "F",
  DROPSHIP: "D",
} as const;

export const PRODUCT_TYPE_LABELS = {
  P: "normal_product",
  R: "rfq_product",
  F: "factory_product",
  D: "dropship_product",
} as const;

// WhatsApp Support Configuration
export const WHATSAPP_SUPPORT_NUMBER = "1234567890"; // Replace with your admin's WhatsApp number (with country code, e.g., "201234567890" for Egypt)
export const WHATSAPP_SUPPORT_MESSAGE = "Hello, I need help with Ultrasooq"; // Default message
