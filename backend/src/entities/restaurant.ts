export type RestaurantType = 'fully_vegan' | 'vegan_options';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// Times are "HH:MM". A closing at or before the opening, as in
// 18:00–02:00, ends on the next day.
export interface TimeInterval {
  opens: string;
  closes: string;
}

// Every day of the week, in opening order; an empty list means closed.
export type WeeklyHours = Record<Weekday, TimeInterval[]>;

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  type: RestaurantType;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  openingHours: WeeklyHours | null;
  createdAt: Date;
  updatedAt: Date;
}
