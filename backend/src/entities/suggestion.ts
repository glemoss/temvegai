import type { RestaurantType, WeeklyHours } from './restaurant.js';

export type SuggestionStatus =
  'pending' | 'processing' | 'ready' | 'failed' | 'approved' | 'rejected';

// The restaurant form filled by the AI, without the coordinates, which the
// admin finds from the address. Only the name is sure to be there; whatever
// the AI did not find is null.
export interface RestaurantDraft {
  name: string;
  description: string | null;
  type: RestaurantType | null;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  openingHours: WeeklyHours | null;
}

export interface Suggestion {
  id: string;
  text: string;
  status: SuggestionStatus;
  draft: RestaurantDraft | null;
  error: string | null;
  restaurantId: string | null;
  processingStartedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
