"use client";

import { redirect } from "next/navigation";

export default function MyOrdersRedirect() {
  redirect("/orders");
}
