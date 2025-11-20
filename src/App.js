import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);

  // Define min and max values for normalization (adjust to your dataset range)
  const INVENTORY_RANGE = [0, 100];
  const SALES_RANGE = [0, 100];
  const LEAD_TIME_RANGE = [1, 30];

  // Normalization helper function
  const normalize = (val, min, max) => (val - min) / (max - min);

  // Denormalization helper (optional, not necessarily needed here)
  // const denormalize = (val, min, max) => val * (max - min) + min;

  // -----------------------------------------
  // 1. FETCH PRODUCTS FROM MOCK API
  // -----------------------------------------
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:4000/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  // Load products on first render
  useEffect(() => {
    fetchProducts();
  }, []);

  // -----------------------------------------
  // 2. TRAIN ML MODEL
  // -----------------------------------------
  const trainModel = async () => {
    setLoading(true);

    // Expanded and normalized training data
    // Format: [inventory, avgSales, leadTime] normalized between 0 and 1
    const trainingDataRaw = [
      { inventory: 20, avgSales: 50, leadTime: 3, reorder: 0 },
      { inventory: 5, avgSales: 30, leadTime: 5, reorder: 1 },
      { inventory: 15, avgSales: 40, leadTime: 4, reorder: 0 },
      { inventory: 8, avgSales: 60, leadTime: 2, reorder: 1 },
      { inventory: 25, avgSales: 70, leadTime: 1, reorder: 0 },
      { inventory: 3, avgSales: 20, leadTime: 10, reorder: 1 },
      { inventory: 40, avgSales: 50, leadTime: 5, reorder: 0 },
      { inventory: 1, avgSales: 10, leadTime: 15, reorder: 1 },
      { inventory: 12, avgSales: 25, leadTime: 7, reorder: 1 }
    ];

    const trainingInputs = trainingDataRaw.map(item =>
      [
        normalize(item.inventory, ...INVENTORY_RANGE),
        normalize(item.avgSales, ...SALES_RANGE),
        normalize(item.leadTime, ...LEAD_TIME_RANGE)
      ]
    );

    const trainingOutputs = trainingDataRaw.map(item => [item.reorder]);

    const trainingTensor = tf.tensor2d(trainingInputs);
    const outputTensor = tf.tensor2d(trainingOutputs);

    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    await model.fit(trainingTensor, outputTensor, { epochs: 200, shuffle: true });

    setModel(model);
    setLoading(false);

    trainingTensor.dispose();
    outputTensor.dispose();
  };

  // -----------------------------------------
  // 3. PREDICT FOR EACH PRODUCT
  // -----------------------------------------
  const predictAll = async () => {
    if (!model) return alert("Please train the model first!");

    const updated = [];

    for (let p of products) {
      // Normalize product features
      const input = tf.tensor2d([[
        normalize(p.inventory, ...INVENTORY_RANGE),
        normalize(p.avgSales, ...SALES_RANGE),
        normalize(p.leadTime, ...LEAD_TIME_RANGE),
      ]]);

      const prediction = model.predict(input);
      const result = (await prediction.data())[0];

      updated.push({
        ...p,
        suggestion: result > 0.5 ? "Reorder" : "No Reorder",
      });

      input.dispose();
      prediction.dispose();
    }

    setProducts(updated);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Forecast — Inventory Reorder Predictor</h1>

      <button onClick={fetchProducts}>Refresh Products</button>
      <button onClick={trainModel} disabled={loading}>
        {loading ? "Training..." : "Train Model"}
      </button>
      <button onClick={predictAll}>Produce Suggestions</button>

      <br /><br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Inventory</th>
            <th>Avg Sales</th>
            <th>Lead Time</th>
            <th>Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.inventory}</td>
              <td>{p.avgSales}</td>
              <td>{p.leadTime}</td>
              <td style={{ fontWeight: "bold" }}>
                {p.suggestion || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
