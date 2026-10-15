export type RestaurantType = 'fully_vegan' | 'vegan_options';

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
  openingHours: string | null;
  createdAt: Date;
  updatedAt: Date;
}
