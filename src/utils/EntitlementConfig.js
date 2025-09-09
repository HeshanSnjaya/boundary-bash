// utils/EntitlementConfig.js
export const ENTITLEMENT_CATEGORY_ICONS = {
  food: 'restaurant',
  beverage: 'wine',
  merchandise: 'bag',
  access: 'key',
  other: 'star'
};

export const ENTITLEMENT_CATEGORY_COLORS = {
  food: '#10b981',
  beverage: '#f97316',
  merchandise: '#8b5cf6',
  access: '#06b6d4',
  other: '#6b7280'
};

export const SPECIFIC_ENTITLEMENT_ICONS = {
  'breakfast': 'sunny',
  'lunch': 'restaurant',
  'dinner': 'moon',
  'evening meal': 'moon',
  'evening refreshments': 'wine',
  'beer': 'wine',
  'soft drink': 'cafe',
  'soft drinks': 'cafe',
  'water': 'water',
  'coffee': 'cafe-outline',
  'tea': 'leaf',
  'snacks': 'fast-food',
  'merchandise': 'bag',
  'access': 'key',
  'parking': 'car',
  'wifi': 'wifi',
  'special beverage': 'wine',
  'special meal': 'restaurant-outline'
};

export const getEntitlementDisplayInfo = (name, category) => {
  // Add safety checks
  if (!name || typeof name !== 'string') {
    return { icon: 'star', color: '#6b7280' };
  }
  
  const iconKey = name.toLowerCase();
  const icon = SPECIFIC_ENTITLEMENT_ICONS[iconKey] || 
               ENTITLEMENT_CATEGORY_ICONS[category] || 
               'star';
  const color = ENTITLEMENT_CATEGORY_COLORS[category] || '#6b7280';
  return { icon, color };
};

export const getLimitOverrideSetting = (entitlementName) => {
  // Add safety check
  if (!entitlementName || typeof entitlementName !== 'string') {
    return null;
  }
  
  const mappings = {
    'beer': 'beerLimit',
    'soft drinks': 'softDrinkLimit',
    'soft drink': 'softDrinkLimit'
  };
  return mappings[entitlementName.toLowerCase()] || null;
};

export const isCommonEntitlement = (name, category) => {
  // Add safety check
  if (!category || typeof category !== 'string') {
    return false;
  }
  return category === 'food' || category === 'beverage';
};
