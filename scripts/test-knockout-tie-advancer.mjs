#!/usr/bin/env node

import { computeKnockoutTieAdvancerPatches } from './lib/knockout-tie-advancer.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testWinnerAndLoserSlots() {
  const patches = computeKnockoutTieAdvancerPatches(74, 10, 20, [
    {
      match_id: 1,
      home_slot: 'winner:74',
      away_slot: 'loser:73',
      home_id: null,
      away_id: 5,
    },
    {
      match_id: 2,
      home_slot: '1A',
      away_slot: 'loser:74',
      home_id: 30,
      away_id: null,
    },
  ]);

  assert(patches.length === 2, 'updates both downstream matches');
  assert(patches[0].match_id === 1 && patches[0].home_id === 10, 'winner slot on home');
  assert(patches[1].match_id === 2 && patches[1].away_id === 20, 'loser slot on away');
}

function testIdempotentWhenUnchanged() {
  const patches = computeKnockoutTieAdvancerPatches(74, 10, 20, [
    {
      match_id: 1,
      home_slot: 'winner:74',
      away_slot: '2B',
      home_id: 10,
      away_id: 30,
    },
  ]);

  assert(patches.length === 0, 'skips when IDs already match');
}

const tests = [
  { name: 'winner and loser feeder slots', fn: testWinnerAndLoserSlots },
  { name: 'idempotent when unchanged', fn: testIdempotentWhenUnchanged },
];

for (const test of tests) {
  test.fn();
  console.log(`ok - ${test.name}`);
}

console.log(`\n${tests.length}/${tests.length} passed.`);
