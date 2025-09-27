import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth.jsx";

export default function Login() {
  const { login, signup, guest } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from || "/dashboard";

  async function doLogin(e) {
    e.preventDefault();
    setMsg("");
    try {
      await login(email.trim(), pass);
      navigate(next, { replace: true });
    } catch (err) {
      setMsg(err.message || "Login failed");
    }
  }

  async function doSignup(e) {
    e.preventDefault();
    setMsg("");
    try {
      await signup(email.trim(), pass, displayName.trim());
      navigate(next, { replace: true });
    } catch (err) {
      setMsg(err.message || "Sign up failed");
    }
  }

  async function doGuest() {
    setMsg("");
    try {
      await guest();
      navigate(next, { replace: true });
    } catch (err) {
      setMsg(err.message || "Guest sign-in failed");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-2xl font-semibold">Sign in</h2>

      <div className="flex gap-2">
        <button
          className={`btn btn-outline ${tab === "login" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setTab("login")}
        >
          Login
        </button>
        <button
          className={`btn btn-outline ${tab === "signup" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setTab("signup")}
        >
          Create Account
        </button>
        <button className="btn btn-outline" onClick={doGuest}>Guest</button>
      </div>

      {msg && <div className="text-sm text-red-600">{msg}</div>}

      {tab === "login" ? (
        <form onSubmit={doLogin} className="space-y-3">
          <input className="w-full border rounded-md px-3 py-2" placeholder="Email"
                 value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Password" type="password"
                 value={pass} onChange={(e) => setPass(e.target.value)} required />
          <button className="btn btn-primary w-full">Login</button>
        </form>
      ) : (
        <form onSubmit={doSignup} className="space-y-3">
          <input className="w-full border rounded-md px-3 py-2" placeholder="Display name (optional)"
                 value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Email"
                 value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Password" type="password"
                 value={pass} onChange={(e) => setPass(e.target.value)} required />
          <button className="btn btn-primary w-full">Create Account</button>
        </form>
      )}

      <div className="text-xs text-gray-500">
        Need read-only? Use the <Link to="/viewer" className="text-blue-600">Public Viewer</Link>.
      </div>
    </div>
  );
}