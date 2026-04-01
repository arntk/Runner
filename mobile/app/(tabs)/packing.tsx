import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getPackingList, PackingItem, WeatherSummary } from '../../services/api';
import { colors, spacing, radius } from '../../constants/theme';

const DISTANCES = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: 'Half', value: 21.1 },
    { label: 'Marathon', value: 42.2 },
];

const PRIORITY_STYLE: Record<string, { bg: string; border: string; text: string }> = {
    essential: { bg: colors.red + '22', border: colors.red, text: colors.red },
    recommended: { bg: colors.yellow + '22', border: colors.yellow, text: colors.yellow },
    optional: { bg: colors.cyan + '22', border: colors.cyan, text: colors.cyan },
};

const WEATHER_ICONS: Record<string, string> = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', default: '🌡️',
};

function WeatherCard({ weather }: { weather: WeatherSummary }) {
    const icon = WEATHER_ICONS[weather.condition] || WEATHER_ICONS.default;
    return (
        <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.weatherCity}>{weather.city}</Text>
                <Text style={styles.weatherDesc}>{weather.description}</Text>
                <View style={styles.weatherRow}>
                    <Text style={styles.weatherStat}>🌡 {weather.temp_c}°C (feels {weather.feels_like_c}°C)</Text>
                </View>
                <View style={styles.weatherRow}>
                    <Text style={styles.weatherStat}>💧 {weather.humidity_pct}%</Text>
                    <Text style={styles.weatherStat}>💨 {weather.wind_kph} km/h</Text>
                    {weather.rain_mm > 0 && <Text style={styles.weatherStat}>🌧 {weather.rain_mm}mm/h</Text>}
                </View>
            </View>
        </View>
    );
}

function GearItem({ item, index }: { item: PackingItem; index: number }) {
    const ps = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.optional;
    return (
        <View style={[styles.gearCard, { borderLeftColor: ps.border }]}>
            <View style={styles.gearTop}>
                <Text style={styles.gearName}>{item.item}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: ps.bg, borderColor: ps.border }]}>
                    <Text style={[styles.priorityText, { color: ps.text }]}>{item.priority}</Text>
                </View>
            </View>
            <Text style={styles.gearReason}>{item.reason}</Text>
        </View>
    );
}

export default function PackingScreen() {
    const [city, setCity] = useState('');
    const [distance, setDistance] = useState(10);
    const [result, setResult] = useState<{ weather: WeatherSummary; items: PackingItem[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [lat, setLat] = useState<number | undefined>();
    const [lon, setLon] = useState<number | undefined>();

    const handleGPS = useCallback(async () => {
        setGpsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Enable location access in Settings to use GPS.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLat(loc.coords.latitude);
            setLon(loc.coords.longitude);
            setCity('📍 Current Location');
        } catch {
            Alert.alert('Error', 'Could not get location.');
        } finally {
            setGpsLoading(false);
        }
    }, []);

    const handleSearch = useCallback(async () => {
        if (!city && (lat === undefined || lon === undefined)) {
            Alert.alert('Missing Info', 'Enter a city name or use GPS.');
            return;
        }
        setLoading(true);
        try {
            const data = await getPackingList(city, distance, lat, lon);
            setResult(data);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not fetch weather. Check your API key or city name.');
        } finally {
            setLoading(false);
        }
    }, [city, distance, lat, lon]);

    const essentials = result?.items.filter(i => i.priority === 'essential') ?? [];
    const recommended = result?.items.filter(i => i.priority === 'recommended') ?? [];
    const optional = result?.items.filter(i => i.priority === 'optional') ?? [];

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🎒</Text>
                    <Text style={styles.heroTitle}>Race Packing List</Text>
                    <Text style={styles.heroSub}>AI-powered gear suggestions based on live weather</Text>
                </View>

                {/* Inputs */}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="City (e.g. Boston)"
                        placeholderTextColor={colors.textDim}
                        value={city.startsWith('📍') ? '' : city}
                        onChangeText={t => { setCity(t); setLat(undefined); setLon(undefined); }}
                    />
                    <TouchableOpacity style={styles.gpsBtn} onPress={handleGPS} disabled={gpsLoading}>
                        {gpsLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.gpsBtnText}>📍</Text>}
                    </TouchableOpacity>
                </View>

                {lat !== undefined && (
                    <Text style={styles.gpsLabel}>Using GPS location · {lat.toFixed(3)}, {lon?.toFixed(3)}</Text>
                )}

                {/* Distance Selector */}
                <Text style={styles.subsectionLabel}>Race Distance</Text>
                <View style={styles.distanceRow}>
                    {DISTANCES.map(d => (
                        <TouchableOpacity
                            key={d.label}
                            style={[styles.distBtn, distance === d.value && styles.distBtnActive]}
                            onPress={() => setDistance(d.value)}
                        >
                            <Text style={[styles.distBtnText, distance === d.value && styles.distBtnTextActive]}>{d.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.searchBtnText}>🔍 Get Packing List</Text>
                    }
                </TouchableOpacity>

                {/* Results */}
                {result && (
                    <>
                        <WeatherCard weather={result.weather} />

                        {essentials.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.red }]}>🔴 Essentials ({essentials.length})</Text>
                                {essentials.map((item, i) => <GearItem key={i} item={item} index={i} />)}
                            </>
                        )}
                        {recommended.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.yellow }]}>🟡 Recommended ({recommended.length})</Text>
                                {recommended.map((item, i) => <GearItem key={i} item={item} index={i} />)}
                            </>
                        )}
                        {optional.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.cyan }]}>🔵 Optional ({optional.length})</Text>
                                {optional.map((item, i) => <GearItem key={i} item={item} index={i} />)}
                            </>
                        )}

                        <Text style={styles.totalCount}>
                            {result.items.length} items total · {Math.round(result.weather.temp_c)}°C · {result.weather.condition}
                        </Text>
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
    heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
    heroSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
    inputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 8 },
    input: {
        flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        color: colors.text, fontSize: 15,
    },
    gpsBtn: {
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
    },
    gpsBtnText: { fontSize: 20 },
    gpsLabel: { fontSize: 11, color: colors.green, marginBottom: spacing.md },
    subsectionLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
    distanceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    distBtn: {
        flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        paddingVertical: 10, alignItems: 'center',
    },
    distBtnActive: { backgroundColor: colors.accent + '33', borderColor: colors.accent },
    distBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    distBtnTextActive: { color: colors.accent },
    searchBtn: {
        backgroundColor: colors.accent, borderRadius: radius.md,
        paddingVertical: 14, alignItems: 'center', marginBottom: spacing.lg,
    },
    searchBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    weatherCard: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        padding: spacing.md, marginBottom: spacing.lg,
        flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    },
    weatherIcon: { fontSize: 48 },
    weatherCity: { fontSize: 18, fontWeight: '700', color: colors.text },
    weatherDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
    weatherRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    weatherStat: { fontSize: 12, color: colors.text },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
    gearCard: {
        backgroundColor: colors.surface, borderRadius: radius.sm,
        borderWidth: 1, borderColor: colors.border,
        borderLeftWidth: 3, padding: spacing.sm, marginBottom: 8,
    },
    gearTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    gearName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
    gearReason: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
    priorityBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    totalCount: { fontSize: 12, color: colors.textDim, textAlign: 'center', marginTop: spacing.md },
});
