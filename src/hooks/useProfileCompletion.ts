'use client';

import { useMemo } from 'react';
import { User } from '@/types';

export interface ProfileField {
  key: string;
  label: string;
  labelVi: string;
  required: boolean;
  icon: string;
  completed: boolean;
}

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: ProfileField[];
  completedFields: ProfileField[];
  isCompleteEnoughForBooking: boolean;
  requiredFieldsMissing: string[];
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces';

function isValidAvatar(avatar: string | undefined): boolean {
  if (!avatar) return false;
  // Check if it's not the default avatar
  if (avatar === DEFAULT_AVATAR) return false;
  // Check if it's a valid URL
  return avatar.length > 0 && (avatar.startsWith('http') || avatar.startsWith('/'));
}

function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  // Vietnamese phone number validation (10-11 digits)
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

function isValidLocation(location: string | undefined): boolean {
  if (!location) return false;
  // Should not be empty or just default
  return location.trim().length > 0 && location.trim() !== 'Viet Nam';
}

function isValidBio(bio: string | undefined): boolean {
  if (!bio) return false;
  // Bio should have at least 20 characters
  return bio.trim().length >= 20;
}

function isValidName(name: string | undefined): boolean {
  if (!name) return false;
  // Name should have at least 2 characters and not be default
  return name.trim().length >= 2 && !name.toLowerCase().includes('nguoi dung moi');
}

export function useProfileCompletion(user: User | null): ProfileCompletionResult {
  return useMemo(() => {
    if (!user) {
      return {
        percentage: 0,
        missingFields: [],
        completedFields: [],
        isCompleteEnoughForBooking: false,
        requiredFieldsMissing: [],
      };
    }

    const fields: ProfileField[] = [
      // Required fields (weighted more heavily)
      {
        key: 'name',
        label: 'Name',
        labelVi: 'Ten',
        required: true,
        icon: 'user',
        completed: isValidName(user.name),
      },
      {
        key: 'avatar',
        label: 'Profile photo',
        labelVi: 'Anh dai dien',
        required: true,
        icon: 'camera',
        completed: isValidAvatar(user.avatar),
      },
      {
        key: 'phone',
        label: 'Phone number',
        labelVi: 'So dien thoai',
        required: true,
        icon: 'phone',
        completed: isValidPhone(user.phone),
      },
      {
        key: 'location',
        label: 'Location',
        labelVi: 'Dia diem',
        required: true,
        icon: 'map-pin',
        completed: isValidLocation(user.location),
      },
      // Recommended fields
      {
        key: 'bio',
        label: 'Bio',
        labelVi: 'Gioi thieu ban than',
        required: false,
        icon: 'file-text',
        completed: isValidBio(user.bio),
      },
      {
        key: 'images',
        label: 'Gallery photos',
        labelVi: 'Anh bo sung',
        required: false,
        icon: 'images',
        completed: (user.images?.length || 0) >= 2,
      },
      {
        key: 'personalityTags',
        label: 'Personality tags',
        labelVi: 'The tinh cach',
        required: false,
        icon: 'tags',
        completed: (user.personalityTags?.length || 0) >= 2,
      },
      {
        key: 'zodiac',
        label: 'Zodiac sign',
        labelVi: 'Cung hoang dao',
        required: false,
        icon: 'star',
        completed: !!user.zodiac,
      },
    ];

    const requiredFields = fields.filter((f) => f.required);
    const recommendedFields = fields.filter((f) => !f.required);

    const completedRequired = requiredFields.filter((f) => f.completed).length;
    const completedRecommended = recommendedFields.filter((f) => f.completed).length;

    // Weight: Required fields count for 60%, recommended for 40%
    const requiredWeight = 60;
    const recommendedWeight = 40;

    const requiredScore = requiredFields.length > 0
      ? (completedRequired / requiredFields.length) * requiredWeight
      : requiredWeight;

    const recommendedScore = recommendedFields.length > 0
      ? (completedRecommended / recommendedFields.length) * recommendedWeight
      : recommendedWeight;

    const percentage = Math.round(requiredScore + recommendedScore);

    const missingFields = fields.filter((f) => !f.completed);
    const completedFields = fields.filter((f) => f.completed);

    // For booking: all required fields must be complete
    const requiredFieldsMissing = requiredFields.filter((f) => !f.completed).map((f) => f.labelVi);
    const isCompleteEnoughForBooking = requiredFieldsMissing.length === 0;

    return {
      percentage,
      missingFields,
      completedFields,
      isCompleteEnoughForBooking,
      requiredFieldsMissing,
    };
  }, [user]);
}

// Helper function to get icon component name for lucide-react
export function getFieldIconName(iconKey: string): string {
  const iconMap: Record<string, string> = {
    'user': 'User',
    'camera': 'Camera',
    'phone': 'Phone',
    'map-pin': 'MapPin',
    'file-text': 'FileText',
    'images': 'Images',
    'tags': 'Tags',
    'star': 'Star',
  };
  return iconMap[iconKey] || 'Circle';
}
