import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../services/api';

export default function RootLayout() {
    const segments = useSegments();
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const inAuthGroup = segments[0] === 'auth';
                const inOnboardingGroup = segments[0] === 'onboarding';

                if (!token) {
                    // Not logged in
                    if (!inAuthGroup) {
                        router.replace('/auth');
                    }
                } else {
                    // Logged in, check profile
                    try {
                        const profile = await getProfile();
                        const isComplete = profile.profiles && profile.profiles.max_hr && profile.profiles.resting_hr;

                        if (!isComplete && !inOnboardingGroup) {
                            router.replace('/onboarding/step1-bio');
                        } else if (isComplete && (inAuthGroup || inOnboardingGroup)) {
                            router.replace('/(tabs)');
                        }
                    } catch (err) {
                        console.error('Failed to fetch profile:', err);
                        // If profile fetch fails (e.g. 401), maybe token is expired
                        if (err.response?.status === 401) {
                            await AsyncStorage.removeItem('userToken');
                            router.replace('/auth');
                        }
                    }
                }
            } catch (e) {
                console.error('Auth check error:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        checkAuth();
    }, [segments]);

    if (!isLoaded) return null;

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: colors.bg },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: colors.bg },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ title: 'Login', presentation: 'modal' }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}
