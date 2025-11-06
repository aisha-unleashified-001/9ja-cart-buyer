import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Alert, Loading } from '../UI';
import { useProfile } from '../../hooks/api/useProfile';
import type { UserAddress } from '../../types';

const AddressesSection: React.FC = () => {
  const { 
    profile, 
    isLoading, 
    error, 
    fetchProfile, 
    addAddress, 
    updateAddress, 
    getAddresses 
  } = useProfile();
  
  const addresses = getAddresses();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    isDefault: false
  });

  // Load profile data on component mount
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormData({
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria',
      isDefault: false
    });
  };

  const handleEdit = (address: UserAddress) => {
    setEditingId(address.id);
    setFormData({
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      if (isAddingNew) {
        await addAddress(formData);
        setIsAddingNew(false);
      } else if (editingId) {
        await updateAddress(editingId, formData);
        setEditingId(null);
      }
      
      // Reset form
      setFormData({
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nigeria',
        isDefault: false
      });
    } catch (error) {
      // Error is handled by the hook and displayed in the UI
      console.error('Failed to save address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria',
      isDefault: false
    });
  };

  const handleDelete = (_id: string) => {
    // Note: Delete endpoint not available in API yet
    if (window.confirm('Are you sure you want to delete this address?')) {
      alert('Delete functionality will be available once the API endpoint is implemented.');
    }
  };

  const renderAddressForm = () => (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="text-lg">
          {isAddingNew ? 'Add New Address' : 'Edit Address'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Street Address</label>
          <Input
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleInputChange}
            placeholder="e.g., 54, John Doe Street"
          />
          <p className="text-xs text-muted-foreground">
            Include house number and street name
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State</label>
            <Input
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="State"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ZIP Code</label>
            <Input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="ZIP Code"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Country</label>
          <Input
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            placeholder="Country"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleInputChange}
            className="rounded border-gray-300"
          />
          <label htmlFor="isDefault" className="text-sm font-medium">
            Set as default address
          </label>
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loading className="w-4 h-4 mr-2" />
                {isAddingNew ? 'Adding...' : 'Saving...'}
              </>
            ) : (
              isAddingNew ? 'Add Address' : 'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading className="w-6 h-6 mr-2" />
        <span>Loading addresses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">My Addresses</h2>
        {!isAddingNew && !editingId && (
          <Button onClick={handleAddNew} className="flex items-center gap-2" disabled={isLoading}>
            <Plus className="w-4 h-4" />
            Add New Address
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.length === 0 && !isAddingNew ? (
          <div className="md:col-span-2">
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No addresses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first address to make checkout faster and easier.
                </p>
                <Button onClick={handleAddNew} className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Add Your First Address
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          addresses.map((address) => (
          <Card key={address.id} className="relative">
            <CardContent className="p-6">
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Default
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-foreground">
                    {address.streetAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(address)}
                  disabled={editingId === address.id}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
        
        {(isAddingNew || editingId) && renderAddressForm()}
      </div>
    </div>
  );
};

export default AddressesSection;