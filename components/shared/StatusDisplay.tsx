"use client";

import { useMe } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { getUserStatusInfo } from "@/utils/statusCheck";
import { Badge } from "@/components/ui/badge";

interface StatusDisplayProps {
  showDetails?: boolean;
  className?: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { data: userData, isLoading: meLoading } = useMe();
  const { data: currentAccount, isLoading: accountLoading } = useCurrentAccount();
  
  if (meLoading || accountLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse w-4 h-4 bg-gray-300 rounded-full"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!userData?.data) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-500">Not logged in</span>
      </div>
    );
  }

  const statusInfo = getUserStatusInfo(userData);
  const currentAccountStatus = currentAccount?.data?.account?.status;
  const currentAccountNote = currentAccount?.data?.account?.statusNote;
  
  // Use current account status if available, otherwise fall back to user status
  const displayStatus = currentAccountStatus || statusInfo.status;
  const displayNote = currentAccountNote;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-success/10 text-success border-success/20";
      case "WAITING":
        return "bg-warning/10 text-warning border-warning/20";
      case "REJECT":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "INACTIVE":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "SUSPENDED":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-4 h-4 rounded-full border-2 ${
          displayStatus === "ACTIVE" ? "bg-success border-white" :
          displayStatus === "WAITING" ? "bg-warning border-white" :
          displayStatus === "REJECT" ? "bg-destructive border-white" :
          displayStatus === "INACTIVE" ? "bg-destructive border-white" :
          "bg-gray-500 border-white"
        }`} />
        
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(displayStatus)}`}
        >
          {displayStatus}
        </Badge>
        
        {showDetails && (
          <div className="text-xs text-gray-500 ml-2">
            {displayStatus === "ACTIVE" && "Full access"}
            {displayStatus === "WAITING" && "Pending approval"}
            {displayStatus === "REJECT" && "Access denied"}
            {displayStatus === "INACTIVE" && "Limited access"}
          </div>
        )}
      </div>
      
      {/* Show Status Note if available */}
      {displayNote && (displayStatus === 'REJECT' || displayStatus === 'INACTIVE') && (
        <div className="ml-6 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
          <div className="flex items-start space-x-1">
            <svg className="w-3 h-3 text-destructive mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Admin Note:</span>
            <span className="ml-1">{displayNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
