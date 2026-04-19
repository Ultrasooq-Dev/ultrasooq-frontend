"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { T } from "./theme";

export function CountdownTimer({
  dateClose,
  endTime,
}: {
  dateClose: string;
  endTime: string;
}) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const end = new Date(dateClose);
  if (endTime) {
    const [h, m] = endTime.split(":").map(Number);
    end.setHours(h || 23, m || 59, 0, 0);
  }

  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return <span className={T.danger}>Expired</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (days > 0) {
    return (
      <span className={cn(days <= 1 ? T.warning : T.muted)}>
        {days}d {hours}h {minutes}m
      </span>
    );
  }
  return (
    <span className={cn(hours <= 2 ? T.danger : T.warning)}>
      {hours}h {minutes}m {seconds}s
    </span>
  );
}
