import React, { useState, useEffect, useRef } from 'react';
import {
  PreprocessingResult,
  PCAResult,
  generateCovarianceEllipse,
  calculateProjectionSegments,
  computePCA,
  preprocessDataset
} from '../utils/pcaEngine';
import { PlotlyGraph } from './PlotlyGraph';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface StepVisualizerProps {
  prepResult: PreprocessingResult;
  pcaResult: PCAResult;
  labels?: string[];
  labelColumnName?: string;
  isStandardized: boolean;
}

export const StepVisualizer: React.FC<StepVisualizerProps> = ({
  prepResult,
  pcaResult,
  labels,
  labelColumnName,
  isStandardized
}) => {
  // Feature pair selection for 2D animation plane
  const [featXIdx, setFeatXIdx] = useState<number>(0);
  const [featYIdx, setFeatYIdx] = useState<number>(1);

  // Animation step 1 to 8
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Interpolation progress within current step: 0.0 to 1.0
  const [progress, setProgress] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showVivaExamNotes, setShowVivaExamNotes] = useState<boolean>(true);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(2.0); // 1 = 68%, 2 = 95%, 3 = 99.7%

  // Ensure feature indices are valid
  const p = prepResult.featureNames.length;
  const safeXIdx = featXIdx < p ? featXIdx : 0;
  const safeYIdx = (featYIdx < p && featYIdx !== safeXIdx) ? featYIdx : (safeXIdx === 0 ? 1 : 0);

  const featXName = prepResult.featureNames[safeXIdx] || 'Feature 1';
  const featYName = prepResult.featureNames[safeYIdx] || 'Feature 2';

  // Compute 2D PCA specifically for the selected pair (for exact geometric animation)
  const rawPair = prepResult.cleanedRawData.map(r => [r[safeXIdx], r[safeYIdx]]);
  const muX = prepResult.means[safeXIdx];
  const muY = prepResult.means[safeYIdx];
  const stdX = prepResult.stdDevs[safeXIdx];
  const stdY = prepResult.stdDevs[safeYIdx];

  // Processed 2D coordinates
  const proc2D = prepResult.processedData.map(r => [r[safeXIdx], r[safeYIdx]]);

  // 2D Covariance and Eigendecomposition on the active 2D pair
  const prep2DSub: PreprocessingResult = {
    cleanedRawData: rawPair,
    featureNames: [featXName, featYName],
    means: [muX, muY],
    stdDevs: [stdX, stdY],
    centeredData: rawPair.map(([x, y]) => [x - muX, y - muY]),
    processedData: proc2D,
    missingSummary: prepResult.missingSummary,
    excludedZeroVariance: []
  };
  const pca2D = computePCA(prep2DSub, 2);

  const lambda1 = pca2D.eigenvalues[0];
  const lambda2 = pca2D.eigenvalues[1];
  const w1: [number, number] = [pca2D.eigenvectors[0][0], pca2D.eigenvectors[1][0]];
  const w2: [number, number] = [pca2D.eigenvectors[0][1], pca2D.eigenvectors[1][1]];
  const evr1 = (pca2D.explainedVarianceRatios[0] * 100).toFixed(1);
  const evr2 = (pca2D.explainedVarianceRatios[1] * 100).toFixed(1);

  // Autoplay loop using requestAnimationFrame
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setProgress(prev => {
        const next = prev + delta * 0.5 * playbackSpeed;
        if (next >= 1.0) {
          // Advance to next step or loop
          setCurrentStep(s => {
            if (s < 8) return s + 1;
            setIsPlaying(false);
            return 8;
          });
          return 0.0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Step definitions
  const stepsMeta = [
    {
      num: 1,
      shortLabel: '1. Raw & Centroid',
      title: 'Raw Feature Space & Centroid',
      subtitle: 'Identify data distribution and mean center μ = [μ₁, μ₂]',
      formula: '\\boldsymbol{\\mu} = \\frac{1}{n} \\sum_{i=1}^{n} \\mathbf{x}_i',
      details: 'Before performing PCA, we inspect the uncentered raw data. The red cross marks the center of mass (sample mean vector μ).'
    },
    {
      num: 2,
      shortLabel: '2. Centering (X - μ)',
      title: 'Mean Centering Translation',
      subtitle: 'Shift data so centroid lies precisely at origin (0, 0)',
      formula: '\\mathbf{X}_{\\text{centered}} = \\mathbf{X} - \\boldsymbol{\\mu}',
      details: 'Every sample is translated by subtracting the feature means. This eliminates intercept terms and ensures eigenvectors pass through the coordinate origin.'
    },
    {
      num: 3,
      shortLabel: '3. Covariance Ellipse',
      title: 'Sample Covariance Ellipse',
      subtitle: 'Quantify pairwise dispersion and correlation structure',
      formula: '\\mathbf{C} = \\frac{1}{n - 1} \\mathbf{X}_{\\text{proc}}^T \\mathbf{X}_{\\text{proc}}',
      details: 'The covariance ellipse models the equiprobable dispersion contour. Its tilt corresponds to feature correlation; its principal axes reveal direction of maximum variance.'
    },
    {
      num: 4,
      shortLabel: '4. Eigenvectors (w)',
      title: 'Eigenvectors from Centroid',
      subtitle: 'Principal axes emerging with magnitudes √λ₁ and √λ₂',
      formula: '\\mathbf{C} \\mathbf{w}_i = \\lambda_i \\mathbf{w}_i, \\quad \\|\\mathbf{w}_i\\| = 1',
      details: 'Eigenvectors w₁ and w₂ are the orthogonal axes of the covariance ellipse. Eigenvalues λ₁ and λ₂ equal the sample variance captured along each component.'
    },
    {
      num: 5,
      shortLabel: '5. Axis Rotation',
      title: 'Coordinate Axes Rotation',
      subtitle: 'Rotate original basis to align with Principal Components (PC1, PC2)',
      formula: '\\mathbf{Z} = \\mathbf{X}_{\\text{proc}} \\mathbf{W}, \\quad \\mathbf{W} = [\\mathbf{w}_1, \\mathbf{w}_2]',
      details: 'A rigid orthogonal rotation maps the feature space into uncorrelated principal coordinates. In this new basis, the covariance matrix becomes diagonal.'
    },
    {
      num: 6,
      shortLabel: '6. PC1 Drop-Lines',
      title: 'Perpendicular Projections onto PC1',
      subtitle: 'Drop orthogonal projection lines from all points to PC1',
      formula: '\\text{proj}_{\\mathbf{w}_1}(\\mathbf{x}_i) = (\\mathbf{x}_i \\cdot \\mathbf{w}_1) \\mathbf{w}_1',
      details: 'PC1 is proven mathematically to be the unique 1D subspace that minimizes the sum of squared perpendicular projection distances (reconstruction error).'
    },
    {
      num: 7,
      shortLabel: '7. 1D Collapse',
      title: 'Dimensionality Reduction (1D Collapse)',
      subtitle: 'Project points smoothly along drop-lines onto the PC1 line',
      formula: 'y_{i1} = \\mathbf{x}_{\\text{proc}, i} \\cdot \\mathbf{w}_1',
      details: 'Points collapse from 2D space down to a single scalar score on PC1. Information along PC2 is discarded, achieving 50% dimensionality reduction.'
    },
    {
      num: 8,
      shortLabel: '8. Reconstruction (x̂)',
      title: 'Reconstruction & Residual Error',
      subtitle: 'Inverse transform back to original feature space with MSE',
      formula: '\\hat{\\mathbf{x}}_i = (y_{i1} \\mathbf{w}_1^T) \\odot \\boldsymbol{\\sigma} + \\boldsymbol{\\mu}, \\quad \\text{MSE} = \\frac{1}{n} \\sum \\|\\mathbf{x}_i - \\hat{\\mathbf{x}}_i\\|^2',
      details: 'Reconstructing the original data from 1D PC1 reveals residual vectors (dashed red lines). The mean squared error in processed space equals the discarded eigenvalue λ₂.'
    }
  ];

  // Helper to interpolate points
  const t = Math.max(0, Math.min(1, progress));

  // Determine plot elements for current step & progress
  const plotData: Plotly.Data[] = [];
  const annotations: any[] = [];
  const shapes: any[] = [];

  // Group labels for coloring
  const uniqueLabels = Array.from(new Set(labels || []));
  const colorMap: Record<string, string> = {
    Setosa: '#0284c7', // Sky 600
    Versicolor: '#16a34a', // Emerald 600
    Virginica: '#9333ea', // Purple 600
    Engineering: '#2563eb', // Blue 600
    Humanities: '#e11d48', // Rose 600
    Economics: '#d97706', // Amber 600
    Barolo: '#7c3aed',
    Grignolino: '#059669',
    Barbera: '#c026d3',
    Normal: '#16a34a',
    Warning: '#f59e0b',
    Critical: '#dc2626',
    Group_A: '#3b82f6',
    Group_B: '#ec4899'
  };

  const getPointColor = (i: number) => {
    if (labels && labels[i] && colorMap[labels[i]]) {
      return colorMap[labels[i]];
    }
    return '#3b82f6';
  };

  // Center coordinate
  const currentCenterX = currentStep === 1 ? muX : (currentStep === 2 ? muX * (1 - t) : 0);
  const currentCenterY = currentStep === 1 ? muY : (currentStep === 2 ? muY * (1 - t) : 0);

  // Compute animated coordinates depending on step:
  let currentPoints: [number, number][] = [];

  if (currentStep === 1) {
    // Raw points
    currentPoints = rawPair.map(([x, y]) => [x, y]);
  } else if (currentStep === 2) {
    // Interpolating raw -> centered (or standardized)
    currentPoints = rawPair.map(([x, y], idx) => {
      const target = isStandardized ? proc2D[idx] : [x - muX, y - muY];
      return [x * (1 - t) + target[0] * t, y * (1 - t) + target[1] * t];
    });
  } else if (currentStep >= 3 && currentStep <= 4) {
    // Centered / processed coordinates at origin
    currentPoints = proc2D.map(([x, y]) => [x, y]);
  } else if (currentStep === 5) {
    // Rotating axes: smooth rotation from standard basis into PC basis
    // Matrix angle:
    const angle1 = Math.atan2(w1[1], w1[0]);
    const rotAngle = -angle1 * t; // Rotate by -angle to align PC1 with horizontal x-axis
    const cosR = Math.cos(rotAngle);
    const sinR = Math.sin(rotAngle);

    currentPoints = proc2D.map(([x, y]) => [
      x * cosR - y * sinR,
      x * sinR + y * cosR
    ]);
  } else if (currentStep === 6) {
    // Points at processed location
    currentPoints = proc2D.map(([x, y]) => [x, y]);
  } else if (currentStep === 7) {
    // Dimensionality reduction: points slide onto PC1 line!
    const { projectedCoords } = calculateProjectionSegments(proc2D as [number, number][], w1);
    currentPoints = proc2D.map(([x, y], idx) => {
      const proj = projectedCoords[idx];
      return [x * (1 - t) + proj[0] * t, y * (1 - t) + proj[1] * t];
    });
  } else if (currentStep === 8) {
    // Reconstruction: compare original raw points vs reconstructed points in original space
    // Interpolate from 1D PC1 projection back to reconstructed original feature space
    currentPoints = pca2D.reconstructedOriginal.map(([rx, ry]) => [rx, ry]);
  }

  // Add scatter points trace
  plotData.push({
    x: currentPoints.map(p => p[0]),
    y: currentPoints.map(p => p[1]),
    mode: 'markers',
    type: 'scatter',
    name: currentStep === 8 ? 'Reconstructed Points (x̂)' : 'Data Points',
    text: prepResult.cleanedRawData.map((_, i) =>
      `Sample ${i + 1}${labels && labels[i] ? ` (${labels[i]})` : ''}<br>${featXName}: ${rawPair[i][0].toFixed(2)}<br>${featYName}: ${rawPair[i][1].toFixed(2)}`
    ),
    hoverinfo: 'text',
    marker: {
      size: currentStep === 7 ? 9 : 8,
      color: prepResult.cleanedRawData.map((_, i) => getPointColor(i)),
      opacity: 0.9,
      line: {
        color: '#ffffff',
        width: 1.5
      }
    }
  });

  // Centroid marker for Steps 1-4
  if (currentStep <= 4) {
    plotData.push({
      x: [currentCenterX],
      y: [currentCenterY],
      mode: 'markers+text',
      type: 'scatter',
      name: 'Centroid (μ)',
      text: ['μ Centroid'],
      textposition: 'top right',
      marker: {
        symbol: 'cross',
        size: 14,
        color: '#dc2626', // Red
        line: { color: '#b91c1c', width: 2 }
      }
    });
  }

  // Step 3 & 4: Covariance Ellipse
  if (currentStep === 3 || currentStep === 4) {
    const ellipse = generateCovarianceEllipse(
      0,
      0,
      lambda1,
      lambda2,
      w1,
      w2,
      confidenceLevel,
      120
    );

    plotData.push({
      x: ellipse.x,
      y: ellipse.y,
      mode: 'lines',
      type: 'scatter',
      name: `Covariance Ellipse (${confidenceLevel}σ)`,
      line: {
        color: '#6366f1',
        width: 2.5,
        dash: 'solid'
      },
      hoverinfo: 'name'
    });
  }

  // Step 4 & 6: Eigenvector arrows / PC line
  if (currentStep === 4) {
    // Scale vectors by sqrt(eigenvalue) * progress for viva visual emergence
    const len1 = Math.sqrt(Math.max(0, lambda1)) * t;
    const len2 = Math.sqrt(Math.max(0, lambda2)) * t;

    // PC1 Vector
    annotations.push({
      x: w1[0] * len1,
      y: w1[1] * len1,
      ax: 0,
      ay: 0,
      xref: 'x',
      yref: 'y',
      axref: 'x',
      ayref: 'y',
      text: `PC1 (λ₁=${lambda1.toFixed(2)}, ${evr1}%)`,
      showarrow: true,
      arrowhead: 3,
      arrowsize: 1.2,
      arrowwidth: 3.5,
      arrowcolor: '#2563eb',
      font: { color: '#1d4ed8', size: 12, family: 'Inter, sans-serif' }
    });

    // PC2 Vector
    annotations.push({
      x: w2[0] * len2,
      y: w2[1] * len2,
      ax: 0,
      ay: 0,
      xref: 'x',
      yref: 'y',
      axref: 'x',
      ayref: 'y',
      text: `PC2 (λ₂=${lambda2.toFixed(2)}, ${evr2}%)`,
      showarrow: true,
      arrowhead: 3,
      arrowsize: 1.2,
      arrowwidth: 3,
      arrowcolor: '#ea580c',
      font: { color: '#c2410c', size: 12, family: 'Inter, sans-serif' }
    });
  }

  // Step 6 & 7: PC1 Subspace Line and Perpendicular Projection Drop-Lines
  if (currentStep === 6 || currentStep === 7) {
    // Draw PC1 infinite axis line
    const maxExtent = 5;
    shapes.push({
      type: 'line',
      x0: -w1[0] * maxExtent,
      y0: -w1[1] * maxExtent,
      x1: w1[0] * maxExtent,
      y1: w1[1] * maxExtent,
      line: {
        color: '#2563eb',
        width: 2.5,
        dash: 'solid'
      }
    });

    const { segments } = calculateProjectionSegments(proc2D as [number, number][], w1);

    // Add orthogonal drop-lines
    const dropX: (number | null)[] = [];
    const dropY: (number | null)[] = [];

    segments.forEach(seg => {
      // In step 6, animate drop lines extending from point to PC1
      const pX = seg.x0 * (1 - t) + seg.x1 * t;
      const pY = seg.y0 * (1 - t) + seg.y1 * t;

      dropX.push(seg.x0, pX, null);
      dropY.push(seg.y0, pY, null);
    });

    plotData.push({
      x: dropX as number[],
      y: dropY as number[],
      mode: 'lines',
      type: 'scatter',
      name: 'Orthogonal Projection Lines',
      line: {
        color: '#94a3b8',
        width: 1.5,
        dash: 'dash'
      },
      hoverinfo: 'none'
    });
  }

  // Step 8: Reconstruction Error & Original points comparison
  if (currentStep === 8) {
    // Original raw points in red/hollow
    plotData.push({
      x: rawPair.map(p => p[0]),
      y: rawPair.map(p => p[1]),
      mode: 'markers',
      type: 'scatter',
      name: 'Original Data (x)',
      marker: {
        size: 8,
        color: 'transparent',
        line: { color: '#ef4444', width: 2 }
      }
    });

    // Residual error connecting lines
    const resX: (number | null)[] = [];
    const resY: (number | null)[] = [];

    rawPair.forEach((orig, idx) => {
      const recon = pca2D.reconstructedOriginal[idx];
      resX.push(orig[0], recon[0], null);
      resY.push(orig[1], recon[1], null);
    });

    plotData.push({
      x: resX as number[],
      y: resY as number[],
      mode: 'lines',
      type: 'scatter',
      name: 'Residual Reconstruction Error Vector',
      line: {
        color: '#ef4444',
        width: 1.5,
        dash: 'dot'
      },
      hoverinfo: 'none'
    });
  }

  // Determine axes titles & ranges
  let xAxisTitle = featXName;
  let yAxisTitle = featYName;

  if (currentStep >= 2 && currentStep <= 4) {
    xAxisTitle = isStandardized ? `Standardized ${featXName} (Z₁)` : `Centered ${featXName} (X₁ - μ₁)`;
    yAxisTitle = isStandardized ? `Standardized ${featYName} (Z₂)` : `Centered ${featYName} (X₂ - μ₂)`;
  } else if (currentStep === 5) {
    xAxisTitle = `Rotated Coordinate PC1 (${evr1}%)`;
    yAxisTitle = `Rotated Coordinate PC2 (${evr2}%)`;
  } else if (currentStep === 6 || currentStep === 7) {
    xAxisTitle = isStandardized ? `Z₁ (PC1 Line: w₁=[${w1[0].toFixed(2)}, ${w1[1].toFixed(2)}])` : `Centered X₁`;
    yAxisTitle = isStandardized ? `Z₂` : `Centered X₂`;
  } else if (currentStep === 8) {
    xAxisTitle = `Reconstructed ${featXName} (Feature Space)`;
    yAxisTitle = `Reconstructed ${featYName} (Feature Space)`;
  }

  const layout: Partial<Plotly.Layout> = {
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0,
      y: -0.22,
      font: { size: 11 }
    },
    xaxis: {
      title: { text: xAxisTitle, font: { size: 12, color: '#475569' } },
      gridcolor: '#e2e8f0',
      zeroline: true,
      zerolinecolor: '#94a3b8',
      zerolinewidth: 1.5
    },
    yaxis: {
      title: { text: yAxisTitle, font: { size: 12, color: '#475569' } },
      gridcolor: '#e2e8f0',
      zeroline: true,
      zerolinecolor: '#94a3b8',
      zerolinewidth: 1.5,
      scaleanchor: (currentStep >= 2 && currentStep <= 7) ? 'x' : undefined,
      scaleratio: 1
    },
    margin: { l: 55, r: 25, t: 25, b: 55 },
    shapes,
    annotations
  };

  const currentMeta = stepsMeta[currentStep - 1];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" data-testid="step-visualizer-card">
      {/* Header bar */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Centerpiece Viva Demonstration
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Stage {currentStep} of 8
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {currentMeta.title}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* Feature Pair Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <label className="text-xs font-medium text-slate-600">Animation Plane:</label>
          <select
            value={safeXIdx}
            onChange={e => setFeatXIdx(Number(e.target.value))}
            className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
          >
            {prepResult.featureNames.map((fn, idx) => (
              <option key={fn} value={idx} disabled={idx === safeYIdx}>
                X: {fn}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">vs</span>
          <select
            value={safeYIdx}
            onChange={e => setFeatYIdx(Number(e.target.value))}
            className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
          >
            {prepResult.featureNames.map((fn, idx) => (
              <option key={fn} value={idx} disabled={idx === safeXIdx}>
                Y: {fn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Pills Navigation */}
      <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-100/60 p-2 gap-1.5 scrollbar-thin">
        {stepsMeta.map(s => {
          const isActive = currentStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => {
                setCurrentStep(s.num);
                setProgress(1.0);
                setIsPlaying(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <span>{s.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Main Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left Column: Interactive Plotly Graph (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between">
          <div className="w-full h-[460px] sm:h-[500px]">
            <PlotlyGraph data={plotData} layout={layout} />
          </div>

          {/* Interactive Animation Controls */}
          <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50/80 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Play Stage'}
                </button>

                <button
                  onClick={() => {
                    setProgress(0.0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                  onClick={() => {
                    setCurrentStep(s => Math.max(1, s - 1));
                    setProgress(1.0);
                    setIsPlaying(false);
                  }}
                  disabled={currentStep === 1}
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-40"
                  aria-label="Previous stage"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentStep(s => Math.min(8, s + 1));
                    setProgress(1.0);
                    setIsPlaying(false);
                  }}
                  disabled={currentStep === 8}
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-40"
                  aria-label="Next stage"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Speed buttons */}
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span className="text-[11px] font-medium text-slate-500 mr-1">Speed:</span>
                {[0.5, 1.0, 2.0].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackSpeed(sp)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      playbackSpeed === sp
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Progress Scrubber */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Operation Progress: {Math.round(progress * 100)}%</span>
                <span className="font-mono text-slate-600">t = {progress.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progress}
                onChange={e => {
                  setProgress(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Extra Controls for Step 3 Ellipse */}
            {currentStep === 3 && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Confidence Ellipse Multiplier:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: '1σ (68%)', val: 1.0 },
                    { label: '2σ (95%)', val: 2.0 },
                    { label: '2.45σ (Chi² 95%)', val: 2.4477 }
                  ].map(lvl => (
                    <button
                      key={lvl.label}
                      onClick={() => setConfidenceLevel(lvl.val)}
                      className={`px-2 py-1 rounded text-xs ${
                        confidenceLevel === lvl.val
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Math Formulas, Computed Values, and Viva Notes (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-slate-50/40 space-y-4 overflow-y-auto max-h-[660px]">
          {/* Formula Card */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Mathematical Formulation
              </span>
              <span className="text-[11px] font-mono text-slate-400">Step {currentStep}</span>
            </div>

            {/* Rendered formula */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-md font-mono text-xs sm:text-sm text-center shadow-inner overflow-x-auto">
              <code>{currentMeta.formula}</code>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {currentMeta.details}
            </p>
          </div>

          {/* Live Computed Numerical Values */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs space-y-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" /> Live Computed Quantities
            </span>

            <div className="space-y-1.5 text-xs text-slate-700 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Feature Means (μ):</span>
                <span className="font-semibold text-slate-900">
                  [{muX.toFixed(3)}, {muY.toFixed(3)}]
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sample Std Devs (s):</span>
                <span className="font-semibold text-slate-900">
                  [{stdX.toFixed(3)}, {stdY.toFixed(3)}]
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Scaling Mode:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                  isStandardized ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  {isStandardized ? 'Standardized (Z-Score)' : 'Covariance-Based (Centered Only)'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Top Eigenvalue (λ₁):</span>
                <span className="font-semibold text-blue-600">
                  {lambda1.toFixed(4)} ({evr1}% variance)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Second Eigenvalue (λ₂):</span>
                <span className="font-semibold text-amber-600">
                  {lambda2.toFixed(4)} ({evr2}% variance)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Eigenvector w₁ (PC1):</span>
                <span className="font-semibold text-slate-900">
                  [{w1[0].toFixed(3)}, {w1[1].toFixed(3)}]ᵀ
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Eigenvector w₂ (PC2):</span>
                <span className="font-semibold text-slate-900">
                  [{w2[0].toFixed(3)}, {w2[1].toFixed(3)}]ᵀ
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Orthogonality Check (w₁·w₂):</span>
                <span className="font-semibold text-emerald-600">
                  {(w1[0] * w2[0] + w1[1] * w2[1]).toExponential(2)} ≈ 0
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">1D Reconstruction MSE:</span>
                <span className="font-semibold text-rose-600">
                  {pca2D.reconstructionMSE.toFixed(4)} (in raw feature space)
                </span>
              </div>
            </div>
          </div>

          {/* Applied ML Viva Exam Preparation Guide Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" /> University Viva Examiner Notes
              </span>
              <button
                onClick={() => setShowVivaExamNotes(!showVivaExamNotes)}
                className="text-[11px] text-indigo-700 hover:underline"
              >
                {showVivaExamNotes ? 'Hide Q&A' : 'Show Q&A'}
              </button>
            </div>

            {showVivaExamNotes && (
              <div className="text-xs text-indigo-950 space-y-2 pt-1">
                {currentStep === 1 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: Why must PCA examine the feature centroid first?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: PCA seeks directions of maximal variance around the mean. If the centroid is not at the origin, the first principal vector would point toward the data cluster rather than along its variance axis.
                    </p>
                  </div>
                )}
                {currentStep === 2 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: When do we standardize (divide by σ) vs merely mean-center?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: Standardize when features have distinct physical units (e.g., kg vs meters, or scores vs dollars). Otherwise, features with arbitrarily large numerical scale dominate the eigenvectors purely due to unit choice.
                    </p>
                  </div>
                )}
                {currentStep === 3 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: Why divide by (n - 1) instead of n in sample covariance?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: Bessel's correction (ddof=1). Estimating the population mean vector μ from sample data uses 1 degree of freedom, causing an uncorrected 1/n estimator to underestimate true population variance.
                    </p>
                  </div>
                )}
                {currentStep === 4 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: Why are eigenvectors of covariance guaranteed to be orthogonal?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: By the Spectral Theorem, any real symmetric matrix (C = Cᵀ) has real eigenvalues and an orthonormal basis of eigenvectors. Distinct eigenspaces are always mutually perpendicular.
                    </p>
                  </div>
                )}
                {currentStep === 5 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: What is the geometric meaning of the rotation matrix W?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: Matrix W performs a rigid coordinate transformation (det(W)=±1) that uncorrelates the variables: Wᵀ C W = Λ (a diagonal matrix of eigenvalues).
                    </p>
                  </div>
                )}
                {currentStep === 6 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: Why are projection lines perpendicular (orthogonal)?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: Orthogonal projection onto a linear subspace minimizes Euclidean distance ||x - proj(x)|| by the Hilbert Projection Theorem, which is equivalent to maximizing the variance of projected coordinates.
                    </p>
                  </div>
                )}
                {currentStep === 7 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: What information is lost when collapsing to 1D?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: All variance along PC2 (equal to λ₂ = {lambda2.toFixed(3)}, representing {evr2}% of total variance). The retained information is {evr1}%.
                    </p>
                  </div>
                )}
                {currentStep === 8 && (
                  <div>
                    <p className="font-semibold text-indigo-900">Q: What is the exact relationship between Reconstruction MSE and discarded eigenvalues?</p>
                    <p className="text-indigo-800 text-[11px] mt-0.5">
                      A: In processed space, Reconstruction MSE = ∑_{`i=k+1`}^p λ_i. Discarding the last component results in reconstruction error directly equal to λ₂.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
