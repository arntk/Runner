import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { updateProfile } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';

export default function OnboardingBio() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [weight, setWeight] = useState('');
    const [maxHr, setMaxHr] = useState('');
    const [restingHr, setRestingHr] = useState('');

    const handleNext = async () => {
        if (!weight || !maxHr || !restingHr) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await updateProfile({
                weight_kg: parseFloat(weight),
                max_hr: parseInt(maxHr, 10),
                resting_hr: parseInt(restingHr, 10),
            });
            router.push('/onboarding/step2-zones');
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.stepText}>Step 1 of 2</Text>
                    <Text style={styles.title}>Biometric Data</Text>
                    <Text style={styles.subtitle}>
                        We use these to calculate your training zones and calorie burn.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Weight (kg)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="70"
                            placeholderTextColor={colors.textDim}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Max Heart Rate (BPM)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="190"
                            placeholderTextColor={colors.textDim}
                            value={maxHr}
                            onChangeText={setMaxHr}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Resting Heart Rate (BPM)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="55"
                            placeholderTextColor={colors.textDim}
                            value={restingHr}
                            onChangeText={setRestingHr}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.nextBtn} 
                    onPress={handleNext} 
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.nextBtnText}>Next</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.xl },
    header: { marginBottom: spacing.xl },
    stepText: { color: colors.accent, fontWeight: '700', fontSize: 14, marginBottom: spacing.xs },
    title: { fontSize: 28, fontWeight: '800', color: colors.white, marginBottom: spacing.sm },
    subtitle: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
    form: { marginBottom: spacing.xl },
    inputRow: { marginBottom: spacing.md }, // md = 16px
    label: { color: colors.white, marginBottom: spacing.xs, fontSize: 14, fontWeight: '600' },
    input: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.white,
        fontSize: 16,
    },
    nextBtn: {
        backgroundColor: colors.accent,
        borderRadius: radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
    },
    nextBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
