export interface CartActionsProps {
  productDetails: any;
  haveAccessToken: boolean;
  deviceId: string;
  globalQuantity: number;
  setGlobalQuantity: (q: number) => void;
  selectedProductVariant: any;
  memoizedCartList: any[];
  cartListByUser: any;
  cartListByDeviceQuery: any;
  productQueryById: any;
  setIsConfirmDialogOpen: (open: boolean) => void;
  setIsVisible: (visible: boolean) => void;
}

export interface WishlistActionsProps {
  searchParamsId: string;
  productInWishlist: any;
  meDataId: number | undefined;
}

export interface ProductPageStateProps {
  id: string;
}
