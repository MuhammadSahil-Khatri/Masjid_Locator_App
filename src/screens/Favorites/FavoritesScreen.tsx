import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { MasjidCard } from '../../components/cards/MasjidCard';
import { useNavigation } from '../../navigation/NavigationContext';

export const FavoritesScreen: React.FC = () => {
  const { 
    masjids, 
    highContrast: isDark, 
    isRtl, 
    translations 
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const { navigate } = useNavigation();

  // In this frontend-only build, favorites are mocked. Let's favorite masjids 'm1' and 'm3'
  const favoriteMasjids = useMemo(() => {
    return masjids.filter(m => m.id === 'm1' || m.id === 'm3');
  }, [masjids]);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          ❤️ Saved Masjids
        </Text>
      </View>

      {favoriteMasjids.length > 0 ? (
        <FlatList
          data={favoriteMasjids}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MasjidCard
              masjid={item}
              isDark={isDark}
              isRtl={isRtl}
              translations={translations}
              onPress={() => navigate('MosqueDetails', { masjidId: item.id })}
              onDirectionsPress={() => navigate('MosqueDetails', { masjidId: item.id })}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Heart size={48} color={currentTheme.textMuted} />
          <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
            No saved masjids yet. Tap the heart icon on a masjid to save it here.
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 80,
  },
});
