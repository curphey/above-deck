import { MantineProvider } from './MantineProvider';
import { Shell } from './Shell';

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Shell>{children}</Shell>
    </MantineProvider>
  );
}
