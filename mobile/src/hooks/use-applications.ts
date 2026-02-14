import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { hapticSuccess, hapticError } from '@/lib/haptics';

export function useApplyToDate(orderId: string) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const apply = useCallback(async (message: string) => {
    if (applied) return;
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { Alert.alert('Lỗi', 'Vui lòng đăng nhập'); setLoading(false); return; }
      const { error } = await supabase.from('date_order_applications').insert({
        order_id: orderId,
        applicant_id: authUser.id,
        message,
        status: 'pending',
      });
      if (error) throw error;
      setApplied(true);
      hapticSuccess();
      Alert.alert('Thành công', 'Đơn ứng tuyển của bạn đã được gửi!');
    } catch {
      hapticError();
      Alert.alert('Lỗi', 'Không thể gửi ứng tuyển. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [orderId, applied]);

  return { apply, loading, applied };
}
