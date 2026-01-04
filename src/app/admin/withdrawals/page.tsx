'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user: any;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  note: string;
  status: 'pending' | 'completed' | 'rejected' | 'cancelled';
  created_at: string;
  processed_at?: string;
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  const handleApprove = async (req: WithdrawalRequest) => {
    if (!confirm(`Xác nhận đã chuyển ${formatCurrency(req.amount)} cho user? Hành động này sẽ trừ tiền trong ví user.`)) return;
    
    setProcessingId(req.id);
    try {
      // 1. Check current balance
      const { data: userRow } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', req.user_id)
        .single();
      
      const currentBalance = Number(userRow?.wallet_balance || 0);
      if (currentBalance < req.amount) {
        toast.error('User không đủ số dư để rút!');
        setProcessingId(null);
        return;
      }

      // 2. Deduct balance
      const { error: updateWalletErr } = await supabase
        .from('users')
        .update({ wallet_balance: currentBalance - req.amount })
        .eq('id', req.user_id);

      if (updateWalletErr) throw updateWalletErr;

      // 3. Create Transaction Log
      await supabase.from('transactions').insert({
        user_id: req.user_id,
        type: 'withdrawal',
        amount: req.amount,
        status: 'completed',
        description: `Rút tiền về ngân hàng (Admin duyệt)`,
        related_id: req.id,
        payment_method: 'banking',
        completed_at: new Date().toISOString()
      });

      // 4. Update Request Status
      const { error: updateReqErr } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', req.id);

      if (updateReqErr) throw updateReqErr;

      toast.success('Đã duyệt yêu cầu thành công');
      fetchRequests();

    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: WithdrawalRequest) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;

    setProcessingId(req.id);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          note: `Từ chối: ${reason}. ${req.note || ''}`,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', req.id);

      if (error) throw error;
      toast.success('Đã từ chối yêu cầu');
      fetchRequests();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yêu cầu Rút tiền</h1>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
          {['pending', 'completed', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors',
                filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {f === 'pending' ? 'Chờ duyệt' : f === 'completed' ? 'Đã duyệt' : f === 'rejected' ? 'Từ chối' : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Thông tin nhận</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{req.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{req.user?.email || req.user?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-lg text-rose-600">{formatCurrency(req.amount)}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs font-mono break-all">
                        {req.note || `${req.bank_name} - ${req.account_number} - ${req.account_name}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold uppercase',
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {formatRelativeTime(req.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={!!processingId}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                            title="Đã chuyển tiền & Duyệt"
                          >
                            {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={!!processingId}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Từ chối"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}