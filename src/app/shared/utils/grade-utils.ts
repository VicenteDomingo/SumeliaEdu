// Definim els nivells de les notes, per aplicar un color determinat a la vista
export type GradeLevel = 'good' | 'medium' | 'low' | 'none';

// Calculem el percentatge. Funció que converteix qualsevol nota en un percentatge
export function toPercent(score: number, maxScore: number): number {
  return (score / maxScore) * 100;
}

// Funció per calcular la mitjana d'una llista de valors. Retornarà null si la llista està buida
export function averageOf(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  let sum = 0;

  for (const value of values) {
    sum += value;
  }

  return Math.round(sum / values.length);
}

// Funció per classificar una nota segons el seu percentatge. Així, després podrem mostrar-la amb un color o altre a la interfície
export function getLevel(percent: number | null): GradeLevel {
  if (percent === null) {
    return 'none';
  }

  if (percent >= 70) {
    return 'good';
  }

  if (percent >= 50) {
    return 'medium';
  }

  return 'low';
}