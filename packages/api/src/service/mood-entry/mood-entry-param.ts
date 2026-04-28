import type { BaseParamModel } from '@vegabase/service';

export interface MoodEntryParam extends BaseParamModel {
  date?: string;     // exact day filter YYYY-MM-DD
  dateFrom?: string; // range: from this date onwards (for stats)
  keyword?: string;  // rawText search
}
