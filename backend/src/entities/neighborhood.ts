export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// A neighborhood with the smallest area that covers all its restaurants.
export interface Neighborhood {
  name: string;
  bounds: MapBounds;
}
