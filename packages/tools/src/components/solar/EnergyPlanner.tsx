import React, { useEffect, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { useSolarStore } from '@/stores/solar';
import { decodeConfig } from '@/lib/solar/url-state';
import { QuickStartWizard } from './wizard/QuickStartWizard';
import { BoatBar } from './configurator/BoatBar';
import { ConfiguratorLayout } from './configurator/ConfiguratorLayout';
import { ShareModal } from './configurator/ShareModal';
import { ResultsDashboard } from './dashboard/ResultsDashboard';
import type { EquipmentInstance } from '@/lib/solar/types';

// --- Error boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class EnergyPlannerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <p>Something went wrong loading the Energy Planner. Please refresh the page.</p>
        </Container>
      );
    }
    return this.props.children;
  }
}

// --- Inner component ---

function EnergyPlannerInner() {
  const wizardComplete = useSolarStore((s) => s.wizardComplete);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // URL state loading on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('c');
    if (configParam) {
      const config = decodeConfig(configParam);
      if (config) {
        const store = useSolarStore.getState();
        // Hydrate store from URL config
        if (config.boatName) store.setBoatName(config.boatName as string);
        if (config.crewSize) store.setCrewSize(config.crewSize as number);
        if (config.regionName) {
          store.setLocation(
            (config.latitude as number) ?? 36.0,
            (config.longitude as number) ?? 14.5,
            config.regionName as string,
          );
        }
        if (config.systemVoltage) store.setSystemVoltage(config.systemVoltage as 12 | 24 | 48);
        if (config.acCircuitVoltage) store.setAcCircuitVoltage(config.acCircuitVoltage as 110 | 220);
        if (config.batteryChemistry) store.setBatteryChemistry(config.batteryChemistry as 'agm' | 'lifepo4');
        if (config.deratingFactor) store.setDeratingFactor(config.deratingFactor as number);
        if (config.viewMode) store.setViewMode(config.viewMode as 'anchor' | 'passage');
        if (config.cruisingStyle) store.setCruisingStyle(config.cruisingStyle as 'weekend' | 'coastal' | 'offshore');
        if (config.boatType) store.setBoatType(config.boatType as 'mono' | 'cat' | 'tri');
        if (config.boatLengthFt) store.setBoatLengthFt(config.boatLengthFt as number);
        if (Array.isArray(config.equipment)) {
          store.setEquipment(config.equipment as EquipmentInstance[]);
        }
        // Mark wizard complete so we skip it
        store.setWizardComplete();
      }
    }
  }, []);

  if (!wizardComplete) {
    return (
      <QuickStartWizard
        onComplete={() => {
          useSolarStore.getState().setWizardComplete();
        }}
      />
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <BoatBar
          onEdit={() => {
            // Reset wizard to allow re-configuration
            useSolarStore.getState().snapshotMetrics(0, 0, 0, 0);
          }}
          onShare={() => setShareModalOpen(true)}
        />
        <ConfiguratorLayout />
        <ResultsDashboard />
      </Stack>
      <ShareModal opened={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </Container>
  );
}

// --- Public component ---

export function EnergyPlanner() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <EnergyPlannerErrorBoundary>
          <EnergyPlannerInner />
        </EnergyPlannerErrorBoundary>
      </QueryClientProvider>
    </MantineProvider>
  );
}
