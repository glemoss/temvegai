export type SuggestionStatus =
  'pending' | 'processing' | 'ready' | 'failed' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  text: string;
  status: SuggestionStatus;
  error: string | null;
  restaurantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
