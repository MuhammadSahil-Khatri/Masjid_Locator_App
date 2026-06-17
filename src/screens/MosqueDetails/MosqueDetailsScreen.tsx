import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal 
} from 'react-native';
import { Phone, Users, Shield, Award, Calendar, Volume2, VolumeX, Navigation } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '../../navigation/NavigationContext';
import { Header } from '../../components/common/Header';
import { CalculationMethod, JuristicMethod } from '../../types';

export const MosqueDetailsScreen: React.FC = () => {
  const { 
    masjids, 
    events, 
    handleRsvpToggle, 
    highContrast: isDark, 
    isRtl, 
    translations, 
    triggerToast 
  } = useApp();

  const { params, goBack } = useNavigation();
  const currentTheme = isDark ? colors.dark : colors.light;

  const masjid = useMemo(() => {
    const id = params?.masjidId || 'm1';
    return masjids.find(m => m.id === id) || masjids[0];
  }, [masjids, params]);

  const [calcMethod, setCalcMethod] = useState<CalculationMethod>('Karachi');
  const [juristicMethod, setJuristicMethod] = useState<JuristicMethod>('Hanafi');
  const [playingAdhan, setPlayingAdhan] = useState<string | null>(null);
  const [showRoutePreview, setShowRoutePreview] = useState(false);

  const [calcPickerVisible, setCalcPickerVisible] = useState(false);
  const [juristicPickerVisible, setJuristicPickerVisible] = useState(false);

  const getCalculatedTime = (baseTime: string, method: CalculationMethod, juristic: JuristicMethod, prayerKey: 'fajr' | 'asr' | 'isha') => {
    const [h, m] = baseTime.split(':').map(Number);
    let offsetMinutes = 0;

    if (method === 'UmmAlQura') offsetMinutes -= 5;
    if (method === 'ISNA') offsetMinutes += 4;
    if (method === 'MWL') offsetMinutes -= 2;
    if (method === 'Egypt') offsetMinutes += 1;

    if (prayerKey === 'asr') {
      if (juristic === 'Hanafi') {
        offsetMinutes += 45;
      }
    }

    let totalMins = h * 60 + m + offsetMinutes;
    if (totalMins < 0) totalMins += 24 * 60;
    const finalH = Math.floor(totalMins / 60) % 24;
    const finalM = totalMins % 60;

    return `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
  };

  const formattedCalculatedTimes = useMemo(() => {
    const times = masjid.prayerTimes;
    return {
      fajr: getCalculatedTime(times.fajr, calcMethod, juristicMethod, 'fajr'),
      dhuhr: times.dhuhr,
      asr: getCalculatedTime(times.asr, calcMethod, juristicMethod, 'asr'),
      maghrib: times.maghrib,
      isha: getCalculatedTime(times.isha, calcMethod, juristicMethod, 'isha'),
      jummah: times.jummah,
    };
  }, [masjid, calcMethod, juristicMethod]);

  const handleToggleAdhan = (key: string) => {
    if (playingAdhan === key) {
      setPlayingAdhan(null);
      triggerToast('Simulated notification reminder deactivated');
    } else {
      setPlayingAdhan(key);
      triggerToast(`🚨 Sound Alert configured for ${key}! Adhan audio will ring 1 min prior.`);
    }
  };

  const currentMasjidEvents = useMemo(() => {
    return events.filter(e => e.masjidId === masjid.id);
  }, [events, masjid]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Header title={isRtl ? masjid.nameUr : masjid.nameEn} showBack={true} isDark={isDark} isRtl={isRtl} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: masjid.image }} style={styles.image} />

        <View style={styles.paddingContainer}>
          {/* Mosque Meta Title Card */}
          <View style={[styles.metaCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <View style={[styles.metaHeader, isRtl && styles.rowReverse]}>
              <Text style={[styles.titleText, { color: currentTheme.text }]}>
                {isRtl ? masjid.nameUr : masjid.nameEn}
              </Text>
              {masjid.isVerified && <Shield size={16} color="#10b981" fill="#10b981" />}
            </View>
            <Text style={[styles.addressText, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>
              {isRtl ? masjid.addressUr : masjid.addressEn}
            </Text>

            <View style={[styles.metaRow, isRtl && styles.rowReverse]}>
              <View style={[styles.metaItem, isRtl && styles.rowReverse]}>
                <Users size={14} color={currentTheme.textMuted} />
                <Text style={{ color: currentTheme.text, fontSize: typography.sizes.xs }}>
                  {translations.capacity}: {masjid.capacity}
                </Text>
              </View>

              <View style={[styles.metaItem, isRtl && styles.rowReverse]}>
                <Phone size={14} color={currentTheme.textMuted} />
                <Text style={{ color: currentTheme.text, fontSize: typography.sizes.xs }}>
                  {masjid.contactNumber}
                </Text>
              </View>
            </View>

            {/* School of Thought */}
            {masjid.schoolOfThought && (
              <View style={[styles.thoughtBadge, { backgroundColor: colors.primaryLight }, isRtl && styles.rowReverse]}>
                <Award size={12} color={colors.primary} />
                <Text style={styles.thoughtText}>
                  {translations.schoolOfThought}: {masjid.schoolOfThought}
                </Text>
              </View>
            )}
          </View>

          {/* Dynamic Computation Controls */}
          <View style={[styles.calcPanel, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
            <Text style={[styles.sectionHeading, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              ⚙️ Computational Settings
            </Text>

            <View style={[styles.selectorRow, isRtl && styles.rowReverse]}>
              <TouchableOpacity 
                style={[styles.selectorBtn, { borderColor: currentTheme.border }]} 
                onPress={() => setCalcPickerVisible(true)}
              >
                <Text style={[styles.selectorBtnText, { color: colors.primary }]}>
                  {calcMethod} Method
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectorBtn, { borderColor: currentTheme.border }]} 
                onPress={() => setJuristicPickerVisible(true)}
              >
                <Text style={[styles.selectorBtnText, { color: colors.primary }]}>
                  {juristicMethod} (Asr)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Prayer Times Grid */}
          <Text style={[styles.sectionHeading, { color: currentTheme.text }, isRtl && typography.alignRtl, { marginTop: spacing.lg }]}>
            🕌 {translations.prayerTimes}
          </Text>

          <View style={[styles.grid, { borderColor: currentTheme.border }]}>
            {[
              { label: translations.fajr, time: formattedCalculatedTimes.fajr, key: 'fajr' },
              { label: translations.dhuhr, time: formattedCalculatedTimes.dhuhr, key: 'dhuhr' },
              { label: translations.asr, time: formattedCalculatedTimes.asr, key: 'asr' },
              { label: translations.maghrib, time: formattedCalculatedTimes.maghrib, key: 'maghrib' },
              { label: translations.isha, time: formattedCalculatedTimes.isha, key: 'isha' },
              { label: translations.jummah, time: formattedCalculatedTimes.jummah, key: 'jummah' }
            ].map((item, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.gridItem, 
                  { 
                    backgroundColor: currentTheme.card, 
                    borderBottomColor: currentTheme.border, 
                    borderRightColor: currentTheme.border 
                  },
                  isRtl && styles.rowReverse
                ]}
              >
                <View style={styles.flexOne}>
                  <Text style={[styles.gridLabel, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>{item.label}</Text>
                  <Text style={[styles.gridTime, { color: currentTheme.text }, isRtl && typography.alignRtl]}>{item.time}</Text>
                </View>

                {item.key !== 'jummah' && (
                  <TouchableOpacity 
                    style={styles.adhanIconBtn} 
                    onPress={() => handleToggleAdhan(item.key)}
                  >
                    {playingAdhan === item.key ? (
                      <Volume2 size={16} color={colors.primary} />
                    ) : (
                      <VolumeX size={16} color={currentTheme.textMuted} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Map Direction Preview */}
          <TouchableOpacity 
            style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowRoutePreview(prev => !prev)}
          >
            <Navigation size={14} color="#ffffff" fill="#ffffff" />
            <Text style={styles.directionsText}>{translations.directionsPreview}</Text>
          </TouchableOpacity>

          {showRoutePreview && (
            <View style={[styles.routeCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <Text style={[styles.routeTitle, { color: currentTheme.text }]}>🛣️ Direct Route Mapping Instructions</Text>
              <Text style={[styles.routeBody, { color: currentTheme.textMuted }]}>
                1. Head North-West towards nearest arterial road.{"\n"}
                2. Drive 2.4 km following GPS live navigation compass.{"\n"}
                3. Arrive at destination: {masjid.nameEn}
              </Text>
            </View>
          )}

          {/* Events Section */}
          {currentMasjidEvents.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.sectionHeading, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
                📅 Upcoming Events
              </Text>
              {currentMasjidEvents.map(evt => (
                <View key={evt.id} style={[styles.eventItem, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                  <View style={[styles.eventHeader, isRtl && styles.rowReverse]}>
                    <Text style={[styles.eventTitle, { color: currentTheme.text }]}>{isRtl ? evt.titleUr : evt.titleEn}</Text>
                    <TouchableOpacity 
                      style={[styles.rsvpMiniBtn, evt.rsvpStatus === 'going' ? { backgroundColor: colors.primary } : { backgroundColor: colors.primaryLight }]}
                      onPress={() => handleRsvpToggle(evt.id)}
                    >
                      <Text style={[styles.rsvpMiniBtnText, evt.rsvpStatus === 'going' ? { color: '#ffffff' } : { color: colors.primary }]}>
                        {evt.rsvpStatus === 'going' ? 'Going' : 'RSVP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.eventDesc, { color: currentTheme.textMuted }, isRtl && typography.alignRtl]}>{isRtl ? evt.descriptionUr : evt.descriptionEn}</Text>
                  <Text style={[styles.eventTime, { color: colors.primary }, isRtl && typography.alignRtl]}>⏰ {evt.date} • {evt.time}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Computational Modal pickers */}
      <Modal visible={calcPickerVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCalcPickerVisible(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Calculation Method</Text>
            {[
              { value: 'Karachi' as const, label: 'University of Karachi' },
              { value: 'UmmAlQura' as const, label: 'Umm Al-Qura (Makkah)' },
              { value: 'ISNA' as const, label: 'ISNA (North America)' },
              { value: 'MWL' as const, label: 'Muslim World League (MWL)' },
              { value: 'Egypt' as const, label: 'Egyptian General Authority' }
            ].map(item => (
              <TouchableOpacity 
                key={item.value} 
                style={styles.pickerItem}
                onPress={() => {
                  setCalcMethod(item.value);
                  setCalcPickerVisible(false);
                  triggerToast(`Updated to: ${item.label}`);
                }}
              >
                <Text style={[styles.pickerItemText, calcMethod === item.value ? { color: colors.primary, fontWeight: 'bold' } : { color: currentTheme.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={juristicPickerVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setJuristicPickerVisible(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Juristic Method</Text>
            {[
              { value: 'Hanafi' as const, label: 'Hanafi (Later shadow)' },
              { value: 'Standard' as const, label: 'Standard (Shafi\'i, Maliki, Hanbali)' }
            ].map(item => (
              <TouchableOpacity 
                key={item.value} 
                style={styles.pickerItem}
                onPress={() => {
                  setJuristicMethod(item.value);
                  setJuristicPickerVisible(false);
                  triggerToast(`Updated Asr calculations: ${item.label}`);
                }}
              >
                <Text style={[styles.pickerItemText, juristicMethod === item.value ? { color: colors.primary, fontWeight: 'bold' } : { color: currentTheme.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  image: {
    height: 180,
    width: '100%',
  },
  paddingContainer: {
    padding: spacing.md,
  },
  metaCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: -spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  addressText: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  thoughtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  thoughtText: {
    color: colors.primary,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  calcPanel: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
  },
  sectionHeading: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectorBtn: {
    flex: 1,
    height: spacing.touchTargetMin,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBtnText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  grid: {
    borderWidth: 1,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  flexOne: {
    flex: 1,
  },
  gridLabel: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  gridTime: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  adhanIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.touchTargetMin + 4,
    borderRadius: spacing.borderRadiusSm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  directionsText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  routeCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
  },
  routeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  routeBody: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  eventItem: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  eventDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  eventTime: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  rsvpMiniBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  rsvpMiniBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalContent: {
    borderRadius: spacing.borderRadiusLg,
    width: '100%',
    padding: spacing.lg,
    elevation: 5,
  },
  pickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: typography.sizes.sm,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
