import React, { useState } from 'react';
import { solveSymmetricEigen } from '../utils/pcaEngine';
import { GraduationCap, Calculator, ChevronDown, ChevronUp, Check, BookOpen, Lightbulb } from 'lucide-react';

export const VivaQuizGuide: React.FC = () => {
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(0);

  // 2x2 custom matrix practice calculator
  const [a11, setA11] = useState<number>(4);
  const [a12, setA12] = useState<number>(2);
  const [a22, setA22] = useState<number>(3);

  // Solve symmetric 2x2 matrix [[a11, a12], [a12, a22]]
  const testMatrix = [
    [a11, a12],
    [a12, a22]
  ];
  const { eigenvalues, eigenvectors } = solveSymmetricEigen(testMatrix);

  // Trace and Determinant
  const trace = a11 + a22;
  const det = a11 * a22 - a12 * a12;
  const discriminant = trace * trace - 4 * det;

  const vivaQuestions = [
    {
      q: '1. Why must the sample covariance matrix be divided by (n - 1) instead of n?',
      a: "This is Bessel's correction for sample variance. Because the population mean μ is unknown, we substitute the sample mean x̄ calculated from the same data points. This estimator removes 1 degree of freedom. An uncorrected factor of 1/n systematically underestimates the true population variance by a factor of (n - 1)/n.",
      keyFormula: '\\mathbf{C} = \\frac{1}{n - 1} \\sum_{i=1}^{n} (\\mathbf{x}_i - \\bar{\\mathbf{x}})(\\mathbf{x}_i - \\bar{\\mathbf{x}})^T'
    },
    {
      q: '2. How does maximizing projected variance lead to an eigenvalue problem?',
      a: "Let w be a unit vector (wᵀw = 1). The variance of data projected onto w is wᵀ C w. To maximize this subject to ||w|| = 1, we set up the Lagrangian: L(w, λ) = wᵀ C w - λ(wᵀw - 1). Taking the gradient with respect to w and setting to 0 yields: 2Cw - 2λw = 0, which directly simplifies to Cw = λw.",
      keyFormula: '\\mathcal{L}(\\mathbf{w}, \\lambda) = \\mathbf{w}^T \\mathbf{C} \\mathbf{w} - \\lambda (\\mathbf{w}^T \\mathbf{w} - 1) \\implies \\mathbf{C}\\mathbf{w} = \\lambda \\mathbf{w}'
    },
    {
      q: '3. What is the fundamental difference between Eigendecomposition and SVD for PCA?',
      a: "Eigendecomposition requires explicitly computing the p × p covariance matrix C = XᵀX / (n - 1), which can suffer from numerical loss of precision when squaring small numbers, and scales as O(n p²). Singular Value Decomposition (SVD) factors X directly as U Σ Vᵀ without ever calculating XᵀX. The right singular vectors V are identical to the eigenvectors of C, and singular values σ_i relate to eigenvalues by λ_i = σ_i² / (n - 1).",
      keyFormula: '\\mathbf{X}_{\\text{proc}} = \\mathbf{U} \\mathbf{\\Sigma} \\mathbf{V}^T \\implies \\mathbf{C} = \\frac{1}{n-1}\\mathbf{V} \\mathbf{\\Sigma}^2 \\mathbf{V}^T'
    },
    {
      q: '4. When does PCA fail or give misleading representations?',
      a: "PCA is a linear orthogonal transformation. It fails when: (1) Data lies on a non-linear manifold (e.g., Swiss roll or concentric circles, where Kernel PCA or t-SNE/UMAP is required); (2) Severe outliers distort the sample mean and covariance; (3) When the largest variance direction does not align with the class separability direction (LDA is preferred for supervised separation).",
      keyFormula: '\\text{Linearity constraint: } \\mathbf{y} = \\mathbf{W}^T \\mathbf{x}'
    },
    {
      q: '5. Why are eigenvalues of a sample covariance matrix always non-negative?',
      a: "The sample covariance matrix is positive semi-definite (C ⪰ 0). For any non-zero vector v, the quadratic form vᵀ C v = vᵀ (XᵀX / (n - 1)) v = ||Xv||² / (n - 1) ≥ 0, which is a squared Euclidean norm divided by positive n - 1. Since eigenvalues satisfy λ = vᵀ C v / ||v||², every eigenvalue must be ≥ 0.",
      keyFormula: '\\mathbf{v}^T \\mathbf{C} \\mathbf{v} = \\frac{\\|\\mathbf{X}\\mathbf{v}\\|^2}{n - 1} \\ge 0 \\implies \\lambda_i \\ge 0'
    },
    {
      q: '6. What happens if two eigenvalues are identical (degenerate eigenvalues)?',
      a: "If λ₁ = λ₂, the data has spherical or circular dispersion in that 2D subspace (an isotropic circular disk instead of an ellipse). Any pair of orthogonal vectors in that eigenspace serves as valid eigenvectors. The orientation of the principal axes is not unique, but the subspace spanned by them remains well-defined.",
      keyFormula: '\\lambda_1 = \\lambda_2 \\implies \\mathbf{C} = \\lambda \\mathbf{I} \\text{ in that subspace}'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" data-testid="viva-guide-card">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> University Viva Preparation
            </span>
            <span className="text-xs text-slate-500">Applied Machine Learning Core Theory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Professor Viva Defense & Theoretical Proofs
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Model questions, rigorous derivations, and an interactive 2×2 hand-calculation matrix solver.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Questions Accordion (7 cols) */}
        <div className="lg:col-span-7 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Essential Oral Examination Questions</h3>
          </div>

          <div className="space-y-2">
            {vivaQuestions.map((item, idx) => {
              const isOpen = openQuestionIdx === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg overflow-hidden transition-all bg-white"
                >
                  <button
                    onClick={() => setOpenQuestionIdx(isOpen ? null : idx)}
                    className="w-full text-left p-3.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-3.5 pt-0 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-700 space-y-2.5">
                      <p className="leading-relaxed">{item.a}</p>
                      <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] text-center">
                        <code>{item.keyFormula}</code>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive 2x2 Matrix Solver (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-slate-50/40 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Interactive 2×2 Hand-Calculation Solver
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Examiners frequently ask candidates to compute eigenvalues of a small 2×2 covariance matrix by hand on the whiteboard:
          </p>

          {/* Matrix Input Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Symmetric Covariance Matrix C:
            </span>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-center font-mono">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">C₁₁ (Var X₁)</label>
                <input
                  type="number"
                  step="0.5"
                  value={a11}
                  onChange={e => setA11(parseFloat(e.target.value) || 0)}
                  className="w-full text-center p-2 border border-slate-300 rounded font-bold text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">C₁₂ (Cov X₁,X₂)</label>
                <input
                  type="number"
                  step="0.5"
                  value={a12}
                  onChange={e => setA12(parseFloat(e.target.value) || 0)}
                  className="w-full text-center p-2 border border-slate-300 rounded font-bold text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">C₂₁ = C₁₂</label>
                <input
                  type="number"
                  disabled
                  value={a12}
                  className="w-full text-center p-2 border border-slate-200 rounded font-bold text-sm bg-slate-100 text-slate-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">C₂₂ (Var X₂)</label>
                <input
                  type="number"
                  step="0.5"
                  value={a22}
                  onChange={e => setA22(parseFloat(e.target.value) || 0)}
                  className="w-full text-center p-2 border border-slate-300 rounded font-bold text-sm bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Step-by-Step Characteristic Equation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs font-mono">
            <span className="text-xs font-sans font-bold text-slate-800 block">
              Analytical Characteristic Derivation:
            </span>
            <div className="p-2 bg-slate-50 rounded text-slate-700 space-y-1 text-[11px]">
              <div>det(C - λI) = (C₁₁ - λ)(C₂₂ - λ) - C₁₂² = 0</div>
              <div>λ² - Tr(C)λ + det(C) = 0</div>
              <div>Tr(C) = {trace.toFixed(2)}, det(C) = {det.toFixed(2)}</div>
              <div>Δ = Tr² - 4·det = {discriminant.toFixed(2)} ≥ 0</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-sans font-semibold text-slate-700">λ₁ (Max Variance):</span>
              <span className="font-bold text-blue-600">{eigenvalues[0].toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-semibold text-slate-700">λ₂ (Min Variance):</span>
              <span className="font-bold text-amber-600">{eigenvalues[1].toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-semibold text-slate-700">Eigenvector w₁:</span>
              <span className="font-bold text-slate-900">
                [{eigenvectors[0][0].toFixed(3)}, {eigenvectors[1][0].toFixed(3)}]ᵀ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
