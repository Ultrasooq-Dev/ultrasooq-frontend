import { BuyGroupDeal } from "./types";

// ─── Privacy: mask customer info before deal is finalized ────
export function maskName(name: string, dealDone: boolean): string {
  if (dealDone) return name;
  const parts = name.split(" ");
  return parts.map((p) => (p.length <= 2 ? p : p.slice(0, 2) + "****")).join(" ");
}

export function maskEmail(email: string, dealDone: boolean): string {
  if (dealDone) return email;
  const [local, domain] = email.split("@");
  if (!domain) return "****@****.***";
  return (local.length <= 2 ? local : local.slice(0, 2) + "****") + "@" + domain.slice(0, 1) + "****.***";
}

// Generate timeline data from deal orders (mock: spreads orders across the deal window)
export function generateDealTimeline(deal: BuyGroupDeal) {
  const open = new Date(deal.dateOpen).getTime();
  const close = new Date(deal.dateClose).getTime();
  const totalDays = Math.max(1, Math.round((close - open) / 86400000));
  const step = totalDays <= 14 ? 1 : totalDays <= 60 ? 3 : 7;

  const points: { date: string; customers: number; quantity: number; revenue: number; target: number }[] = [];
  let cumCustomers = 0;
  let cumQuantity = 0;
  let cumRevenue = 0;

  for (let d = 0; d <= totalDays; d += step) {
    const dayDate = new Date(open + d * 86400000);
    const dayStr = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Count orders placed on or before this day
    const ordersUpToDay = deal.orders.filter((o) => {
      const orderDate = new Date(o.createdAt).getTime();
      return orderDate <= dayDate.getTime() && !["CANCELLED", "REFUNDED"].includes(o.status);
    });

    cumCustomers = ordersUpToDay.length;
    cumQuantity = ordersUpToDay.reduce((s, o) => s + o.quantity, 0);
    cumRevenue = ordersUpToDay.reduce((s, o) => s + o.total, 0);

    points.push({
      date: dayStr,
      customers: cumCustomers,
      quantity: cumQuantity,
      revenue: Math.round(cumRevenue),
      target: deal.minCustomer,
    });
  }

  return points;
}
