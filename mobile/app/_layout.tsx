import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import * as SplashScreen from 'expo-splash-screen';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

// Expo Router uses this export to catch JS errors in production
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.icon}>⚠️</Text>
      <Text style={errorStyles.title}>Đã xảy ra lỗi</Text>
      <Text style={errorStyles.message}>
        {error.message || 'Ứng dụng gặp sự cố không mong muốn.'}
      </Text>
      <Pressable style={errorStyles.retryBtn} onPress={retry}>
        <Text style={errorStyles.retryBtnText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  retryBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

function RootLayoutInner() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen
          name="date/[id]"
          options={{
            headerShown: true,
            title: 'Chi tiết đơn hẹn',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="restaurants/[id]"
          options={{
            headerShown: true,
            title: 'Nhà hàng',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="wallet"
          options={{
            headerShown: true,
            title: 'Ví của tôi',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="vip"
          options={{
            headerShown: true,
            title: 'Nâng cấp VIP',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="connections"
          options={{
            headerShown: true,
            title: 'Kết nối của tôi',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="my-reviews"
          options={{
            headerShown: true,
            title: 'Đánh giá của tôi',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Cài đặt',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="safety"
          options={{
            headerShown: true,
            title: 'An toàn & Bảo mật',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            headerShown: true,
            title: 'Hỗ trợ',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="all-restaurants"
          options={{
            headerShown: true,
            title: 'Tất cả nhà hàng',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="all-date-orders"
          options={{
            headerShown: true,
            title: 'Tất cả đơn hẹn',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{
            headerShown: true,
            title: 'Đánh giá sau hẹn',
            headerBackTitle: 'Quay lại',
          }}
        />
        <Stack.Screen
          name="connection/[id]"
          options={{
            headerShown: true,
            title: 'Chi tiết kết nối',
            headerBackTitle: 'Quay lại',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
