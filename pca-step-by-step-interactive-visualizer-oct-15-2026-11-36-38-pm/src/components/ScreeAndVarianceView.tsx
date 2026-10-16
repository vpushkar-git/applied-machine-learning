import React, { useState } from 'react';
import { PCAResult, PreprocessingResult } from '../utils/pcaEngine';
import { PlotlyGraph } from './PlotlyGraph';
import { BarChart2, Layers, TrendingUp, Award, HelpCircle } from 'lucide-react';

interface ScreeAndVarianceViewProps {
  pcaResult: PCAResult;
  prepResult: PreprocessingResult;
  isStandardized: boolean;
}

export const ScreeAndVarianceView: React.FC<ScreeAndVarianceViewProps> = ({
  pcaResult,
  prepResult,
  isStandardized
}) => {
  const [targetVarianceThreshold, setTargetVarianceThreshold] = useState<number>(0.85); // 85%

  const { eigenvalues, explainedVarianceRatios, cumulativeVarianceRatios, eigenvectors } = pcaResult;
  const numComponents = eigenvalues.length;
  const compLabels = Array.from({ length: numComponents }, (_, i) => `PC${i + 1}`);

  // Recommended number of components to reach threshold
  const recommendedK = cumulativeVarianceRatios.findIndex(cum => cum >= targetVarianceThreshold) + 1 || numComponents;

  // Scree Plot: Dual-axis plot with Bar chart for individual variance and Line for cumulative variance
  const screeData: Plotly.Data[] = [
    {
      x: compLabels,
      y: explainedVarianceRatios.map(r => r * 100),
      type: 'bar',
      name: 'Individual Explained Variance (%)',
      marker: {
        color: compLabels.map((_, i) => (i < recommendedK ? '#3b82f6' : '#94a3b8')),
        opacity: 0.85
      },
      text: explainedVarianceRatios.map(r => `${(r * 100).toFixed(1)}%`),
      textposition: 'auto'
    },
    {
      x: compLabels,
      y: cumulativeVarianceRatios.map(c => c * 100),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Cumulative Variance (%)',
      yaxis: 'y2',
      line: { color: '#ef4444', width: 3 },
      marker: { size: 8, color: '#dc2626' }
    }
  ];

  const screeLayout: Partial<Plotly.Layout> = {
    xaxis: { title: { text: 'Principal Components' } },
    yaxis: {
      title: { text: 'Individual Variance (%)', font: { color: '#2563eb' } },
      range: [0, 105],
      gridcolor: '#f1f5f9'
    },
    yaxis2: {
      title: { text: 'Cumulative Variance (%)', font: { color: '#dc2626' } },
      overlaying: 'y',
      side: 'right',
      range: [0, 105],
      showgrid: false
    },
    margin: { l: 50, r: 50, t: 20, b: 50 },
    legend: { orientation: 'h', y: -0.25 },
    shapes: [
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y2',
        y0: targetVarianceThreshold * 100,
        y1: targetVarianceThreshold * 100,
        line: { color: '#10b981', width: 2, dash: 'dot' }
      }
    ],
    annotations: [
      {
        xref: 'paper',
        x: 0.98,
        yref: 'y2',
        y: targetVarianceThreshold * 100 + 4,
        text: `Target: ${(targetVarianceThreshold * 100).toFixed(0)}%`,
        showarrow: false,
        font: { size: 11, color: '#059669', family: 'Inter, sans-serif' }
      }
    ]
  };

  // Biplot (PC1 vs PC2 with loading arrows)
  const biplotData: Plotly.Data[] = [];

  // 1. Data point scores in PC1 vs PC2
  biplotData.push({
    x: pcaResult.projectedData.map(r => r[0]),
    y: pcaResult.projectedData.map(r => r[1]),
    mode: 'markers',
    type: 'scatter',
    name: 'Sample Coordinates (Y)',
    marker: { size: 7, color: '#3b82f6', opacity: 0.75 }
  });

  // 2. Feature loading arrows: loadings = eigenvector * sqrt(lambda)
  const biplotAnnotations: any[] = [];
  const maxScore = Math.max(
    ...pcaResult.projectedData.map(r => Math.max(Math.abs(r[0]), Math.abs(r[1])))
  );

  prepResult.featureNames.forEach((featName, r) => {
    // Vector coords
    const l1 = eigenvectors[r][0] * Math.sqrt(eigenvalues[0]);
    const l2 = eigenvectors[r][1] * Math.sqrt(eigenvalues[1]);
    const scaleFactor = (maxScore / 1.5) || 1;

    biplotAnnotations.push({
      x: l1 * scaleFactor,
      y: l2 * scaleFactor,
      ax: 0,
      ay: 0,
      xref: 'x',
      yref: 'y',
      axref: 'x',
      ayref: 'y',
      text: featName,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1.2,
      arrowwidth: 2.5,
      arrowcolor: '#e11d48',
      font: { color: '#be123c', size: 11, family: 'Inter, sans-serif' }
    });
  });

  const biplotLayout: Partial<Plotly.Layout> = {
    xaxis: {
      title: { text: `PC1 (${(explainedVarianceRatios[0] * 100).toFixed(1)}% Var)` },
      gridcolor: '#e2e8f0',
      zerolinecolor: '#94a3b8'
    },
    yaxis: {
      title: { text: `PC2 (${(explainedVarianceRatios[1] * 100).toFixed(1)}% Var)` },
      gridcolor: '#e2e8f0',
      zerolinecolor: '#94a3b8'
    },
    margin: { l: 50, r: 25, t: 20, b: 50 },
    annotations: biplotAnnotations
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" data-testid="scree-variance-card">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Dimensionality Analysis
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total Variance = {eigenvalues.reduce((a, b) => a + b, 0).toFixed(2)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Scree Plot, Eigenvalues & Variance Retention
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Identify the optimal subspace dimension k using the Elbow heuristic and Kaiser-Guttman criterion.
          </p>
        </div>

        {/* Target Threshold Selector */}
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-600">Retention Goal:</span>
          {[0.80, 0.85, 0.90, 0.95].map(thresh => (
            <button
              key={thresh}
              onClick={() => setTargetVarianceThreshold(thresh)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                targetVarianceThreshold === thresh
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {(thresh * 100).toFixed(0)}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Scree Plot */}
        <div className="p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Scree Plot & Cumulative Explained Variance</h3>
            <p className="text-xs text-slate-500">Bars = Individual Variance, Line = Cumulative Retention</p>
          </div>
          <div className="w-full h-[380px]">
            <PlotlyGraph data={screeData} layout={screeLayout} />
          </div>

          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                To capture at least <strong>{(targetVarianceThreshold * 100).toFixed(0)}%</strong> of variance, retain <strong>k = {recommendedK}</strong> component{recommendedK > 1 ? 's' : ''}.
              </span>
            </div>
            <span className="font-mono font-bold text-blue-800">
              {(cumulativeVarianceRatios[recommendedK - 1] * 100).toFixed(1)}% Retained
            </span>
          </div>
        </div>

        {/* Right: Biplot & Loadings */}
        <div className="p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">PCA Biplot: Observations & Feature Loadings</h3>
            <p className="text-xs text-slate-500">Blue Dots = Projected Samples, Red Vectors = Component Loadings</p>
          </div>
          <div className="w-full h-[380px]">
            <PlotlyGraph data={biplotData} layout={biplotLayout} />
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-1">
              Interpreting the Biplot:
            </span>
            <span>
              Red arrows denote original feature vectors in the PC1-PC2 plane. Features pointing in the same direction are positively correlated; orthogonal arrows indicate zero correlation.
            </span>
          </div>
        </div>
      </div>

      {/* Component Loadings & Eigenvalue Table */}
      <div className="p-5 border-t border-slate-200 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Eigenvalue Decomposition & Component Loadings Matrix (W)
        </h3>
        <div className="overflow-x-auto text-xs font-mono">
          <table className="w-full text-left bg-white border border-slate-200 rounded-lg shadow-2xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="p-2.5">Feature Name</th>
                {compLabels.map((lbl, idx) => (
                  <th key={lbl} className="p-2.5">
                    {lbl} (λ={eigenvalues[idx].toFixed(2)})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prepResult.featureNames.map((fn, r) => (
                <tr key={fn} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2.5 font-semibold text-slate-800">{fn}</td>
                  {compLabels.map((_, c) => {
                    const weight = eigenvectors[r][c];
                    return (
                      <td
                        key={c}
                        className={`p-2.5 ${
                          Math.abs(weight) > 0.4 ? 'font-bold text-blue-600' : 'text-slate-600'
                        }`}
                      >
                        {weight.toFixed(4)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-50 font-sans font-semibold text-slate-700">
                <td className="p-2.5">Explained Variance (%)</td>
                {explainedVarianceRatios.map((ratio, idx) => (
                  <td key={idx} className="p-2.5 font-mono text-blue-700">
                    {(ratio * 100).toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-100 font-sans font-semibold text-slate-800">
                <td className="p-2.5">Cumulative Variance (%)</td>
                {cumulativeVarianceRatios.map((cum, idx) => (
                  <td key={idx} className="p-2.5 font-mono text-emerald-700">
                    {(cum * 100).toFixed(2)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
