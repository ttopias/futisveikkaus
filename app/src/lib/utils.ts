import type { User } from '@supabase/supabase-js';
import { TeamInTable, TimeInTable, type Match, type Prediction, type Team } from '$lib/index';

export const userColor = (role: string) => {
  if (role === 'admin') return 'stroke-warning';
  return '';
};

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

export const groupByUser = (predictions: Prediction[]) => {
  return predictions.reduce((acc: { [key: string]: Prediction[] }, prediction: Prediction) => {
    const userName = prediction.profile?.first_name ?? '';
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(prediction);
    return acc;
  }, {});
};

export const transformDataForChart = (groupedPredictions: Record<string, Prediction[]>) => {
  const usersData = Object.keys(groupedPredictions).map((userName) => {
    let cumulativePoints = 0;

    const data = groupedPredictions[userName].map((prediction) => {
      cumulativePoints += prediction.points;

      return {
        x: new Date(prediction.match.starts_at),
        y: cumulativePoints,
      };
    });

    return {
      label: userName,
      data,
      latestPoints: cumulativePoints,
    };
  });

  usersData.sort((a, b) => b.latestPoints - a.latestPoints);

  return usersData.map(({ label, data }) => ({
    label,
    data,
  }));
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
    value: (v: Team) => v.name,
    renderComponent: TeamInTable,
    sortable: false,
  },
  {
    key: 'points',
    title: 'P',
    value: (v: Team) => v.win * 3 + v.draw,
    sortable: true,
  },
  {
    key: 'win',
    title: 'V',
    value: (v: Team) => v.win,
    sortable: true,
  },
  {
    key: 'draw',
    title: 'T',
    value: (v: Team) => v.draw,
    sortable: true,
  },
  {
    key: 'loss',
    title: 'H',
    value: (v: Team) => v.loss,
    sortable: true,
  },
  {
    key: 'gf',
    title: 'TM',
    value: (v: Team) => v.gf,
    sortable: true,
  },
  {
    key: 'gaa',
    title: 'PM',
    value: (v: Team) => v.gaa,
    sortable: true,
  },
];

export const matchTableCols = [
  {
    key: 'group',
    title: 'LOHKO',
    value: (v: Match) => v.group ?? '',
    sortable: true,
  },
  {
    key: 'starts_at',
    title: 'PVM',
    value: (v: Match) => kickoffMs(v.starts_at),
    renderComponent: {
      component: TimeInTable,
      props: { field: 'starts_at', format: 'DD-MM-YYYY' },
    },
    sortable: true,
  },
  {
    key: 'starts_at_time',
    title: 'KLO',
    value: (v: Match) => v.starts_at,
    renderComponent: {
      component: TimeInTable,
      props: { field: 'starts_at', format: 'HH:mm' },
    },
    sortable: false,
  },
  {
    key: 'home',
    title: 'KOTI',
    value: (v: Match) => v.home?.name ?? '',
    renderComponent: {
      component: TeamInTable,
      props: { field: 'home', flagLeft: true },
    },
    sortable: false,
  },
  {
    key: 'home_goals',
    title: '',
    value: (v: Match) => (v.finished ? v.home_goals : 0),
    sortable: false,
  },
  {
    key: 'away_goals',
    title: '',
    value: (v: Match) => (v.finished ? v.away_goals : 0),
    sortable: false,
  },
  {
    key: 'away',
    title: 'VIERAS',
    value: (v: Match) => v.away?.name ?? '',
    renderComponent: {
      component: TeamInTable,
      props: { field: 'away', flagLeft: false },
    },
    sortable: false,
  },
];
