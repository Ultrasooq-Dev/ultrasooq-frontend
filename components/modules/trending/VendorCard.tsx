import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Users, 
  Package,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import NoImagePlaceholder from "@/public/images/no-image.jpg";

type VendorCardProps = {
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePicture?: string;
    tradeRole: string;
    userProfile?: any[];
    productCount: number;
    averageRating?: number;
    location?: string;
    businessTypes?: string[];
  };
  onViewProducts: (vendorId: number) => void;
  isLoading?: boolean;
};

const VendorCard: React.FC<VendorCardProps> = ({ 
  vendor, 
  onViewProducts, 
  isLoading = false 
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  if (isLoading) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-300"></div>
              <div className="h-3 w-1/2 rounded bg-gray-300"></div>
              <div className="h-3 w-1/4 rounded bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getBusinessTypeTags = () => {
    if (!vendor.userProfile?.length) return [];
    
    return vendor.userProfile
      .map((item: any) => item?.userProfileBusinessType)
      .flat()
      .map((item: any) => item?.userProfileBusinessTypeTag?.tagName)
      .filter(Boolean);
  };

  const businessTypes = getBusinessTypeTags();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      {/* Header */}
      <div className="flex items-start space-x-4">
        {/* Vendor Avatar */}
        <div className="relative h-16 w-16 shrink-0">
          <Image
            src={vendor.profilePicture || NoImagePlaceholder}
            alt={`${vendor.firstName} ${vendor.lastName}`}
            fill
            className="rounded-full object-cover"
            sizes="64px"
          />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1">
            <Building2 className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Vendor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {vendor.firstName} {vendor.lastName}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {vendor.tradeRole.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            
            {/* Rating */}
            {vendor.averageRating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-warning fill-current" />
                <span className="text-sm font-medium text-gray-700">
                  {vendor.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-3 space-y-1">
            {vendor.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendor.email}</span>
              </div>
            )}
            {vendor.phoneNumber && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{vendor.phoneNumber}</span>
              </div>
            )}
            {vendor.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}
          </div>

          {/* Business Types */}
          {businessTypes.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {businessTypes.slice(0, 3).map((type, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-1"
                  >
                    {type}
                  </Badge>
                ))}
                {businessTypes.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{businessTypes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>{vendor.productCount} products</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProducts(vendor.id)}
            className="group/btn flex items-center space-x-1 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/30"
          >
            <span>View Products</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
          
          <Link
            href={
              vendor.tradeRole === "COMPANY"
                ? `/company-profile-details?userId=${vendor.id}`
                : vendor.tradeRole === "FREELANCER"
                  ? `/freelancer-profile-details?userId=${vendor.id}`
                  : "#"
            }
            className="p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-primary/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

export default VendorCard;
