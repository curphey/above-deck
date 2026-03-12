/** Invented words: nautical roots + brandable suffixes/prefixes */
export function generateCoinages(): string[] {
  const roots = [
    'nav', 'mar', 'pel', 'aq', 'ven', 'vor', 'cur', 'lux',
    'ard', 'ost', 'kel', 'vol', 'tru', 'pil', 'hal', 'vig',
    'sol', 'rul', 'dek', 'rok', 'bor', 'fin', 'val', 'zen',
    'rut', 'hav', 'sev', 'nor', 'sur', 'tal', 'ves', 'lar',
  ];

  const prefixMods = [
    '', 'a', 'e', 'o',
  ];

  const suffixes = [
    'a', 'o', 'i', 'y', 'ia', 'io', 'eo', 'ar', 'er', 'ra',
    'ly', 'ix', 'is', 'us', 'al', 'an', 'en', 'on', 'ica',
    'ova', 'ine', 'ent', 'ant', 'ory',
  ];

  const coinages: string[] = [];
  for (const root of roots) {
    for (const pre of prefixMods) {
      for (const suf of suffixes) {
        const name = pre + root + suf;
        if (name.length >= 4 && name.length <= 8) {
          // Capitalise first letter
          coinages.push(name.charAt(0).toUpperCase() + name.slice(1));
        }
      }
    }
  }

  // Hand-picked coinages with strong brandability
  const handPicked = [
    'Navara', 'Mareo', 'Pelago', 'Aquira', 'Ventora',
    'Vorant', 'Curva', 'Ardent', 'Ostia', 'Kelva',
    'Voltar', 'Pilara', 'Halcyo', 'Vigora', 'Solara',
    'Dekora', 'Rokara', 'Borean', 'Finara', 'Valora',
    'Zenara', 'Rutova', 'Havena', 'Sevara', 'Norica',
    'Surova', 'Talora', 'Vesara', 'Larova', 'Navica',
    'Mariva', 'Peliga', 'Voruna', 'Kelvon', 'Ostara',
    'Halcya', 'Zenova', 'Rutena', 'Sevona', 'Talvea',
  ];

  return [...new Set([...coinages, ...handPicked])];
}
