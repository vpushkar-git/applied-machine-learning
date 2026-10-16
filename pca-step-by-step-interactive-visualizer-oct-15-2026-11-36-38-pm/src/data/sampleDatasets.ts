/**
 * Pre-curated datasets for Applied Machine Learning PCA demonstration
 */

export interface DatasetDef {
  id: string;
  name: string;
  description: string;
  category: string;
  data: Record<string, any>[];
  defaultFeatures: string[];
  labelColumn?: string;
}

export const SAMPLE_DATASETS: DatasetDef[] = [
  {
    id: 'student_scores',
    name: 'Student Exam Performance (Viva Demo)',
    description: '30 students evaluated across Math, Physics, Literature, and Writing. Demonstrates correlated STEM vs Humanities clusters, with realistic missing values for preprocessing.',
    category: 'Academic & Educational',
    defaultFeatures: ['Math_Score', 'Physics_Score', 'Literature_Score'],
    labelColumn: 'Major_Track',
    data: [
      { Student_ID: 'S01', Math_Score: 88, Physics_Score: 84, Literature_Score: 62, Writing_Score: 65, Major_Track: 'Engineering' },
      { Student_ID: 'S02', Math_Score: 92, Physics_Score: 90, Literature_Score: 70, Writing_Score: 68, Major_Track: 'Engineering' },
      { Student_ID: 'S03', Math_Score: 78, Physics_Score: 80, Literature_Score: 65, Writing_Score: 60, Major_Track: 'Engineering' },
      { Student_ID: 'S04', Math_Score: 95, Physics_Score: 96, Literature_Score: 72, Writing_Score: 74, Major_Track: 'Engineering' },
      { Student_ID: 'S05', Math_Score: 85, Physics_Score: null, Literature_Score: 68, Writing_Score: 66, Major_Track: 'Engineering' }, // missing value
      { Student_ID: 'S06', Math_Score: 90, Physics_Score: 87, Literature_Score: 64, Writing_Score: 62, Major_Track: 'Engineering' },
      { Student_ID: 'S07', Math_Score: 60, Physics_Score: 65, Literature_Score: 89, Writing_Score: 92, Major_Track: 'Humanities' },
      { Student_ID: 'S08', Math_Score: 65, Physics_Score: 62, Literature_Score: 94, Writing_Score: 95, Major_Track: 'Humanities' },
      { Student_ID: 'S09', Math_Score: 58, Physics_Score: 59, Literature_Score: 88, Writing_Score: 86, Major_Track: 'Humanities' },
      { Student_ID: 'S10', Math_Score: 70, Physics_Score: 68, Literature_Score: 91, Writing_Score: 90, Major_Track: 'Humanities' },
      { Student_ID: 'S11', Math_Score: 62, Physics_Score: 60, Literature_Score: null, Writing_Score: 88, Major_Track: 'Humanities' }, // missing value
      { Student_ID: 'S12', Math_Score: 55, Physics_Score: 58, Literature_Score: 96, Writing_Score: 98, Major_Track: 'Humanities' },
      { Student_ID: 'S13', Math_Score: 75, Physics_Score: 74, Literature_Score: 76, Writing_Score: 78, Major_Track: 'Economics' },
      { Student_ID: 'S14', Math_Score: 82, Physics_Score: 79, Literature_Score: 74, Writing_Score: 75, Major_Track: 'Economics' },
      { Student_ID: 'S15', Math_Score: 80, Physics_Score: 82, Literature_Score: 80, Writing_Score: 81, Major_Track: 'Economics' },
      { Student_ID: 'S16', Math_Score: 72, Physics_Score: 70, Literature_Score: 82, Writing_Score: 80, Major_Track: 'Economics' },
      { Student_ID: 'S17', Math_Score: 84, Physics_Score: 81, Literature_Score: 78, Writing_Score: 76, Major_Track: 'Economics' },
      { Student_ID: 'S18', Math_Score: 79, Physics_Score: 77, Literature_Score: 79, Writing_Score: 79, Major_Track: 'Economics' },
      { Student_ID: 'S19', Math_Score: 94, Physics_Score: 93, Literature_Score: 60, Writing_Score: 61, Major_Track: 'Engineering' },
      { Student_ID: 'S20', Math_Score: 89, Physics_Score: 91, Literature_Score: 66, Writing_Score: 64, Major_Track: 'Engineering' },
      { Student_ID: 'S21', Math_Score: 59, Physics_Score: 63, Literature_Score: 92, Writing_Score: 91, Major_Track: 'Humanities' },
      { Student_ID: 'S22', Math_Score: 64, Physics_Score: 66, Literature_Score: 87, Writing_Score: 89, Major_Track: 'Humanities' },
      { Student_ID: 'S23', Math_Score: 76, Physics_Score: 75, Literature_Score: 85, Writing_Score: 83, Major_Track: 'Economics' },
      { Student_ID: 'S24', Math_Score: 81, Physics_Score: 83, Literature_Score: 77, Writing_Score: 75, Major_Track: 'Economics' },
      { Student_ID: 'S25', Math_Score: 91, Physics_Score: 89, Literature_Score: 69, Writing_Score: 70, Major_Track: 'Engineering' },
      { Student_ID: 'S26', Math_Score: 54, Physics_Score: 57, Literature_Score: 95, Writing_Score: 94, Major_Track: 'Humanities' },
      { Student_ID: 'S27', Math_Score: 73, Physics_Score: 71, Literature_Score: 81, Writing_Score: 78, Major_Track: 'Economics' },
      { Student_ID: 'S28', Math_Score: 86, Physics_Score: 88, Literature_Score: 65, Writing_Score: 67, Major_Track: 'Engineering' },
      { Student_ID: 'S29', Math_Score: 61, Physics_Score: 64, Literature_Score: 90, Writing_Score: 93, Major_Track: 'Humanities' },
      { Student_ID: 'S30', Math_Score: 77, Physics_Score: 78, Literature_Score: 75, Writing_Score: 77, Major_Track: 'Economics' },
    ]
  },
  {
    id: 'iris_subset',
    name: "Fisher's Iris Flower Morphometrics",
    description: "Classic benchmark in pattern recognition. Features: Sepal Length, Sepal Width, Petal Length, and Petal Width across 3 botanical species.",
    category: 'Benchmark Science',
    defaultFeatures: ['Sepal_Length', 'Sepal_Width', 'Petal_Length'],
    labelColumn: 'Species',
    data: [
      { Sepal_Length: 5.1, Sepal_Width: 3.5, Petal_Length: 1.4, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 4.9, Sepal_Width: 3.0, Petal_Length: 1.4, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 4.7, Sepal_Width: 3.2, Petal_Length: 1.3, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 4.6, Sepal_Width: 3.1, Petal_Length: 1.5, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 5.0, Sepal_Width: 3.6, Petal_Length: 1.4, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 5.4, Sepal_Width: 3.9, Petal_Length: 1.7, Petal_Width: 0.4, Species: 'Setosa' },
      { Sepal_Length: 4.6, Sepal_Width: 3.4, Petal_Length: 1.4, Petal_Width: 0.3, Species: 'Setosa' },
      { Sepal_Length: 5.0, Sepal_Width: 3.4, Petal_Length: 1.5, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 4.4, Sepal_Width: 2.9, Petal_Length: 1.4, Petal_Width: 0.2, Species: 'Setosa' },
      { Sepal_Length: 4.9, Sepal_Width: 3.1, Petal_Length: 1.5, Petal_Width: 0.1, Species: 'Setosa' },
      { Sepal_Length: 7.0, Sepal_Width: 3.2, Petal_Length: 4.7, Petal_Width: 1.4, Species: 'Versicolor' },
      { Sepal_Length: 6.4, Sepal_Width: 3.2, Petal_Length: 4.5, Petal_Width: 1.5, Species: 'Versicolor' },
      { Sepal_Length: 6.9, Sepal_Width: 3.1, Petal_Length: 4.9, Petal_Width: 1.5, Species: 'Versicolor' },
      { Sepal_Length: 5.5, Sepal_Width: 2.3, Petal_Length: 4.0, Petal_Width: 1.3, Species: 'Versicolor' },
      { Sepal_Length: 6.5, Sepal_Width: 2.8, Petal_Length: 4.6, Petal_Width: 1.5, Species: 'Versicolor' },
      { Sepal_Length: 5.7, Sepal_Width: 2.8, Petal_Length: 4.5, Petal_Width: 1.3, Species: 'Versicolor' },
      { Sepal_Length: 6.3, Sepal_Width: 3.3, Petal_Length: 4.7, Petal_Width: 1.6, Species: 'Versicolor' },
      { Sepal_Length: 4.9, Sepal_Width: 2.4, Petal_Length: 3.3, Petal_Width: 1.0, Species: 'Versicolor' },
      { Sepal_Length: 6.6, Sepal_Width: 2.9, Petal_Length: 4.6, Petal_Width: 1.3, Species: 'Versicolor' },
      { Sepal_Length: 5.2, Sepal_Width: 2.7, Petal_Length: 3.9, Petal_Width: 1.4, Species: 'Versicolor' },
      { Sepal_Length: 6.3, Sepal_Width: 3.3, Petal_Length: 6.0, Petal_Width: 2.5, Species: 'Virginica' },
      { Sepal_Length: 5.8, Sepal_Width: 2.7, Petal_Length: 5.1, Petal_Width: 1.9, Species: 'Virginica' },
      { Sepal_Length: 7.1, Sepal_Width: 3.0, Petal_Length: 5.9, Petal_Width: 2.1, Species: 'Virginica' },
      { Sepal_Length: 6.3, Sepal_Width: 2.9, Petal_Length: 5.6, Petal_Width: 1.8, Species: 'Virginica' },
      { Sepal_Length: 6.5, Sepal_Width: 3.0, Petal_Length: 5.8, Petal_Width: 2.2, Species: 'Virginica' },
      { Sepal_Length: 7.6, Sepal_Width: 3.0, Petal_Length: 6.6, Petal_Width: 2.1, Species: 'Virginica' },
      { Sepal_Length: 4.9, Sepal_Width: 2.5, Petal_Length: 4.5, Petal_Width: 1.7, Species: 'Virginica' },
      { Sepal_Length: 7.3, Sepal_Width: 2.9, Petal_Length: 6.3, Petal_Width: 1.8, Species: 'Virginica' },
      { Sepal_Length: 6.7, Sepal_Width: 2.5, Petal_Length: 5.8, Petal_Width: 1.8, Species: 'Virginica' },
      { Sepal_Length: 7.2, Sepal_Width: 3.6, Petal_Length: 6.1, Petal_Width: 2.5, Species: 'Virginica' },
    ]
  },
  {
    id: 'wine_chemistry',
    name: 'Wine Chemical Profiling',
    description: 'Chemical analysis of Italian cultivars. Measures Alcohol, Malic Acid, Ash, Alkalinity, and Color Intensity.',
    category: 'Chemistry & Food Science',
    defaultFeatures: ['Alcohol', 'Malic_Acid', 'Ash', 'Color_Intensity'],
    labelColumn: 'Cultivar',
    data: [
      { Alcohol: 14.23, Malic_Acid: 1.71, Ash: 2.43, Color_Intensity: 5.64, Cultivar: 'Barolo' },
      { Alcohol: 13.20, Malic_Acid: 1.78, Ash: 2.14, Color_Intensity: 4.38, Cultivar: 'Barolo' },
      { Alcohol: 13.16, Malic_Acid: 2.36, Ash: 2.67, Color_Intensity: 5.68, Cultivar: 'Barolo' },
      { Alcohol: 14.37, Malic_Acid: 1.95, Ash: 2.50, Color_Intensity: 7.80, Cultivar: 'Barolo' },
      { Alcohol: 13.24, Malic_Acid: 2.59, Ash: 2.87, Color_Intensity: 4.32, Cultivar: 'Barolo' },
      { Alcohol: 14.20, Malic_Acid: 1.76, Ash: 2.45, Color_Intensity: 6.75, Cultivar: 'Barolo' },
      { Alcohol: 14.39, Malic_Acid: 1.87, Ash: 2.45, Color_Intensity: 5.25, Cultivar: 'Barolo' },
      { Alcohol: 14.06, Malic_Acid: 2.15, Ash: 2.61, Color_Intensity: 5.05, Cultivar: 'Barolo' },
      { Alcohol: 12.37, Malic_Acid: 0.94, Ash: 1.36, Color_Intensity: 2.12, Cultivar: 'Grignolino' },
      { Alcohol: 12.33, Malic_Acid: 1.10, Ash: 2.28, Color_Intensity: 3.27, Cultivar: 'Grignolino' },
      { Alcohol: 12.64, Malic_Acid: 1.36, Ash: 2.02, Color_Intensity: 5.75, Cultivar: 'Grignolino' },
      { Alcohol: 13.67, Malic_Acid: 1.25, Ash: 1.92, Color_Intensity: 3.80, Cultivar: 'Grignolino' },
      { Alcohol: 12.37, Malic_Acid: 1.13, Ash: 2.30, Color_Intensity: 4.45, Cultivar: 'Grignolino' },
      { Alcohol: 12.17, Malic_Acid: 1.45, Ash: 2.53, Color_Intensity: 2.95, Cultivar: 'Grignolino' },
      { Alcohol: 12.37, Malic_Acid: 1.21, Ash: 2.56, Color_Intensity: 2.76, Cultivar: 'Grignolino' },
      { Alcohol: 13.11, Malic_Acid: 1.01, Ash: 1.70, Color_Intensity: 3.25, Cultivar: 'Grignolino' },
      { Alcohol: 12.82, Malic_Acid: 3.37, Ash: 2.30, Color_Intensity: 6.90, Cultivar: 'Barbera' },
      { Alcohol: 13.58, Malic_Acid: 2.58, Ash: 2.69, Color_Intensity: 8.66, Cultivar: 'Barbera' },
      { Alcohol: 13.40, Malic_Acid: 3.91, Ash: 2.48, Color_Intensity: 7.30, Cultivar: 'Barbera' },
      { Alcohol: 12.84, Malic_Acid: 2.96, Ash: 2.61, Color_Intensity: 9.60, Cultivar: 'Barbera' },
      { Alcohol: 12.93, Malic_Acid: 2.81, Ash: 2.70, Color_Intensity: 10.80, Cultivar: 'Barbera' },
      { Alcohol: 13.36, Malic_Acid: 2.56, Ash: 2.35, Color_Intensity: 5.60, Cultivar: 'Barbera' },
      { Alcohol: 13.52, Malic_Acid: 3.17, Ash: 2.72, Color_Intensity: 7.74, Cultivar: 'Barbera' },
      { Alcohol: 13.62, Malic_Acid: 4.95, Ash: 2.64, Color_Intensity: 8.60, Cultivar: 'Barbera' },
    ]
  },
  {
    id: 'pipeline_stress_test',
    name: 'Preprocessing Stress Test (Missing & Zero-Variance)',
    description: 'Engineered specifically for AML viva demonstrations. Contains intentional missing entries (NaN/null) and a constant zero-variance sensor feature to verify pipeline robustness.',
    category: 'Pipeline Validation',
    defaultFeatures: ['Temperature_C', 'Pressure_kPa', 'Constant_Sensor_Bias', 'Vibration_mm'],
    labelColumn: 'Machine_Status',
    data: [
      { Unit_ID: 'U1', Temperature_C: 62.5, Pressure_kPa: 101.3, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.12, Machine_Status: 'Normal' },
      { Unit_ID: 'U2', Temperature_C: 64.1, Pressure_kPa: 102.1, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.14, Machine_Status: 'Normal' },
      { Unit_ID: 'U3', Temperature_C: null, Pressure_kPa: 100.8, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.11, Machine_Status: 'Normal' }, // missing temp
      { Unit_ID: 'U4', Temperature_C: 63.8, Pressure_kPa: null, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.13, Machine_Status: 'Normal' }, // missing pressure
      { Unit_ID: 'U5', Temperature_C: 65.2, Pressure_kPa: 103.0, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.15, Machine_Status: 'Normal' },
      { Unit_ID: 'U6', Temperature_C: 78.4, Pressure_kPa: 115.6, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.42, Machine_Status: 'Warning' },
      { Unit_ID: 'U7', Temperature_C: 81.0, Pressure_kPa: 118.2, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.48, Machine_Status: 'Warning' },
      { Unit_ID: 'U8', Temperature_C: 79.5, Pressure_kPa: 116.0, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.45, Machine_Status: 'Warning' },
      { Unit_ID: 'U9', Temperature_C: 83.2, Pressure_kPa: null, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.52, Machine_Status: 'Critical' }, // missing pressure
      { Unit_ID: 'U10', Temperature_C: 92.0, Pressure_kPa: 128.4, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.88, Machine_Status: 'Critical' },
      { Unit_ID: 'U11', Temperature_C: 95.5, Pressure_kPa: 132.1, Constant_Sensor_Bias: 5.0, Vibration_mm: 0.94, Machine_Status: 'Critical' },
      { Unit_ID: 'U12', Temperature_C: 94.1, Pressure_kPa: 130.5, Constant_Sensor_Bias: 5.0, Vibration_mm: null, Machine_Status: 'Critical' }, // missing vibration
    ]
  }
];

/**
 * Generates synthetic correlated 2D Gaussian dataset
 */
export function generateSyntheticCorrelatedData(
  numPoints: number = 30,
  meanX: number = 15,
  meanY: number = 25,
  stdX: number = 5,
  stdY: number = 2,
  angleDegrees: number = 35,
  noise: number = 0.5
): Record<string, any>[] {
  const theta = (angleDegrees * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const rows: Record<string, any>[] = [];

  // Seeded Box-Muller pseudo-random generator
  let seed = 1234567;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const randNorm = () => {
    const u = Math.max(1e-10, rand());
    const v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  for (let i = 0; i < numPoints; i++) {
    // Generate independent Gaussian variables
    const u = randNorm() * stdX;
    const v = randNorm() * stdY + randNorm() * noise;

    // Rotate by theta
    const rotX = u * cosT - v * sinT;
    const rotY = u * sinT + v * cosT;

    const xVal = Number((rotX + meanX).toFixed(2));
    const yVal = Number((rotY + meanY).toFixed(2));

    rows.push({
      Sample_ID: `Pt_${i + 1}`,
      Feature_X: xVal,
      Feature_Y: yVal,
      Cluster: i < numPoints / 2 ? 'Group_A' : 'Group_B'
    });
  }

  return rows;
}
