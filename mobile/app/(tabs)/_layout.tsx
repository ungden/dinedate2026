import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Khám phá': '🏠',
    'Tạo hẹn': '➕',
    'Lịch hẹn': '📅',
    'Cá nhân': '👤',
  };
  return <Text style={{ fontSize: focused ? 24 : 20 }}>{icons[name] || '📱'}</Text>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ focused }) => <TabIcon name="Khám phá" focused={focused} />,
          headerTitle: 'DineDate',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Tạo hẹn',
          tabBarIcon: ({ focused }) => <TabIcon name="Tạo hẹn" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Lịch hẹn',
          tabBarIcon: ({ focused }) => <TabIcon name="Lịch hẹn" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ focused }) => <TabIcon name="Cá nhân" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
