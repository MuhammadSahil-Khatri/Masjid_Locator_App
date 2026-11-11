import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Bell, BookOpen, Megaphone, CheckCheck } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { colors } from '../../theme';
import { typography } from '../../theme/typography';
import { useNavigation } from '../../navigation/NavigationContext';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types/notifications';
import { EmptyState } from '../../components/common/EmptyState';

const BackArrowIcon = ({ color = '#1D3B6D', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size * (21 / 13)} viewBox="0 0 13 21" fill="none">
    <Path d="M12 20L1 10.5L12 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function formatRelativeTime(dateString: string, isRtl: boolean): string {
  try {
    const now = Date.now();
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return '';

    const diffSec = Math.floor((now - time) / 1000);
    if (diffSec < 60) {
      return isRtl ? 'ابھی' : 'Just now';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return isRtl ? `${diffMin} منٹ پہلے` : `${diffMin}m ago`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return isRtl ? `${diffHours} گھنٹے پہلے` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return isRtl ? 'کل' : 'Yesterday';
    }
    if (diffDays < 7) {
      return isRtl ? `${diffDays} دن پہلے` : `${diffDays}d ago`;
    }

    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isRtl } = useApp();
  const { goBack, navigate } = useNavigation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sync, refreshing } = useNotifications();

  const handleNotificationPress = async (item: AppNotification) => {
    // Mark as read immediately
    if (!item.isRead) {
      await markAsRead(item.id);
    }

    // Navigate to dedicated detail screen using original record UUID
    if (item.type === 'announcement') {
      navigate('AnnouncementDetail', { id: item.recordId });
    } else if (item.type === 'hadith') {
      navigate('HadithDetail', { id: item.recordId });
    }
  };

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      {/* ── Top Header Bar ── */}
      <View style={styles.headerWrapper}>
        <View style={[styles.headerRow, isRtl && { flexDirection: 'row-reverse' }]}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <View style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined}>
              <BackArrowIcon size={14} color="#1D3B6D" />
            </View>
          </TouchableOpacity>

          {/* Screen Title */}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isRtl ? 'اطلاعات' : 'Notifications'}
          </Text>

          {/* Mark All Read Action */}
          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllAsRead}
              activeOpacity={0.7}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={16} color={colors.primary} />
              <Text style={styles.markAllText}>
                {isRtl ? 'سب پڑھیں' : 'Mark all'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionPlaceholder} />
          )}
        </View>
      </View>

      {/* ── Notification List ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 30 },
          notifications.length === 0 && styles.emptyScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={sync}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={36} color={colors.primary} />}
            title={isRtl ? 'کوئی اطلاع نہیں' : 'No Notifications'}
            description={
              isRtl
                ? 'ابھی تک کوئی نئی اطلاع موصول نہیں ہوئی ہے۔ اعلانات اور احادیث یہاں ظاہر ہوں گے۔'
                : 'You have no notifications right now. New announcements and Hadith updates will appear here.'
            }
          />
        ) : (
          notifications.map((item) => {
            const isAnnouncement = item.type === 'announcement';
            const timeAgo = formatRelativeTime(item.createdAt, isRtl);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.unreadCard,
                  isRtl && styles.cardRtl,
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                {/* Content Icon & Badge */}
                <View style={[styles.iconWrapper, isAnnouncement ? styles.announcementIconBg : styles.hadithIconBg]}>
                  {isAnnouncement ? (
                    <Megaphone size={18} color={colors.primary} />
                  ) : (
                    <BookOpen size={18} color="#D97706" />
                  )}
                </View>

                {/* Text Content */}
                <View style={[styles.textContent, isRtl && { alignItems: 'flex-end' }]}>
                  {/* Category / Type & Time row */}
                  <View style={[styles.metaRow, isRtl && { flexDirection: 'row-reverse' }]}>
                    <View
                      style={[
                        styles.typeBadge,
                        isAnnouncement ? styles.announcementBadge : styles.hadithBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          isAnnouncement ? styles.announcementBadgeText : styles.hadithBadgeText,
                        ]}
                      >
                        {isAnnouncement
                          ? isRtl
                            ? item.categoryName || 'اعلان'
                            : item.categoryName || 'Announcement'
                          : isRtl
                          ? 'حدیث'
                          : 'Hadith'}
                      </Text>
                    </View>

                    <Text style={styles.timeText}>{timeAgo}</Text>
                  </View>

                  {/* Title */}
                  <Text
                    style={[
                      styles.cardTitle,
                      !item.isRead && styles.unreadTitleText,
                      isRtl && { textAlign: 'right' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {/* Description preview */}
                  <Text
                    style={[
                      styles.cardDescription,
                      isRtl && { textAlign: 'right' },
                    ]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>

                  {/* Mosque name footer if available */}
                  {item.mosqueName ? (
                    <Text style={[styles.mosqueNameText, isRtl && { textAlign: 'right' }]}>
                      📍 {item.mosqueName}
                    </Text>
                  ) : null}
                </View>

                {/* Unread dot indicator on the card */}
                {!item.isRead && <View style={styles.cardUnreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAFEFF',
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(3, 190, 205, 0.2)',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3B6D',
    letterSpacing: 0.2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(3, 190, 205, 0.08)',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionPlaceholder: {
    width: 36,
    height: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 190, 205, 0.12)',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  unreadCard: {
    backgroundColor: '#FAFEFF',
    borderColor: 'rgba(3, 190, 205, 0.35)',
  },
  cardRtl: {
    flexDirection: 'row-reverse',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementIconBg: {
    backgroundColor: 'rgba(3, 190, 205, 0.12)',
  },
  hadithIconBg: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  textContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  announcementBadge: {
    backgroundColor: 'rgba(3, 190, 205, 0.12)',
  },
  hadithBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  announcementBadgeText: {
    color: colors.primary,
  },
  hadithBadgeText: {
    color: '#D97706',
  },
  timeText: {
    fontSize: 12,
    color: '#8A9BA8',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D3B6D',
    marginBottom: 3,
  },
  unreadTitleText: {
    fontWeight: '700',
    color: '#0F2B4D',
  },
  cardDescription: {
    fontSize: 13,
    color: '#5A6E82',
    lineHeight: 18,
  },
  mosqueNameText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 6,
  },
  cardUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E44848',
    marginLeft: 6,
    marginTop: 4,
  },
});

