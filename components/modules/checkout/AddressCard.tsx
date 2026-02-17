import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import DropdownIcon from "@/public/images/custom-hover-dropdown-btn.svg";
import PhoneIcon from "@/public/images/phoneicon.svg";
import LocationIcon from "@/public/images/locationicon.svg";

type AddressCardProps = {
  id: number;
  firstName: string;
  lastName: string;
  cc: string;
  phoneNumber: string;
  address: string;
  town: string;
  city?: { id: number; name: string; };
  state?: { id: number; name: string; };
  country?: { id: number; name: string; };
  postCode: string;
  onEdit: () => void;
  onDelete: () => void;
  onSelectAddress: () => void;
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
  onSelectAddress,
}) => {
  return (
    <div className="relative">
      <RadioGroupItem
        value={id?.toString()}
        id={id?.toString()}
        className="absolute top-4 left-4 z-10"
        onClick={onSelectAddress}
      />
      <Label 
        htmlFor={id?.toString()} 
        className="block p-6 pl-12 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {firstName} {lastName}
              </h3>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <Image 
                    src={PhoneIcon} 
                    alt="phone-icon" 
                    width={16} 
                    height={16}
                    className="text-gray-500"
                  />
                </div>
                <span className="text-gray-700 font-medium">{phoneNumber}</span>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                  <Image 
                    src={LocationIcon} 
                    alt="location-icon" 
                    width={16} 
                    height={16}
                    className="text-gray-500"
                  />
                </div>
                <span className="text-gray-600 leading-relaxed">
                  {[address, town, city?.name, state?.name, postCode, country?.name].filter(el => el).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <div className="flex-shrink-0 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                <Image
                  alt="options-icon"
                  src={DropdownIcon}
                  height={20}
                  width={20}
                  className="text-gray-500"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={onEdit}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  Edit Address
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="cursor-pointer hover:bg-gray-50 text-red-600 focus:text-red-600"
                >
                  Delete Address
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Label>
    </div>
  );
};

export default AddressCard;
