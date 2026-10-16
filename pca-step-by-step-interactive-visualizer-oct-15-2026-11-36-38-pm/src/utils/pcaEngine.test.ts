import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMean,
  computeMedian,
  computeSampleStdDev,
  preprocessDataset,
  calculateCovarianceMatrix,
  solveSymmetricEigen,
  computePCA,
  generateCovarianceEllipse,
  calculateProjectionSegments
} from './pcaEngine.ts';

test('computeMean and computeMedian calculate accurately', () => {
  const vals = [10, 20, 30, 40, 50];
  assert.equal(computeMean(vals), 30);
  assert.equal(computeMedian(vals), 30);

  const evenVals = [10, 20, 30, 40];
  assert.equal(computeMedian(evenVals), 25);
});

test('computeSampleStdDev uses sample variance with ddof=1 (Bessel correction)', () => {
  const vals = [2, 4, 4, 4, 5, 5, 7, 9];
  const mean = computeMean(vals); // 5
  const std = computeSampleStdDev(vals, mean);
  // sum sq diffs: (2-5)^2 + 3*(4-5)^2 + 2*(5-5)^2 + (7-5)^2 + (9-5)^2 = 9 + 3 + 0 + 4 + 16 = 32
  // sample var = 32 / (8 - 1) = 32 / 7 = 4.57142857...
  // sample std = sqrt(32/7) = 2.1380899...
  assert.ok(Math.abs(std - Math.sqrt(32 / 7)) < 1e-6);
});

test('preprocessDataset handles median imputation and zero-variance detection', () => {
  const data = [
    { x: 1, y: 10, z: 5 },
    { x: 2, y: null, z: 5 }, // missing y
    { x: 3, y: 30, z: 5 },  // z is constant (zero variance!)
    { x: 4, y: 40, z: 5 },
  ];

  const result = preprocessDataset(data, {
    imputationStrategy: 'median',
    standardize: true,
    selectedFeatures: ['x', 'y', 'z']
  });

  // z must be detected as zero-variance and excluded
  assert.equal(result.excludedZeroVariance.length, 1);
  assert.equal(result.excludedZeroVariance[0].feature, 'z');
  assert.deepEqual(result.featureNames, ['x', 'y']);

  // Missing y was imputed with median of [10, 30, 40] = 30
  assert.equal(result.missingSummary.missingPerFeature['y'], 1);
  assert.equal(result.missingSummary.imputedValues['y'], 30);
  assert.equal(result.cleanedRawData.length, 4);

  // Mean centering verification: mean of centered data columns must be 0
  for (let j = 0; j < 2; j++) {
    const colSum = result.centeredData.reduce((acc, row) => acc + row[j], 0);
    assert.ok(Math.abs(colSum) < 1e-10, `Column ${j} mean should be 0`);
  }

  // Standardized verification: sample standard deviation of processed data must be 1 (ddof=1)
  for (let j = 0; j < 2; j++) {
    const colVals = result.processedData.map(r => r[j]);
    const m = computeMean(colVals);
    const s = computeSampleStdDev(colVals, m);
    assert.ok(Math.abs(s - 1.0) < 1e-6, `Column ${j} sample std should be 1.0`);
  }
});

test('preprocessDataset rejects datasets with columns with no valid values', () => {
  const data = [
    { a: null, b: 1 },
    { a: undefined, b: 2 }
  ];
  const result = preprocessDataset(data, {
    imputationStrategy: 'median',
    standardize: true,
    selectedFeatures: ['a', 'b']
  });
  assert.ok(result.error?.includes('has no valid numerical values'));
});

test('covariance matrix and Jacobi eigenvalue decomposition satisfy C * v = lambda * v', () => {
  // Simple 2D centered data with known correlation
  const X = [
    [-2, -1],
    [-1, -1],
    [0, 0],
    [1, 1],
    [2, 1]
  ];
  const cov = calculateCovarianceMatrix(X);
  assert.equal(cov.length, 2);
  assert.equal(cov[0].length, 2);
  // Check symmetry
  assert.ok(Math.abs(cov[0][1] - cov[1][0]) < 1e-12);

  const { eigenvalues, eigenvectors } = solveSymmetricEigen(cov);
  assert.equal(eigenvalues.length, 2);

  // Check C * v = lambda * v for each eigenvector
  for (let col = 0; col < 2; col++) {
    const lambda = eigenvalues[col];
    const v = [eigenvectors[0][col], eigenvectors[1][col]];

    // Matrix vector product C * v
    const Cv0 = cov[0][0] * v[0] + cov[0][1] * v[1];
    const Cv1 = cov[1][0] * v[0] + cov[1][1] * v[1];

    assert.ok(Math.abs(Cv0 - lambda * v[0]) < 1e-6, 'Eigenvector 0 component error');
    assert.ok(Math.abs(Cv1 - lambda * v[1]) < 1e-6, 'Eigenvector 1 component error');
  }

  // Check orthogonality: v1 . v2 = 0
  const dot = eigenvectors[0][0] * eigenvectors[0][1] + eigenvectors[1][0] * eigenvectors[1][1];
  assert.ok(Math.abs(dot) < 1e-6, 'Eigenvectors must be orthogonal');
});

test('full PCA: explained variance ratio sums to 1.0 and full reconstruction has near-zero MSE', () => {
  const rawData = [
    { f1: 2.5, f2: 2.4 },
    { f1: 0.5, f2: 0.7 },
    { f1: 2.2, f2: 2.9 },
    { f1: 1.9, f2: 2.2 },
    { f1: 3.1, f2: 3.0 },
    { f1: 2.3, f2: 2.7 },
    { f1: 2.0, f2: 1.6 },
    { f1: 1.0, f2: 1.1 },
    { f1: 1.5, f2: 1.6 },
    { f1: 1.1, f2: 0.9 }
  ];

  const prep = preprocessDataset(rawData, {
    imputationStrategy: 'mean',
    standardize: false, // Mode B: covariance-based
    selectedFeatures: ['f1', 'f2']
  });

  const pca = computePCA(prep, 2);

  // Explained variance ratios sum to 1.0
  const sumEVR = pca.explainedVarianceRatios.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sumEVR - 1.0) < 1e-6);

  // When keeping all k=p components, reconstruction MSE must be 0
  assert.ok(pca.reconstructionMSE < 1e-10, `Full reconstruction MSE was ${pca.reconstructionMSE}`);

  // Reconstructed original matches raw data
  for (let i = 0; i < rawData.length; i++) {
    assert.ok(Math.abs(pca.reconstructedOriginal[i][0] - rawData[i].f1) < 1e-6);
    assert.ok(Math.abs(pca.reconstructedOriginal[i][1] - rawData[i].f2) < 1e-6);
  }
});

test('calculateProjectionSegments yields accurate orthogonal coordinates', () => {
  const points: [number, number][] = [
    [1, 2],
    [-2, 1],
    [3, 0]
  ];
  // Unit vector along x-axis [1, 0]
  const pc1: [number, number] = [1, 0];
  const { segments, projectedCoords, pc1Scores } = calculateProjectionSegments(points, pc1);

  assert.equal(segments.length, 3);
  assert.deepEqual(pc1Scores, [1, -2, 3]);
  assert.deepEqual(projectedCoords, [
    [1, 0],
    [-2, 0],
    [3, 0]
  ]);
});
