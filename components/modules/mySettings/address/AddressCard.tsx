import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import PhoneIcon from "@/public/images/phoneicon.svg";
import LocationIcon from "@/public/images/locationicon.svg";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type AddressCardProps = {
  id: number;
  firstName: string;
  lastName: string;
  cc: string;
  phoneNumber: string;
  address: string;
  town: string;
  city?: string | { id: number; name: string };
  state?: string | { id: number; name: string };
  country?: string | { id: number; name: string };
  postCode: string;
  onEdit: () => void;
  onDelete: () => void;
};

const AddressCard: React.FC<AddressCardProps> = ({
  id,
  firstName,
  lastName,
  cc,
  phoneNumber,
  address,
  town,
  city,
  state,
  country,
  postCode,
  onEdit,
  onDelete,
}) => {
  const { langDir } = useAuth();
  
  // Helper function to extract name from object or string
  const getName = (value?: string | { id: number; name: string }): string => {
    if (!value) return "";
    return typeof value === "string" ? value : value.name || "";
  };

  const cityName = getName(city);
  const stateName = getName(state);
  const countryName = getName(country);

  const addressParts = [
    address,
    town,
    cityName,
    stateName,
    postCode,
    countryName,
  ].filter((el) => el && el.trim() !== "");

  const fullAddress = addressParts.join(", ");

  return (
    <div className="group relative overflow-visible rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {firstName} {lastName}
          </h3>
        </div>

        {/* Actions Dropdown */}
        <div className="relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Address options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-40">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
                className="cursor-pointer focus:bg-gray-100"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Address Details */}
      <div className="mt-4 space-y-3" dir={langDir}>
        {/* Phone Number */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-100 text-blue-600">
            <Image
              src={PhoneIcon}
              alt="phone-icon"
              width={12}
              height={12}
              className="shrink-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {cc && <span className="text-gray-600">{cc}</span>} {phoneNumber}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-100 text-green-600">
            <Image
              src={LocationIcon}
              alt="location-icon"
              width={12}
              height={12}
              className="shrink-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-gray-700">
              {fullAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-blue-500 opacity-0 transition-opacity group-hover:opacity-5" />
    </div>
  );
};

export default AddressCard;
