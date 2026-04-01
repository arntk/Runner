import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLatestActivity, getActivities } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';
import { ZonePill } from '../../components/ZonePill';

export default function CoachScreen() {
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentCount, setRecentCount] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const [latest, all] = await Promise.all([getLatestActivity(), getActivities()]);
                setActivity(latest);
                setRecentCount(all.length);
            } catch {
                /* offline */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🧠</Text>
                    <Text style={styles.heroTitle}>AI Coach</Text>
                    <Text style={styles.heroSub}>Norwegian Double Threshold · K-Means Analysis</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
                ) : !activity ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No activities found.</Text>
                        <Text style={styles.emptyHint}>Sync Strava on the Dashboard tab to generate coaching insights.</Text>
                    </View>
                ) : (
                    <>
                        {/* Latest Activity Summary */}
                        <View style={styles.card}>
                            <Text style={styles.cardLabel}>Latest Run</Text>
                            <Text style={styles.runDate}>{new Date(activity.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                            <View style={styles.rowWrap}>
                                <View style={styles.stat}>
                                    <Text style={styles.statVal}>{((activity.distance || 0) / 1609.34).toFixed(2)}</Text>
                                    <Text style={styles.statLbl}>miles</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statVal}>{activity.avg_hr ?? '--'}</Text>
                                    <Text style={styles.statLbl}>avg bpm</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statVal}>{recentCount}</Text>
                                    <Text style={styles.statLbl}>runs logged</Text>
                                </View>
                            </View>
                        </View>

                        {/* AI Feedback */}
                        {activity.ai_feedback ? (
                            <View style={styles.feedbackCard}>
                                <Text style={styles.feedbackHeader}>🎯 Coach's Insight</Text>
                                <Text style={styles.feedbackText}>{activity.ai_feedback}</Text>
                            </View>
                        ) : (
                            <View style={[styles.feedbackCard, { borderColor: colors.textDim }]}>
                                <Text style={[styles.feedbackText, { color: colors.textDim }]}>
                                    Analysis not yet generated. Sync a new run to get feedback.
                                </Text>
                            </View>
                        )}

                        {/* Zone Reference */}
                        <Text style={styles.sectionTitle}>Training Zones (K-Means)</Text>
                        <Text style={styles.sectionHint}>
                            Your 5 physiological zones are automatically calibrated from your last {recentCount} runs.
                        </Text>
                        <View style={styles.zonesGrid}>
                            {['Recovery', 'Aerobic Base', 'Grey Zone', 'Threshold', 'VO2 Max'].map(z => (
                                <ZonePill key={z} zone={z} />
                            ))}
                        </View>

                        {/* Philosophy cards */}
                        <Text style={styles.sectionTitle}>Norwegian Method Pillars</Text>
                        {[
                            {
                                icon: '⚛️',
                                title: 'The Split Is the Atom',
                                body: 'Analysis is performed at the individual lap level — not on aggregate stats. Each split reveals the true metabolic state of that effort.',
                            },
                            {
                                icon: '🎯',
                                title: 'Double Threshold',
                                body: 'Two quality sessions per week at controlled lactate threshold intensity. The goal is maximal stimulus with minimal fatigue accumulation.',
                            },
                            {
                                icon: '📉',
                                title: 'Drift Detection',
                                body: 'If Threshold laps bleed into VO2 Max territory, the coach flags it. If recovery runs are too fast, the coach warns you.',
                            },
                        ].map(p => (
                            <View key={p.title} style={styles.pillarCard}>
                                <Text style={styles.pillarIcon}>{p.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pillarTitle}>{p.title}</Text>
                                    <Text style={styles.pillarBody}>{p.body}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
    hero: { alignItems: 'center', marginBottom: spacing.lg },
    heroEmoji: { fontSize: 40, marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
    heroSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, padding: spacing.md,
        marginBottom: spacing.md,
    },
    cardLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    runDate: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    rowWrap: { flexDirection: 'row', gap: spacing.md },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 22, fontWeight: '700', color: colors.accentGlow },
    statLbl: { fontSize: 11, color: colors.textMuted },
    feedbackCard: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.accent,
        padding: spacing.md, marginBottom: spacing.lg,
    },
    feedbackHeader: { fontSize: 13, color: colors.accent, fontWeight: '700', marginBottom: 8 },
    feedbackText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
    zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    pillarCard: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        padding: spacing.md, marginBottom: spacing.sm,
        flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    },
    pillarIcon: { fontSize: 24 },
    pillarTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
    pillarBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: 13, color: colors.textDim, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});
