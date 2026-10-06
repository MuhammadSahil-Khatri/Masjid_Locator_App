import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { DuaItem } from '../../services/duaService';
import { GoldenDividerSvg, ShareIcon } from './DuaIcons';

interface DuaCardProps {
  dua: DuaItem;
  index: number;
  isRtl?: boolean;
}

export const DuaCard: React.FC<DuaCardProps> = ({ dua, isRtl = false }) => {
  const handleShare = async () => {
    try {
      let message = `${dua.title}\n\n${dua.arabic}`;
      if (dua.translation) {
        message += `\n\n${dua.translation}`;
      }
      await Share.share({ message, title: dua.title });
    } catch (e) {
      // User cancelled or error
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* ── Dua Title ── */}
      {dua.title ? (
        <Text style={[styles.duaTitle, isRtl && styles.textRtl]}>
          {dua.title}
        </Text>
      ) : null}

      {/* ── Arabic Text ── */}
      <Text style={styles.arabicText} arabic weight="bold">
        {dua.arabic}
      </Text>

      {/* ── Golden Islamic Divider ── */}
      <GoldenDividerSvg />

      {/* ── English Translation ── */}
      {dua.translation ? (
        <Text style={[styles.translationText, isRtl && styles.textRtl]}>
          {dua.translation}
        </Text>
      ) : null}

      {/* ── Card Footer ── */}
      {/* <View style={styles.lineBreaker} /> */}

      {/* <View style={[styles.cardFooter, isRtl && styles.rowReverse]}>
        <View />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share Supplication"
        >
          <ShareIcon size={16} color="#0081A0" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8F3F5',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0081A0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#0081A0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  duaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
    marginBottom: 10,
    lineHeight: 20,
  },
  arabicText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'right',
    lineHeight: 46,
    letterSpacing: 0.3,
    paddingVertical: 4,
  },
  translationText: {
    fontSize: 15,
    color: '#2C3E50',
    lineHeight: 26,
    marginTop: 6,
    fontWeight: '400',
  },
  lineBreaker: {
    height: 1,
    backgroundColor: '#EEF2F4',
    width: '100%',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0F7F9',
  },
  actionBtnText: {
    color: '#0081A0',
    fontSize: 12,
    fontWeight: '600',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },
});
