export interface ICreateProductRequest {
  productType: "R" | "P";
  productName: string;
  categoryId: number;
  brandId: number;
  skuNo: string;
  productTagList?: Array<{
    tagId: number;
  }>;
  productImagesList?: Array<{
    imageName: string;
    image: string;
  }>;
  placeOfOriginId: number;
  productPrice: number;
  offerPrice: number;
  description: string;
  specification: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ICreateProduct {
  data: { id: number; productName: string } | null;
  status: boolean;
  message: string;
}

export interface IDeleteProductRequest {
  productId: string;
}

export interface IDeleteProduct extends ICreateProduct {}

export interface IUpdateProductRequest extends ICreateProductRequest {
  productId: number;
}

export interface IUpdateProduct extends ICreateProduct {
  customizeProductId: number;
  fromPrice: number;
  toPrice: number;
}
