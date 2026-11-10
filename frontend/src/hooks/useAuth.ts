import { useState, useEffect, useCallback } from 'react';
import {
  User,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types/chat';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncUserDoc = useCallback(async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || null,
          isAnonymous: firebaseUser.isAnonymous,
          createdAt: serverTimestamp(),
        });
      }
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        isAnonymous: firebaseUser.isAnonymous,
      });
    } catch {
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        isAnonymous: firebaseUser.isAnonymous,
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserDoc(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserDoc]);

  const loginAnonymously = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await signInAnonymously(auth);
      await syncUserDoc(cred.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in anonymously.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [syncUserDoc]);

  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserDoc(cred.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [syncUserDoc]);

  const signUpWithEmail = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await syncUserDoc(cred.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create account.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [syncUserDoc]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    profile,
    loading,
    authError,
    setAuthError,
    loginAnonymously,
    loginWithEmail,
    signUpWithEmail,
    logout,
  };
}
