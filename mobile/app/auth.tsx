import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { login, register } from '../services/api';
import { colors, spacing, radius } from '../constants/theme';

export default function AuthScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                router.replace('/(tabs)');
            } else {
                await register(email, password);
                router.replace('/onboarding/step1-bio');
            }
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.center}>
                <Text style={styles.logo}>🏃</Text>
                <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                <Text style={styles.subtitle}>
                    {isLogin 
                        ? 'Login to track your training and get AI coaching.' 
                        : 'Join AeroFit AI to start your personalized training journey.'}
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@example.com"
                            placeholderTextColor={colors.textDim}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textDim}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.authBtn} 
                        onPress={handleAuth} 
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={styles.authBtnText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.toggleBtn} 
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a0f1e' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    logo: { fontSize: 64, marginBottom: spacing.lg },
    title: { fontSize: 26, fontWeight: '800', color: colors.white, marginBottom: spacing.sm },
    subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
    form: { width: '100%' },
    inputContainer: { marginBottom: spacing.md },
    label: { color: colors.white, marginBottom: spacing.xs, fontSize: 14, fontWeight: '600' },
    input: {
        backgroundColor: '#111827',
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.white,
        fontSize: 16,
    },
    authBtn: {
        backgroundColor: colors.primary || '#3b82f6',
        borderRadius: radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    authBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
    toggleBtn: { alignItems: 'center' },
    toggleText: { color: colors.primary || '#3b82f6', fontSize: 14 },
});
