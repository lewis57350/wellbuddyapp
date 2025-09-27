import React from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    localStorage.setItem("wb_logged_in", "1");
    navigate("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4">
      <h2 className="text-xl font-semibold">Login</h2>
      <input className="w-full border rounded-md px-3 py-2" placeholder="Email" required />
      <input className="w-full border rounded-md px-3 py-2" type="password" placeholder="Password" required />
      <button className="btn btn-primary w-full">Sign In</button>
    </form>
  );
}
