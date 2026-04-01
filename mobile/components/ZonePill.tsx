import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface ZonePillProps {
    zone: string;
    pace?: string;
    hr?: number;
}

export function ZonePill({ zone, pace, hr }: ZonePillProps) {
    const zoneColors: Record<string, string> = {
        Recovery: colors.cyan,
        'Aerobic Base': colors.green,
        'Grey Zone': colors.yellow,
        Threshold: colors.orange,
        'VO2 Max': colors.red,
    };
    const c = zoneColors[zone] || colors.accent;
    return (
        <View style={[styles.zonePill, { borderColor: c }]}>
            <Text style={[styles.zoneName, { color: c }]}>{zone}</Text>
            {pace && <Text style={styles.zoneDetail}>{pace}</Text>}
            {hr && <Text style={styles.zoneDetail}>♥ {hr}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    zonePill: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    zoneName: { fontSize: 12, fontWeight: '700' },
    zoneDetail: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
