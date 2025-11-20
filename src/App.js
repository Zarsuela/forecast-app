// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import { createModel } from "./utils/model";
import { normalizeFeatureMatrix, normalizeWithParams } from "./utils/preprocess";
import ProductTable from "./components/ProductTable";
import Dashboard from "./components/Dashboard";

function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle");
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const modelRef = useRef(null);
  const minsRef = useRef(null);
  const maxsRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    // try to load saved model
    (async () => {
      try {
        const loaded = await tf.loadLayersModel("indexeddb://forecast-model");
        modelRef.current = loaded;
        setStatus("Loaded model from IndexedDB");
      } catch (e) {
        // no saved model
      }
    })();
  }, []);

  async function fetchProducts() {
    setStatus("fetching products");
    try {
      const res = await axios.get("http://localhost:4000/products?_limit=200"); // adjust
      setProducts(res.data);
      setStatus("products loaded: " + res.data.length);
    } catch (err) {
      console.error(err);
      setStatus("failed to fetch products — make sure mock API is running on port 4000");
    }
  }

  // Simple function to create labels when real labels are absent:
  // Label = 1 (Reorder) if inventory < avgSalesPerWeek * (daysToReplenish/7) * safetyFactor
  function generateLabelsFromRule(products) {
    return products.map(p => {
      const weeksLead = p.daysToReplenish / 7;
      const expectedUse = (p.avgSalesPerWeek || 0) * weeksLead;
      const safetyFactor = 1.2; // tweak
      return (p.inventory < expectedUse * safetyFactor) ? 1 : 0;
    });
  }

  async function trainModel() {
    setStatus("preparing training data");
    if (!products.length) {
      setStatus("no products to train on");
      return;
    }

    // Build feature matrix and labels:
    const X = products.map(p => [
      p.inventory,
      p.avgSalesPerWeek,
      p.daysToReplenish
    ]);

    const y = generateLabelsFromRule(products); // use real labels if you have them.

    // Normalize features:
    const { scaled, mins, maxs } = normalizeFeatureMatrix(X);
    minsRef.current = mins;
    maxsRef.current = maxs;

    const xs = tf.tensor2d(scaled);
    const ys = tf.tensor2d(y.map(v => [v]));

    // Split into train/validation
    const total = xs.shape[0];
    const trainSize = Math.floor(total * 0.8);
    const [xTrain, xVal] = tf.split(xs, [trainSize, total - trainSize]);
    const [yTrain, yVal] = tf.split(ys, [trainSize, total - trainSize]);

    setStatus("creating model");
    const model = createModel(3);
    modelRef.current = model;

    setStatus("training model");
    // show training progress using callback
    await model.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 32,
      validationData: [xVal, yVal],
      shuffle: true,
      callbacks: {
        onEpochBegin: async (epoch) => {
          setModelInfo(prev => ({ ...prev, epoch }));
        },
        onEpochEnd: async (epoch, logs) => {
          setModelInfo({
            epoch,
            loss: logs.loss?.toFixed(4),
            acc: logs.acc?.toFixed(3) || logs.acc,
            val_loss: logs.val_loss?.toFixed(4),
            val_acc: logs.val_acc?.toFixed(3)
          });
        }
      }
    });

    // Save model to IndexedDB
    try {
      await model.save("indexeddb://forecast-model");
      setStatus("Model trained and saved to IndexedDB");
    } catch (e) {
      console.warn("save failed", e);
      setStatus("Model trained (saving failed)");
    }

    // cleanup
    xTrain.dispose();
    xVal.dispose();
    xs.dispose();
    ys.dispose();
  }

  // Predict and produce suggestions
  async function produceSuggestions() {
    if (!modelRef.current) {
      setStatus("no model loaded — train first");
      return;
    }
    setStatus("producing suggestions");
    const feats = products.map(p => [p.inventory, p.avgSalesPerWeek, p.daysToReplenish]);
    // normalize using stored mins/maxs
    const scaled = normalizeWithParams(feats, minsRef.current, maxsRef.current);
    const xs = tf.tensor2d(scaled);
    const preds = modelRef.current.predict(xs);
    const data = await preds.data();
    const sug = products.map((p, i) => ({
      ...p,
      score: data[i],
      suggestion: data[i] > 0.5 ? "Reorder" : "No Reorder"
    }));
    setSuggestions(sug.sort((a,b) => b.score - a.score));
    xs.dispose();
    if (preds.dispose) preds.dispose();
    setStatus("suggestions ready");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Forecast — Inventory Reorder Predictor</h1>
      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={fetchProducts}>Refresh Products</button>
        <button onClick={trainModel}>Train Model (client)</button>
        <button onClick={produceSuggestions}>Produce Suggestions</button>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Products ({products.length})</h3>
          <ProductTable products={products} />
        </div>
        <div style={{ flex: 1 }}>
          <h3>Top reorder suggestions</h3>
          <Dashboard items={suggestions.slice(0, 50)} />
        </div>
      </div>
      {modelInfo && (
        <div style={{ marginTop: 12 }}>
          <strong>Training:</strong> epoch {modelInfo.epoch} |
          loss: {modelInfo.loss} val_loss: {modelInfo.val_loss} |
          acc: {modelInfo.acc} val_acc: {modelInfo.val_acc}
        </div>
      )}
    </div>
  );
}

export default App;
