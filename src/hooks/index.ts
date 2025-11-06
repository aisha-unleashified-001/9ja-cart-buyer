// Real API hooks (preferred)
export * from './api/useRealProducts';
export * from './api/useRealCategories';
export * from './api/useProfile';

// Legacy mock hooks (deprecated - will be removed)
export * from './useMockProducts';

// Utility hooks
export { default as useClickOutside } from './useClickOutside';
export { useCart } from './useCart';