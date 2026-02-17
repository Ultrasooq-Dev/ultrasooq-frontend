import React, { useEffect, useState, useCallback } from "react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AddProductIcon from "@/public/images/add-product.svg";
import ExistingProductIcon from "@/public/images/existing-product.svg";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useExistingProductForCopy } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Copy, ArrowLeft } from "lucide-react";

type AddProductContentProps = {
  productId?: number;
  onClose?: () => void;
};

const AddProductContent: React.FC<AddProductContentProps> = ({ productId, onClose }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();
  
  const [selectedOption, setSelectedOption] = useState<"new" | "existing" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchData, refetch: searchProducts } = useExistingProductForCopy(
    {
      page: 1,
      limit: 10,
      term: searchTerm,
    },
    false
  );

  const handleAddNewProduct = () => {
    router.push("/product");
    onClose?.();
  };

  const handleAddFromExisting = () => {
    setSelectedOption("existing");
  };

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      toast({
        title: t("please_enter_product_name"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    if (searchTerm.trim().length < 3) {
      toast({
        title: t("search_term_too_short"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchProducts();
      if (result.data?.data) {
        setSearchResults(result.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      toast({
        title: t("search_failed"),
        description: t("search_failed"),
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, searchProducts, toast, t]);

  const handleSelectProduct = (product: any) => {
    router.push(`/product?copy=${product.id}&fromExisting=true`);
    onClose?.();
  };

  const handleBack = () => {
    setSelectedOption(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  if (selectedOption === "existing") {
    return (
      <DialogContent className="custom-action-type-chose-picker max-w-2xl">
        <div className="modal-headerpart">
          <DialogTitle dir={langDir} translate="no">
            {t("add_from_existing_product")}
          </DialogTitle>
        </div>
        <div className="modal-bodypart">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3" dir={langDir}>
                {t("search_existing_product_description")}
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={t("enter_product_name")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                  dir={langDir}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? t("searching") : t("search")}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900" dir={langDir}>
                  {t("search_results")}
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.existingProductImages?.[0]?.image ? (
                          <Image
                            src={product.existingProductImages[0].image}
                            alt={product.productName}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <Copy className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900" dir={langDir}>
                          {product.productName}
                        </h5>
                        {/* <p className="text-sm text-gray-500" dir={langDir}>
                           SKU: {product.skuNo}
                        </p> */}
                        <p className="text-xs text-gray-400" dir={langDir}>
                          {product.category?.name} • {product.brand?.brandName}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        {t("select")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2" dir={langDir}>
                  {t("no_products_found")}
                </p>
                <p className="text-sm text-gray-400" dir={langDir}>
                  {t("try_different_search_term")}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="custom-action-type-chose-picker">
      <div className="modal-headerpart">
        <DialogTitle dir={langDir} translate="no">
          {t("choose_how_to_add_product")}
        </DialogTitle>
      </div>
      <div className="modal-bodypart">
        <div className="import-pickup-type-selector-lists" dir={langDir}>
          <div className="import-pickup-type-selector-item">
            <button
              onClick={handleAddNewProduct}
              className="import-pickup-type-selector-box hover:bg-gray-100! w-full text-left"
            >
              <div className="icon-container">
                <Image src={AddProductIcon} alt="add-product-icon" />
              </div>
              <div className="text-container">
                <h5 dir={langDir} translate="no">{t("add_new_product")}</h5>
                <p className="text-sm text-gray-600" dir={langDir}>
                  {t("create_product_from_scratch")}
                </p>
              </div>
            </button>
          </div>

          <div className="import-pickup-type-selector-item">
            <button
              onClick={handleAddFromExisting}
              className="import-pickup-type-selector-box hover:bg-gray-100! w-full text-left"
            >
              <div className="icon-container">
                <Image src={ExistingProductIcon} alt="existing-product-icon" />
              </div>
              <div className="text-container">
                <h5 dir={langDir} translate="no">{t("add_from_existing_product")}</h5>
                <p className="text-sm text-gray-600" dir={langDir}>
                  {t("copy_and_modify_existing_product")}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default AddProductContent;
