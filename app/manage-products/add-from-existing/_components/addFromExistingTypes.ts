// Types and interfaces for the Add From Existing Product page

export interface ProductModel {
  modelName: string;
  specifications: string;
}

export interface PreviewData {
  productName?: string;
  name?: string;
  price?: string | number;
  estimatedPrice?: string | number;
  description?: string;
  shortDescription?: string;
  category?: string;
  brand?: string;
  specifications?: Array<{ label: string; specification: string }>;
  matchedCategoryId?: number | null;
  categoryConfidence?: string;
  categoryPath?: number[] | null;
  modelExists?: boolean | null;
}

export interface ExistingProduct {
  id: number | string;
  productName: string;
  category?: { name: string };
  brand?: { brandName: string };
  shortDescription?: string;
  description?: string;
  specifications?: any;
  existingProductImages?: Array<{ image: string }>;
}

export interface AddFromExistingState {
  searchTerm: string;
  searchResults: ExistingProduct[];
  isSearching: boolean;
  selectedProduct: ExistingProduct | null;
  showProductPopup: boolean;
  shouldSearch: boolean;
  isAIGenerating: boolean;
  aiGeneratedData: any;
  aiProductSuggestions: any[];
  aiProductModels: ProductModel[];
  aiModelSource: "text" | "image" | "url" | null;
  selectedModel: string | null;
  modelExists: boolean | null;
  checkingModel: boolean;
  showPreviewModal: boolean;
  previewData: PreviewData | null;
  processingProductIndex: number | null;
  autoAISearchTriggered: boolean;
  aiSearchSkipped: boolean;
  selectedImage: File | null;
  imagePreview: string | null;
  productUrl: string;
  querySearchTerm: string;
}
