import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = {
    user,
    loading,
    signInEmail: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    signUpEmail: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
    signInGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth),
  };


return (
  <AuthCtx.Provider value={value}>
    {children}
  </AuthCtx.Provider>
);
}
export function useAuth() {
  return useContext(AuthCtx);
}

// Guard
import { Navigate } from "react-router-dom";
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;            // or a spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
