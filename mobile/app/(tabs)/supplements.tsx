import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getSupplementTimeline, TimelineEvent } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';

dayjs.extend(relativeTime);

const DISTANCES = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: 'Half Marathon', value: 21.1 },
    { label: 'Marathon', value: 42.2 },
];

const TYPE_COLORS: Record<string, string> = {
    carb: colors.carb,
    supplement: colors.supplement,
    sleep: colors.sleep,
    caffeine: colors.caffeine,
    protein: colors.protein,
    hydration: colors.hydration,
    race: colors.red,
};

const TYPE_ICONS: Record<string, string> = {
    carb: '🌾',
    supplement: '💊',
    sleep: '🌙',
    caffeine: '☕',
    protein: '🥩',
    hydration: '💧',
    race: '🏁',
};

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const tc = TYPE_COLORS[event.type] || colors.accent;
    const now = dayjs();
    const ts = dayjs(event.timestamp);
    const isPast = ts.isBefore(now);
    const isRace = event.type === 'race';

    return (
        <View style={styles.timelineRow}>
            {/* Left column: dot + line */}
            <View style={styles.timelineDotCol}>
                <View style={[styles.dot, { borderColor: tc, backgroundColor: isPast ? tc : 'transparent' }]}>
                    <Text style={{ fontSize: 10 }}>{isPast ? '✓' : ''}</Text>
                </View>
                {!isLast && <View style={[styles.line, { backgroundColor: tc + '44' }]} />}
            </View>

            {/* Right column: content */}
            <TouchableOpacity
                style={[styles.eventCard, { borderLeftColor: tc }, isPast && styles.pastCard]}
                onPress={() => setExpanded(e => !e)}
                activeOpacity={0.8}
            >
                <View style={styles.eventHeader}>
                    <Text style={{ fontSize: 16 }}>{TYPE_ICONS[event.type] ?? '📌'}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.eventLabel, isRace && { color: tc, fontSize: 16 }]}>{event.label}</Text>
                        <Text style={styles.eventTime}>
                            {ts.format('ddd MMM D · h:mm A')}
                            {isPast ? '  ✅' : `  (${ts.fromNow()})`}
                        </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: tc + '22', borderColor: tc }]}>
                        <Text style={[styles.typeText, { color: tc }]}>{event.type}</Text>
                    </View>
                </View>
                {expanded && (
                    <Text style={styles.eventNote}>{event.note}</Text>
                )}
                <Text style={styles.expandHint}>{expanded ? '▲ Less' : '▼ Details'}</Text>
            </TouchableOpacity>
        </View>
    );
}

// Simple date/time steppers
function DateTimePicker({
    value, onChange,
}: { value: dayjs.Dayjs; onChange: (d: dayjs.Dayjs) => void }) {
    return (
        <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateArrow} onPress={() => onChange(value.subtract(1, 'day'))}>
                <Text style={styles.arrow}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateValue}>{value.format('ddd MMM D')}</Text>
            <TouchableOpacity style={styles.dateArrow} onPress={() => onChange(value.add(1, 'day'))}>
                <Text style={styles.arrow}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateArrow} onPress={() => onChange(value.subtract(1, 'hour'))}>
                <Text style={styles.arrow}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateValue}>{value.format('h:mm A')}</Text>
            <TouchableOpacity style={styles.dateArrow} onPress={() => onChange(value.add(1, 'hour'))}>
                <Text style={styles.arrow}>▶</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function SupplementsScreen() {
    const [distance, setDistance] = useState(42.2);
    const [raceDate, setRaceDate] = useState(dayjs().add(48, 'hour').startOf('hour'));
    const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleBuild = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSupplementTimeline(raceDate.toISOString(), distance);
            setTimeline(data.timeline);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not generate timeline. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, [raceDate, distance]);

    // Protein reminder from latest activity (simulated / from timeline)
    const proteinEvent = timeline?.find(e => e.type === 'protein');

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>💊</Text>
                    <Text style={styles.heroTitle}>48h Race Prep</Text>
                    <Text style={styles.heroSub}>Carb-loading · Supplements · Sleep · Protein</Text>
                </View>

                {/* Protocol legend */}
                <View style={styles.legendRow}>
                    {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                        <View key={type} style={[styles.legendItem, { borderColor: TYPE_COLORS[type] ?? colors.accent }]}>
                            <Text style={{ fontSize: 14 }}>{icon}</Text>
                            <Text style={[styles.legendText, { color: TYPE_COLORS[type] }]}>{type}</Text>
                        </View>
                    ))}
                </View>

                {/* Config */}
                <View style={styles.configCard}>
                    <Text style={styles.configLabel}>📅 Race Date & Time</Text>
                    <DateTimePicker value={raceDate} onChange={setRaceDate} />

                    <Text style={[styles.configLabel, { marginTop: spacing.md }]}>🏃 Race Distance</Text>
                    <View style={styles.distRow}>
                        {DISTANCES.map(d => (
                            <TouchableOpacity
                                key={d.label}
                                style={[styles.distBtn, distance === d.value && styles.distBtnActive]}
                                onPress={() => setDistance(d.value)}
                            >
                                <Text style={[styles.distText, distance === d.value && { color: colors.accent }]}>
                                    {d.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.buildBtn} onPress={handleBuild} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.buildBtnText}>⏳ Build My Timeline</Text>
                    }
                </TouchableOpacity>

                {/* Protein Reminder Banner */}
                {proteinEvent && (
                    <View style={styles.proteinBanner}>
                        <Text style={styles.proteinTitle}>🥩 Post-Run Protein Reminder</Text>
                        <Text style={styles.proteinNote}>{proteinEvent.note}</Text>
                    </View>
                )}

                {/* Timeline */}
                {timeline && (
                    <>
                        <Text style={styles.sectionTitle}>
                            Your {timeline.length}-point protocol · Race: {raceDate.format('MMM D HH:mm')}
                        </Text>
                        {timeline.map((event, idx) => (
                            <TimelineItem
                                key={idx}
                                event={event}
                                isLast={idx === timeline.length - 1}
                            />
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
    hero: { alignItems: 'center', marginBottom: spacing.md },
    heroEmoji: { fontSize: 40, marginBottom: 8 },
    heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
    heroSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
    legendItem: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
    },
    legendText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    configCard: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, padding: spacing.md,
        marginBottom: spacing.md,
    },
    configLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    dateArrow: {
        backgroundColor: colors.surfaceAlt, borderRadius: 6,
        paddingHorizontal: 12, paddingVertical: 8,
    },
    arrow: { color: colors.accent, fontSize: 14, fontWeight: '700' },
    dateValue: { fontSize: 14, color: colors.text, fontWeight: '600', minWidth: 90, textAlign: 'center' },
    distRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    distBtn: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: 10, paddingVertical: 8,
    },
    distBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
    distText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    buildBtn: {
        backgroundColor: colors.supplement, borderRadius: radius.md,
        paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md,
    },
    buildBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    proteinBanner: {
        backgroundColor: colors.protein + '22', borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.protein,
        padding: spacing.md, marginBottom: spacing.lg,
    },
    proteinTitle: { fontSize: 14, fontWeight: '700', color: colors.protein, marginBottom: 6 },
    proteinNote: { fontSize: 13, color: colors.text, lineHeight: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    // Timeline
    timelineRow: { flexDirection: 'row', marginBottom: 0 },
    timelineDotCol: { alignItems: 'center', width: 24, marginRight: 10 },
    dot: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
        marginTop: 14,
    },
    line: { width: 2, flex: 1, minHeight: 16 },
    eventCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
        padding: spacing.sm, marginBottom: 8,
    },
    pastCard: { opacity: 0.6 },
    eventHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    eventLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    eventTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    typeBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
    typeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    eventNote: {
        fontSize: 12, color: colors.text, lineHeight: 18,
        marginTop: 8, paddingTop: 8,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    expandHint: { fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'right' },
});
