// // "The utils folder is for small, reusable helper functions that make your code cleaner and easier to maintain...utils are typically lightweight and pure functions. They don't connect to anything external, and they just work with the data you give them." (https://khaisastudio.medium.com/understanding-the-role-of-libs-and-utils-in-a-next-js-15-project-b1c0368ef044)

// Funció per convertir una data a string, el format que empra PostgreSQL (AAAA-MM-DD)
export function toDateText(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
}

// El dilluns de la setmana en la que cau una data
export function getMonday(date: Date): Date {
  const monday = new Date(date); // fem una còpia de la data, sense modificar la original
  const dayOfWeek = date.getDay(); // el dia de la setmana 0 diumenge, 1 dll...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Operador Ternari -> Si el dia és diumenge (0), han passat 6 dies des del dilluns. En altres cassos, restem 1 al número del dia

  monday.setDate(date.getDate() - daysSinceMonday); // Calculem el dilluns 
  return monday;
}