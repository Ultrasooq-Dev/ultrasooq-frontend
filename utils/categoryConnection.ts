/**
 * Check if vendor's business category is connected to product's category
 * @param vendorBusinessCategoryIds - Array of vendor's business category IDs
 * @param productCategoryId - Product's category ID
 * @param productCategoryLocation - Product's category location path (optional)
 * @param categoryConnections - Category connections data from API (category_categoryIdDetail array)
 * @returns boolean - true if connected, false otherwise
 */
export const checkCategoryConnection = (
  vendorBusinessCategoryIds: number[],
  productCategoryId: number,
  productCategoryLocation?: string,
  categoryConnections?: any[]
): boolean => {
  if (!vendorBusinessCategoryIds?.length || !productCategoryId) {
    return false;
  }

  // Check direct connection via categoryConnections
  // categoryConnections contains connections FROM the product's category TO business categories
  if (categoryConnections?.length) {
    const isConnected = categoryConnections.some((connection: any) => {
      // Try multiple ways to get the connectTo ID
      const connectToId = 
        connection.connectTo || 
        connection.connectToDetail?.id ||
        connection.connectToId;
      
      if (!connectToId) return false;
      
      // Check if this connection's connectTo matches any of the vendor's business category IDs
      const connectToIdNum = Number(connectToId);
      const matches = vendorBusinessCategoryIds.includes(connectToIdNum);
      
      return matches;
    });
    if (isConnected) {
      return true;
    }
  }

  // Fallback: Check if productCategoryId directly matches any vendor business category
  // This handles the case where the product category itself is a business category
  if (vendorBusinessCategoryIds.includes(Number(productCategoryId))) {
    return true;
  }

  // If categoryConnections not available, check via categoryLocation
  // This is a fallback - ideally categoryConnections should be provided
  if (productCategoryLocation && vendorBusinessCategoryIds.length > 0) {
    // Handle both comma-separated and slash-separated paths
    const categoryPath = productCategoryLocation
      .split(/[,\/]/)
      .map(Number)
      .filter(Boolean);
    
    // Check if any vendor business category ID is in the product's category path
    const hasMatch = vendorBusinessCategoryIds.some((vendorCatId) =>
      categoryPath.includes(vendorCatId)
    );
    if (hasMatch) {
      return true;
    }
  }

  return false;
};

