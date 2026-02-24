import {
  DAYS_NAME_LIST,
  imageExtensions,
  videoExtensions,
  WEEKDAYS_LIST,
} from "./constants";
import countryCodes, { CountryProperty } from "country-codes-list";

export const parsedDays = (data: string) => {
  if (!data) return;
  const days = JSON.parse(data);
  const response = Object.keys(days)
    .map((day) => {
      if (days[day] === 1) {
        return DAYS_NAME_LIST[day];
      }
    })
    .filter((item) => item)
    .join(", ");
  return response || "NA";
};

export const getInitials = (firstName: string, lastName: string) => {
  const firstInitial = firstName?.charAt(0) || "";
  const lastInitial = lastName?.charAt(0) || "";
  return `${firstInitial}${lastInitial}`;
};

export const getAmPm = (time: string) => {
  if (!time) return;
  const [hoursStr, minutes] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${ampm}`;
};

export const getCurrentDay = () => {
  const date = new Date();
  const day = date.getDay();
  return WEEKDAYS_LIST[day];
};

export const countryObjs = countryCodes?.customList?.(
  // @ts-expect-error - type mismatch
  "countryNameEn" as CountryProperty.countryNameEn,
  "+{countryCallingCode}",
) || {};

export const getCurrentTime = new Date().toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

export const getLastTwoHundredYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 200; i++) {
    years.push(currentYear - i);
  }
  return years;
};

export const generateDeviceId = () => {
  const timestamp = new Date().getTime();
  const randomString =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  const deviceId = `device_${timestamp}_${randomString}`;
  return deviceId;
};

export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

export const getOrCreateDeviceId = () => {
  if (!isBrowser()) return;
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export const getLoginType = () => {
  if (!isBrowser()) return;
  return localStorage.getItem("loginType");
};

export const stripHTML = (text: string) => {
  return text.replace(/<[^>]*>/g, "");
};

export const generateRandomSkuNoWithTimeStamp = () => new Date().getTime();

// FORMAT EG: Jun 10, 2024
export const formatDate = (isoString: string | undefined): string => {
  if (!isoString) return "-";
  const date = new Date(isoString);

  if (!date || date.toString() === "Invalid Date") return "-";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

export const capitalizeWord = (word: string): string => {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

export const handleDescriptionParse = (description: string) => {
  if (description) {
    try {
      const json = JSON.parse(description);
      return json;
    } catch (error) { console.error(error); }
  }
};

export const formatPrice = (price: number, symbol: string = '$'): string => {
  if (!price) return "";
  const formattedTotal = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedTotal}`;
};

export const isVideo = (path: string) => {
  if (typeof path === "string") {
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension) {
      if (videoExtensions.includes(extension)) {
        return true;
      }
    }
    return false;
  } else if (typeof path === "object") {
    return true;
  }
};

export const isImage = (path: any) => {
  if (typeof path === "string") {
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension) {
      if (imageExtensions.includes(extension)) {
        return true;
      }
    }
    return false;
  } else if (typeof path === "object" && path?.type?.includes("image")) {
    return true;
  }
};

export const generateUniqueNumber = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return timestamp + randomNum;
}

export const convertDateTime = (dateString: string | undefined) => {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    minute: "numeric",
    hour: "numeric",
    hour12: true,
    second: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-GB", options);
  return formattedDate;
};

export const convertDate = (dateString: string | undefined) => {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-GB", options);
  return formattedDate;
};

export const convertTime = (dateString: string | undefined) => {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    minute: "numeric",
    hour: "numeric",
    hour12: true,
    second: "numeric",
  };
  const formattedDate = date.toLocaleTimeString("en-GB", options);
  return formattedDate;
};

export const convertDateTimeToUTC = (datetime: string) => {
  const date = new Date(datetime);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() < 9 ? `0${date.getUTCMonth() + 1}` : (date.getUTCMonth() + 1).toString();
  const day = date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate().toString();
  const hour = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours().toString();
  const minutes = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes().toString();
  const seconds = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds().toString();
  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
}