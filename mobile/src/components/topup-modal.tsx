import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import {
  PaymentConfig,
  getPaymentConfig,
  generateVietQRUrl,
  getBankDisplayName,
  createTopupRequest,
  checkTopupStatus,
  cancelTopupRequest,
} from '@/lib/payment';

const POLL_INTERVAL = 3000;
const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

interface TopupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export default function TopupModal({ visible, onClose, onSuccess, userId }: TopupModalProps) {
  // Step: 'amount' -> 'payment'
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const [requestId, setRequestId] = useState<string | null>(null);
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load payment config on open
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const load = async () => {
      setConfigLoading(true);
      setConfigError(null);
      const cfg = await getPaymentConfig();
      if (cancelled) return;
      if (!cfg || !cfg.is_active) {
        setConfigError('Hệ thống thanh toán chưa được cấu hình. Vui lòng liên hệ Admin.');
      }
      setConfig(cfg);
      setConfigLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [visible]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setStep('amount');
      setSelectedAmount(null);
      setRequestId(null);
      setTransferCode(null);
      setPaymentStatus('pending');
      setCreating(false);
      setChecking(false);
      setCancelling(false);
      setCopied(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [visible]);

  // Create topup request and go to payment step
  const handleSelectAmount = useCallback(async (amount: number) => {
    setSelectedAmount(amount);
    setCreating(true);

    const request = await createTopupRequest(userId, amount);
    if (!request) {
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.');
      setCreating(false);
      return;
    }

    setRequestId(request.id);
    setTransferCode(request.transfer_code);
    setCreating(false);
    setStep('payment');
  }, [userId]);

  // Poll for payment confirmation
  const pollOnce = useCallback(async () => {
    if (!requestId) return;
    if (paymentStatus === 'confirmed' || paymentStatus === 'cancelled') return;

    const status = await checkTopupStatus(requestId);
    if (status && status !== 'pending') {
      setPaymentStatus(status as 'confirmed' | 'cancelled');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (status === 'confirmed') {
        onSuccess?.();
        setTimeout(() => onClose(), 1500);
      }
    }
  }, [requestId, paymentStatus, onSuccess, onClose]);

  useEffect(() => {
    if (step !== 'payment' || !requestId) return;
    if (paymentStatus !== 'pending') return;

    pollOnce();
    pollingRef.current = setInterval(pollOnce, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [step, requestId, paymentStatus, pollOnce]);

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleManualCheck = async () => {
    setChecking(true);
    await pollOnce();
    setChecking(false);
    if (paymentStatus === 'pending') {
      Alert.alert('Chưa nhận được', 'Chưa nhận được thanh toán, vui lòng đợi thêm...');
    }
  };

  const handleCancel = async () => {
    if (!requestId) {
      onClose();
      return;
    }
    setCancelling(true);
    await cancelTopupRequest(requestId);
    setCancelling(false);
    onClose();
  };

  const qrUrl = config && transferCode && selectedAmount
    ? generateVietQRUrl(config, selectedAmount, transferCode)
    : '';

  const bankName = config ? getBankDisplayName(config) : '';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {step === 'amount' ? 'Nạp tiền' : 'Chuyển khoản'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Đóng</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Config loading */}
          {configLoading && (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Đang kết nối ngân hàng...</Text>
            </View>
          )}

          {/* Config error */}
          {configError && !configLoading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{configError}</Text>
              <Pressable style={styles.errorBtn} onPress={onClose}>
                <Text style={styles.errorBtnText}>Đóng</Text>
              </Pressable>
            </View>
          )}

          {/* Step 1: Amount selection */}
          {step === 'amount' && config?.is_active && !configLoading && (
            <View style={styles.amountSection}>
              <Text style={styles.sectionLabel}>Chọn số tiền muốn nạp</Text>
              <View style={styles.amountGrid}>
                {TOPUP_AMOUNTS.map((amount) => (
                  <Pressable
                    key={amount}
                    style={[
                      styles.amountBtn,
                      selectedAmount === amount && styles.amountBtnActive,
                    ]}
                    onPress={() => handleSelectAmount(amount)}
                    disabled={creating}
                  >
                    {creating && selectedAmount === amount ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={[
                        styles.amountBtnText,
                        selectedAmount === amount && styles.amountBtnTextActive,
                      ]}>
                        {amount.toLocaleString('vi-VN')}đ
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Payment details + QR */}
          {step === 'payment' && paymentStatus === 'pending' && config && (
            <View style={styles.paymentSection}>
              {/* QR Code */}
              <View style={styles.qrWrap}>
                {qrUrl ? (
                  <Image
                    source={{ uri: qrUrl }}
                    style={styles.qrImage}
                    contentFit="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrPlaceholderText}>Không tạo được QR</Text>
                  </View>
                )}
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>⏳ Đang chờ thanh toán...</Text>
              </View>

              {/* Bank details */}
              <View style={styles.bankDetails}>
                <DetailRow label="Ngân hàng" value={bankName} />
                <DetailRow label="Chủ tài khoản" value={config.bank_holder} uppercase />
                <DetailRow
                  label="Số tài khoản"
                  value={config.bank_account}
                  mono
                  copyable
                  copied={copied === 'stk'}
                  onCopy={() => handleCopy(config.bank_account, 'stk')}
                />
                <DetailRow
                  label="Số tiền"
                  value={formatCurrency(selectedAmount || 0)}
                  highlight
                  copyable
                  copied={copied === 'amount'}
                  onCopy={() => handleCopy(String(selectedAmount || 0), 'amount')}
                />
                <View style={styles.detailRowBorder} />
                <DetailRow
                  label="Nội dung CK"
                  value={transferCode || ''}
                  mono
                  highlight
                  important
                  copyable
                  copied={copied === 'code'}
                  onCopy={() => handleCopy(transferCode || '', 'code')}
                />
              </View>

              <Text style={styles.warningText}>
                Vui lòng ghi đúng nội dung chuyển khoản để hệ thống tự động xác nhận.
              </Text>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
                  onPress={handleCancel}
                  disabled={cancelling}
                >
                  <Text style={styles.cancelBtnText}>
                    {cancelling ? 'Đang hủy...' : 'Hủy bỏ'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.checkBtn, checking && { opacity: 0.5 }]}
                  onPress={handleManualCheck}
                  disabled={checking}
                >
                  {checking ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.checkBtnText}>Tôi đã chuyển</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Success */}
          {paymentStatus === 'confirmed' && (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Thanh toán thành công!</Text>
              <Text style={styles.successDesc}>
                Số dư đã được cộng {formatCurrency(selectedAmount || 0)}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---- Detail Row Component ----

function DetailRow({
  label,
  value,
  mono,
  uppercase,
  highlight,
  important,
  copyable,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  uppercase?: boolean;
  highlight?: boolean;
  important?: boolean;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text
          style={[
            styles.detailValue,
            mono && styles.detailValueMono,
            uppercase && { textTransform: 'uppercase' },
            highlight && styles.detailValueHighlight,
            important && styles.detailValueImportant,
          ]}
          selectable
        >
          {value}
        </Text>
        {copyable && onCopy && (
          <Pressable onPress={onCopy} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>{copied ? '✓' : '📋'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 16 : Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  closeBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },

  // Center / loading
  centerBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Error
  errorBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBtn: {
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  errorBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },

  // Step 1: Amount
  amountSection: {
    gap: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amountBtn: {
    width: '47%' as any,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  amountBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  amountBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  amountBtnTextActive: {
    color: Colors.white,
  },

  // Step 2: Payment
  paymentSection: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  qrWrap: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  statusBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  statusBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#F57F17',
  },

  // Bank details
  bankDetails: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowBorder: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  detailValueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  detailValueHighlight: {
    color: Colors.primary,
    fontWeight: '800',
  },
  detailValueImportant: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    color: Colors.secondary,
  },
  copyBtn: {
    padding: Spacing.xs,
  },
  copyBtnText: {
    fontSize: 16,
  },

  warningText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  checkBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },

  // Success
  successBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.success,
  },
  successDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
