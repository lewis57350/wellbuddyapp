import React from "react";

export default function WellCard({ well, children }) {
  return (
    <div className="card">
      <div className="font-medium">{well.name}</div>
      <div className="text-sm text-gray-600">{well.location}  {well.pumpType}</div>
      {children}
    </div>
  );
}
