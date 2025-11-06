import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, CardContent } from '../UI';
import { useCartStore } from '../../store/useCartStore';
import { useRealProductsList } from '../../hooks/api/useRealProducts';

const QuickCartDemo: React.FC = () => {
  const { addItem, getTotalItems } = useCartStore();
  const { products } = useRealProductsList({ page: 1, perPage: 5 });

  const addDemoItems = () => {
    // Add first two available products to cart as demo
    if (products.length >= 2) {
      // Convert ProductSummary to Product for cart
      const product1 = {
        ...products[0],
        description: products[0].name,
        shortDescription: products[0].name,
        features: [],
        specifications: {},
        inventory: {
          ...products[0].inventory,
          quantity: 100,
          lowStockThreshold: 10,
          trackQuantity: true,
        },
        images: {
          ...products[0].images,
          gallery: [products[0].images.main],
          videos: [],
        },
        sellerId: 'demo-seller',
        shipping: {
          freeShipping: true,
          estimatedDelivery: '2-3 business days',
        },
        returns: {
          returnable: true,
          period: 30,
          unit: 'days' as const,
          free: true,
        },
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      const product2 = {
        ...products[1],
        description: products[1].name,
        shortDescription: products[1].name,
        features: [],
        specifications: {},
        inventory: {
          ...products[1].inventory,
          quantity: 100,
          lowStockThreshold: 10,
          trackQuantity: true,
        },
        images: {
          ...products[1].images,
          gallery: [products[1].images.main],
          videos: [],
        },
        sellerId: 'demo-seller',
        shipping: {
          freeShipping: true,
          estimatedDelivery: '2-3 business days',
        },
        returns: {
          returnable: true,
          period: 30,
          unit: 'days' as const,
          free: true,
        },
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      addItem(product1, 1);
      addItem(product2, 1);
    }
  };

  const totalItems = getTotalItems(false); // Demo uses guest cart

  if (totalItems > 0 || products.length < 2) {
    return null; // Don't show if cart already has items or not enough products loaded
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Demo Mode
            </h3>
            <p className="text-sm text-blue-700">
              Add real products to your cart to test the checkout flow
            </p>
          </div>
          <Button
            onClick={addDemoItems}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Demo Items
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickCartDemo;