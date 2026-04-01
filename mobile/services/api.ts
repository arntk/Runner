import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo public env variable — set EXPO_PUBLIC_API_URL in mobile/.env
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Auth Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Authentication ──────────────────────────────────────────────────────────
export async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
    }
    return res.data;
}

export async function register(email, password) {
    const res = await api.post('/api/auth/register', { email, password });
    if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
    }
    return res.data;
}

export async function logout() {
    await AsyncStorage.removeItem('userToken');
}

export async function getProfile() {
    const res = await api.get('/api/profile');
    return res.data;
}

export async function updateProfile(data) {
    const res = await api.put('/api/profile', data);
    return res.data;
}

export async function estimateVdot(distance_m: number, time_min: number) {
    const res = await api.post('/api/vdot/estimate', { distance_m, time_min });
    return res.data;
}

// ─── Activities ──────────────────────────────────────────────────────────────
export async function getActivities() {
    const res = await api.get('/api/activities');
    return res.data;
}

export async function getLatestActivity() {
    const res = await api.get('/api/activity/latest');
    return res.data;
}

export async function syncStrava() {
    const res = await api.post('/api/sync/strava');
    return res.data;
}

// ─── Strava Auth ──────────────────────────────────────────────────────────────
export async function getStravaAuthUrl(): Promise<string> {
    const res = await api.get('/api/auth/strava/url');
    return res.data.url;
}

export async function exchangeStravaCode(code: string) {
    const res = await api.post('/api/auth/strava/callback', { code });
    return res.data;
}

// ─── Packing List ────────────────────────────────────────────────────────────
export interface PackingItem {
    item: string;
    reason: string;
    priority: 'essential' | 'recommended' | 'optional';
}

export interface WeatherSummary {
    city: string;
    temp_c: number;
    feels_like_c: number;
    humidity_pct: number;
    wind_kph: number;
    rain_mm: number;
    condition: string;
    description: string;
}

export interface PackingListResponse {
    weather: WeatherSummary;
    items: PackingItem[];
}

export async function getPackingList(
    city: string,
    distance_km: number,
    lat?: number,
    lon?: number
): Promise<PackingListResponse> {
    const params: Record<string, string | number> = { distance_km };
    if (lat !== undefined && lon !== undefined) {
        params.lat = lat;
        params.lon = lon;
    } else {
        params.city = city;
    }
    const res = await api.get('/api/packing-list', { params });
    return res.data;
}

// ─── Supplement Timeline ─────────────────────────────────────────────────────
export interface TimelineEvent {
    timestamp: string;
    label: string;
    note: string;
    type: 'carb' | 'supplement' | 'sleep' | 'caffeine' | 'protein' | 'hydration' | 'race';
    hours_before_race: number;
}

export interface SupplementTimeline {
    race_datetime: string;
    distance_km: number;
    timeline: TimelineEvent[];
}

export async function getSupplementTimeline(
    race_datetime: string,
    distance_km: number
): Promise<SupplementTimeline> {
    const res = await api.post('/api/supplements/timeline', { race_datetime, distance_km });
    return res.data;
}

export async function getProteinReminder() {
    const res = await api.get('/api/supplements/protein-reminder');
    return res.data;
}
