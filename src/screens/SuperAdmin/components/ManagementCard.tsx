import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Edit2, Trash2, CheckCircle2, AlertCircle, Ban } from 'lucide-react-native';
import { Text } from '../../../components/ui/Text';
import { colors, spacing, typography } from '../../../theme';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export type CardType = 'mosque' | 'admin' | 'super_admin' | 'hadith' | 'announcement' | 'worshiper';

interface ManagementCardProps {
  item: any;
  type: CardType;
  index: number;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onBlockToggle?: (item: any) => void;
}

export const ManagementCard: React.FC<ManagementCardProps> = ({
  item,
  type,
  index,
  onEdit,
  onDelete,
  onBlockToggle,
}) => {
  const themeColors = colors.light;
  const scale = useSharedValue(1);

  const rCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderContent = () => {
    switch (type) {
      case 'mosque':
        return (
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: themeColors.text }]} weight="bold">
                {item.nameEn}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: item.isVerified
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(246, 139, 53, 0.1)',
                  },
                ]}
              >
                {item.isVerified ? (
                  <CheckCircle2 size={12} color={colors.success} style={styles.badgeIcon} />
                ) : (
                  <AlertCircle size={12} color={colors.primary} style={styles.badgeIcon} />
                )}
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.isVerified ? colors.success : colors.primary },
                  ]}
                  weight="semibold"
                >
                  {item.isVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
            {item.nameUr && (
              <Text style={[styles.subtitleUr, { color: themeColors.textMuted }]} arabic>
                {item.nameUr}
              </Text>
            )}
            <Text style={[styles.descText, { color: themeColors.textMuted }]}>
              {item.addressEn}, {item.cityEn}
            </Text>
          </View>
        );

      case 'admin':
      case 'super_admin':
        const isSuper = type === 'super_admin';
        return (
          <View style={styles.cardInfoRow}>
            <View style={[styles.avatar, { backgroundColor: isSuper ? colors.brown : colors.peach }]}>
              <Text style={styles.avatarText} weight="bold">
                {getInitials(item.name)}
              </Text>
            </View>
            <View style={styles.avatarDetails}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: themeColors.text }]} weight="bold">
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isSuper
                        ? 'rgba(137, 79, 53, 0.1)'
                        : 'rgba(246, 139, 53, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isSuper ? colors.brown : colors.primary },
                    ]}
                    weight="semibold"
                  >
                    {isSuper ? 'Super Admin' : 'Admin'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.descText, { color: themeColors.textMuted }]}>
                {item.email}
              </Text>
              {!isSuper && item.assignedMasjidName && (
                <Text style={[styles.subText, { color: colors.primary }]} weight="medium">
                  Masjid: {item.assignedMasjidName}
                </Text>
              )}
            </View>
          </View>
        );

      case 'hadith':
        return (
          <View style={styles.cardInfo}>
            <Text style={[styles.title, { color: themeColors.text }]} weight="bold">
              {item.title}
            </Text>
            {item.textAr && (
              <Text style={[styles.arabicPreview, { color: colors.brown }]} numberOfLines={1} arabic>
                {item.textAr}
              </Text>
            )}
            <Text style={[styles.descText, { color: themeColors.textMuted }]} numberOfLines={2}>
              {item.textEn}
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
              {item.date}
            </Text>
          </View>
        );

      case 'announcement': {
        const isToday = item.is_today;
        return (
          <View style={[styles.cardInfo, isToday && { paddingLeft: 8 }]}>
            {isToday && (
              <View style={styles.todayIndicator} />
            )}
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: themeColors.text }]} weight="bold" numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.titleBadgesRow}>
                {isToday && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(246, 139, 53, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]} weight="semibold">
                      Today
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        item.status === 'Published' || item.is_active
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(142, 142, 142, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.status === 'Published' || item.is_active ? colors.success : themeColors.textMuted },
                    ]}
                    weight="semibold"
                  >
                    {item.status === 'Published' ? 'Published' : item.is_active ? 'Active' : 'Draft'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.descText, { color: themeColors.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
            {item.event_date && (
              <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
                {item.event_time
                  ? `Event: ${item.event_date} at ${item.event_time?.substring(0, 5)}`
                  : `Event: ${item.event_date}`}
              </Text>
            )}
            {item.mosque_name && (
              <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
                Mosque: {item.mosque_name}
              </Text>
            )}
          </View>
        );
      }

      case 'worshiper':
        const isBlocked = !!item.is_blocked;
        return (
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: themeColors.text }]} weight="bold">
                {item.name || 'Unknown'}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isBlocked
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(34, 197, 94, 0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isBlocked ? colors.danger : colors.success },
                  ]}
                  weight="semibold"
                >
                  {isBlocked ? 'Blocked' : 'Active'}
                </Text>
              </View>
            </View>
            {item.email && (
              <Text style={[styles.descText, { color: themeColors.textMuted }]}>
                {item.email}
              </Text>
            )}
            <Text style={[styles.descText, { color: themeColors.textMuted }]} numberOfLines={1}>
              CNIC: {item.cnic || 'N/A'} • Phone: {item.phone || 'N/A'}
            </Text>
            {item.created_at && (
              <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
                Joined: {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const actionScaleEdit = useSharedValue(1);
  const actionScaleDelete = useSharedValue(1);
  const actionScaleBlock = useSharedValue(1);

  const rEditStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionScaleEdit.value }],
  }));

  const rDeleteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionScaleDelete.value }],
  }));

  const rBlockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionScaleBlock.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(350)}
      style={[
        styles.cardContainer,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        rCardStyle,
      ]}
    >
      <View style={styles.mainLayout}>
        <View style={styles.contentWrapper}>{renderContent()}</View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {type === 'worshiper' ? (
            <>
              {/* Block/Unblock toggle button */}
              <Animated.View style={rBlockStyle}>
                <TouchableOpacity
                  onPressIn={() => {
                    actionScaleBlock.value = withSpring(0.85);
                  }}
                  onPressOut={() => {
                    actionScaleBlock.value = withSpring(1);
                  }}
                  onPress={() => onBlockToggle?.(item)}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        item.is_blocked
                          ? 'rgba(34, 197, 94, 0.08)'
                          : 'rgba(239, 68, 68, 0.08)',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {item.is_blocked ? (
                    <CheckCircle2 size={16} color={colors.success} />
                  ) : (
                    <Ban size={16} color={colors.danger} />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Remove User button */}
              <Animated.View style={rDeleteStyle}>
                <TouchableOpacity
                  onPressIn={() => {
                    actionScaleDelete.value = withSpring(0.85);
                  }}
                  onPressOut={() => {
                    actionScaleDelete.value = withSpring(1);
                  }}
                  onPress={() => onDelete?.(item)}
                  style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View style={rEditStyle}>
                <TouchableOpacity
                  onPressIn={() => {
                    actionScaleEdit.value = withSpring(0.85);
                  }}
                  onPressOut={() => {
                    actionScaleEdit.value = withSpring(1);
                  }}
                  onPress={() => onEdit?.(item)}
                  style={[styles.actionButton, { backgroundColor: 'rgba(246, 139, 53, 0.08)' }]}
                  activeOpacity={0.8}
                >
                  <Edit2 size={16} color={colors.primary} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={rDeleteStyle}>
                <TouchableOpacity
                  onPressIn={() => {
                    actionScaleDelete.value = withSpring(0.85);
                  }}
                  onPressOut={() => {
                    actionScaleDelete.value = withSpring(1);
                  }}
                  onPress={() => onDelete?.(item)}
                  style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentWrapper: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
  },
  avatarDetails: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.base + 1,
    maxWidth: '70%',
  },
  subtitleUr: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    textAlign: 'left',
  },
  descText: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  subText: {
    fontSize: typography.sizes.xs + 1,
    marginTop: 1,
  },
  arabicPreview: {
    fontSize: typography.sizes.base,
    textAlign: 'left',
    marginTop: 2,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  // Today indicator for announcements
  todayIndicator: {
    position: 'absolute',
    left: -spacing.md,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  titleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default ManagementCard;
