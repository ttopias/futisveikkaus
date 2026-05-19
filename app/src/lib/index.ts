import type { MatchStage } from '$lib/stages';
import Content from '$lib/components/Content.svelte';
import Modal from '$lib/components/Modal.svelte';
import Portal from '$lib/components/Portal.svelte';
import RoleBadge from '$lib/components/RoleBadge.svelte';
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
  match_number?: number;
  stage?: MatchStage;
  starts_at: string;
  home?: Team | null;
  away?: Team | null;
  home_slot?: string | null;
  away_slot?: string | null;
  home_goals: number;
  away_goals: number;
  finished: boolean;
  index?: number;
  groupStage?: boolean;
  group?: string;
};

export type Profile = {
  id: string;
  first_name: string;
};

export type Prediction = {
  guess_id: number;
  user_id?: string;
  match: Match;
  home_goals: number;
  away_goals: number;
  points: number;
  points_calculated: boolean;
  groupStage?: boolean;
  group?: string;
  profile?: Profile;
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
  gaa: number;
};

export type User = {
  user_id?: string;
  id?: string;
  total_points?: number;
  first_name: string;
};

export { Content, Modal, Portal, RoleBadge, TeamInTable, TimeInTable, Trigger };
