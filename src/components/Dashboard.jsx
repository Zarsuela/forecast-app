// src/components/Dashboard.jsx
import React from "react";

export default function Dashboard({ items = [] }) {
  if (!items.length) return <p>No suggestions yet. Train model and press Produce Suggestions.</p>;
  return (
    <div style={{ maxHeight: 600, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Inventory</th>
            <th>Avg/Wk</th>
            <th>Days to Repl.</th>
            <th>Score</th>
            <th>Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td style={{ textAlign: "center" }}>{p.inventory}</td>
              <td style={{ textAlign: "center" }}>{p.avgSalesPerWeek}</td>
              <td style={{ textAlign: "center" }}>{p.daysToReplenish}</td>
              <td style={{ textAlign: "center" }}>{p.score?.toFixed(3)}</td>
              <td>{p.suggestion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
