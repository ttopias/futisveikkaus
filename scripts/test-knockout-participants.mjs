#!/usr/bin/env node

/**
 * Unit tests for knockout participant resolution and group-only result sync.
 *
 * Usage: node scripts/test-knockout-participants.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFixtureCsv } from './lib/fixtures.mjs';
import {
  buildTeamsByFinnishName,
  computeKnockoutParticipantUpdates,
  resolveParticipant,
} from './lib/knockout-participants.mjs';
import { computeMatchUpdates, resultsFromFixtures } from './lib/update-match-results-core.mjs';
import { FINNISH_NAME_OVERRIDES, canonicalize } from './lib/team-names.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testResolveParticipant() {
  const enToFi = { Germany: 'Saksa', Spain: 'Espanja', ...FINNISH_NAME_OVERRIDES };
  const teamsByFinnishName = buildTeamsByFinnishName([
    { team_id: 10, name: 'Saksa' },
    { team_id: 20, name: 'Espanja' },
  ]);
  const resolveName = canonicalize(enToFi);

  const germany = resolveParticipant('Germany', resolveName, teamsByFinnishName);
  assert(germany.type === 'team' && germany.teamId === 10, 'English name maps to team_id');

  const slot = resolveParticipant('2A', resolveName, teamsByFinnishName);
  assert(slot.type === 'slot' && slot.slot === '2A', 'slot code stays unresolved');

  const runnerUp = resolveParticipant('Runner-up Group B', resolveName, teamsByFinnishName);
  assert(runnerUp.type === 'slot' && runnerUp.slot === '2B', 'runner-up group maps to slot');

  const tba = resolveParticipant('To be announced', resolveName, teamsByFinnishName);
  assert(tba.type === 'unknown', 'TBA is unknown, not a team');
}

function testComputeKnockoutParticipantUpdates() {
  const samplePath = path.join(__dirname, 'fixtures', 'sample-knockout-sync.csv');
  const text = fs.readFileSync(samplePath, 'utf8');
  const fixtureRows = parseFixtureCsv(text, 'UTC');

  const enToFi = { Germany: 'Saksa', Spain: 'Espanja', ...FINNISH_NAME_OVERRIDES };
  const teamsByFinnishName = buildTeamsByFinnishName([
    { team_id: 10, name: 'Saksa' },
    { team_id: 20, name: 'Espanja' },
    { team_id: 30, name: 'Brasilia' },
  ]);

  const knockoutMatches = [
    {
      match_id: 'm73',
      match_number: 73,
      stage: 'r32',
      home_id: null,
      away_id: 30,
    },
    {
      match_id: 'm74',
      match_number: 74,
      stage: 'r32',
      home_id: 5,
      away_id: 6,
    },
    {
      match_id: 'm89',
      match_number: 89,
      stage: 'r16',
      home_id: null,
      away_id: null,
    },
  ];

  const { updates } = computeKnockoutParticipantUpdates(
    knockoutMatches,
    fixtureRows,
    enToFi,
    teamsByFinnishName,
  );

  const m73 = updates.find((u) => u.match_number === 73);
  assert(m73?.patch.home_id === 10, 'R32 Germany sets home_id only');
  assert(m73?.patch.away_id === undefined, 'R32 runner-up slot does not clear away_id');

  const m74 = updates.find((u) => u.match_number === 74);
  assert(!m74, '2A vs 2B produces no participant update');

  const m89 = updates.find((u) => u.match_number === 89);
  assert(m89?.patch.away_id === 20, 'R16 Spain sets away_id');
  assert(m89?.patch.home_id === undefined, 'winner feeder slot does not clear home_id');
}

function testGroupOnlyResultSync() {
  const samplePath = path.join(__dirname, 'fixtures', 'sample-knockout-sync.csv');
  const text = fs.readFileSync(samplePath, 'utf8');
  const fixtureRows = parseFixtureCsv(text, 'UTC');
  const sourceResults = resultsFromFixtures(fixtureRows);

  const matches = [
    {
      match_id: 'g1',
      match_number: 1,
      stage: 'group',
      home_goals: null,
      away_goals: null,
      finished: false,
    },
    {
      match_id: 'k73',
      match_number: 73,
      stage: 'r32',
      home_goals: null,
      away_goals: null,
      finished: false,
    },
  ];

  const { updates, skippedKnockout } = computeMatchUpdates(matches, sourceResults);
  assert(skippedKnockout === 1, 'knockout row skipped');
  assert(updates.length === 1 && updates[0].match_number === 1, 'only group match updated');
}

const tests = [
  { name: 'resolveParticipant', fn: testResolveParticipant },
  { name: 'computeKnockoutParticipantUpdates', fn: testComputeKnockoutParticipantUpdates },
  { name: 'group-only result sync', fn: testGroupOnlyResultSync },
];

let passed = 0;
for (const test of tests) {
  test.fn();
  passed += 1;
  console.log(`ok - ${test.name}`);
}

console.log(`\n${passed}/${tests.length} tests passed.`);
