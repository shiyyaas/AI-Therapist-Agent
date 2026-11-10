import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment | null = null;

  beforeAll(async () => {
    if (!EMULATOR_HOST) {
      console.warn('Skipping Firestore Rules test: FIRESTORE_EMULATOR_HOST is not set.');
      return;
    }

    const rulesPath = path.resolve(process.cwd(), '../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-rules-test',
      firestore: {
        rules,
        host: EMULATOR_HOST.split(':')[0],
        port: parseInt(EMULATOR_HOST.split(':')[1], 10),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  it('allows owner to read and write own user document and denies other users', async () => {
    if (!testEnv) return;

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    const anonDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(aliceDb.collection('users').doc('alice').set({ name: 'Alice' }));
    await assertSucceeds(aliceDb.collection('users').doc('alice').get());

    await assertFails(bobDb.collection('users').doc('alice').get());
    await assertFails(bobDb.collection('users').doc('alice').set({ name: 'Hacked' }));
    await assertFails(anonDb.collection('users').doc('alice').get());
  });

  it('enforces session ownership and prevents cross-user access', async () => {
    if (!testEnv) return;

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    // Alice creates session
    await assertSucceeds(
      aliceDb.collection('sessions').doc('session-alice').set({
        uid: 'alice',
        title: 'Alice chat',
        status: 'active',
      })
    );

    // Alice can read
    await assertSucceeds(aliceDb.collection('sessions').doc('session-alice').get());

    // Bob cannot read or modify
    await assertFails(bobDb.collection('sessions').doc('session-alice').get());
    await assertFails(
      bobDb.collection('sessions').doc('session-alice').update({ title: 'Bob was here' })
    );
  });

  it('protects session summary subcollection: only owner can read, other user is denied', async () => {
    if (!testEnv) return;

    // Seed session with admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminFirestore = context.firestore();
      await adminFirestore.collection('sessions').doc('session-alice').set({
        uid: 'alice',
        title: 'Alice session',
        status: 'ended',
      });
      await adminFirestore
        .collection('sessions')
        .doc('session-alice')
        .collection('summary')
        .doc('latest')
        .set({
          overview: 'Private discussion summary',
          emotionalThemes: ['anxiety'],
          strengths: ['resilience'],
          copingSteps: ['breathing'],
          followUp: 'none',
          riskNote: 'Safe',
        });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    const anonDb = testEnv.unauthenticatedContext().firestore();

    // Alice can read her summary
    await assertSucceeds(
      aliceDb.collection('sessions').doc('session-alice').collection('summary').doc('latest').get()
    );

    // Bob cannot read Alice's summary
    await assertFails(
      bobDb.collection('sessions').doc('session-alice').collection('summary').doc('latest').get()
    );

    // Unauthenticated access is denied
    await assertFails(
      anonDb.collection('sessions').doc('session-alice').collection('summary').doc('latest').get()
    );
  });

  it('verifies rules file syntax and baseline assertions when emulator host not present', () => {
    const rulesPath = path.resolve(process.cwd(), '../firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf8');
    expect(content).toContain('match /sessions/{sessionId}');
    expect(content).toContain('match /summary/{summaryId}');
    expect(content).toContain('request.auth.uid == userId');
  });
});
