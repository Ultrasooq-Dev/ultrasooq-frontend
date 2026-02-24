"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { SELL_TYPE_LIST, CONSUMER_TYPE_LIST, PRODUCT_CONDITION_LIST, ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import ReactSelect, { MultiValue } from "react-select";
import { IOption } from "@/utils/types/common.types";
import {
  useCountries,
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { useMe } from "@/apis/queries/user.queries";

interface BulkEditSidebarProps {
  onBulkUpdate: (data: any) => void;
  selectedProducts: number[];
  onUpdate: () => void;
  isLoading?: boolean;
}

const BulkEditSidebar: React.FC<BulkEditSidebarProps> = ({
  onBulkUpdate,
  selectedProducts,
  onUpdate,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  // Data fetching for countries, states, cities
  const countriesQuery = useCountries();
  const countriesNewQuery = useAllCountries();
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();
  
  // Get user data for branches
  const me = useMe();

  // State management for multi-select
  const [selectedCountries, setSelectedCountries] = useState<IOption[]>([]);
  const [selectedStates, setSelectedStates] = useState<IOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<IOption[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<Record<string, IOption[]>>({});
  const [citiesByState, setCitiesByState] = useState<Record<string, IOption[]>>({});

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
    type: 'hide' | 'show';
  } | null>(null);

  // Tab state management
  const [activeTab, setActiveTab] = useState<'warehouse-location' | 'product-basic' | 'ask-for' | 'discounts'>('warehouse-location');

  const form = useForm({
    defaultValues: {
      // Section checkboxes
      updateWarehouse: false,
      updateWhereToSell: false,
      updateBasic: false,
      updateDiscounts: false,
      updateAskFor: false,
      
      // Warehouse fields
      branchId: "",
      
      // Where to Sell fields
      sellCountryIds: [] as IOption[],
      sellStateIds: [] as IOption[],
      sellCityIds: [] as IOption[],
      placeOfOriginId: "",
      
      // Basic fields
      enableChat: false,
      
      // Product Condition field (separate section)
      productCondition: "",
      
      // Ask For fields
      askForPrice: "",
      askForStock: "",
      
      // Discount fields
      consumerType: "",
      sellType: "",
      vendorDiscount: 0,
      vendorDiscountType: "",
      consumerDiscount: 0,
      consumerDiscountType: "",
      
      // Quantity fields
      minQuantity: 0,
      maxQuantity: 0,
      minCustomer: 0,
      maxCustomer: 0,
      minQuantityPerCustomer: 0,
      maxQuantityPerCustomer: 0,
      
      // Time fields
      timeOpen: 0,
      timeClose: 0,
      
      // Delivery
      deliveryAfter: 0,
    },
  });

  const watchSellType = form.watch("sellType");
  const watchConsumerType = form.watch("consumerType");
  const watchVendorDiscount = form.watch("vendorDiscount");
  const watchConsumerDiscount = form.watch("consumerDiscount");
  const watchProductCondition = form.watch("productCondition");
  const watchUpdateWarehouse = form.watch("updateWarehouse");
  const watchUpdateWhereToSell = form.watch("updateWhereToSell");
  const watchUpdateBasic = form.watch("updateBasic");
  const watchUpdateDiscounts = form.watch("updateDiscounts");
  const watchUpdateAskFor = form.watch("updateAskFor");
  const watchAskForPrice = form.watch("askForPrice");
  const watchAskForStock = form.watch("askForStock");

  // Show confirmation dialog
  const showConfirmation = (hide: boolean) => {
    const action = hide ? "hide" : "show";
    const productCount = selectedProducts.length;
    const confirmMessage = `Are you sure you want to ${action} ${productCount} selected product${productCount > 1 ? 's' : ''} ${hide ? 'from' : 'to'} customers?`;
    
    setConfirmAction({
      message: confirmMessage,
      onConfirm: () => executeHideShow(hide),
      type: hide ? 'hide' : 'show',
    });
    setShowConfirmDialog(true);
  };

  // Handle bulk hide/show separately
  const executeHideShow = async (hide: boolean) => {
    setShowConfirmDialog(false);
    setConfirmAction(null);

    try {
      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/bulkHideShow`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productPriceIds: selectedProducts,
          hide: hide,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (result.status) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // Refresh the product list
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update product visibility",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle bulk product condition update separately
  const handleBulkProductCondition = async () => {
    try {
      const condition = form.getValues("productCondition");
      
      if (!condition) {
        toast({
          title: "Error",
          description: "Please select a product condition",
          variant: "destructive",
        });
        return;
      }

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/bulkProductCondition`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productPriceIds: selectedProducts,
          productCondition: condition,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (result.status) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // Refresh the product list
        form.setValue("productCondition", ""); // Reset the form field
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update product condition",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle bulk discount update separately
  const handleBulkDiscountUpdate = async () => {
    try {
      const formData = form.getValues();
      
      // Validate required fields
      if (!formData.consumerType || !formData.sellType) {
        toast({
          title: "Error",
          description: "Please select both Consumer Type and Sell Type",
          variant: "destructive",
        });
        return;
      }

      // Prepare discount data
      const discountData: any = {
        consumerType: formData.consumerType,
        sellType: formData.sellType,
      };

      // Add optional fields if they have values
      if (formData.deliveryAfter !== undefined) discountData.deliveryAfter = Number(formData.deliveryAfter);
      if (formData.vendorDiscount !== undefined) discountData.vendorDiscount = Number(formData.vendorDiscount);
      if (formData.vendorDiscountType) discountData.vendorDiscountType = formData.vendorDiscountType;
      if (formData.consumerDiscount !== undefined) discountData.consumerDiscount = Number(formData.consumerDiscount);
      if (formData.consumerDiscountType) discountData.consumerDiscountType = formData.consumerDiscountType;
      if (formData.minQuantity !== undefined) discountData.minQuantity = Number(formData.minQuantity);
      if (formData.maxQuantity !== undefined) discountData.maxQuantity = Number(formData.maxQuantity);
      if (formData.minCustomer !== undefined) discountData.minCustomer = Number(formData.minCustomer);
      if (formData.maxCustomer !== undefined) discountData.maxCustomer = Number(formData.maxCustomer);
      if (formData.minQuantityPerCustomer !== undefined) discountData.minQuantityPerCustomer = Number(formData.minQuantityPerCustomer);
      if (formData.maxQuantityPerCustomer !== undefined) discountData.maxQuantityPerCustomer = Number(formData.maxQuantityPerCustomer);
      if (formData.timeOpen !== undefined) discountData.timeOpen = Number(formData.timeOpen);
      if (formData.timeClose !== undefined) discountData.timeClose = Number(formData.timeClose);

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/bulkDiscountUpdate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productPriceIds: selectedProducts,
          discountData: discountData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (result.status) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // Refresh the product list
        // Reset discount form fields
        form.setValue("consumerType", "");
        form.setValue("sellType", "");
        form.setValue("deliveryAfter", 0);
        form.setValue("vendorDiscount", 0);
        form.setValue("vendorDiscountType", "");
        form.setValue("consumerDiscount", 0);
        form.setValue("consumerDiscountType", "");
        form.setValue("minQuantity", 0);
        form.setValue("maxQuantity", 0);
        form.setValue("minCustomer", 0);
        form.setValue("maxCustomer", 0);
        form.setValue("minQuantityPerCustomer", 0);
        form.setValue("maxQuantityPerCustomer", 0);
        form.setValue("timeOpen", 0);
        form.setValue("timeClose", 0);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update discounts",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle bulk where to sell update separately
  const handleBulkWhereToSellUpdate = async () => {
    try {
      const formData = form.getValues();
      
      // Validate that at least one location field is selected
      if (!selectedCountries.length && !selectedStates.length && !selectedCities.length) {
        toast({
          title: "Error",
          description: "Please select at least one country, state, or city",
          variant: "destructive",
        });
        return;
      }

      // Prepare location data
      const locationData: any = {};

      // Add location fields if they have values
      if (selectedCountries.length > 0) locationData.sellCountryIds = selectedCountries;
      if (selectedStates.length > 0) locationData.sellStateIds = selectedStates;
      if (selectedCities.length > 0) locationData.sellCityIds = selectedCities;
      // Note: placeOfOriginId temporarily disabled due to database constraint issues
      // if (formData.placeOfOriginId) locationData.placeOfOriginId = formData.placeOfOriginId;

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/bulkWhereToSellUpdate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productPriceIds: selectedProducts,
          locationData: locationData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (result.status) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // Refresh the product list
        // Reset location form fields
        setSelectedCountries([]);
        setSelectedStates([]);
        setSelectedCities([]);
        form.setValue("sellCountryIds", []);
        form.setValue("sellStateIds", []);
        form.setValue("sellCityIds", []);
        // form.setValue("placeOfOriginId", ""); // Temporarily disabled
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update where to sell settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle bulk ask for updates separately
  const handleBulkAskForUpdate = async () => {
    try {
      const formData = form.getValues();
      
      // Validate that at least one ask for field is selected
      if ((!watchAskForPrice || watchAskForPrice === "") && (!watchAskForStock || watchAskForStock === "")) {
        toast({
          title: "Error",
          description: "Please select at least one Ask For option",
          variant: "destructive",
        });
        return;
      }

      // Prepare ask for data
      const askForData: any = {};

      // Add ask for fields if they have values
      if (watchAskForPrice && watchAskForPrice !== "") askForData.askForPrice = watchAskForPrice;
      if (watchAskForStock && watchAskForStock !== "") askForData.askForStock = watchAskForStock;

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/bulkAskForUpdate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productPriceIds: selectedProducts,
          askForData: askForData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (result.status) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // Refresh the product list
        // Reset ask for form fields
        form.setValue("askForPrice", "");
        form.setValue("askForStock", "");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update ask for settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: any) => {
    // Hide/show is handled by separate buttons, not form submission
    
    // Include fields only from checked sections
    const updateData: any = {};
    
    // Warehouse section data
    if (data.updateWarehouse) {
      if (data.branchId !== undefined && data.branchId !== "") updateData.branchId = data.branchId;
    }
    
    // Where to Sell section data - now handled by separate button/API
    // Removed from general update to prevent conflicts
    
    // Customer Visibility is handled separately - not included in general update

    // Basic section data
    if (data.updateBasic) {
      if (data.enableChat !== undefined) updateData.enableChat = data.enableChat;
    }
    
    // Ask For section data - now handled by separate button/API
    // Removed from general update to prevent conflicts
    
    // Discounts section data
    if (data.updateDiscounts) {
      if (data.consumerType !== undefined && data.consumerType !== "") updateData.consumerType = data.consumerType;
      if (data.sellType !== undefined && data.sellType !== "") updateData.sellType = data.sellType;
      if (data.deliveryAfter !== undefined) updateData.deliveryAfter = data.deliveryAfter;
      if (data.vendorDiscount !== undefined) {
        updateData.vendorDiscount = data.vendorDiscount;
        if (data.vendorDiscountType !== undefined) updateData.vendorDiscountType = data.vendorDiscountType;
      }
      if (data.consumerDiscount !== undefined) {
        updateData.consumerDiscount = data.consumerDiscount;
        if (data.consumerDiscountType !== undefined) updateData.consumerDiscountType = data.consumerDiscountType;
      }
      if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
      if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
      if (data.minCustomer !== undefined) updateData.minCustomer = data.minCustomer;
      if (data.maxCustomer !== undefined) updateData.maxCustomer = data.maxCustomer;
      if (data.minQuantityPerCustomer !== undefined) updateData.minQuantityPerCustomer = data.minQuantityPerCustomer;
      if (data.maxQuantityPerCustomer !== undefined) updateData.maxQuantityPerCustomer = data.maxQuantityPerCustomer;
      if (data.timeOpen !== undefined) updateData.timeOpen = Number(data.timeOpen);
      if (data.timeClose !== undefined) updateData.timeClose = Number(data.timeClose);
    }
    
    // Check if there's any data to update
    if (Object.keys(updateData).length === 0) {
      return;
    }
    onBulkUpdate(updateData);
  };

  const sellTypes = () => {
    return SELL_TYPE_LIST.map((item) => ({
      label: t(item.label),
      value: item.value,
    }));
  };

  const consumerTypes = () => {
    return CONSUMER_TYPE_LIST.map((item) => ({
      label: t(item.label),
      value: item.value,
    }));
  };


  const discountTypes = () => [
    { label: t("percentage"), value: "PERCENTAGE" },
    { label: t("flat"), value: "FLAT" },
  ];

  const productConditions = () => {
    return PRODUCT_CONDITION_LIST.map((item) => ({
      label: t(item.label),
      value: item.value,
    }));
  };

  // Memoized countries data
  const memoizedAllCountries = useMemo(() => {
    if (!countriesNewQuery.data?.data) return [];
    return countriesNewQuery.data.data.map((country: any) => ({
      label: country.name,
      value: country.id.toString(),
    }));
  }, [countriesNewQuery.data]);

  const memoizedCountries = useMemo(() => {
    if (!countriesQuery.data?.data) return [];
    return countriesQuery.data.data.map((country: any) => ({
      label: country.name || country.countryName,
      value: country.id.toString(),
    }));
  }, [countriesQuery.data]);

  // Memoized all states from selected countries
  const memoizedAllStates = useMemo(() => {
    const allStates: IOption[] = [];
    Object.values(statesByCountry).forEach((states) => {
      allStates.push(...states);
    });
    return allStates;
  }, [statesByCountry]);

  // Memoized branches data
  const memoizedBranches = useMemo(() => {
    if (!me.data?.data?.userBranch) return [];
    return me.data.data.userBranch.map((branch: any) => ({
      label: branch.city ? `${branch.city} Branch` : `Branch ${branch.id}`,
      value: branch.id.toString(),
    }));
  }, [me.data?.data?.userBranch]);

  // Custom styles for ReactSelect
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: "32px",
      height: "32px",
      fontSize: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      "&:hover": {
        border: "1px solid #d1d5db",
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      fontSize: "12px",
      padding: "4px 8px",
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f3f4f6" : "white",
      color: state.isSelected ? "white" : "#374151",
    }),
  };

  // Fetch states when countries are selected
  useEffect(() => {
    if (selectedCountries.length > 0) {
      const fetchStates = async () => {
        const newStatesByCountry: Record<string, IOption[]> = {};
        
        for (const country of selectedCountries) {
          try {
            const response = await fetchStatesByCountry.mutateAsync({
              countryId: parseInt(country.value),
            });
            
            if (response?.data) {
              newStatesByCountry[country.value] = (response.data as any[]).map((state: any) => ({
                label: state.name,
                value: state.id.toString(),
              }));
            }
          } catch (error) {
          }
        }
        
        setStatesByCountry(newStatesByCountry);
      };
      
      fetchStates();
    } else {
      setStatesByCountry({});
      setSelectedStates([]);
      setSelectedCities([]);
    }
  }, [selectedCountries]);

  // Fetch cities when states are selected
  useEffect(() => {
    if (selectedStates.length > 0) {
      const fetchCities = async () => {
        const newCitiesByState: Record<string, IOption[]> = {};
        
        for (const state of selectedStates) {
          try {
            const response = await fetchCitiesByState.mutateAsync({
              stateId: parseInt(state.value),
            });
            
            if (response?.data) {
              newCitiesByState[state.value] = (response.data as any[]).map((city: any) => ({
                label: city.name,
                value: city.id.toString(),
              }));
            }
          } catch (error) {
          }
        }
        
        setCitiesByState(newCitiesByState);
      };
      
      fetchCities();
    } else {
      setCitiesByState({});
      setSelectedCities([]);
    }
  }, [selectedStates]);

  // Synchronize form values with local state on mount
  useEffect(() => {
    const formValues = form.getValues();
    if (formValues.sellCountryIds && formValues.sellCountryIds.length > 0) {
      setSelectedCountries(formValues.sellCountryIds);
    }
    if (formValues.sellStateIds && formValues.sellStateIds.length > 0) {
      setSelectedStates(formValues.sellStateIds);
    }
    if (formValues.sellCityIds && formValues.sellCityIds.length > 0) {
      setSelectedCities(formValues.sellCityIds);
    }
  }, []);

  // Sync form values when local state changes
  useEffect(() => {
    form.setValue("sellStateIds", selectedStates);
  }, [selectedStates, form]);

  useEffect(() => {
    form.setValue("sellCityIds", selectedCities);
  }, [selectedCities, form]);

  return (
    <aside className="h-fit">
      <div className="bg-card rounded-lg shadow-xs border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-primary/5 to-info/5 px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
            {t("bulk_edit")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("select_fields_to_update")}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('warehouse-location')}
              className={`py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'warehouse-location'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              } transition-colors`}
            >
              Location
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('product-basic')}
              className={`py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'product-basic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              } transition-colors`}
            >
              Product
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ask-for')}
              className={`py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'ask-for'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              } transition-colors`}
            >
              Ask For
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discounts')}
              className={`py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'discounts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
              } transition-colors`}
            >
              Discounts
            </button>
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-3">

          {/* Warehouse & Location Tab */}
          {activeTab === 'warehouse-location' && (
            <>
              {/* Warehouse Section */}
              <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <Controller
                  name="updateWarehouse"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  )}
                />
                <span className="text-sm font-medium text-foreground" translate="no">
                  Warehouse
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Warehouse Fields */}
            <div className={`space-y-2 ${!watchUpdateWarehouse ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Branch Selection */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  Select Branch
                </Label>
                <Controller
                  name="branchId"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={!watchUpdateWarehouse}
                      className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      <option value="">{t("select")}</option>
                      {memoizedBranches.map((branch: IOption) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Where to Sell Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <Controller
                  name="updateWhereToSell"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  )}
                />
                <span className="text-sm font-medium text-foreground" translate="no">
                  Where to Sell
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Where to Sell Fields */}
            <div className={`space-y-2 ${!watchUpdateWhereToSell ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Where to Sell - Select Multiple Country */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  {t("select_multiple_country")}
                </Label>
                <Controller
                  name="sellCountryIds"
                  control={form.control}
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      isDisabled={!watchUpdateWhereToSell}
                      onChange={(newValues: MultiValue<IOption>) => {
                        const newCountries = newValues || [];
                        setSelectedCountries([...newCountries]);
                        field.onChange(newCountries);

                        // Remove states that belong to the removed country
                        const updatedStates = selectedStates.filter((state) =>
                          newCountries.some((country) =>
                            statesByCountry[country.value]?.some(
                              (s) => s.value === state.value,
                            ),
                          ),
                        );
                        setSelectedStates(updatedStates);
                        form.setValue("sellStateIds", updatedStates);

                        // Remove cities that belong to removed states
                        const updatedCities = selectedCities.filter((city) =>
                          updatedStates.some((state) =>
                            citiesByState[state.value]?.some(
                              (c) => c.value === city.value,
                            ),
                          ),
                        );
                        setSelectedCities(updatedCities);
                        form.setValue("sellCityIds", updatedCities);
                      }}
                      options={memoizedAllCountries}
                      value={selectedCountries}
                      styles={customStyles}
                      instanceId="sellCountryIds"
                      placeholder={t("select")}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  )}
                />
              </div>

              {/* Select Multiple State - Always Available */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  {t("select_multiple_state")}
                </Label>
                <Controller
                  name="sellStateIds"
                  control={form.control}
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      isDisabled={!watchUpdateWhereToSell}
                      onChange={(newValues: MultiValue<IOption>) => {
                        const newStates = newValues || [];
                        field.onChange(newStates);
                        setSelectedStates([...newStates]);

                        // Remove cities that belong to removed states
                        const updatedCities = selectedCities.filter((city) =>
                          newStates.some((state) =>
                            citiesByState[state.value]?.some(
                              (c) => c.value === city.value,
                            ),
                          ),
                        );
                        setSelectedCities(updatedCities);
                        form.setValue("sellCityIds", updatedCities);
                      }}
                      options={selectedCountries.length > 0 
                        ? selectedCountries.flatMap((country) => statesByCountry[country.value] || [])
                        : []
                      }
                      value={selectedStates}
                      styles={customStyles}
                      instanceId="sellStateIds"
                      placeholder={selectedCountries.length > 0 ? t("select") : "Select countries first"}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  )}
                />
              </div>

              {/* Select Multiple City - Always Available */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  {t("select_multiple_city")}
                </Label>
                <Controller
                  name="sellCityIds"
                  control={form.control}
                  render={({ field }) => (
                    <ReactSelect
                      isMulti
                      isDisabled={!watchUpdateWhereToSell}
                      onChange={(newValues: MultiValue<IOption>) => {
                        const newCities = newValues || [];
                        field.onChange(newCities);
                        setSelectedCities([...newCities]);
                      }}
                      options={selectedStates.length > 0 
                        ? selectedStates.flatMap((state) => citiesByState[state.value] || [])
                        : []
                      }
                      value={selectedCities}
                      styles={customStyles}
                      instanceId="sellCityIds"
                      placeholder={selectedStates.length > 0 ? t("select") : "Select states first"}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  )}
                />
              </div>

              {/* Place of Origin */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  {t("place_of_origin")}
                </Label>
                <Controller
                  name="placeOfOriginId"
                  control={form.control}
                  render={({ field }) => (
                    <ReactSelect
                      isDisabled={!watchUpdateWhereToSell}
                      onChange={(newValue) => {
                        field.onChange(newValue?.value || "");
                      }}
                      options={memoizedAllCountries}
                      value={memoizedAllCountries.find(
                        (item: IOption) => item.value === field.value,
                      )}
                      styles={customStyles}
                      instanceId="placeOfOriginId"
                      placeholder={memoizedAllCountries.length > 0 ? t("select") : "Loading countries..."}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  )}
                />
              </div>

              {/* Update Where to Sell Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleBulkWhereToSellUpdate()}
                  disabled={!watchUpdateWhereToSell || (!selectedCountries.length && !selectedStates.length && !selectedCities.length)}
                  className={`w-full px-3 py-1.5 text-xs font-medium rounded focus:outline-hidden focus:ring-1 focus:ring-offset-1 transition-colors ${
                    watchUpdateWhereToSell && (selectedCountries.length > 0 || selectedStates.length > 0 || selectedCities.length > 0)
                      ? 'bg-info text-white hover:bg-info/90 focus:ring-info'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Update Where to Sell
                </button>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Product & Basic Tab */}
          {activeTab === 'product-basic' && (
            <>
              {/* Product Condition Section */}
              <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <span className="text-sm font-medium text-foreground" translate="no">
                  Product Condition
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Product Condition Update */}
            <div className="p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                  Update Product Condition
                </Label>
                <Controller
                  name="productCondition"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">{t("select")}</option>
                      {productConditions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <button
                  type="button"
                  onClick={() => handleBulkProductCondition()}
                  disabled={!watchProductCondition}
                  className={`w-full px-4 py-2 text-xs font-medium rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors ${
                    watchProductCondition
                      ? 'bg-primary text-white hover:bg-primary/90 focus:ring-primary'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Update Product Condition
                </button>
              </div>
            </div>
          </div>

          {/* Customer Visibility Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <span className="text-sm font-medium text-foreground" translate="no">
                  Customer Visibility
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Hide All Selected */}
            <div className="p-3 bg-muted rounded border border-border">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground" translate="no">
                  Control Customer Visibility
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => showConfirmation(true)}
                    className="flex-1 px-3 py-2 bg-destructive text-white text-xs font-medium rounded hover:bg-destructive/90 focus:outline-hidden focus:ring-1 focus:ring-destructive focus:ring-offset-1 transition-colors"
                  >
                    ⚠️ Hide from Customers
                  </button>
                  <button
                    type="button"
                    onClick={() => showConfirmation(false)}
                    className="flex-1 px-3 py-2 bg-success text-white text-xs font-medium rounded hover:bg-success/90 focus:outline-hidden focus:ring-1 focus:ring-success focus:ring-offset-1 transition-colors"
                  >
                    ✅ Show to Customers
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <Controller
                  name="updateBasic"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  )}
                />
                <span className="text-sm font-medium text-foreground" translate="no">
                  Basic Settings
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Basic Fields */}
            <div className={`space-y-2 ${!watchUpdateBasic ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Enable Chat */}
              <div className="p-3 bg-muted rounded border border-border">
                <div className="flex items-center space-x-3">
                  <Controller
                    name="enableChat"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={!watchUpdateBasic}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                  />
                  <Label className="text-sm font-medium text-foreground" translate="no">
                    Enable Chat
                  </Label>
                </div>
              </div>

            </div>
          </div>
            </>
          )}

          {/* Ask For Settings Tab */}
          {activeTab === 'ask-for' && (
            <>
              {/* Ask For Section */}
              <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <Controller
                  name="updateAskFor"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  )}
                />
                <span className="text-sm font-medium text-foreground" translate="no">
                  Ask For Settings
                </span>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Ask For Fields */}
            <div className={`space-y-2 ${!watchUpdateAskFor ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Ask for Price */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  Ask for Price
                </Label>
                <Controller
                  name="askForPrice"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={!watchUpdateAskFor}
                      className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}
                />
              </div>

              {/* Ask for Stock */}
              <div className="p-3 bg-muted rounded border border-border">
                <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
                  Ask for Stock
                </Label>
                <Controller
                  name="askForStock"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={!watchUpdateAskFor}
                      className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}
                />
              </div>

              {/* Update Ask For Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleBulkAskForUpdate()}
                  disabled={!watchUpdateAskFor || (!watchAskForPrice && !watchAskForStock) || (watchAskForPrice === "" && watchAskForStock === "")}
                  className={`w-full px-3 py-1.5 text-xs font-medium rounded focus:outline-hidden focus:ring-1 focus:ring-offset-1 transition-colors ${
                    watchUpdateAskFor && (watchAskForPrice && watchAskForPrice !== "" || watchAskForStock && watchAskForStock !== "")
                      ? 'bg-warning text-white hover:bg-warning/90 focus:ring-warning'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Update Ask For Settings
                </button>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Discounts Tab */}
          {activeTab === 'discounts' && (
            <>
              {/* Discounts Section */}
              <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-px bg-muted flex-1"></div>
              <div className="flex items-center space-x-2 px-3 bg-card">
                <Controller
                  name="updateDiscounts"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                  )}
                />
                <h3 className="text-sm font-semibold text-muted-foreground" translate="no">
                  {t("discounts")}
                </h3>
              </div>
              <div className="h-px bg-muted flex-1"></div>
            </div>

            {/* Consumer Type */}
            <div className={`p-4 rounded-lg border ${watchUpdateDiscounts ? 'bg-muted border-border' : 'bg-muted border-border'}`}>
              <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                {t("consumer_type")}
              </Label>
              <Controller
                name="consumerType"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={!watchUpdateDiscounts}
                    className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-transparent ${
                      watchUpdateDiscounts 
                        ? 'border-border focus:ring-primary' 
                        : 'border-border bg-muted cursor-not-allowed'
                    }`}
                  >
                    <option value="">{t("select")}</option>
                    {consumerTypes().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Sell Type */}
            <div className={`p-4 rounded-lg border ${watchUpdateDiscounts ? 'bg-muted border-border' : 'bg-muted border-border'}`}>
              <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                {t("sell_type")}
              </Label>
              <Controller
                name="sellType"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={!watchUpdateDiscounts}
                    className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-transparent ${
                      watchUpdateDiscounts 
                        ? 'border-border focus:ring-primary' 
                        : 'border-border bg-muted cursor-not-allowed'
                    }`}
                  >
                    <option value="">{t("select")}</option>
                    {sellTypes().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Show dependent fields only when both Consumer Type and Sell Type are selected and section is enabled */}
            {watchConsumerType && watchSellType && watchUpdateDiscounts ? (
              <>
              {/* Delivery After */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                  {t("deliver_after")}
                </Label>
                <Controller
                  name="deliveryAfter"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) - 1;
                          field.onChange(newValue >= 0 ? newValue : 0);
                        }}
                      >
                        -
                      </button>
                      <Input
                        {...field}
                        type="number"
                        placeholder={t("after")}
                        className="pl-12 pr-12 text-center"
                        value={field.value || 0}
                        min="0"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) + 1;
                          field.onChange(newValue);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Quantity fields - show only for BUYGROUP sell type */}
              {watchSellType === "BUYGROUP" && (
                <>
                  {/* Min Quantity */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("min_quantity")}
                    </Label>
                    <Controller
                      name="minQuantity"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) - 1;
                              field.onChange(newValue >= 0 ? newValue : 0);
                            }}
                          >
                            -
                          </button>
                          <Input
                            {...field}
                            type="number"
                            placeholder={t("min")}
                            className="pl-12 pr-12 text-center"
                            value={field.value || 0}
                            min="0"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) + 1;
                              field.onChange(newValue);
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Max Quantity */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("max_quantity")}
                    </Label>
                    <Controller
                      name="maxQuantity"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) - 1;
                              field.onChange(newValue >= 0 ? newValue : 0);
                            }}
                          >
                            -
                          </button>
                          <Input
                            {...field}
                            type="number"
                            placeholder={t("max")}
                            className="pl-12 pr-12 text-center"
                            value={field.value || 0}
                            min="0"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) + 1;
                              field.onChange(newValue);
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Min Customer */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("min_customer")}
                    </Label>
                    <Controller
                      name="minCustomer"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) - 1;
                              field.onChange(newValue >= 0 ? newValue : 0);
                            }}
                          >
                            -
                          </button>
                          <Input
                            {...field}
                            type="number"
                            placeholder={t("min")}
                            className="pl-12 pr-12 text-center"
                            value={field.value || 0}
                            min="0"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) + 1;
                              field.onChange(newValue);
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Max Customer */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("max_customer")}
                    </Label>
                    <Controller
                      name="maxCustomer"
                      control={form.control}
                      render={({ field }) => (
                        <div className="relative">
                          <button
                            type="button"
                            className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) - 1;
                              field.onChange(newValue >= 0 ? newValue : 0);
                            }}
                          >
                            -
                          </button>
                          <Input
                            {...field}
                            type="number"
                            placeholder={t("max")}
                            className="pl-12 pr-12 text-center"
                            value={field.value || 0}
                            min="0"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                            onClick={() => {
                              const newValue = Number(field.value) + 1;
                              field.onChange(newValue);
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Time Open - Common for all sell types */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                  {t("time_open")}
                </Label>
                <Controller
                  name="timeOpen"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) - 1;
                          field.onChange(newValue >= 0 ? newValue : 0);
                        }}
                      >
                        -
                      </button>
                      <Input
                        {...field}
                        type="number"
                        placeholder={t("time_open")}
                        className="pl-12 pr-12 text-center"
                        value={field.value || 0}
                        min="0"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) + 1;
                          field.onChange(newValue);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Time Close - Common for all sell types */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                  {t("time_close")}
                </Label>
                <Controller
                  name="timeClose"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) - 1;
                          field.onChange(newValue >= 0 ? newValue : 0);
                        }}
                      >
                        -
                      </button>
                      <Input
                        {...field}
                        type="number"
                        placeholder={t("time_close")}
                        className="pl-12 pr-12 text-center"
                        value={field.value || 0}
                        min="0"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                        onClick={() => {
                          const newValue = Number(field.value) + 1;
                          field.onChange(newValue);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Quantity Per Customer - show for BUYGROUP or WHOLESALE_PRODUCT sell type with any consumer type */}
              {(watchSellType === "BUYGROUP" || watchSellType === "WHOLESALE_PRODUCT") && (
                <>
                  {/* Min Quantity Per Customer */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("min_quantity_per_customer")}
                    </Label>
                    <Controller
                      name="minQuantityPerCustomer"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = Math.max(currentValue - 1, 0);
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-8 w-20 text-center"
                            placeholder={t("min")}
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = currentValue + 1;
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Max Quantity Per Customer */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("max_quantity_per_customer")}
                    </Label>
                    <Controller
                      name="maxQuantityPerCustomer"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = Math.max(currentValue - 1, 0);
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-8 w-20 text-center"
                            placeholder={t("max")}
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = currentValue + 1;
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Vendor Discount - Show for EVERYONE or VENDORS/BUSINESS consumer type */}
              {(watchConsumerType === "EVERYONE" || watchConsumerType === "VENDORS" || watchConsumerType === "BUSINESS") && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                    {t("vendor_discount")}
                  </Label>
                  <Controller
                    name="vendorDiscount"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <button
                          type="button"
                          className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                          onClick={() => {
                            const newValue = Number(field.value) - 1;
                            field.onChange(newValue);
                          }}
                        >
                          -
                        </button>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Discount"
                          className="pl-12 pr-12 text-center"
                          value={field.value || 0}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                          onClick={() => {
                            const newValue = Number(field.value) + 1;
                            field.onChange(newValue);
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Consumer Discount - Show for EVERYONE or CONSUMER consumer type */}
              {(watchConsumerType === "EVERYONE" || watchConsumerType === "CONSUMER") && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                    {t("consumer_discount")}
                  </Label>
                  <Controller
                    name="consumerDiscount"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <button
                          type="button"
                          className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                          onClick={() => {
                            const newValue = Number(field.value) - 1;
                            field.onChange(newValue);
                          }}
                        >
                          -
                        </button>
                        <Input
                          {...field}
                          type="number"
                          placeholder={t("discount")}
                          className="pl-12 pr-12 text-center"
                          value={field.value || 0}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                          onClick={() => {
                            const newValue = Number(field.value) + 1;
                            field.onChange(newValue);
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Vendor Discount Type - Show for EVERYONE or VENDORS/BUSINESS consumer type */}
              {(watchConsumerType === "EVERYONE" || watchConsumerType === "VENDORS" || watchConsumerType === "BUSINESS") && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                    {t("vendor_discount_type")}
                  </Label>
                  <Controller
                    name="vendorDiscountType"
                    control={form.control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        {discountTypes().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              )}

              {/* Consumer Discount Type - Show for EVERYONE or CONSUMER consumer type */}
              {(watchConsumerType === "EVERYONE" || watchConsumerType === "CONSUMER") && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                    {t("consumer_discount_type")}
                  </Label>
                  <Controller
                    name="consumerDiscountType"
                    control={form.control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        {discountTypes().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              )}

              {/* Trial Product Fields - Show for TRIAL_PRODUCT sell type with any consumer type */}
              {watchSellType === "TRIAL_PRODUCT" && (
                <>
                  {/* Max Quantity Per Customer for Trial Product */}
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
                      {t("max_quantity_per_customer")}
                    </Label>
                    <Controller
                      name="maxQuantityPerCustomer"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = Math.max(currentValue - 1, 0);
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-8 w-20 text-center"
                            placeholder={t("max")}
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = Number(field.value) || 0;
                              const newValue = currentValue + 1;
                              field.onChange(newValue);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
              </>
            ) : (
              /* Show message only when Consumer Type/Sell Type is not selected (section is enabled) */
              watchUpdateDiscounts && (
                <div className="p-6 text-center">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="text-primary text-sm font-medium mb-2">
                      {t("select_consumer_type_and_sell_type")}
                    </div>
                    <div className="text-primary text-xs">
                      {t("choose_consumer_type_and_sell_type_to_see_options")}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Update Discounts Button - Show only when Consumer Type and Sell Type are selected */}
            {watchConsumerType && watchSellType && watchUpdateDiscounts && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleBulkDiscountUpdate()}
                  className="w-full px-4 py-2 bg-success text-white text-xs font-medium rounded-md hover:bg-success/90 focus:outline-hidden focus:ring-2 focus:ring-success focus:ring-offset-2 transition-colors"
                >
                  Update Discounts
                </button>
              </div>
            )}
          </div>
            </>
          )}

          {/* Submit Button */}
          {/* <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-xs hover:shadow-md"
              translate="no"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("updating")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t("update_selected")}
                </span>
              )}
            </Button>
          </div> */}
        </form>
      </div>

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded shadow-xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                  confirmAction.type === 'hide' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-success/10 text-success'
                }`}>
                  {confirmAction.type === 'hide' ? '⚠️' : '✅'}
                </div>
                <h3 className="text-base font-medium text-foreground">
                  Confirm Action
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {confirmAction.message}
              </p>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                  }}
                  className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-muted focus:outline-hidden focus:ring-1 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAction.onConfirm}
                  className={`px-3 py-1.5 text-xs text-white rounded focus:outline-hidden focus:ring-1 transition-colors ${
                    confirmAction.type === 'hide'
                      ? 'bg-destructive hover:bg-destructive/90 focus:ring-destructive'
                      : 'bg-success hover:bg-success/90 focus:ring-success'
                  }`}
                >
                  {confirmAction.type === 'hide' ? 'Hide Products' : 'Show Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default BulkEditSidebar;
