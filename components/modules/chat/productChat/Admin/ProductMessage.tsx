import React from "react";
import Image from "next/image";
import moment from "moment";
import { cn } from "@/lib/utils";
import AvatarPlaceholder from "@/public/images/no-user-image.png";

type ProductMessageProps = {
  onClick?: () => void;
  isSelected?: boolean;
  message: {
    user: {
      firstName?: string;
      lastName?: string;
      accountName?: string;
      profilePicture?: string;
    },
    content: string,
    createdAt: string,
    unreadMsgCount: string
  }
};

const ProductMessage: React.FC<ProductMessageProps> = ({
  onClick,
  isSelected,
  message
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-wrap rounded-md px-[10px] py-[20px]",
        isSelected ? "shadow-lg" : "",
      )}
    >
      <div className="relative h-[40px] w-[40px] rounded-full">
        <Image
          src={message?.user?.profilePicture || AvatarPlaceholder}
          alt="global-icon"
          fill
          className="rounded-full"
        />
      </div>
      <div className="flex w-[calc(100%-2.5rem)] flex-wrap items-center justify-start gap-y-1 pl-3">
        <div className="flex w-full">
          <h4 className="text-foreground text-left text-[15px] font-normal uppercase">
            {(() => {
              const accountName = message.user.accountName;
              const cleanAccountName = accountName 
                ? accountName.replace(/\s*buyer\s*/gi, "").replace(/^\s*-\s*|\s*-\s*$/g, "").replace(/\s*-\s*/g, " ").trim()
                : null;
              
              return cleanAccountName || 
                `${message.user.firstName || ""} ${message.user.lastName || ""}`.trim() || 
                "User";
            })()}
          </h4>
        </div>

        {message?.createdAt ? (
          <div>
            <div className="flex space-x-2 p-2">
              <div className="flex items-center space-x-1">
                <div className="text-xs font-normal text-gray-500">
                  {message.content}
                </div>
                {message?.unreadMsgCount ? (
                  <div className="flex items-center justify-center h-5 w-5 text-xs font-semibold text-white bg-primary rounded-full">
                    {message?.unreadMsgCount}
                  </div>
                ) : ""}
              </div>
            </div>
            {message?.createdAt ? (
              <div className="w-full text-right text-xs font-normal text-[#AEAFB8]">
                <span>
                  {moment(message?.createdAt)
                    .startOf("seconds")
                    .fromNow()}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
};

export default ProductMessage;
