import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Button, Card, CardContent } from '../UI';
import type { UserAddress } from '../../types';

interface AddressSelectorProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (address: UserAddress) => void;
  onAddNew: () => void;
  onCancel: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNew,
  onCancel,
}) => {
  const shouldScroll = addresses.length > 6;
  
  return (
    <>
      <style>{`
        .address-selector-scrollable {
          max-height: 420px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding-right: 8px !important;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .address-selector-scrollable::-webkit-scrollbar {
          width: 8px;
        }
        .address-selector-scrollable::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .address-selector-scrollable::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .address-selector-scrollable::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Choose Address</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          
          <div 
            className={`space-y-3 ${shouldScroll ? 'address-selector-scrollable' : ''}`}
          >
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAddressId === address.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectAddress(address)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mt-0.5">
                  {selectedAddressId === address.id && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">
                      {address.streetAddress}
                    </p>
                    {address.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Address Option */}
          <div
            className="p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onClick={onAddNew}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                <Plus className="w-3 h-3 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Add New Address</p>
                <p className="text-sm text-muted-foreground">
                  Use a different address for this order
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default AddressSelector;