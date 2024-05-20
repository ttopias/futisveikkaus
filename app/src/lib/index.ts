import Content from '$lib/components/Content.svelte';
import DashboardPage from '$lib/components/DashboardPage.svelte';
import Modal from '$lib/components/Modal.svelte';
import Portal from '$lib/components/Portal.svelte';
import RoleBadge from '$lib/components/RoleBadge.svelte';
import TableActions from '$lib/components/TableActions.svelte';
import TeamInTable from '$lib/components/TeamInTable.svelte';
import TimeInTable from '$lib/components/TimeInTable.svelte';
import Trigger from '$lib/components/Trigger.svelte';

export type Guess = {
  user_id: User;
  guess_id: number;
  match: Match;
  home_goals: number;
  away_goals: number;
};

export type Match = {
  match_id: number;
  predictable_until: string;
  date: string;
  time: string;
  home: Team;
  away: Team;
  home_goals: number;
  away_goals: number;
  finished: boolean;
  index?: number;
};

export type Prediction = {
  guess_id: number;
  match: Match;
  home_goals: number;
  away_goals: number;
  points: number;
  points_calculated: number;
};

export type Team = {
  team_id: number;
  country_code: string;
  name: string;
  group: string;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
};

export type User = {
  user_id: string;
  total_points: number;
  first_name: string;
};

export {
  Content,
  DashboardPage,
  Modal,
  Portal,
  RoleBadge,
  TableActions,
  TeamInTable,
  TimeInTable,
  Trigger,
};
