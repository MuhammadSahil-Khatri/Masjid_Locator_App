/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Circle, Line } from 'react-native-svg';
import { Navigation, MapPin, Compass, WifiOff, RefreshCw } from 'lucide-react-native';
import { Masjid, Language } from '../types';

interface MapComponentProps {
  masjids: Masjid[];
  selectedMasjid: Masjid | null;
  onSelectMasjid: (masjid: Masjid) => void;
  userLocation: { lat: number; lng: number };
  language: Language;
  showRoutePreview: boolean;
}

const RADAR_ANGLES = [45, 135, 230, 310];
const RADAR_RADII = [35, 65, 85, 105];

export default function MapComponent({
  masjids,
  selectedMasjid,
  onSelectMasjid,
  userLocation,
  language,
  showRoutePreview,
}: MapComponentProps) {
  const [usingOfflineRadar, setUsingOfflineRadar] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  // Auto pan to selected masjid
  useEffect(() => {
    if (usingOfflineRadar || !selectedMasjid || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: selectedMasjid.lat,
      longitude: selectedMasjid.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);
  }, [selectedMasjid, usingOfflineRadar]);

  const handleToggleRadar = () => {
    setUsingOfflineRadar(!usingOfflineRadar);
  };

  const isRtl = language === 'ur';

  // Radar Center calculations
  const RADAR_CENTER = 120; // 240 / 2

  return (
    <View style={styles.container}>
      {/* Top Banner showing connection status */}
      <View style={[styles.topBanner, isRtl && styles.rowReverse]}>
        <View style={styles.statusIndicator}>
          <View style={[styles.pulseDot, usingOfflineRadar ? styles.pulseDotOffline : styles.pulseDotLive]} />
          <Text style={styles.statusText}>
            {usingOfflineRadar ? 'OFFLINE RADAR' : 'LIVE GPS MAP'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleToggleRadar} style={styles.toggleBtn}>
          <RefreshCw size={12} color={usingOfflineRadar ? '#f59e0b' : '#10b981'} />
          <Text style={styles.toggleBtnText}>
            {usingOfflineRadar ? 'Online Map' : 'Offline Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Map Viewport */}
      {!usingOfflineRadar ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        >
          {/* User Location Marker */}
          <Marker 
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Your Location"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerCore} />
            </View>
          </Marker>

          {/* Masjid Pins */}
          {masjids.map((masjid) => {
            const isSelected = selectedMasjid?.id === masjid.id;
            return (
              <Marker
                key={masjid.id}
                coordinate={{ latitude: masjid.lat, longitude: masjid.lng }}
                onPress={() => onSelectMasjid(masjid)}
              >
                <View style={[styles.masjidMarker, isSelected ? styles.masjidMarkerSelected : styles.masjidMarkerNormal]}>
                  <Text style={styles.masjidMarkerEmoji}>🕌</Text>
                  <Text style={[styles.masjidMarkerText, isSelected ? styles.masjidMarkerTextSelected : null]} numberOfLines={1}>
                    {language === 'ur' ? masjid.nameUr : masjid.nameEn}
                  </Text>
                </View>
              </Marker>
            );
          })}

          {/* Route Preview Polyline */}
          {showRoutePreview && selectedMasjid && (
            <Polyline
              coordinates={[
                { latitude: userLocation.lat, longitude: userLocation.lng },
                // midpoint curve
                { 
                  latitude: (userLocation.lat + selectedMasjid.lat) / 2 + 0.001,
                  longitude: (userLocation.lng + selectedMasjid.lng) / 2 - 0.001
                },
                { latitude: selectedMasjid.lat, longitude: selectedMasjid.lng }
              ]}
              strokeColor="#d97706" // amber-600
              strokeWidth={3}
              lineDashPattern={[6, 6]}
            />
          )}
        </MapView>
      ) : (
        /* OFFLINE VECTOR RADAR (Using react-native-svg for vectors) */
        <View style={styles.radarContainer}>
          <View style={styles.radarCircle}>
            {/* Grid Rings and lines via SVG */}
            <Svg width="240" height="240" style={StyleSheet.absoluteFillObject}>
              <Circle cx="120" cy="120" r="105" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" fill="none" />
              <Circle cx="120" cy="120" r="85" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="1" fill="none" />
              <Circle cx="120" cy="120" r="65" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" fill="none" />
              <Circle cx="120" cy="120" r="35" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" fill="none" />
              
              {/* Radar Grid Axes */}
              <Line x1="0" y1="120" x2="240" y2="120" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />
              <Line x1="120" y1="0" x2="120" y2="240" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />

              {/* Offline route line */}
              {showRoutePreview && selectedMasjid && (() => {
                const idx = masjids.findIndex(m => m.id === selectedMasjid.id);
                if (idx !== -1) {
                  const angle = RADAR_ANGLES[idx % RADAR_ANGLES.length];
                  const radius = RADAR_RADII[idx % RADAR_RADII.length];
                  const radians = (angle * Math.PI) / 180;
                  const x = Math.cos(radians) * radius;
                  const y = Math.sin(radians) * radius;
                  return (
                    <Line
                      x1="120"
                      y1="120"
                      x2={120 + x}
                      y2={120 + y}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4, 4"
                    />
                  );
                }
                return null;
              })()}
            </Svg>

            {/* Radar Center (User location indicator) */}
            <View style={styles.radarUserBadge}>
              <Compass size={12} color="#10b981" />
              <Text style={styles.radarUserText}>YOU</Text>
            </View>

            {/* Radar Mosque Blips */}
            {masjids.map((masjid, idx) => {
              const isSelected = selectedMasjid?.id === masjid.id;
              const angle = RADAR_ANGLES[idx % RADAR_ANGLES.length];
              const radius = RADAR_RADII[idx % RADAR_RADII.length];
              const radians = (angle * Math.PI) / 180;
              const x = Math.cos(radians) * radius;
              const y = Math.sin(radians) * radius;

              // Absolute styles
              const blipSize = isSelected ? 28 : 22;
              const top = RADAR_CENTER + y - (blipSize / 2);
              const left = RADAR_CENTER + x - (blipSize / 2);

              return (
                <TouchableOpacity
                  key={masjid.id}
                  onPress={() => onSelectMasjid(masjid)}
                  style={[
                    styles.radarBlip,
                    {
                      top,
                      left,
                      width: blipSize,
                      height: blipSize,
                      borderRadius: blipSize / 2,
                    },
                    isSelected ? styles.radarBlipSelected : styles.radarBlipNormal
                  ]}
                >
                  <MapPin size={isSelected ? 14 : 10} color={isSelected ? '#0f172a' : '#10b981'} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Offline instructions */}
          <View style={styles.offlineAlertCard}>
            <WifiOff size={16} color="#f59e0b" />
            <View>
              <Text style={styles.offlineAlertTitle}>Cached Offline Database</Text>
              <Text style={styles.offlineAlertBody}>
                Using offline coordinates catalog. Tap blips to inspect timing sheets.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseDotLive: {
    backgroundColor: '#10b981',
  },
  pulseDotOffline: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  toggleBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  userMarkerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    borderColor: '#ffffff',
    borderWidth: 1.5,
  },
  masjidMarker: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: 100,
  },
  masjidMarkerNormal: {
    borderColor: '#10b981',
  },
  masjidMarkerSelected: {
    borderColor: '#f59e0b',
  },
  masjidMarkerEmoji: {
    fontSize: 10,
  },
  masjidMarkerText: {
    fontSize: 8,
    color: '#ffffff',
    flex: 1,
  },
  masjidMarkerTextSelected: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  radarContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  radarCircle: {
    position: 'relative',
    width: 240,
    height: 240,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarUserBadge: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    zIndex: 10,
  },
  radarUserText: {
    color: '#10b981',
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  radarBlip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  radarBlipNormal: {
    backgroundColor: '#022c22',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
  },
  radarBlipSelected: {
    backgroundColor: '#f59e0b',
  },
  offlineAlertCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    maxWidth: '90%',
  },
  offlineAlertTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  offlineAlertBody: {
    fontSize: 8.5,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 11,
  },
  rowReverse: {
    flexDirection: 'row-reverse' as const,
  }
});
