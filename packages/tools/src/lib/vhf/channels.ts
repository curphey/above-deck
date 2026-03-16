interface ChannelInfo {
  number: number;
  name: string;
  txFreq: string;
  rxFreq: string;
}

const channels: Record<number, ChannelInfo> = {
  6: { number: 6, name: 'Ship-to-ship safety', txFreq: '156.300', rxFreq: '156.300' },
  8: { number: 8, name: 'Commercial ship-to-ship', txFreq: '156.400', rxFreq: '156.400' },
  9: { number: 9, name: 'Boating calling', txFreq: '156.450', rxFreq: '156.450' },
  10: { number: 10, name: 'Commercial', txFreq: '156.500', rxFreq: '156.500' },
  12: { number: 12, name: 'Port operations', txFreq: '156.600', rxFreq: '156.600' },
  13: { number: 13, name: 'Bridge-to-bridge safety', txFreq: '156.650', rxFreq: '156.650' },
  14: { number: 14, name: 'Port operations', txFreq: '156.700', rxFreq: '156.700' },
  16: { number: 16, name: 'Distress, safety, calling', txFreq: '156.800', rxFreq: '156.800' },
  67: { number: 67, name: 'UK small craft safety', txFreq: '156.375', rxFreq: '156.375' },
  68: { number: 68, name: 'Marina/yacht club', txFreq: '156.425', rxFreq: '156.425' },
  69: { number: 69, name: 'Marina/yacht club', txFreq: '156.475', rxFreq: '156.475' },
  70: { number: 70, name: 'DSC (no voice)', txFreq: '156.525', rxFreq: '156.525' },
  71: { number: 71, name: 'Marina/yacht club', txFreq: '156.575', rxFreq: '156.575' },
  72: { number: 72, name: 'Ship-to-ship', txFreq: '156.625', rxFreq: '156.625' },
  73: { number: 73, name: 'Port operations', txFreq: '156.675', rxFreq: '156.675' },
  77: { number: 77, name: 'Ship-to-ship', txFreq: '156.875', rxFreq: '156.875' },
  80: { number: 80, name: 'Marina/yacht club', txFreq: '157.025', rxFreq: '161.625' },
};

export function getChannelInfo(ch: number): ChannelInfo | undefined {
  return channels[ch];
}

export function getChannelName(ch: number): string {
  return channels[ch]?.name ?? `Channel ${ch}`;
}

export function getChannelFrequency(ch: number): string {
  return channels[ch]?.txFreq ?? '---';
}
