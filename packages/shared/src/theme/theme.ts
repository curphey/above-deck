import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';
import { COLORS } from './colors';

const ocean: MantineColorsTuple = [
  '#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc',
  '#4dabf7', '#339af0', '#228be6', '#1c7ed6',
  '#1971c2', '#1864ab',
];

export const theme = createTheme({
  primaryColor: 'ocean',
  colors: { ocean },
  fontFamily: '"Inter", system-ui, sans-serif',
  fontFamilyMonospace: '"Fira Code", monospace',
  headings: {
    fontFamily: '"Space Mono", monospace',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  other: {
    defaultColorScheme: 'dark',
  },
  components: {
    Card: {
      defaultProps: { radius: 'md', withBorder: true },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
});
