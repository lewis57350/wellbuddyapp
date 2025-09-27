import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
} from "./firebase.js";

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
    onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    }), []);

  const value = {
    user,
    loading,
    login: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    signup: async (email, pass, displayName) => {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) await updateProfile(cred.user, { displayName });
      return cred.user;
    },
    guest: () => signInAnonymously(auth),
    logout: () => signOut(auth),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}