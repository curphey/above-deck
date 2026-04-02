import { MantineProvider as BaseMantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '@above-deck/shared/theme/theme';

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme} defaultColorScheme="dark">
      {children}
    </BaseMantineProvider>
  );
}

export { ColorSchemeScript };
