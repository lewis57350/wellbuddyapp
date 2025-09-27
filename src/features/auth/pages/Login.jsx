import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth";

export default function Login() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await signInEmail(email, pass);
      } else {
        await signUpEmail(email, pass);
      }
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e.message || "Authentication error");
    }
  }

  async function google() {
    try {
      await signInGoogle();
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    }
  }

  return (
    <div className="mx-auto max-w-sm card">
      <h2 className="text-xl font-semibold mb-2">
        {mode === "login" ? "Sign in" : "Create account"}
      </h2>

      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary w-full">
          {mode === "login" ? "Sign in" : "Sign up"}
        </button>

        <button type="button" className="btn btn-outline w-full" onClick={google}>
          Continue with Google
        </button>
      </form>

      <div className="text-sm mt-3">
        {mode === "login" ? (
          <>New here?{" "}
            <button className="underline" onClick={() => setMode("signup")}>Create an account</button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button className="underline" onClick={() => setMode("login")}>Sign in</button>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-3">
        Or continue without an account: <Link className="underline" to="/dashboard">skip</Link>
      </div>
    </div>
  );
}