const assert = require('node:assert/strict');
const { test } = require('node:test');
const { scoreJob } = require('../services/jobRecommendations');

test('fallback job matching explains preference overlaps without asserting licensing', () => {
  const match = scoreJob({
    title: 'Locum veterinarian',
    clinic: 'Harbor Animal Care',
    location: 'Mumbai',
    type: 'Temporary',
    opportunityType: 'Locum',
    requirements: ['Valid veterinary license'],
    tags: ['Emergency'],
  }, {
    qualifications: 'Valid veterinary license',
    preferredEmploymentTypes: ['Locum'],
    availability: 'Available from November',
  });

  assert.ok(match.score > 0);
  assert.ok(match.reasons.some((reason) => reason.includes('employment preferences')));
  assert.ok(match.reasons.some((reason) => reason.includes('not verify') || reason.includes('verify licensing')));
  assert.ok(match.reasons.some((reason) => reason.includes('Availability listed')));

  const noEvidence = scoreJob({ requirements: ['Surgical board certification'] }, { qualifications: '' });
  assert.equal(noEvidence.score, null);
  assert.deepEqual(noEvidence.reasons, ['No matching profile signals found yet']);
});
