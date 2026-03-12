/** Two short words combined into brand-worthy compounds */
export function generateCompounds(): string[] {
  const prefixes = [
    'Sea', 'Tide', 'Wind', 'Wave', 'Salt', 'Blue', 'Deep',
    'Fair', 'True', 'Open', 'Way', 'Star', 'Sun', 'Sky',
    'Bay', 'Reef', 'Sail', 'Port', 'Hull', 'Bow', 'Helm',
    'Drift', 'Gale', 'Mast', 'Keel',
  ];

  const suffixes = [
    'way', 'line', 'mark', 'plot', 'plan', 'run', 'set',
    'log', 'map', 'fix', 'cast', 'track', 'path', 'lap',
    'hub', 'base', 'spot', 'dock', 'point', 'deck', 'helm',
    'sail', 'tide', 'ward', 'bound', 'port', 'bay',
  ];

  const compounds: string[] = [];
  for (const pre of prefixes) {
    for (const suf of suffixes) {
      const name = pre + suf;
      // Skip if prefix and suffix are the same word
      if (pre.toLowerCase() === suf.toLowerCase()) continue;
      // Only keep reasonable lengths
      if (name.length >= 5 && name.length <= 10) {
        compounds.push(name);
      }
    }
  }

  // Add some hand-picked compounds that generators might miss
  const handPicked = [
    'Fairwind', 'Blueline', 'Starfix', 'Waycast',
    'Openhelm', 'Trueset', 'Deeplog', 'Saltpath',
    'Bowline', 'Keelplan', 'Driftmap', 'Helmway',
    'Seastack', 'Tideset', 'Windlog', 'Portline',
    'Sailmark', 'Bayward', 'Galeset', 'Mastline',
    'Reefway', 'Hullmark', 'Bowcast', 'Seatack',
  ];

  return [...new Set([...compounds, ...handPicked])];
}
