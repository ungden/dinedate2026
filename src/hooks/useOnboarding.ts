'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ONBOARDING_STORAGE_KEY = 'dinedate_onboarding_completed';

interface UseOnboardingReturn {
  isOnboardingCompleted: boolean;
  isLoading: boolean;
  showOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  dismissOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check onboarding status on mount and when user changes
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;

      // Not authenticated - don't show onboarding
      if (!isAuthenticated || !user?.id) {
        setIsOnboardingCompleted(true);
        setShowOnboarding(false);
        setIsLoading(false);
        return;
      }

      try {
        // First check localStorage for quick access
        const localCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (localCompleted === 'true') {
          setIsOnboardingCompleted(true);
          setShowOnboarding(false);
          setIsLoading(false);
          return;
        }

        // Check database for onboarding status
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[useOnboarding] Error checking onboarding status:', error);
          // Default to not showing if there's an error
          setIsOnboardingCompleted(true);
          setShowOnboarding(false);
          setIsLoading(false);
          return;
        }

        const completed = !!data?.onboarding_completed;
        setIsOnboardingCompleted(completed);

        // Show onboarding for new users who haven't completed it
        if (!completed) {
          setShowOnboarding(true);
        }

        // Sync to localStorage
        if (completed) {
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        }
      } catch (err) {
        console.error('[useOnboarding] Exception:', err);
        setIsOnboardingCompleted(true);
        setShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id, isAuthenticated, authLoading]);

  // Complete onboarding - save to both localStorage and DB
  const completeOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Update localStorage immediately for responsiveness
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingCompleted(true);
      setShowOnboarding(false);

      // Update database
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[useOnboarding] Error saving to DB:', error);
        // Don't revert localStorage - user experience is more important
      }
    } catch (err) {
      console.error('[useOnboarding] Exception completing onboarding:', err);
    }
  }, [user?.id]);

  // Reset onboarding (for testing purposes)
  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Clear localStorage
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setIsOnboardingCompleted(false);
      setShowOnboarding(true);

      // Update database
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[useOnboarding] Error resetting in DB:', error);
      }
    } catch (err) {
      console.error('[useOnboarding] Exception resetting onboarding:', err);
    }
  }, [user?.id]);

  // Dismiss onboarding without completing (skip button)
  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return {
    isOnboardingCompleted,
    isLoading,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    dismissOnboarding,
  };
}
