/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  DimensionValue 
} from 'react-native';
import Svg, { Circle, Line, Rect, G, Path, Polyline } from 'react-native-svg';
import { Navigation, MapPin, Compass, WifiOff, RefreshCw } from 'lucide-react-native';
import { Masjid, Language } from '../types';

interface MapComponentProps {
  masjids: Masjid[];
  selectedMasjid: Masjid | null;
  onSelectMasjid: (masjid: Masjid) => void;
  userLocation: { lat: number; lng: number };
  language: Language;
  showRoutePreview: boolean;
  routeCoordinates?: { latitude: number; longitude: number }[];
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
  routeCoordinates,
}: MapComponentProps) {
  const [usingOfflineRadar, setUsingOfflineRadar] = useState(false);
  
  // Web Map Interactive States
  const [zoom, setZoom] = useState(1.5);
  const [centerCoords, setCenterCoords] = useState(userLocation);

  // Auto pan/center on selected masjid when it changes
  useEffect(() => {
    if (selectedMasjid) {
      setCenterCoords({ lat: selectedMasjid.lat, lng: selectedMasjid.lng });
    } else {
      setCenterCoords(userLocation);
    }
  }, [selectedMasjid, userLocation]);

  const handleToggleRadar = () => {
    setUsingOfflineRadar(!usingOfflineRadar);
  };

  const handleRecenterUser = () => {
    setCenterCoords(userLocation);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const isRtl = language === 'ur';

  // Radar Center calculations
  const RADAR_CENTER = 120; // 240 / 2

  // Web Map Dimensions & Scalers (viewBox is 600x400)
  const MAP_WIDTH = 600;
  const MAP_HEIGHT = 400;
  const VIEW_CX = MAP_WIDTH / 2;
  const VIEW_CY = MAP_HEIGHT / 2;

  // Scale: pixels per degree of lat/lng
  const baseScale = 3000;
  const currentScale = baseScale * zoom;

  // Convert lat/lng to SVG viewBox coordinates
  const getCoordinates = (lat: number, lng: number) => {
    const latDiff = lat - centerCoords.lat;
    const lngDiff = lng - centerCoords.lng;
    return {
      x: VIEW_CX + (lngDiff * currentScale),
      y: VIEW_CY - (latDiff * currentScale), // Subtract because North is up, but Y coordinates go down
    };
  };

  const userSvgCoords = getCoordinates(userLocation.lat, userLocation.lng);

  return (
    <View style={styles.container}>
      {/* Top Banner showing connection status */}
      <View style={[styles.topBanner, isRtl && styles.rowReverse]}>
        <View style={styles.statusIndicator}>
          <View style={[styles.pulseDot, usingOfflineRadar ? styles.pulseDotOffline : styles.pulseDotLive]} />
          <Text style={styles.statusText}>
            {usingOfflineRadar ? 'OFFLINE RADAR' : 'LIVE GPS WEB MAP'}
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
        <View style={styles.webMapContainer}>
          {/* Interactive SVG Web Map HUD */}
          <Svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} 
            style={styles.webMapSvg}
          >
            {/* Dark Grid Background */}
            <Rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#020617" />
            
            {/* Grid Lines */}
            {Array.from({ length: 13 }).map((_, i) => {
              const xPos = (MAP_WIDTH / 12) * i;
              return <Line key={`v-${i}`} x1={xPos} y1="0" x2={xPos} y2={MAP_HEIGHT} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2, 4" />;
            })}
            {Array.from({ length: 9 }).map((_, i) => {
              const yPos = (MAP_HEIGHT / 8) * i;
              return <Line key={`h-${i}`} x1="0" y1={yPos} x2={MAP_WIDTH} y2={yPos} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2, 4" />;
            })}

            {/* Concentric distance rings around User */}
            <Circle cx={userSvgCoords.x} cy={userSvgCoords.y} r={80 * zoom} stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" fill="none" />
            <Circle cx={userSvgCoords.x} cy={userSvgCoords.y} r={160 * zoom} stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" fill="none" />
            <Circle cx={userSvgCoords.x} cy={userSvgCoords.y} r={240 * zoom} stroke="rgba(16, 185, 129, 0.03)" strokeWidth="1" fill="none" />

            {/* Route Polyline Preview */}
            {routeCoordinates && routeCoordinates.length > 0 ? (
              (() => {
                const points = routeCoordinates
                  .map(coord => {
                    const { x, y } = getCoordinates(coord.latitude, coord.longitude);
                    return `${x},${y}`;
                  })
                  .join(' ');
                
                return (
                  <Polyline
                    points={points}
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    fill="none"
                  />
                );
              })()
            ) : (
              showRoutePreview && selectedMasjid && (() => {
                const selectedCoords = getCoordinates(selectedMasjid.lat, selectedMasjid.lng);
                const midX = (userSvgCoords.x + selectedCoords.x) / 2 + 15;
                const midY = (userSvgCoords.y + selectedCoords.y) / 2 - 15;
                
                return (
                  <Path
                    d={`M ${userSvgCoords.x} ${userSvgCoords.y} Q ${midX} ${midY} ${selectedCoords.x} ${selectedCoords.y}`}
                    stroke="#d97706"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="5, 5"
                  />
                );
              })()
            )}

            {/* User Location Node */}
            <G>
              <Circle 
                cx={userSvgCoords.x} 
                cy={userSvgCoords.y} 
                r="12" 
                fill="rgba(16, 185, 129, 0.25)" 
              />
              <Circle 
                cx={userSvgCoords.x} 
                cy={userSvgCoords.y} 
                r="5" 
                fill="#10b981" 
                stroke="#ffffff" 
                strokeWidth="1.5" 
              />
            </G>
          </Svg>

          {/* Interactive Absolute Overlays for Masjid Markers */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {masjids.map((masjid) => {
              const isSelected = selectedMasjid?.id === masjid.id;
              const coords = getCoordinates(masjid.lat, masjid.lng);

              // Don't render if completely outside the coordinate viewport bounds
              if (coords.x < -50 || coords.x > MAP_WIDTH + 50 || coords.y < -50 || coords.y > MAP_HEIGHT + 50) {
                return null;
              }

              // Position relative to percent space of 600x400 viewBox
              const leftPercent = `${(coords.x / MAP_WIDTH) * 100}%` as DimensionValue;
              const topPercent = `${(coords.y / MAP_HEIGHT) * 100}%` as DimensionValue;

              return (
                <TouchableOpacity
                  key={masjid.id}
                  style={[
                    styles.webMarker,
                    { left: leftPercent, top: topPercent },
                    isSelected ? styles.masjidMarkerSelected : styles.masjidMarkerNormal
                  ]}
                  onPress={() => onSelectMasjid(masjid)}
                >
                  <Text style={styles.masjidMarkerEmoji}>🕌</Text>
                  <Text style={[styles.masjidMarkerText, isSelected ? styles.masjidMarkerTextSelected : null]} numberOfLines={1}>
                    {language === 'ur' ? masjid.nameUr : masjid.nameEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Web Map Floating Control Dashboard */}
          <View style={styles.webControls}>
            <TouchableOpacity style={styles.webCtrlBtn} onPress={handleZoomIn}>
              <Text style={styles.webCtrlBtnText}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webCtrlBtn} onPress={handleZoomOut}>
              <Text style={styles.webCtrlBtnText}>➖</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webCtrlBtn} onPress={handleRecenterUser}>
              <Text style={styles.webCtrlBtnText}>🎯</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  webMapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  webMapSvg: {
    flex: 1,
  },
  webMarker: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -12 }], // Center the marker over its coordinate
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  webControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  webCtrlBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  webCtrlBtnText: {
    fontSize: 14,
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
