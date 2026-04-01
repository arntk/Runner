import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 16,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: colors.bg,
                },
                headerTintColor: colors.text,
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="coach"
                options={{
                    title: 'Coach',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" label="Coach" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="packing"
                options={{
                    title: 'Packing',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🎒" label="Packing" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="supplements"
                options={{
                    title: 'Supplements',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="💊" label="Supplements" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
                }}
            />
        </Tabs>
    );
}
