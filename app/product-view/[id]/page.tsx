/**
 * /product-view/[id] — Product detail page
 * Re-exports the exact same component as /trending/[id]
 * so all features (BuyGroup timing, variants, dropship marketing,
 * other sellers, wishlist, cart, chat, reviews, Q&A, specs) work identically.
 */
export { default } from "@/app/trending/[id]/page";
