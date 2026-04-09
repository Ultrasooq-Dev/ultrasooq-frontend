"use client";
import { redirect } from "next/navigation";
import { useParams } from "next/navigation";

export default function SellerOrderDetailPage() {
  const params = useParams();
  redirect(`/orders/${params?.id}`);
}
