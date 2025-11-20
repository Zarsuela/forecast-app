// src/components/ProductTable.jsx
import React from "react";

export default function ProductTable({ products = [] }) {
  return (
    <div style={{ maxHeight: 600, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Name</th>
            <th>Inventory</th>
            <th>Avg Sales / wk</th>
            <th>Days to Replenish</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td style={{ textAlign: "center" }}>{p.inventory}</td>
              <td style={{ textAlign: "center" }}>{p.avgSalesPerWeek}</td>
              <td style={{ textAlign: "center" }}>{p.daysToReplenish}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
