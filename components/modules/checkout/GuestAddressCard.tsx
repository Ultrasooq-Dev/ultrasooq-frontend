import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import DropdownIcon from "@/public/images/custom-hover-dropdown-btn.svg";
import PhoneIcon from "@/public/images/phoneicon.svg";
import LocationIcon from "@/public/images/locationicon.svg";

type GuestAddressCardProps = {
  firstName?: string;
  lastName?: string;
  cc?: string;
  phoneNumber?: string;
  address?: string;
  town?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  onEdit: () => void;
};

const GuestAddressCard: React.FC<GuestAddressCardProps> = ({
  firstName,
  lastName,
  cc,
  phoneNumber,
  address,
  city,
  town,
  state,
  country,
  postCode,
  onEdit,
}) => {
  return (
    <div className="relative">
      <div className="block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white">
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
                  {[address, town, city, state, postCode, country].filter(el => el).join(', ')}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestAddressCard;
