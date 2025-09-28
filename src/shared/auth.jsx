import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  signInAnonymously
} from "firebase/auth";

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  async function loginAnon() {
    await signInAnonymously(auth);
  }
  async function logout() {
    await fbSignOut(auth);
  }

  const value = useMemo(() => ({
    user,
    ready,
    login,       // keep this name to match components that expect { login }
    loginAnon,
    logout
  }), [user, ready]);

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}