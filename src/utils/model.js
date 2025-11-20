// src/utils/model.js
import * as tf from "@tensorflow/tfjs";

export function createModel(inputShape = 3) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"]
  });
  return model;
}
