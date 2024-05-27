import type { User } from '@supabase/supabase-js';
import { TeamInTable, TimeInTable } from '$lib/index';

export const userColor = (role: string) => {
  if (role === 'admin') return 'stroke-warning';
  return '';
};

export const isAdmin = (role: string) => {
  if (['admin'].includes(role)) return true;
  else return false;
};

export const myUser = (user: User | null) => {
  return user ?? null;
};

export const myRole = (user: User | null) => {
  return user?.user_metadata.role ?? 'user';
};

export const roleAdmin = (user: User | null | undefined) => {
  if (['admin'].includes(user?.user_metadata.role)) return true;
  else return false;
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

export const teamTableCols = [
  {
    key: 'country',
    title: 'MAA',
    renderComponent: TeamInTable,
    sortable: false,
  },
  {
    key: 'points',
    title: 'P',
    value: (v: any) => v.win * 3 + v.draw,
    sortable: true,
  },
  {
    key: 'win',
    title: 'V',
    value: (v: any) => v.win,
    sortable: true,
  },
  {
    key: 'draw',
    title: 'T',
    value: (v: any) => v.draw,
    sortable: true,
  },
  {
    key: 'loss',
    title: 'H',
    value: (v: any) => v.loss,
    sortable: true,
  },
  {
    key: 'gf',
    title: 'TM',
    value: (v: any) => v.gf,
    sortable: true,
  },
  {
    key: 'gaa',
    title: 'PM',
    value: (v: any) => v.gaa,
    sortable: true,
  },
];

export const matchTableCols = [
  {
    key: 'group',
    title: 'LOHKO',
    value: (v: any) => v.group,
    sortable: false,
  },
  {
    key: 'date',
    title: 'PVM',
    renderComponent: {
      component: TimeInTable,
      props: { field: 'date', format: 'DD-MM-YYYY' },
    },
    sortable: false,
  },
  {
    key: 'time',
    title: 'KLO',
    value: (v: any) => v.time,
    sortable: false,
  },
  {
    key: 'home',
    title: 'KOTI',
    renderComponent: {
      component: TeamInTable,
      props: { field: 'home', flagLeft: true },
    },
    sortable: false,
  },
  {
    key: 'home_goals',
    title: '',
    value: (v: any) => (v.finished ? v.home_goals : ''),
    sortable: false,
  },
  {
    key: 'away_goals',
    title: '',
    value: (v: any) => (v.finished ? v.away_goals : ''),
    sortable: false,
  },
  {
    key: 'away',
    title: 'VIERAS',
    renderComponent: {
      component: TeamInTable,
      props: { field: 'away', flagLeft: false },
    },
    sortable: false,
  },
];
