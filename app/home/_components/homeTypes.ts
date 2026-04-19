import { TrendingProduct } from "@/utils/types/common.types";

export interface CartItem {
  id: any;
  productId: any;
  quantity: any;
  object: any;
  serviceId?: any;
  cartProductServices?: CartProductService[];
}

export interface CartProductService {
  relatedCartType: string;
  productId: any;
}

export interface ProductGridItem extends TrendingProduct {
  sold?: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductGridSectionProps {
  products: ProductGridItem[];
  cartList: CartItem[] | undefined;
  haveAccessToken: boolean;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  showSold?: boolean;
  limit?: number;
  gridClass?: string;
}
