"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";
import type { AddressCardProps } from "./types";

export default function AddressCard({
  title,
  icon: Icon,
  iconColor,
  name,
  address,
  phone,
  pin,
}: AddressCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className={cn("h-4 w-4", iconColor)} />
        {title}
      </h3>
      <div className="space-y-1.5 text-sm">
        <p className="font-semibold">{name}</p>
        <p className="leading-relaxed text-muted-foreground">{address}</p>
        {pin && (
          <p className="text-muted-foreground">Pin: {pin}</p>
        )}
        {phone && (
          <p className="flex items-center gap-1.5 pt-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {phone}
          </p>
        )}
      </div>
    </div>
  );
}
