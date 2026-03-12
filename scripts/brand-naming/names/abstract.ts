/** Short invented words (4-7 chars) that sound good and are brandable */
export function generateAbstract(): string[] {
  // Phonetically pleasing syllable components
  const onsets = [
    'b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n',
    'p', 'r', 's', 't', 'v', 'w', 'z', 'br', 'cr', 'dr',
    'fl', 'fr', 'gr', 'pr', 'sk', 'sl', 'sp', 'st', 'tr',
  ];
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const codas = [
    '', 'b', 'd', 'f', 'k', 'l', 'm', 'n', 'p', 'r',
    's', 't', 'x', 'z', 'nd', 'nt', 'lt', 'st',
  ];

  const names: Set<string> = new Set();

  // Generate CVCV and CVCCV patterns (most brandable)
  for (const o1 of onsets) {
    for (const v1 of vowels) {
      for (const o2 of onsets.slice(0, 15)) { // limit combinations
        for (const v2 of vowels) {
          const name = o1 + v1 + o2 + v2;
          if (name.length >= 4 && name.length <= 7) {
            names.add(name.charAt(0).toUpperCase() + name.slice(1));
          }
        }
      }
    }
  }

  // Curated abstract names with strong sound
  const curated = [
    'Vruno', 'Kelva', 'Ostra', 'Rova', 'Talo',
    'Nevo', 'Zura', 'Beko', 'Fira', 'Helo',
    'Kova', 'Luma', 'Mova', 'Peka', 'Rivo',
    'Sena', 'Tova', 'Vela', 'Weka', 'Zola',
    'Arvo', 'Bora', 'Cova', 'Deka', 'Evo',
    'Faro', 'Gova', 'Hula', 'Iko', 'Jova',
    'Kalo', 'Leva', 'Mako', 'Nola', 'Ova',
    'Paro', 'Reka', 'Sova', 'Tula', 'Varo',
    'Alvo', 'Breva', 'Crova', 'Dreka', 'Flova',
    'Grova', 'Preva', 'Skova', 'Trova', 'Stova',
  ];

  for (const name of curated) {
    names.add(name);
  }

  // Limit output to avoid overwhelming domain checks
  // Take a random sample of generated + all curated
  const generated = [...names];
  if (generated.length > 500) {
    // Deterministic sample: take every Nth
    const step = Math.floor(generated.length / 500);
    const sampled = generated.filter((_, i) => i % step === 0);
    return sampled.slice(0, 500);
  }

  return generated;
}
