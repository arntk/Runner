import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, RefreshControl,
    StyleSheet, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActivities, syncStrava } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';

function formatPace(speedMps: number): string {
    if (!speedMps || speedMps === 0) return '--';
    const minPerMile = (1609.34 / speedMps) / 60;
    const m = Math.floor(minPerMile);
    const s = Math.round((minPerMile - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}/mi`;
}

function formatDist(meters: number): string {
    if (!meters) return '--';
    return (meters / 1609.34).toFixed(2) + ' mi';
}

function formatDuration(seconds: number): string {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function HRBadge({ hr }: { hr?: number }) {
    if (!hr) return null;
    const color = hr > 170 ? colors.red : hr > 155 ? colors.orange : hr > 140 ? colors.yellow : colors.green;
    return (
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>♥ {hr} bpm</Text>
        </View>
    );
}

function ActivityCard({ item }: { item: any }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    <Text style={styles.distText}>{formatDist(item.distance)}</Text>
                </View>
                <View style={styles.cardRight}>
                    <HRBadge hr={item.avg_hr} />
                    <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                    <Text style={styles.paceText}>{formatPace(item.distance && item.duration ? item.distance / item.duration : 0)}</Text>
                </View>
            </View>

            {expanded && item.ai_feedback && (
                <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>🧠 Coach Insight</Text>
                    <Text style={styles.feedbackText}>{item.ai_feedback}</Text>
                </View>
            )}
            {expanded && !item.ai_feedback && (
                <Text style={[styles.feedbackText, { color: colors.textDim, paddingTop: spacing.sm }]}>
                    No AI feedback yet — sync to generate analysis.
                </Text>
            )}
        </TouchableOpacity>
    );
}

export default function DashboardScreen() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const load = async () => {
        try {
            const data = await getActivities();
            setActivities(data);
        } catch {
            // Backend may not be running in dev
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncStrava();
            Alert.alert('Sync Complete', res.message || 'Activities updated.');
            load();
        } catch (e: any) {
            Alert.alert('Sync Failed', e?.response?.data?.message || 'Could not reach backend.');
        } finally {
            setSyncing(false);
        }
    };

    // Compute quick stats
    const totalMiles = activities.reduce((acc, a) => acc + (a.distance || 0) / 1609.34, 0);
    const avgHR = activities.filter(a => a.avg_hr).reduce((acc, a, _, arr) => acc + a.avg_hr / arr.length, 0);

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={colors.accent} />
                }
            >
                {/* Hero Header */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>AeroFit AI</Text>
                    <Text style={styles.heroSub}>Norwegian Method · Sub-Elite Coaching</Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalMiles.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Total Miles</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{activities.length}</Text>
                        <Text style={styles.statLabel}>Runs</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{avgHR ? Math.round(avgHR) : '--'}</Text>
                        <Text style={styles.statLabel}>Avg HR</Text>
                    </View>
                </View>

                {/* Sync Button */}
                <TouchableOpacity style={styles.syncBtn} onPress={handleSync} disabled={syncing}>
                    {syncing
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.syncBtnText}>⚡ Sync Strava</Text>
                    }
                </TouchableOpacity>

                {/* Activity List */}
                <Text style={styles.sectionTitle}>Recent Runs</Text>
                {loading ? (
                    <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
                ) : activities.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No activities yet.</Text>
                        <Text style={styles.emptyHint}>Connect Strava and tap Sync to get started.</Text>
                    </View>
                ) : (
                    activities.map(a => <ActivityCard key={a.id} item={a} />)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
    hero: { marginBottom: spacing.lg, alignItems: 'center' },
    heroTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
    heroSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    statBox: {
        flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
        padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.accentGlow },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    syncBtn: {
        backgroundColor: colors.accent, borderRadius: radius.md,
        paddingVertical: 14, alignItems: 'center', marginBottom: spacing.lg,
    },
    syncBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        padding: spacing.md, marginBottom: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardRight: { alignItems: 'flex-end', gap: 4 },
    dateText: { fontSize: 12, color: colors.textMuted },
    distText: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 },
    durationText: { fontSize: 12, color: colors.textMuted },
    paceText: { fontSize: 13, color: colors.accentGlow, fontWeight: '600' },
    badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    feedbackBox: {
        marginTop: spacing.sm, padding: spacing.sm,
        backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
        borderLeftWidth: 3, borderLeftColor: colors.accent,
    },
    feedbackLabel: { fontSize: 11, color: colors.accent, fontWeight: '700', marginBottom: 4 },
    feedbackText: { fontSize: 13, color: colors.text, lineHeight: 20 },
    emptyBox: { alignItems: 'center', marginTop: spacing.xxl },
    emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: 13, color: colors.textDim, marginTop: 8, textAlign: 'center' },
});
