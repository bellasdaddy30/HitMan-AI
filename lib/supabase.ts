import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type DbSong = {
  id: string;
  user_id: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  duration: number;
  lyrics: string;
  description: string | null;
  audio_path: string | null;
  seed: number | null;
  created_at: string;
};
