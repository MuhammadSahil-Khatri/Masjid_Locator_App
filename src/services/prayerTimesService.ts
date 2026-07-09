/**
 * AlAdhan Prayer Times API Service
 * Docs: https://aladhan.com/prayer-times-api
 *
 * Method 2 = Islamic Society of North America (ISNA) — works globally.
 * All network errors are caught and re-thrown as typed Error objects.
 */

import { AlAdhanTimingsResponse, ParsedPrayerTimes } from '../types';

const BASE_URL = 'https://api.aladhan.com/v1';

/** Strip timezone suffix e.g. "04:20 (PKT)" → "04:20" */
const stripTz = (time: string): string => time.split(' ')[0];

/** Convert 24-hour time string "HH:MM" → "h:MM AM/PM" */
const to12Hour = (time24: string): string => {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

/** Reverse geocode coordinates to city name using Nominatim */
export const reverseGeocode = async (lat: number, lng: number, language: string = 'en'): Promise<string> => {
  try {
    const acceptLang = language === 'ur' ? 'ur,en-US;q=0.8' : 'en-US,en;q=0.8';
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${acceptLang}`,
      { headers: { 'Accept-Language': acceptLang, 'User-Agent': 'MasjidLocatorApp/1.0' } }
    );
    if (!res.ok) throw new Error('Geocode failed');
    const geo = await res.json();
    // Pick the most meaningful administrative label available
    const addr = geo.address || {};
    return (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      addr.state ||
      ''
    );
  } catch {
    return '';
  }
};

export interface PrayerTimesResult {
  timings: ParsedPrayerTimes;
  hijriDate: string;
  gregorianDate: string;
  city: string;
}

/**
 * Fetch prayer times for the given coordinates.
 * @param lat  Latitude
 * @param lng  Longitude
 * @param method  AlAdhan calculation method (default 2 = ISNA)
 */
export const fetchPrayerTimes = async (
  lat: number,
  lng: number,
  method = 2,
  language = 'en'
): Promise<PrayerTimesResult> => {
  const url = `${BASE_URL}/timings?latitude=${lat}&longitude=${lng}&method=${method}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AlAdhan API error: ${response.status} ${response.statusText}`);
  }

  const json: AlAdhanTimingsResponse = await response.json();

  if (json.code !== 200 || !json.data) {
    throw new Error(`AlAdhan returned unexpected response: ${json.status}`);
  }

  const { timings, date } = json.data;

  // Parse and convert to 12-hour AM/PM format
  const parsedTimings: ParsedPrayerTimes = {
    Fajr: to12Hour(stripTz(timings.Fajr)),
    Sunrise: to12Hour(stripTz(timings.Sunrise)),
    Dhuhr: to12Hour(stripTz(timings.Dhuhr)),
    Asr: to12Hour(stripTz(timings.Asr)),
    Maghrib: to12Hour(stripTz(timings.Maghrib)),
    Isha: to12Hour(stripTz(timings.Isha)),
  };

  // Hijri date: "5 Muharram 1447 AH"
  const hijriDate = `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year} AH`;

  // Gregorian: "Saturday, 27 June 2026"
  const gregorianDate = `${date.gregorian.weekday.en}, ${date.gregorian.day} ${date.gregorian.month.en} ${date.gregorian.year}`;

  // City: use reverse geocoding for accurate current location city name
  const city = await reverseGeocode(lat, lng, language);

  return { timings: parsedTimings, hijriDate, gregorianDate, city };
};

/**
 * Fetch Qibla bearing for a given location.
 * Returns bearing in degrees from North (0–360).
 */
export const fetchQiblaBearing = async (lat: number, lng: number): Promise<number> => {
  const url = `${BASE_URL}/qibla/${lat}/${lng}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Qibla API error: ${response.status}`);
  }
  const json = await response.json();
  return json?.data?.direction ?? 0;
};

