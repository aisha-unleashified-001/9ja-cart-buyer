import React, { useState, useEffect } from 'react';
import { Button, Input, Alert } from '../UI';
import { useProfile } from '../../hooks/api/useProfile';
import { profileUpdateSchema, passwordUpdateSchema } from '../../lib/validations';
import type { ProfileUpdateData, PasswordUpdateData } from '../../types';
import { Eye, EyeOff } from 'lucide-react';

const ProfileSection: React.FC = () => {
  const { profile, isLoading, error, fetchProfile, updateProfile, updatePassword } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      }));
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    setValidationErrors({});
    setSuccessMessage('');

    try {
      // Determine what to update
      const isPasswordUpdate = formData.currentPassword || formData.newPassword || formData.confirmPassword;
      const isProfileUpdate = formData.firstName !== profile?.firstName || formData.lastName !== profile?.lastName;

      if (isPasswordUpdate) {
        // Validate password update
        const passwordData: PasswordUpdateData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmPassword,
        };

        const passwordValidation = passwordUpdateSchema.safeParse(passwordData);
        if (!passwordValidation.success) {
          const errors: Record<string, string> = {};
          passwordValidation.error.issues.forEach((issue) => {
            if (issue.path[0]) {
              errors[issue.path[0] as string] = issue.message;
            }
          });
          setValidationErrors(errors);
          return;
        }

        await updatePassword(passwordData);
        setSuccessMessage('Password updated successfully!');
      }

      if (isProfileUpdate) {
        // Validate profile update
        const profileData: ProfileUpdateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
        };

        const profileValidation = profileUpdateSchema.safeParse(profileData);
        if (!profileValidation.success) {
          const errors: Record<string, string> = {};
          profileValidation.error.issues.forEach((issue) => {
            if (issue.path[0]) {
              errors[issue.path[0] as string] = issue.message;
            }
          });
          setValidationErrors(errors);
          return;
        }

        await updateProfile(profileData);
        setSuccessMessage('Profile updated successfully!');
      }

      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      // Error is already handled by the hook
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original profile data
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
    setValidationErrors({});
    setSuccessMessage('');
  };

  // Show loading state
  if (isLoading && !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Edit Your Profile</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" disabled={isLoading}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">First Name</label>
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your first name"
            className={`bg-muted ${validationErrors.firstName ? 'border-red-500' : ''}`}
          />
          {validationErrors.firstName && (
            <p className="text-sm text-red-600">{validationErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Last Name</label>
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="Enter your last name"
            className={`bg-muted ${validationErrors.lastName ? 'border-red-500' : ''}`}
          />
          {validationErrors.lastName && (
            <p className="text-sm text-red-600">{validationErrors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={true} // Email cannot be changed
            placeholder="your.email@example.com"
            className="bg-muted opacity-60"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Show addresses if available */}
        {profile?.addresses && profile.addresses.length > 0 && (
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Addresses</label>
            <div className="space-y-2">
              {profile.addresses.map((address) => (
                <div key={address.id} className="p-3 bg-muted rounded-md text-sm">
                  <div className="font-medium">{address.streetAddress}</div>
                  <div className="text-muted-foreground">
                    {address.city}, {address.state} {address.zipCode}, {address.country}
                    {address.isDefault && <span className="ml-2 text-primary">(Default)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-lg font-medium text-foreground">Password Changes</h3>
          
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <Input
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  className={`bg-muted pr-10 ${validationErrors.currentPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.currentPassword && (
                <p className="text-sm text-red-600">{validationErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  className={`bg-muted pr-10 ${validationErrors.newPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.newPassword && (
                <p className="text-sm text-red-600">{validationErrors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must contain at least 6 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className={`bg-muted pr-10 ${validationErrors.confirmNewPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.confirmNewPassword && (
                <p className="text-sm text-red-600">{validationErrors.confirmNewPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              className="bg-primary hover:bg-primary/90"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;