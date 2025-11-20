// src/utils/preprocess.js
export function normalizeFeatureMatrix(X) {
  // X is array of arrays: [[inventory, avgSales, leadTime], ...]
  const nFeatures = X[0].length;
  const mins = Array(nFeatures).fill(Number.POSITIVE_INFINITY);
  const maxs = Array(nFeatures).fill(Number.NEGATIVE_INFINITY);

  X.forEach(row => {
    row.forEach((val, j) => {
      if (val < mins[j]) mins[j] = val;
      if (val > maxs[j]) maxs[j] = val;
    });
  });

  const scaled = X.map(row => row.map((val, j) => {
    const denom = maxs[j] - mins[j] || 1;
    return (val - mins[j]) / denom;
  }));

  return { scaled, mins, maxs };
}

export function normalizeWithParams(X, mins, maxs) {
  return X.map(row => row.map((val, j) => {
    const denom = maxs[j] - mins[j] || 1;
    return (val - mins[j]) / denom;
  }));
}
