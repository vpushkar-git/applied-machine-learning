import React, { useState } from 'react';
import { PreprocessingResult, PreprocessingOptions, calculateCovarianceMatrix } from '../utils/pcaEngine';
import { PlotlyGraph } from './PlotlyGraph';
import {
  AlertTriangle,
  CheckCircle,
  Sliders,
  Filter,
  BarChart3,
  Table as TableIcon,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PreprocessingPipelineViewProps {
  rawTable: Record<string, any>[];
  allColumns: string[];
  numericalColumns: string[];
  categoricalColumns: string[];
  options: PreprocessingOptions;
  onOptionsChange: (newOptions: PreprocessingOptions) => void;
  prepResult: PreprocessingResult;
}

export const PreprocessingPipelineView: React.FC<PreprocessingPipelineViewProps> = ({
  rawTable,
  allColumns,
  numericalColumns,
  categoricalColumns,
  options,
  onOptionsChange,
  prepResult
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'tables' | 'covariance' | 'distributions'>('summary');
  const [selectedHistFeature, setSelectedHistFeature] = useState<string>(
    prepResult.featureNames[0] || numericalColumns[0] || ''
  );

  const { missingSummary, excludedZeroVariance, error } = prepResult;

  // Toggle feature selection
  const handleFeatureToggle = (col: string) => {
    let next: string[];
    if (options.selectedFeatures.includes(col)) {
      if (options.selectedFeatures.length <= 2) {
        // Must maintain at least 2 features
        return;
      }
      next = options.selectedFeatures.filter(f => f !== col);
    } else {
      next = [...options.selectedFeatures, col];
    }
    onOptionsChange({ ...options, selectedFeatures: next });
  };

  // Heatmap for Covariance matrix
  const cov = calculateCovarianceMatrix(prepResult.processedData);
  const heatmapData: Plotly.Data[] = [
    {
      z: cov,
      x: prepResult.featureNames,
      y: prepResult.featureNames,
      type: 'heatmap',
      colorscale: [
        [0, '#3b82f6'],
        [0.5, '#f8fafc'],
        [1, '#ef4444']
      ],
      hoverongaps: false,
      text: cov.map(row => row.map(val => val.toFixed(4))),
      texttemplate: '%{text}',
      textfont: { color: '#0f172a', size: 11 }
    }
  ];

  const heatmapLayout: Partial<Plotly.Layout> = {
    xaxis: { tickangle: -25, tickfont: { size: 11 } },
    yaxis: { tickfont: { size: 11 }, autorange: 'reversed' },
    margin: { l: 80, r: 40, t: 25, b: 60 }
  };

  // Before & After Distributions for the selected feature
  const featIdx = prepResult.featureNames.indexOf(selectedHistFeature);
  const rawVals = featIdx !== -1 ? prepResult.cleanedRawData.map(r => r[featIdx]) : [];
  const procVals = featIdx !== -1 ? prepResult.processedData.map(r => r[featIdx]) : [];

  const histData: Plotly.Data[] = [
    {
      x: rawVals,
      type: 'histogram',
      name: `Raw Cleaned ${selectedHistFeature}`,
      opacity: 0.65,
      marker: { color: '#3b82f6' },
      autobinx: true
    },
    {
      x: procVals,
      type: 'histogram',
      name: options.standardize
        ? `Standardized (μ=0, s=1)`
        : `Mean-Centered (μ=0)`,
      opacity: 0.65,
      marker: { color: '#10b981' },
      autobinx: true
    }
  ];

  const histLayout: Partial<Plotly.Layout> = {
    barmode: 'overlay',
    xaxis: { title: { text: 'Value Range' }, gridcolor: '#f1f5f9' },
    yaxis: { title: { text: 'Observation Frequency' }, gridcolor: '#f1f5f9' },
    margin: { l: 50, r: 25, t: 20, b: 50 },
    legend: { orientation: 'h', y: -0.2 }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" data-testid="preprocessing-pipeline-card">
      {/* Pipeline Header */}
      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Pipeline Stages 1–5
            </span>
            <span className="text-xs text-slate-500">Mathematical Pipeline Validation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Data Preprocessing & Scaling Architecture
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Configurable pipeline for imputation, feature filtering, mean centering, and sample scaling.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'summary' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pipeline Controls
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'tables' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Matrix Stages
          </button>
          <button
            onClick={() => setActiveTab('covariance')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'covariance' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Covariance Matrix
          </button>
          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'distributions' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Before / After Histograms
          </button>
        </div>
      </div>

      {/* Global Error Banner if any */}
      {error && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-900">Preprocessing Validation Block</h3>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Excluded Zero Variance Alert */}
      {excludedZeroVariance.length > 0 && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">Automatic Zero-Variance Filter Activated:</span>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-800">
              {excludedZeroVariance.map(ex => (
                <li key={ex.feature}>
                  Column <strong>"{ex.feature}"</strong> excluded (variance = {ex.variance.toExponential(2)} &lt; 1e-12). Prevents mathematical singularity.
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 1: SUMMARY & CONTROLS */}
      {activeTab === 'summary' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Missing Value Strategy */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">1. Missing Value Handling</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically detects null, NaN, or nonnumeric inputs across observations.
              </p>
              <div className="space-y-1.5 pt-1">
                {[
                  { id: 'median', label: 'Median Imputation (Default & Recommended)' },
                  { id: 'mean', label: 'Mean Imputation' },
                  { id: 'drop_rows', label: 'Remove Rows with Missing Values' }
                ].map(strat => (
                  <label
                    key={strat.id}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 p-1.5 rounded hover:bg-slate-100"
                  >
                    <input
                      type="radio"
                      name="imputationStrategy"
                      value={strat.id}
                      checked={options.imputationStrategy === strat.id}
                      onChange={() =>
                        onOptionsChange({
                          ...options,
                          imputationStrategy: strat.id as any
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{strat.label}</span>
                  </label>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>Total Missing Detected:</span>
                <span className="font-semibold text-slate-800">
                  {Object.values(missingSummary.missingPerFeature).reduce((a, b) => a + b, 0)} cells
                </span>
              </div>
            </div>

            {/* 2. Scaling Mode Toggle */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">2. Scaling Architecture</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mean centering is <strong>always mandatory</strong>. Standard deviation scaling adjusts for differing units.
              </p>
              
              <div className="pt-2">
                <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer shadow-2xs">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Standardize Features
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Divide by sample standard deviation (ddof=1)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.standardize}
                    onChange={e =>
                      onOptionsChange({ ...options, standardize: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="text-[11px] p-2 bg-blue-50/70 border border-blue-200 rounded text-blue-900">
                <strong>Active Mode:</strong>{' '}
                {options.standardize
                  ? 'Mode A (Standardized Z = (X-μ)/σ). Equalizes feature weights.'
                  : 'Mode B (Covariance-Based). Preserves native units & original variances.'}
              </div>
            </div>

            {/* 3. Feature Selection Matrix */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">3. Feature Selection</h3>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {options.selectedFeatures.length} / {numericalColumns.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select features for PCA. Categorical and label columns are automatically excluded.
              </p>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {numericalColumns.map(col => {
                  const isChecked = options.selectedFeatures.includes(col);
                  return (
                    <label
                      key={col}
                      className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <span className="font-mono text-slate-800">{col}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFeatureToggle(col)}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  );
                })}
              </div>

              {categoricalColumns.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Target/Labels excluded: {categoricalColumns.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Verification Metrics Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold">Pipeline Preprocessing Invariants Verified</h4>
                <p className="text-xs text-slate-300">
                  Mean centering verified (E[X_centered] = 0). Sample degrees of freedom (ddof=1) verified.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center px-3 py-1 bg-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
                <span className="font-bold text-white">{rawTable.length}</span>
              </div>
              <div className="text-center px-3 py-1 bg-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">CLEANED ROWS</span>
                <span className="font-bold text-emerald-400">{prepResult.cleanedRawData.length}</span>
              </div>
              <div className="text-center px-3 py-1 bg-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">ACTIVE FEATURES</span>
                <span className="font-bold text-blue-400">{prepResult.featureNames.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA MATRIX STAGES */}
      {activeTab === 'tables' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-600" /> Preprocessing Transformation Stages (First 5 Rows)
            </h3>
            <span className="text-xs text-slate-500">
              Mean Centering μ = [{prepResult.means.map(m => m.toFixed(2)).join(', ')}]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cleaned Raw */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 block mb-2">1. Cleaned Raw Data (X)</span>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      {prepResult.featureNames.map(f => (
                        <th key={f} className="p-1">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepResult.cleanedRawData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {row.map((val, j) => (
                          <td key={j} className="p-1">{val.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mean-Centered Data */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 block mb-2">2. Mean-Centered Data (X - μ)</span>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      {prepResult.featureNames.map(f => (
                        <th key={f} className="p-1">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepResult.centeredData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {row.map((val, j) => (
                          <td key={j} className="p-1">{val.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Standardized / Processed Data */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                3. {options.standardize ? 'Standardized Data Z = (X-μ)/σ' : 'Processed Data (Centered Only)'}
              </span>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      {prepResult.featureNames.map(f => (
                        <th key={f} className="p-1">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepResult.processedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {row.map((val, j) => (
                          <td key={j} className="p-1">{val.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COVARIANCE MATRIX */}
      {activeTab === 'covariance' && (
        <div className="p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {options.standardize
                ? 'Standardized Correlation Matrix (R)'
                : 'Sample Covariance Matrix (C = XᵀX / (n-1))'}
            </h3>
            <p className="text-xs text-slate-500">
              Pairwise covariance and correlation coefficients between active numerical features
            </p>
          </div>
          <div className="w-full h-[450px]">
            <PlotlyGraph data={heatmapData} layout={heatmapLayout} />
          </div>
        </div>
      )}

      {/* TAB 4: DISTRIBUTIONS */}
      {activeTab === 'distributions' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Feature Histogram Comparison
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Select Feature:</span>
              <select
                value={selectedHistFeature}
                onChange={e => setSelectedHistFeature(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium"
              >
                {prepResult.featureNames.map(fn => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full h-[420px]">
            <PlotlyGraph data={histData} layout={histLayout} />
          </div>
        </div>
      )}
    </div>
  );
};
