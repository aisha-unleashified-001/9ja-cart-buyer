import { useState, useCallback } from 'react';
import { profileApi, type UpdateProfileRequest } from '../../api/profile';
import { addressApi, transformAddressToApi } from '../../api/address';
import { apiErrorUtils } from '../../utils/api-errors';
import type { UserProfile, ProfileUpdateData, PasswordUpdateData, UserAddress } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

// Hook for managing user profile
export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile: updateAuthProfile } = useAuthStore();

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileApi.getProfile();
      
      // Map API response to UserProfile
      const userProfile: UserProfile = {
        id: response.data.profile.buyerId,
        email: response.data.profile.emailAddress,
        firstName: response.data.profile.firstName,
        lastName: response.data.profile.lastName,
        phone: response.data.profile.phoneNumber || undefined,
        isActive: response.data.profile.isActive === '1',
        isEmailVerified: response.data.profile.isEmailVerified === '1',
        verifiedAt: response.data.profile.verifiedAt,
        createdAt: response.data.profile.createdAt,
        updatedAt: response.data.profile.updatedAt,
        addresses: response.data.addresses.map(addr => ({
          id: addr.id,
          streetAddress: addr.streetAddress,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          country: addr.country,
          isDefault: addr.isDefault,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        })),
      };

      setProfile(userProfile);
      
      // Update auth store with latest profile data
      updateAuthProfile({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone,
      });

    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthProfile]);

  // Update profile information
  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: UpdateProfileRequest = {};
      
      if (data.firstName !== undefined) {
        updateData.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        updateData.lastName = data.lastName;
      }

      await profileApi.updateProfile(updateData);
      
      // Refresh profile data after successful update
      await fetchProfile();

    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Update password
  const updatePassword = useCallback(async (data: PasswordUpdateData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: UpdateProfileRequest = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      };

      await profileApi.updateProfile(updateData);

    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new address
  const addAddress = useCallback(async (addressData: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiData = transformAddressToApi(
        addressData.streetAddress,
        addressData.city,
        addressData.state,
        addressData.zipCode,
        addressData.country,
        addressData.isDefault
      );

      await addressApi.addAddress(apiData);
      
      // Refresh profile data to get updated addresses
      await fetchProfile();

    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Update existing address
  const updateAddress = useCallback(async (id: string, addressData: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiData = transformAddressToApi(
        addressData.streetAddress,
        addressData.city,
        addressData.state,
        addressData.zipCode,
        addressData.country,
        addressData.isDefault
      );

      await addressApi.editAddress(id, apiData);
      
      // Refresh profile data to get updated addresses
      await fetchProfile();

    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Get default address
  const getDefaultAddress = useCallback((): UserAddress | null => {
    if (!profile?.addresses) return null;
    return profile.addresses.find(addr => addr.isDefault) || null;
  }, [profile]);

  // Get all addresses
  const getAddresses = useCallback((): UserAddress[] => {
    if (!profile?.addresses) return [];
    return profile.addresses;
  }, [profile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updatePassword,
    addAddress,
    updateAddress,
    getDefaultAddress,
    getAddresses,
  };
};