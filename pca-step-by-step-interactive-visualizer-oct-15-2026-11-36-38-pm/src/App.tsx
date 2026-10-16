import React, { useState, useMemo } from 'react';
import {
  SAMPLE_DATASETS,
  DatasetDef,
  generateSyntheticCorrelatedData
} from './data/sampleDatasets';
import {
  PreprocessingOptions,
  preprocessDataset,
  computePCA
} from './utils/pcaEngine';
import { StepVisualizer } from './components/StepVisualizer';
import { PreprocessingPipelineView } from './components/PreprocessingPipelineView';
import { ScreeAndVarianceView } from './components/ScreeAndVarianceView';
import { ReconstructionView } from './components/ReconstructionView';
import { VivaQuizGuide } from './components/VivaQuizGuide';
import {
  Database,
  Sliders,
  PlayCircle,
  BarChart3,
  RefreshCcw,
  GraduationCap,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Active dataset
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('student_scores');

  // Synthetic dataset controls
  const [synthAngle, setSynthAngle] = useState<number>(35);
  const [synthNoise, setSynthNoise] = useState<number>(0.6);
  const [synthStdX, setSynthStdX] = useState<number>(5);
  const [synthStdY, setSynthStdY] = useState<number>(2);

  // Active top view
  const [activeView, setActiveView] = useState<
    'viva_steps' | 'preprocessing' | 'scree' | 'reconstruction' | 'exam_guide'
  >('viva_steps');

  // Active dataset reference
  const currentDatasetDef = useMemo<DatasetDef>(() => {
    if (selectedDatasetId === 'synthetic_gaussian') {
      const data = generateSyntheticCorrelatedData(
        35,
        15,
        25,
        synthStdX,
        synthStdY,
        synthAngle,
        synthNoise
      );
      return {
        id: 'synthetic_gaussian',
        name: 'Synthetic Correlated Bivariate Gaussian',
        description: 'Dynamically generated Gaussian cluster with controllable orientation angle and covariance structure.',
        category: 'Synthetic AML Generator',
        data,
        defaultFeatures: ['Feature_X', 'Feature_Y'],
        labelColumn: 'Cluster'
      };
    }
    return (
      SAMPLE_DATASETS.find(d => d.id === selectedDatasetId) ||
      SAMPLE_DATASETS[0]
    );
  }, [selectedDatasetId, synthAngle, synthNoise, synthStdX, synthStdY]);

  // Extract all columns and determine numerical vs categorical
  const { allColumns, numericalColumns, categoricalColumns } = useMemo(() => {
    const raw = currentDatasetDef.data;
    if (raw.length === 0) {
      return { allColumns: [], numericalColumns: [], categoricalColumns: [] };
    }
    const cols = Object.keys(raw[0]);
    const numCols: string[] = [];
    const catCols: string[] = [];

    for (const c of cols) {
      // Check if majority of values are convertible to finite numbers
      let validNumCount = 0;
      for (const row of raw) {
        const val = row[c];
        if (val !== null && val !== undefined && val !== '' && !isNaN(Number(val)) && isFinite(Number(val))) {
          validNumCount++;
        }
      }
      if (validNumCount > raw.length * 0.4 && c !== currentDatasetDef.labelColumn) {
        numCols.push(c);
      } else {
        catCols.push(c);
      }
    }

    return { allColumns: cols, numericalColumns: numCols, categoricalColumns: catCols };
  }, [currentDatasetDef]);

  // Preprocessing Options state
  const [preprocessingOptions, setPreprocessingOptions] = useState<PreprocessingOptions>({
    imputationStrategy: 'median',
    standardize: true, // Default: Mode A
    selectedFeatures: currentDatasetDef.defaultFeatures
  });

  // Whenever dataset changes, reset selected features to its defaults
  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    const target =
      id === 'synthetic_gaussian'
        ? { defaultFeatures: ['Feature_X', 'Feature_Y'] }
        : SAMPLE_DATASETS.find(d => d.id === id);

    if (target) {
      setPreprocessingOptions(prev => ({
        ...prev,
        selectedFeatures: target.defaultFeatures
      }));
    }
  };

  // Run Preprocessing pipeline
  const prepResult = useMemo(() => {
    return preprocessDataset(currentDatasetDef.data, preprocessingOptions);
  }, [currentDatasetDef.data, preprocessingOptions]);

  // Run PCA decomposition
  const pcaResult = useMemo(() => {
    if (prepResult.error || prepResult.processedData.length < 2 || prepResult.featureNames.length < 2) {
      return null;
    }
    return computePCA(prepResult);
  }, [prepResult]);

  // Extract labels for coloring
  const rowLabels = useMemo(() => {
    if (!currentDatasetDef.labelColumn) return undefined;
    return currentDatasetDef.data.map(r => String(r[currentDatasetDef.labelColumn!]));
  }, [currentDatasetDef]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Academic Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and project identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    PCA Step-by-Step Visualizer
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Applied Machine Learning
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Mathematical Transformation, Preprocessing & Eigendecomposition Engine
                </p>
              </div>
            </div>

            {/* View Selector Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto py-1">
              {[
                { id: 'viva_steps', label: '8-Step Viva Animation', icon: PlayCircle },
                { id: 'preprocessing', label: 'Preprocessing Pipeline', icon: Sliders },
                { id: 'scree', label: 'Scree & Biplot', icon: BarChart3 },
                { id: 'reconstruction', label: 'Reconstruction & MSE', icon: RefreshCcw },
                { id: 'exam_guide', label: 'Viva Oral Exam Guide', icon: GraduationCap }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Streamlit-Style Dataset & Quick Configuration Control Strip */}
        <section aria-label="Dataset Configuration" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Active AML Benchmark Dataset
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <select
                    value={selectedDatasetId}
                    onChange={e => handleDatasetChange(e.target.value)}
                    className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  >
                    {SAMPLE_DATASETS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category})
                      </option>
                    ))}
                    <option value="synthetic_gaussian">
                      Interactive Correlated Gaussian (Custom Angle & Spread)
                    </option>
                  </select>

                  <span className="text-xs text-slate-500 hidden md:inline">
                    {currentDatasetDef.description}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Preprocessing Mode Toggle */}
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.standardize}
                  onChange={e =>
                    setPreprocessingOptions(prev => ({
                      ...prev,
                      standardize: e.target.checked
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Standardize Features (Mode A)</span>
              </label>

              <div className="h-4 w-px bg-slate-300" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Imputation:</span>
                <select
                  value={preprocessingOptions.imputationStrategy}
                  onChange={e =>
                    setPreprocessingOptions(prev => ({
                      ...prev,
                      imputationStrategy: e.target.value as any
                    }))
                  }
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 font-medium text-slate-800"
                >
                  <option value="median">Median</option>
                  <option value="mean">Mean</option>
                  <option value="drop_rows">Drop Rows</option>
                </select>
              </div>
            </div>
          </div>

          {/* If Synthetic Gaussian is selected, show interactive generation sliders */}
          {selectedDatasetId === 'synthetic_gaussian' && (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-blue-50/50 p-3 rounded-lg">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Correlation Tilt Angle:</span>
                  <span className="font-mono font-bold text-blue-600">{synthAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={synthAngle}
                  onChange={e => setSynthAngle(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Major Spread (σ₁):</span>
                  <span className="font-mono font-bold text-blue-600">{synthStdX}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={synthStdX}
                  onChange={e => setSynthStdX(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Minor Spread (σ₂):</span>
                  <span className="font-mono font-bold text-blue-600">{synthStdY}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={synthStdY}
                  onChange={e => setSynthStdY(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Gaussian Noise:</span>
                  <span className="font-mono font-bold text-blue-600">{synthNoise}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={synthNoise}
                  onChange={e => setSynthNoise(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </section>

        {/* Global Error Fallback */}
        {prepResult.error ? (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">
              Pipeline Validation Error
            </h3>
            <p className="text-sm text-rose-700 max-w-xl mx-auto">
              {prepResult.error}
            </p>
            <p className="text-xs text-slate-500">
              Please adjust your feature selection or imputation strategy in the Preprocessing Pipeline tab.
            </p>
            <button
              onClick={() => setActiveView('preprocessing')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Configure Preprocessing Settings
            </button>
          </div>
        ) : !pcaResult ? (
          <div className="p-8 text-center text-slate-500">Computing PCA...</div>
        ) : (
          <>
            {/* VIEW 1: 8-STEP VIVA ANIMATION CENTERPIECE */}
            {activeView === 'viva_steps' && (
              <StepVisualizer
                prepResult={prepResult}
                pcaResult={pcaResult}
                labels={rowLabels}
                labelColumnName={currentDatasetDef.labelColumn}
                isStandardized={preprocessingOptions.standardize}
              />
            )}

            {/* VIEW 2: PREPROCESSING PIPELINE & VALIDATION */}
            {activeView === 'preprocessing' && (
              <PreprocessingPipelineView
                rawTable={currentDatasetDef.data}
                allColumns={allColumns}
                numericalColumns={numericalColumns}
                categoricalColumns={categoricalColumns}
                options={preprocessingOptions}
                onOptionsChange={setPreprocessingOptions}
                prepResult={prepResult}
              />
            )}

            {/* VIEW 3: SCREE PLOT & BIPLOT */}
            {activeView === 'scree' && (
              <ScreeAndVarianceView
                pcaResult={pcaResult}
                prepResult={prepResult}
                isStandardized={preprocessingOptions.standardize}
              />
            )}

            {/* VIEW 4: RECONSTRUCTION & RESIDUAL ERROR */}
            {activeView === 'reconstruction' && (
              <ReconstructionView
                prepResult={prepResult}
                isStandardized={preprocessingOptions.standardize}
              />
            )}

            {/* VIEW 5: ORAL VIVA EXAM GUIDE */}
            {activeView === 'exam_guide' && <VivaQuizGuide />}
          </>
        )}
      </div>

      {/* University Project Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Applied Machine Learning Viva Centerpiece &bull; Mathematically Verified Eigendecomposition & Preprocessing
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Formulas: Bessel ddof=1 &bull; Jacobi Symmetric Eigh &bull; Orthogonal Projection
          </div>
        </div>
      </footer>
    </div>
  );
}
