import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../constants/theme';
import { getProfile, updateProfile } from '../../services/api';

const ZONE_NAMES = ["Recovery", "Aerobic Base", "Grey Zone", "Threshold", "VO2 Max"];

function ZonePill({ zone, pace, hr, onPress }: { zone: string; pace?: string; hr?: string | number; onPress?: () => void }) {
    const zoneColors: Record<string, string> = {
        Recovery: colors.cyan,
        'Aerobic Base': colors.green,
        'Grey Zone': colors.yellow,
        Threshold: colors.orange,
        'VO2 Max': colors.red,
    };
    const c = zoneColors[zone] || colors.accent;
    return (
        <TouchableOpacity 
            style={[styles.zonePill, { borderColor: c }]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.zoneName, { color: c }]}>{zone}</Text>
            {pace && <Text style={styles.zoneDetail}>{pace}</Text>}
            {hr && <Text style={styles.zoneDetail}>♥ {hr}</Text>}
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Edit Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<{ type: 'bio' | 'hr_zone' | 'pace_zone', field: string, label: string } | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await getProfile();
            setData(res);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!editTarget || !data) return;

        const updatedProfiles = { ...data.profiles };
        const value = parseFloat(editValue);

        if (isNaN(value) && editValue !== '') {
            Alert.alert("Invalid Input", "Please enter a numeric value.");
            return;
        }

        if (editTarget.type === 'bio') {
            updatedProfiles[editTarget.field] = value;
        } else if (editTarget.type === 'hr_zone') {
            const hr_zones = { ...updatedProfiles.hr_zones };
            hr_zones[editTarget.field] = value;
            updatedProfiles.hr_zones = hr_zones;
        } else if (editTarget.type === 'pace_zone') {
            const pace_zones = { ...updatedProfiles.pace_zones };
            pace_zones[editTarget.field] = value;
            updatedProfiles.pace_zones = pace_zones;
        }

        try {
            await updateProfile(updatedProfiles);
            await fetchProfile();
            setModalVisible(false);
        } catch (err) {
            Alert.alert("Error", "Failed to update profile.");
        }
    };

    const openEditModal = (type: 'bio' | 'hr_zone' | 'pace_zone', field: string, label: string, currentVal: any) => {
        setEditTarget({ type, field, label });
        setEditValue(currentVal?.toString() || '');
        setModalVisible(true);
    };

    const toggleHrUnit = async () => {
        const newUnit = data.profiles.hr_unit_pref === 'absolute' ? 'percentage' : 'absolute';
        try {
            await updateProfile({ hr_unit_pref: newUnit });
            fetchProfile();
        } catch (err) {
            Alert.alert("Error", "Failed to update preference.");
        }
    };

    const togglePaceUnit = async () => {
        const newUnit = data.profiles.pace_unit_pref === 'absolute' ? 'percentage' : 'absolute';
        try {
            await updateProfile({ pace_unit_pref: newUnit });
            fetchProfile();
        } catch (err) {
            Alert.alert("Error", "Failed to update preference.");
        }
    };

    const handleModalUnitChange = async (newUnit: 'absolute' | 'percentage') => {
        if (!editTarget || !data) return;
        
        const field = editTarget.type === 'hr_zone' ? 'hr_unit_pref' : 'pace_unit_pref';
        if (data.profiles[field] === newUnit) return;

        try {
            await updateProfile({ [field]: newUnit });
            await fetchProfile();
        } catch (err) {
            Alert.alert("Error", "Failed to update preference.");
        }
    };

    const resetToCalibrated = async () => {
        Alert.alert(
            "Reset Zones",
            "Are you sure you want to reset to AI-calibrated zones? This will clear your manual overrides.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reset", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Sending empty objects to clear overrides
                            await updateProfile({ hr_zones: {}, pace_zones: {} });
                            fetchProfile();
                        } catch (err) {
                            Alert.alert("Error", "Failed to reset zones.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const profile = data?.profiles || {};
    const email = data?.email || '';

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.name}>{profile.name || 'Athlete Name'}</Text>
                    <Text style={styles.email}>{email}</Text>
                </View>

                {/* Bio Stats */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Bio Stats</Text>
                    <StatRow 
                        label="Weight" 
                        value={profile.weight_kg} 
                        unit="kg" 
                        onEdit={() => openEditModal('bio', 'weight_kg', 'Weight (kg)', profile.weight_kg)}
                    />
                    <StatRow 
                        label="Max HR" 
                        value={profile.max_hr} 
                        unit="BPM" 
                        onEdit={() => openEditModal('bio', 'max_hr', 'Max HR (BPM)', profile.max_hr)}
                    />
                    <StatRow 
                        label="Resting HR" 
                        value={profile.resting_hr} 
                        unit="BPM" 
                        onEdit={() => openEditModal('bio', 'resting_hr', 'Resting HR (BPM)', profile.resting_hr)}
                    />
                </View>

                {/* HR Zones */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Heart Rate Zones</Text>
                    <TouchableOpacity style={styles.unitToggle} onPress={toggleHrUnit}>
                        <Text style={styles.unitToggleText}>
                            {profile.hr_unit_pref === 'absolute' ? 'BPM' : '% Max'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.zonesGrid}>
                    {ZONE_NAMES.map(name => (
                        <ZonePill 
                            key={name} 
                            zone={name} 
                            hr={profile.hr_zones?.[name] || '-'}
                            onPress={() => openEditModal('hr_zone', name, `${name} HR`, profile.hr_zones?.[name])}
                        />
                    ))}
                </View>

                {/* Pace Zones */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pace Zones</Text>
                    <TouchableOpacity style={styles.unitToggle} onPress={togglePaceUnit}>
                        <Text style={styles.unitToggleText}>
                            {profile.pace_unit_pref === 'absolute' ? 'min/km' : '% Threshold'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.zonesGrid}>
                    {ZONE_NAMES.map(name => (
                        <ZonePill 
                            key={name} 
                            zone={name} 
                            pace={profile.pace_zones?.[name] ? `${profile.pace_zones[name]}` : '-'}
                            onPress={() => openEditModal('pace_zone', name, `${name} Pace`, profile.pace_zones?.[name])}
                        />
                    ))}
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={resetToCalibrated}>
                    <Text style={styles.resetButtonText}>Reset to Calibrated</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit {editTarget?.label}</Text>

                        {(editTarget?.type === 'hr_zone' || editTarget?.type === 'pace_zone') && (
                            <View style={styles.modalUnitRow}>
                                <TouchableOpacity 
                                    style={[styles.miniToggle, (editTarget.type === 'hr_zone' ? profile.hr_unit_pref : profile.pace_unit_pref) === 'absolute' && styles.miniToggleActive]}
                                    onPress={() => handleModalUnitChange('absolute')}
                                >
                                    <Text style={[styles.miniToggleText, (editTarget.type === 'hr_zone' ? profile.hr_unit_pref : profile.pace_unit_pref) === 'absolute' && styles.miniToggleTextActive]}>
                                        {editTarget.type === 'hr_zone' ? 'BPM' : 'min/km'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.miniToggle, (editTarget.type === 'hr_zone' ? profile.hr_unit_pref : profile.pace_unit_pref) === 'percentage' && styles.miniToggleActive]}
                                    onPress={() => handleModalUnitChange('percentage')}
                                >
                                    <Text style={[styles.miniToggleText, (editTarget.type === 'hr_zone' ? profile.hr_unit_pref : profile.pace_unit_pref) === 'percentage' && styles.miniToggleTextActive]}>
                                        {editTarget.type === 'hr_zone' ? '% Max' : '% Threshold'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            value={editValue}
                            onChangeText={setEditValue}
                            keyboardType="numeric"
                            placeholder="Enter value"
                            placeholderTextColor={colors.textDim}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function StatRow({ label, value, unit, onEdit }: { label: string; value: any; unit: string; onEdit: () => void }) {
    return (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{value || '-'} <Text style={styles.statUnit}>{unit}</Text></Text>
                <TouchableOpacity onPress={onEdit} style={styles.editIcon}>
                    <Text style={{ fontSize: 16 }}>✏️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
    },
    header: {
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    email: {
        fontSize: 16,
        color: colors.textMuted,
        marginTop: 4,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 16,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    statUnit: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: 'normal',
    },
    editIcon: {
        marginLeft: spacing.md,
        padding: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    unitToggle: {
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    unitToggleText: {
        color: colors.accent,
        fontSize: 12,
        fontWeight: 'bold',
    },
    zonesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: spacing.lg,
    },
    zonePill: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        minWidth: '30%',
    },
    zoneName: {
        fontSize: 12,
        fontWeight: '700',
    },
    zoneDetail: {
        fontSize: 11,
        color: colors.text,
        marginTop: 2,
    },
    resetButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.red,
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    resetButtonText: {
        color: colors.red,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.lg,
    },
    input: {
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: radius.md,
        padding: spacing.md,
        fontSize: 18,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalUnitRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    miniToggle: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
    },
    miniToggleActive: {
        borderColor: colors.accent,
        backgroundColor: colors.accent + '20', // subtle tint
    },
    miniToggleText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
    },
    miniToggleTextActive: {
        color: colors.accent,
    },
    modalButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    saveButton: {
        backgroundColor: colors.accent,
    },
    buttonText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
