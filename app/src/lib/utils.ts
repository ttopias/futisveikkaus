import type { User } from '@supabase/supabase-js';

export { cn } from './utils/cn';
export { formatMatchTime } from './utils/format-match-time';
import type { Match, Prediction } from '$lib/index';

export const getUserRole = (user: User | null | undefined): string => {
  const role = user?.app_metadata?.role;
  return typeof role === 'string' ? role : 'user';
};

export const isAdmin = (role: string) => role === 'admin';

export const myUser = (user: User | null) => {
  return user ?? null;
};

export const myRole = (user: User | null) => {
  return getUserRole(user);
};

export const roleAdmin = (user: User | null | undefined) => {
  return isAdmin(getUserRole(user));
};

const kickoffMs = (starts_at?: string | null) => {
  if (!starts_at) return 0;
  const ms = new Date(starts_at).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

export const sortByDateTime = (list: Match[]): Match[] => {
  return list.sort((a, b) => kickoffMs(a.starts_at) - kickoffMs(b.starts_at));
};

export const sortPredsByDateTime = (list: Prediction[]): Prediction[] => {
  return list.sort((a, b) => kickoffMs(a.match.starts_at) - kickoffMs(b.match.starts_at));
};

export const rules = [
  { rule: 'Ottelun lopputulos täysin oikein', points: '+6' },
  {
    rule: 'Veikkaat tasapeliä ja ottelu päättyy tasan. Yksi lisäpiste, vaikka tulos ei ole oikea',
    points: '+4',
  },
  { rule: 'Ottelun voittaja oikein', points: '+3' },
  { rule: 'Joukkueen maalimäärä oikein', points: '+1' },
  { rule: 'Veikkaat tasapeliä, mutta ottelu ei pääty tasapeliin', points: '-2' },
  { rule: 'Veikkaat jommankumman voittoa, mutta ottelu päättyy tasapeliin', points: '-2' },
  { rule: 'Väärä voittaja', points: '-4' },
];
