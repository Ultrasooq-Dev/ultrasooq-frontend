import React from "react";
import { USER_STATUS_CONFIG } from "@/utils/constants";

interface StatusDisplayBadgeProps {
  status: string;
  statusNote?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const StatusDisplayBadge: React.FC<StatusDisplayBadgeProps> = ({
  status,
  statusNote,
  size = "md",
  showIcon = true,
}) => {
  const statusConfig = USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || USER_STATUS_CONFIG.WAITING;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex flex-col items-start space-y-1">
      <span
        className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]}`}
        style={{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.textColor,
          border: `1px solid ${statusConfig.color}`,
        }}
        title={statusNote || statusConfig.label}
      >
        {showIcon && (
          <svg
            className={`${iconSizeClasses[size]} mr-1.5`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {statusConfig.icon === "clock-o" && (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            )}
            {statusConfig.icon === "check-circle" && (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            )}
            {statusConfig.icon === "times-circle" && (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
            {statusConfig.icon === "ban" && (
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            )}
            {statusConfig.icon === "user-secret" && (
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zm14.44.654c.04-.212.048-.432.025-.654a6.484 6.484 0 00-1.905-3.959 3 3 0 014.308 3.516.78.78 0 01-.358.442 4.97 4.97 0 01-2.07.655z"
                clipRule="evenodd"
              />
            )}
          </svg>
        )}
        {statusConfig.label}
      </span>

      {statusNote && (
        <small
          className="text-gray-500 text-xs max-w-xs truncate"
          title={statusNote}
        >
          {statusNote}
        </small>
      )}
    </div>
  );
};

export default StatusDisplayBadge;
