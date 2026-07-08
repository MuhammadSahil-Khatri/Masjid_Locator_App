/**
 * Optimized types for Search Screen
 * Only includes fields needed for search and map display
 */

export interface SearchMosque {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  capacity: number | null;
  is_active: boolean;
}

// Extended mosque data fetched only when needed
export interface MosqueDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  capacity: number | null;
  is_active: boolean;
  description: string | null;
  tags: string[];
  admin_name: string | null;
  admin_email: string | null;
}
