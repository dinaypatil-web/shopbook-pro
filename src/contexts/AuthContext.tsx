import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { deriveKey, generateSalt } from '../lib/crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  businessId: string;
  salt: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  encryptionKey: string | null;
  loading: boolean;
  isAdmin: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, appVerifier: RecaptchaVerifier) => Promise<string>;
  confirmPhoneOtp: (verificationId: string, otp: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  businessName: string;
  phone?: string;
  gstNumber?: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore
  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
    return null;
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await loadProfile(firebaseUser.uid);
        setProfile(p);
        // Note: encryption key is set during login, not here (we don't have the password)
      } else {
        setProfile(null);
        setEncryptionKey(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  // ── Login ────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await loadProfile(cred.user.uid);
    if (p) {
      setProfile(p);
      // Derive encryption key from password + stored salt
      const key = deriveKey(password, p.salt);
      setEncryptionKey(key);
    }
  };

  // ── Phone OTP ────────────────────────────────────────────────────────────

  const loginWithPhone = async (phone: string, appVerifier: RecaptchaVerifier): Promise<string> => {
    const result = await signInWithPhoneNumber(auth, phone, appVerifier);
    return result.verificationId;
  };

  const confirmPhoneOtp = async (verificationId: string, otp: string, _password: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const cred = await signInWithCredential(auth, credential);
    const p = await loadProfile(cred.user.uid);
    if (p) {
      setProfile(p);
      const key = deriveKey(_password, p.salt);
      setEncryptionKey(key);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────

  const register = async (data: RegisterData) => {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await updateProfile(cred.user, { displayName: data.displayName });

    const salt = generateSalt();
    const businessId = `biz_${cred.user.uid}`;
    const key = deriveKey(data.password, salt);

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: cred.user.uid,
      email: data.email,
      displayName: data.displayName,
      phone: data.phone,
      role: 'admin',
      businessId,
      salt,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), userProfile);

    // Create business document
    await setDoc(doc(db, 'businesses', businessId), {
      name: data.businessName,
      gstNumber: data.gstNumber || '',
      ownerId: cred.user.uid,
      members: [cred.user.uid],
      createdAt: new Date().toISOString(),
    });

    setProfile(userProfile);
    setEncryptionKey(key);
  };

  // ── Logout ───────────────────────────────────────────────────────────────

  const logout = async () => {
    await signOut(auth);
    setEncryptionKey(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        encryptionKey,
        loading,
        isAdmin,
        login,
        loginWithPhone,
        confirmPhoneOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
