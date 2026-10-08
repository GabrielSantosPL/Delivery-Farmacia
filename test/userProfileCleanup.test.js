import test from 'node:test';
import assert from 'node:assert/strict';

import { removeAccidentalUserProfiles } from '../src/utils/userProfileCleanup.js';

test('removes the unintended Dr. Rogério Meireles profile', () => {
  const users = [
    { id: 'user-farm', name: 'Dra. Camila Sampaio', role: 'farmaceutico' },
    { id: 'user-doctor', name: 'Dr. Rogério Meireles', role: 'cliente' },
    { id: 'user-client', name: 'Maria Aparecida Santos', role: 'cliente' },
  ];

  assert.deepEqual(removeAccidentalUserProfiles(users), [users[0], users[2]]);
});

test('preserves the three supported profile types', () => {
  const users = [
    { id: 'user-farm', name: 'Dra. Camila Sampaio', role: 'farmaceutico' },
    { id: 'user-driver', name: 'Carlos Eduardo (Carlinhos)', role: 'entregador' },
    { id: 'user-client', name: 'Maria Aparecida Santos', role: 'cliente' },
  ];

  assert.deepEqual(removeAccidentalUserProfiles(users), users);
});
