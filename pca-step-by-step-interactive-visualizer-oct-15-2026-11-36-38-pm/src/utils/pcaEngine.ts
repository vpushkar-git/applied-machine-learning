/**
 * Pure mathematical engine for Principal Component Analysis (PCA)
 * Includes missing value handling, zero-variance filtering, mean centering,
 * sample covariance, eigenvalue decomposition (Jacobi algorithm for symmetric matrices),
 * projection, reconstruction, and animation frame interpolation.
 */

export interface PreprocessingOptions {
  imputationStrategy: 'median' | 'mean' | 'drop_rows';
  standardize: boolean; // true = Mode A (Z-score, ddof=1), false = Mode B (Covariance-based, mean-centered only)
  selectedFeatures: string[];
}

export interface MissingValueSummary {
  totalRows: number;
  validRows: number;
  droppedRows: number;
  missingPerFeature: Record<string, number>;
  imputedValues: Record<string, number>;
}

export interface ZeroVarianceFeature {
  feature: string;
  variance: number;
  reason: string;
}

export interface PreprocessingResult {
  cleanedRawData: number[][]; // Raw values after imputation or row drop
  featureNames: string[];
  means: number[];
  stdDevs: number[]; // sample standard deviation (ddof=1)
  centeredData: number[][];
  processedData: number[][]; // Centered, or Centered / StdDev
  missingSummary: MissingValueSummary;
  excludedZeroVariance: ZeroVarianceFeature[];
  error?: string;
}

export interface PCAResult {
  covarianceMatrix: number[][];
  eigenvalues: number[];
  eigenvectors: number[][]; // Column-wise eigenvectors, sorted descending by eigenvalue: eigenvectors[row][col]
  explainedVarianceRatios: number[];
  cumulativeVarianceRatios: number[];
  projectedData: number[][]; // n x k transformed coordinates: Y = X_processed * W
  reconstructedProcessed: number[][]; // Y * W^T
  reconstructedOriginal: number[][]; // In original feature space
  reconstructionMSE: number; // Mean squared error in original feature space
}

/**
 * Computes sample mean of an array of numbers
 */
export function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Computes median of an array of numbers
 */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Computes sample standard deviation with Bessel's correction (ddof=1)
 */
export function computeSampleStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSq = values.reduce((acc, val) => acc + (val - mean) ** 2, 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

/**
 * Preprocesses a raw tabular dataset according to requirements
 */
export function preprocessDataset(
  rawTable: Record<string, any>[],
  options: PreprocessingOptions
): PreprocessingResult {
  const { imputationStrategy, standardize, selectedFeatures } = options;

  const totalRows = rawTable.length;
  if (totalRows === 0) {
    return {
      cleanedRawData: [],
      featureNames: [],
      means: [],
      stdDevs: [],
      centeredData: [],
      processedData: [],
      missingSummary: { totalRows: 0, validRows: 0, droppedRows: 0, missingPerFeature: {}, imputedValues: {} },
      excludedZeroVariance: [],
      error: 'Dataset is empty.'
    };
  }

  // 1. Identify numerical values and missing counts for selected features
  const missingPerFeature: Record<string, number> = {};
  const imputedValues: Record<string, number> = {};

  for (const feat of selectedFeatures) {
    missingPerFeature[feat] = 0;
    const validVals: number[] = [];
    for (const row of rawTable) {
      const val = row[feat];
      if (val === null || val === undefined || val === '' || isNaN(Number(val)) || !isFinite(Number(val))) {
        missingPerFeature[feat]++;
      } else {
        validVals.push(Number(val));
      }
    }

    if (validVals.length === 0) {
      return {
        cleanedRawData: [],
        featureNames: selectedFeatures,
        means: [],
        stdDevs: [],
        centeredData: [],
        processedData: [],
        missingSummary: { totalRows, validRows: 0, droppedRows: 0, missingPerFeature, imputedValues },
        excludedZeroVariance: [],
        error: `Feature "${feat}" has no valid numerical values.`
      };
    }

    if (imputationStrategy === 'mean') {
      imputedValues[feat] = computeMean(validVals);
    } else if (imputationStrategy === 'median') {
      imputedValues[feat] = computeMedian(validVals);
    }
  }

  // 2. Handle missing rows or imputation
  let cleanedRows: number[][] = [];
  let droppedRowsCount = 0;

  if (imputationStrategy === 'drop_rows') {
    for (const row of rawTable) {
      let hasMissing = false;
      const rowVals: number[] = [];
      for (const feat of selectedFeatures) {
        const val = row[feat];
        if (val === null || val === undefined || val === '' || isNaN(Number(val)) || !isFinite(Number(val))) {
          hasMissing = true;
          break;
        } else {
          rowVals.push(Number(val));
        }
      }
      if (!hasMissing) {
        cleanedRows.push(rowVals);
      } else {
        droppedRowsCount++;
      }
    }
  } else {
    // Impute
    for (const row of rawTable) {
      const rowVals: number[] = [];
      for (const feat of selectedFeatures) {
        const val = row[feat];
        if (val === null || val === undefined || val === '' || isNaN(Number(val)) || !isFinite(Number(val))) {
          rowVals.push(imputedValues[feat]);
        } else {
          rowVals.push(Number(val));
        }
      }
      cleanedRows.push(rowVals);
    }
  }

  if (cleanedRows.length < 2) {
    return {
      cleanedRawData: [],
      featureNames: selectedFeatures,
      means: [],
      stdDevs: [],
      centeredData: [],
      processedData: [],
      missingSummary: {
        totalRows,
        validRows: cleanedRows.length,
        droppedRows: droppedRowsCount,
        missingPerFeature,
        imputedValues
      },
      excludedZeroVariance: [],
      error: `At least two valid observations are required after data cleaning (found ${cleanedRows.length}).`
    };
  }

  // 3. Detect Zero-Variance or near-zero variance features (< 1e-12)
  const activeFeatureIndices: number[] = [];
  const activeFeatureNames: string[] = [];
  const excludedZeroVariance: ZeroVarianceFeature[] = [];

  for (let j = 0; j < selectedFeatures.length; j++) {
    const colVals = cleanedRows.map(r => r[j]);
    const colMean = computeMean(colVals);
    const colStd = computeSampleStdDev(colVals, colMean);
    const colVar = colStd ** 2;

    if (colVar < 1e-12 || isNaN(colVar)) {
      excludedZeroVariance.push({
        feature: selectedFeatures[j],
        variance: colVar,
        reason: 'Feature has zero or near-zero variance. Excluded to prevent mathematical singularity or division by zero.'
      });
    } else {
      activeFeatureIndices.push(j);
      activeFeatureNames.push(selectedFeatures[j]);
    }
  }

  if (activeFeatureNames.length < 2) {
    return {
      cleanedRawData: cleanedRows,
      featureNames: activeFeatureNames,
      means: [],
      stdDevs: [],
      centeredData: [],
      processedData: [],
      missingSummary: {
        totalRows,
        validRows: cleanedRows.length,
        droppedRows: droppedRowsCount,
        missingPerFeature,
        imputedValues
      },
      excludedZeroVariance,
      error: `At least 2 non-zero-variance features are required for PCA (only ${activeFeatureNames.length} valid feature remaining).`
    };
  }

  // Filter cleanedRows to only active features
  const filteredCleaned = cleanedRows.map(row => activeFeatureIndices.map(idx => row[idx]));
  const n = filteredCleaned.length;
  const p = activeFeatureNames.length;

  // 4. Calculate feature means and sample standard deviations (ddof=1)
  const means: number[] = [];
  const stdDevs: number[] = [];

  for (let j = 0; j < p; j++) {
    const colVals = filteredCleaned.map(r => r[j]);
    const m = computeMean(colVals);
    const s = computeSampleStdDev(colVals, m);
    means.push(m);
    stdDevs.push(s);
  }

  // 5. Mean Centering: X_centered = X - mu (MANDATORY)
  const centeredData: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < p; j++) {
      row.push(filteredCleaned[i][j] - means[j]);
    }
    centeredData.push(row);
  }

  // 6. Feature Scaling (Optional): Mode A (Standardized) vs Mode B (Covariance-based)
  const processedData: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < p; j++) {
      if (standardize) {
        // Z = (X - mu) / sigma
        row.push(centeredData[i][j] / (stdDevs[j] > 1e-12 ? stdDevs[j] : 1));
      } else {
        // Mode B: mean-centered only
        row.push(centeredData[i][j]);
      }
    }
    processedData.push(row);
  }

  return {
    cleanedRawData: filteredCleaned,
    featureNames: activeFeatureNames,
    means,
    stdDevs,
    centeredData,
    processedData,
    missingSummary: {
      totalRows,
      validRows: n,
      droppedRows: droppedRowsCount,
      missingPerFeature,
      imputedValues
    },
    excludedZeroVariance
  };
}

/**
 * Calculates sample covariance matrix: C = X_proc^T * X_proc / (n - 1)
 */
export function calculateCovarianceMatrix(processedData: number[][]): number[][] {
  const n = processedData.length;
  if (n <= 1) return [];
  const p = processedData[0].length;
  const cov: number[][] = Array.from({ length: p }, () => Array(p).fill(0));

  for (let j1 = 0; j1 < p; j1++) {
    for (let j2 = 0; j2 < p; j2++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += processedData[i][j1] * processedData[i][j2];
      }
      cov[j1][j2] = sum / (n - 1);
    }
  }

  return cov;
}

/**
 * Eigenvalue decomposition for symmetric real matrices using the Jacobi Eigenvalue Algorithm.
 * Robust, highly accurate, guaranteed quadratic convergence for real symmetric covariance matrices.
 */
export function solveSymmetricEigen(matrix: number[][]): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  // Deep clone matrix A
  let A = matrix.map(row => [...row]);
  // Initialize V as identity matrix
  let V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  const maxIterations = 100;
  const eps = 1e-12;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Find maximum off-diagonal element
    let maxOff = 0;
    let p = 0;
    let q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(A[i][j]);
        if (val > maxOff) {
          maxOff = val;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < eps) {
      break;
    }

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const theta = (aqq - app) / (2 * apq);
    // When theta is 0 (app === aqq), rotation angle is 45 deg (t = 1)
    let t: number;
    if (Math.abs(theta) < 1e-15) {
      t = 1.0;
    } else {
      t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    }
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    // Apply Jacobi rotation to A
    const tau = s / (1 + c);
    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let j = 0; j < n; j++) {
      if (j !== p && j !== q) {
        const ajp = A[j][p];
        const ajq = A[j][q];
        A[j][p] = ajp - s * (ajq + tau * ajp);
        A[p][j] = A[j][p];
        A[j][q] = ajq + s * (ajp - tau * ajq);
        A[q][j] = A[j][q];
      }
    }

    // Accumulate transformations in V
    for (let j = 0; j < n; j++) {
      const vjp = V[j][p];
      const vjq = V[j][q];
      V[j][p] = vjp - s * (vjq + tau * vjp);
      V[j][q] = vjq + s * (vjp - tau * vjq);
    }
  }

  // Extract eigenvalues and normalize eigenvectors
  const rawEigenvalues = Array.from({ length: n }, (_, i) => Math.max(0, A[i][i]));

  // Standardize eigenvector orientation (ensure first non-zero component is positive for determinism)
  for (let j = 0; j < n; j++) {
    let norm = 0;
    for (let i = 0; i < n; i++) {
      norm += V[i][j] * V[i][j];
    }
    norm = Math.sqrt(norm);
    if (norm > 1e-12) {
      for (let i = 0; i < n; i++) {
        V[i][j] /= norm;
      }
    }
    // Deterministic sign convention
    let signFlip = false;
    for (let i = 0; i < n; i++) {
      if (Math.abs(V[i][j]) > 1e-6) {
        if (V[i][j] < 0) signFlip = true;
        break;
      }
    }
    if (signFlip) {
      for (let i = 0; i < n; i++) {
        V[i][j] = -V[i][j];
      }
    }
  }

  return { eigenvalues: rawEigenvalues, eigenvectors: V };
}

/**
 * Computes complete PCA results including projection, variance ratios, and reconstruction.
 */
export function computePCA(
  preprocessing: PreprocessingResult,
  nComponents?: number
): PCAResult {
  const { processedData, cleanedRawData, means, stdDevs } = preprocessing;
  const n = processedData.length;
  const p = processedData[0].length;
  const k = Math.min(nComponents ?? p, p);

  const covMatrix = calculateCovarianceMatrix(processedData);
  const { eigenvalues: rawEvals, eigenvectors: rawEvecs } = solveSymmetricEigen(covMatrix);

  // Pair and sort in descending order
  const pairs = rawEvals.map((val, idx) => ({
    val,
    vec: rawEvecs.map(row => row[idx])
  }));

  pairs.sort((a, b) => b.val - a.val);

  const sortedEigenvalues = pairs.map(p => p.val);
  const totalVariance = sortedEigenvalues.reduce((sum, v) => sum + v, 0) || 1e-12;

  const explainedVarianceRatios = sortedEigenvalues.map(v => v / totalVariance);
  const cumulativeVarianceRatios: number[] = [];
  let cum = 0;
  for (const ratio of explainedVarianceRatios) {
    cum += ratio;
    cumulativeVarianceRatios.push(cum);
  }

  // W matrix: p x k (each column is top eigenvector)
  // eigenvectors[row][col]
  const W: number[][] = Array.from({ length: p }, (_, r) =>
    Array.from({ length: k }, (_, c) => pairs[c].vec[r])
  );

  // Project: Y = X_processed * W (n x k)
  const projectedData: number[][] = [];
  for (let i = 0; i < n; i++) {
    const projRow: number[] = [];
    for (let c = 0; c < k; c++) {
      let dot = 0;
      for (let r = 0; r < p; r++) {
        dot += processedData[i][r] * W[r][c];
      }
      projRow.push(dot);
    }
    projectedData.push(projRow);
  }

  // Reconstruct in processed space: Y * W^T (n x p)
  const reconstructedProcessed: number[][] = [];
  for (let i = 0; i < n; i++) {
    const reconRow: number[] = [];
    for (let r = 0; r < p; r++) {
      let sum = 0;
      for (let c = 0; c < k; c++) {
        sum += projectedData[i][c] * W[r][c];
      }
      reconRow.push(sum);
    }
    reconstructedProcessed.push(reconRow);
  }

  // Reconstruct in original feature space:
  // If standardized: X_recon = X_proc_recon * sigma + mu
  // If covariance-based: X_recon = X_proc_recon + mu
  const isStandardized = preprocessing.stdDevs.length > 0 && preprocessing.stdDevs.some(s => s !== 0);
  const reconstructedOriginal: number[][] = [];
  let totalSqError = 0;

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < p; j++) {
      let val: number;
      if (preprocessing.stdDevs && preprocessing.stdDevs.length === p) {
        // Check if standardize was on
        const s = preprocessing.stdDevs[j];
        // If processedData is roughly scaled by s
        // In preprocessingResult, we can reconstruct precisely:
        // centeredData was either kept or scaled by stdDevs.
        // If standardized mode, processedData = centeredData / sigma.
        // Therefore, reverse by * sigma + mu
        // Let's use the exact formula:
        const wasStandardized = Math.abs(processedData[i][j] - preprocessing.centeredData[i][j]) > 1e-6;
        val = wasStandardized
          ? reconstructedProcessed[i][j] * s + means[j]
          : reconstructedProcessed[i][j] + means[j];
      } else {
        val = reconstructedProcessed[i][j] + means[j];
      }
      row.push(val);
      totalSqError += (cleanedRawData[i][j] - val) ** 2;
    }
    reconstructedOriginal.push(row);
  }

  const reconstructionMSE = totalSqError / (n * p);

  return {
    covarianceMatrix: covMatrix,
    eigenvalues: sortedEigenvalues,
    eigenvectors: W,
    explainedVarianceRatios,
    cumulativeVarianceRatios,
    projectedData,
    reconstructedProcessed,
    reconstructedOriginal,
    reconstructionMSE
  };
}

/**
 * Calculates parametric points for a 2D covariance ellipse
 * centered at (cx, cy) using eigenvalues and eigenvectors.
 * numPoints: default 100
 * nStd: number of standard deviations (e.g. 1, 2, or 2.4477 for 95% confidence chi-squared 2-dof)
 */
export function generateCovarianceEllipse(
  cx: number,
  cy: number,
  lambda1: number,
  lambda2: number,
  evec1: [number, number],
  evec2: [number, number],
  nStd: number = 2,
  numPoints: number = 100
): { x: number[]; y: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];

  const a = nStd * Math.sqrt(Math.max(0, lambda1));
  const b = nStd * Math.sqrt(Math.max(0, lambda2));

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const u = a * Math.cos(angle);
    const v = b * Math.sin(angle);

    // Rotate by eigenvector basis
    const x = cx + u * evec1[0] + v * evec2[0];
    const y = cy + u * evec1[1] + v * evec2[1];

    xs.push(x);
    ys.push(y);
  }

  return { x: xs, y: ys };
}

/**
 * Generates orthogonal projection line segments from 2D points onto PC1 vector line
 */
export function calculateProjectionSegments(
  points: [number, number][],
  pc1Vec: [number, number]
): {
  segments: { x0: number; y0: number; x1: number; y1: number }[];
  projectedCoords: [number, number][];
  pc1Scores: number[];
} {
  const segments: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const projectedCoords: [number, number][] = [];
  const pc1Scores: number[] = [];

  for (const [x, y] of points) {
    // Dot product with unit vector pc1Vec
    const score = x * pc1Vec[0] + y * pc1Vec[1];
    pc1Scores.push(score);

    // Projected point on line
    const projX = Math.abs(score * pc1Vec[0]) < 1e-15 ? 0 : score * pc1Vec[0];
    const projY = Math.abs(score * pc1Vec[1]) < 1e-15 ? 0 : score * pc1Vec[1];

    projectedCoords.push([projX, projY]);
    segments.push({
      x0: x,
      y0: y,
      x1: projX,
      y1: projY
    });
  }

  return { segments, projectedCoords, pc1Scores };
}
