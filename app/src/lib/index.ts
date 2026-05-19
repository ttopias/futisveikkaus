import type { MatchStage } from '$lib/stages';

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

export { formatMatchTime } from '$lib/utils/format-match-time';
