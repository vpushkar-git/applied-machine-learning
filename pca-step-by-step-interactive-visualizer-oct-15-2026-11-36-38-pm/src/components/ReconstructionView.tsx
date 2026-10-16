import React, { useState } from 'react';
import { PreprocessingResult, computePCA } from '../utils/pcaEngine';
import { PlotlyGraph } from './PlotlyGraph';
import { RefreshCw, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';

interface ReconstructionViewProps {
  prepResult: PreprocessingResult;
  isStandardized: boolean;
}

export const ReconstructionView: React.FC<ReconstructionViewProps> = ({
  prepResult,
  isStandardized
}) => {
  const maxComponents = prepResult.featureNames.length;
  const [selectedK, setSelectedK] = useState<number>(1);
  const [previewRowIdx, setPreviewRowIdx] = useState<number>(0);

  // Compute PCA with selected k
  const pcaK = computePCA(prepResult, selectedK);
  const { cleanedRawData, featureNames, means, stdDevs } = prepResult;
  const n = cleanedRawData.length;
  const p = featureNames.length;

  // Comparison for first 10 rows
  const rowsToDisplay = Math.min(n, 8);

  // Reconstruction scatter plot: Actual vs Reconstructed for a selected feature
  const [plotFeatureIdx, setPlotFeatureIdx] = useState<number>(0);

  const actualFeatureVals = cleanedRawData.map(r => r[plotFeatureIdx]);
  const reconFeatureVals = pcaK.reconstructedOriginal.map(r => r[plotFeatureIdx]);

  const minVal = Math.min(...actualFeatureVals, ...reconFeatureVals);
  const maxVal = Math.max(...actualFeatureVals, ...reconFeatureVals);

  const parityPlotData: Plotly.Data[] = [
    // 45-degree identity line (ideal reconstruction)
    {
      x: [minVal, maxVal],
      y: [minVal, maxVal],
      mode: 'lines',
      type: 'scatter',
      name: 'Ideal Identity (x̂ = x)',
      line: { color: '#94a3b8', dash: 'dash', width: 2 }
    },
    // Actual vs Reconstructed scatter
    {
      x: actualFeatureVals,
      y: reconFeatureVals,
      mode: 'markers',
      type: 'scatter',
      name: `Reconstructed Points (k=${selectedK})`,
      text: cleanedRawData.map((_, i) =>
        `Sample ${i + 1}<br>Actual: ${actualFeatureVals[i].toFixed(2)}<br>Recon: ${reconFeatureVals[i].toFixed(2)}`
      ),
      hoverinfo: 'text',
      marker: {
        size: 8,
        color: '#2563eb',
        line: { color: '#1e40af', width: 1.5 }
      }
    }
  ];

  const parityPlotLayout: Partial<Plotly.Layout> = {
    xaxis: {
      title: { text: `Original Actual Value (${featureNames[plotFeatureIdx]})` },
      gridcolor: '#e2e8f0'
    },
    yaxis: {
      title: { text: `Reconstructed Value x̂ (using k=${selectedK})` },
      gridcolor: '#e2e8f0'
    },
    margin: { l: 50, r: 25, t: 20, b: 50 },
    legend: { orientation: 'h', y: -0.2 }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" data-testid="reconstruction-card">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              Lossy Compression & Recovery
            </span>
            <span className="text-xs text-slate-500 font-mono">
              k = {selectedK} of {maxComponents} components
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Data Reconstruction & Residual Error Space
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Evaluate information preservation and reconstruction mean squared error (MSE) in original units.
          </p>
        </div>

        {/* K slider / buttons */}
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-700">Retained Components (k):</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxComponents }, (_, i) => i + 1).map(k => (
              <button
                key={k}
                onClick={() => setSelectedK(k)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  selectedK === k
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MSE and Metrics Banner */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Reconstruction Status</span>
            <h4 className="text-sm font-semibold">
              {selectedK === maxComponents
                ? 'Exact Lossless Inversion (0.00 MSE)'
                : `Lossy Projection (${((1 - pcaK.cumulativeVarianceRatios[selectedK - 1]) * 100).toFixed(1)}% Variance Discarded)`}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">ORIGINAL SPACE MSE</span>
            <span className={`text-base font-bold ${pcaK.reconstructionMSE < 1e-4 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pcaK.reconstructionMSE.toFixed(4)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">CUMULATIVE VARIANCE</span>
            <span className="text-base font-bold text-blue-400">
              {(pcaK.cumulativeVarianceRatios[selectedK - 1] * 100).toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">SCALE REVERSAL</span>
            <span className="text-base font-bold text-emerald-400">
              {isStandardized ? '× σ + μ' : '+ μ'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Identity / Parity Plot (6 cols) */}
        <div className="lg:col-span-6 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Reconstruction Fidelity & Parity ({featureNames[plotFeatureIdx]})
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of actual features vs decoded projection using k={selectedK}
              </p>
            </div>
            <select
              value={plotFeatureIdx}
              onChange={e => setPlotFeatureIdx(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium"
            >
              {featureNames.map((fn, idx) => (
                <option key={fn} value={idx}>
                  {fn}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full h-[380px]">
            <PlotlyGraph data={parityPlotData} layout={parityPlotLayout} />
          </div>

          <p className="text-[11px] text-slate-500 mt-2">
            Points falling exactly on the dashed diagonal indicate zero reconstruction error for that observation.
          </p>
        </div>

        {/* Right: Tabular Comparison of Actual vs Reconstructed (6 cols) */}
        <div className="lg:col-span-6 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Observation-Level Comparison (First {rowsToDisplay} Rows)
            </h3>
            <span className="text-[11px] text-slate-500">
              Comparing Actual x vs Reconstructed x̂
            </span>
          </div>

          <div className="overflow-x-auto text-xs font-mono max-h-[420px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-2">Sample</th>
                  <th className="p-2">Feature</th>
                  <th className="p-2">Original (x)</th>
                  <th className="p-2">Recon (x̂)</th>
                  <th className="p-2">Residual (x - x̂)</th>
                  <th className="p-2">Squared Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {cleanedRawData.slice(0, rowsToDisplay).flatMap((row, rIdx) => {
                  const reconRow = pcaK.reconstructedOriginal[rIdx];
                  return featureNames.map((feat, fIdx) => {
                    const origVal = row[fIdx];
                    const recVal = reconRow[fIdx];
                    const diff = origVal - recVal;
                    const sqErr = diff ** 2;

                    return (
                      <tr
                        key={`${rIdx}-${fIdx}`}
                        className={fIdx === 0 && rIdx !== 0 ? 'border-t-2 border-slate-200' : ''}
                      >
                        <td className="p-2 font-medium text-slate-500">
                          {fIdx === 0 ? `S${rIdx + 1}` : ''}
                        </td>
                        <td className="p-2 font-semibold text-slate-800">{feat}</td>
                        <td className="p-2 text-slate-700">{origVal.toFixed(2)}</td>
                        <td className="p-2 text-blue-700 font-semibold">{recVal.toFixed(2)}</td>
                        <td className="p-2 text-slate-600">{diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}</td>
                        <td className="p-2 text-rose-600 font-semibold">{sqErr.toFixed(3)}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
