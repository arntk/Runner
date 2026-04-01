import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { updateProfile, estimateVdot } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';
import { ZonePill } from '../../components/ZonePill';

export default function OnboardingZones() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [estimating, setEstimating] = useState(false);
    
    // Race Data
    const [distance, setDistance] = useState('5000');
    const [time, setTime] = useState('20.0');
    const [vdot, setVdot] = useState<number | null>(null);
    const [zones, setZones] = useState<Record<string, string> | null>(null);

    // Preferences
    const [hrUnit, setHrUnit] = useState<'bpm' | 'percent'>('bpm');
    const [paceUnit, setPaceUnit] = useState<'min_km' | 'percent'>('min_km');

    const handleEstimate = async () => {
        if (!distance || !time) {
            Alert.alert('Error', 'Please enter race distance and time');
            return;
        }

        setEstimating(true);
        try {
            const result = await estimateVdot(parseFloat(distance), parseFloat(time));
            setVdot(result.vdot);
            setZones(result.zones);
        } catch (e: any) {
            Alert.alert('Error', 'Failed to estimate VDOT. Check your inputs.');
        } finally {
            setEstimating(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            await updateProfile({
                vdot: vdot,
                pace_zones: zones,
                hr_unit_pref: hrUnit,
                pace_unit_pref: paceUnit,
            });
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.stepText}>Step 2 of 2</Text>
                    <Text style={styles.title}>Zone Calibration</Text>
                    <Text style={styles.subtitle}>
                        Enter a recent race result to estimate your VDOT and training paces.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Race Distance (meters)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="5000"
                            placeholderTextColor={colors.textDim}
                            value={distance}
                            onChangeText={setDistance}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <Text style={styles.label}>Race Time (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="20.0"
                            placeholderTextColor={colors.textDim}
                            value={time}
                            onChangeText={setTime}
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.estimateBtn} 
                        onPress={handleEstimate}
                        disabled={estimating}
                    >
                        {estimating 
                            ? <ActivityIndicator color={colors.accent} />
                            : <Text style={styles.estimateBtnText}>Calculate Zones</Text>
                        }
                    </TouchableOpacity>
                </View>

                {vdot && zones && (
                    <View style={styles.results}>
                        <Text style={styles.sectionTitle}>Your Estimated VDOT: {vdot}</Text>
                        <View style={styles.zonesGrid}>
                            {Object.entries(zones).map(([name, pace]) => (
                                <ZonePill key={name} zone={name} pace={pace} />
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.preferences}>
                    <Text style={styles.sectionTitle}>Display Preferences</Text>
                    
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>Heart Rate: {hrUnit === 'bpm' ? 'BPM' : '% Max HR'}</Text>
                        <Switch 
                            value={hrUnit === 'percent'} 
                            onValueChange={(val) => setHrUnit(val ? 'percent' : 'bpm')}
                            trackColor={{ false: colors.surface, true: colors.accent }}
                        />
                    </View>

                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>Pace: {paceUnit === 'min_km' ? 'min/km' : '% Threshold Pace'}</Text>
                        <Switch 
                            value={paceUnit === 'percent'} 
                            onValueChange={(val) => setPaceUnit(val ? 'percent' : 'min_km')}
                            trackColor={{ false: colors.surface, true: colors.accent }}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.finishBtn} 
                    onPress={handleFinish} 
                    disabled={loading || !vdot}
                >
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.finishBtnText}>Complete Onboarding</Text>
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
    inputRow: { marginBottom: spacing.md },
    label: { color: colors.white, marginBottom: spacing.xs, fontSize: 14, fontWeight: '600' },
    input: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.white,
        fontSize: 16,
    },
    estimateBtn: {
        borderWidth: 1,
        borderColor: colors.accent,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    estimateBtnText: { color: colors.accent, fontWeight: '700' },
    results: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: spacing.md },
    zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    preferences: { marginBottom: spacing.xl },
    prefRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
    },
    prefLabel: { color: colors.white, fontSize: 15 },
    finishBtn: {
        backgroundColor: colors.accent,
        borderRadius: radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        opacity: 0.9,
    },
    finishBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
