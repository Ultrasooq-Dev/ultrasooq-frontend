import React from "react";
import Image from "next/image";
import moment from "moment";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { RfqQuoteType } from "./sellerChatTypes";

interface SellerChatCustomerListProps {
  rfqCustomers: RfqQuoteType[];
  selectedCustomerId?: number | null;
  onSelectCustomer: (customer: RfqQuoteType) => void;
}

/**
 * Column layout — Column 3: renders the list of customers for a selected RFQ.
 */
const SellerChatCustomerList: React.FC<SellerChatCustomerListProps> = ({
  rfqCustomers,
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const t = useTranslations();
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {rfqCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">{t("no_customers_found")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rfqCustomers.map((customer) => {
              const buyerInfo = customer.buyerIDDetail;
              const buyerName =
                (buyerInfo as any)?.accountName ||
                `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() ||
                "Buyer";

              return (
                <div
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 bg-card p-4 transition-all hover:border-destructive hover:bg-destructive/5",
                    selectedCustomerId === customer.id
                      ? "border-destructive bg-destructive/5"
                      : "border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
                      <Image
                        src={buyerInfo?.profilePicture || PlaceholderImage}
                        alt={buyerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{buyerName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {customer.lastUnreadMessage?.content
                          ? customer.lastUnreadMessage.content.substring(0, 50) + "..."
                          : "Lorem Ipsum Dolor Sit Amet,"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {customer.lastUnreadMessage?.createdAt
                        ? moment(customer.lastUnreadMessage.createdAt).fromNow()
                        : "2hr Ago"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChatCustomerList;
