import React, { useEffect, useState } from "react";

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold">{time}</div>
      <div className="text-sm opacity-75">{date}</div>
    </div>
  );
}