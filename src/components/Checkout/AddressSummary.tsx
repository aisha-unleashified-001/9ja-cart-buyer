import React from 'react';
import { MapPin, Edit, ChevronDown } from 'lucide-react';
import { Button, Card, CardContent } from '../UI';
import type { UserAddress } from '../../types';

interface AddressSummaryProps {
  address: UserAddress;
  onEdit: () => void;
  onChangeAddress?: () => void;
  showChangeOption?: boolean;
}

const AddressSummary: React.FC<AddressSummaryProps> = ({
  address,
  onEdit,
  onChangeAddress,
  showChangeOption = false,
}) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground">Shipping Address</h3>
              {address.isDefault && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Default
                </span>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {address.streetAddress}
              </p>
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
              <p>{address.country}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            
            {showChangeOption && onChangeAddress && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onChangeAddress}
                className="flex items-center gap-1 text-primary hover:text-primary"
              >
                <ChevronDown className="w-3 h-3" />
                Change
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressSummary;