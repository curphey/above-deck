import { useMemo, useState } from 'react';
import {
  Container,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { useSolarStore } from '@/stores/solar';
import { REGIONS } from './RegionPicker';
import {
  calculateDrainFromEquipment,
  calculateChargeFromEquipment,
  calculateStorageFromEquipment,
  INVERTER_EFFICIENCY,
  PANEL_FACTOR,
  ALTERNATOR_EFFICIENCY,
} from '@/lib/solar/equipment-calc';
import type {
  EquipmentInstance,
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from '@/lib/solar/types';
import { BoatSelector } from './BoatSelector';
import { SummaryBar } from './SummaryBar';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentDrawer } from './EquipmentDrawer';
import { AddEquipmentDrawer } from './AddEquipmentDrawer';
import { ConsumptionDonut } from './ConsumptionDonut';
import { RecommendationTiers } from './RecommendationTiers';
import { SaveBar } from './SaveBar';
import { useSolarCalculation } from '@/hooks/use-solar-calculation';
import { useApplianceCatalog } from '@/hooks/use-appliance-catalog';

const HEADING_FONT = "'Space Mono', monospace";

// --- Local helper: per-item Wh/day map ---

function buildWhPerDayMap(
  equipment: EquipmentInstance[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
  peakSunHours: number,
  deratingFactor: number,
  systemVoltage: number,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of equipment) {
    if (!item.enabled) {
      map.set(item.id, 0);
      continue;
    }

    switch (item.type) {
      case 'drain': {
        const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
        const crewMultiplier = item.crewScaling ? crewSize / 2 : 1;
        const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
        map.set(
          item.id,
          Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier * inverterFactor),
        );
        break;
      }
      case 'charge': {
        switch (item.sourceType) {
          case 'solar': {
            const panelFactor = PANEL_FACTOR[item.panelType ?? 'rigid'];
            map.set(
              item.id,
              Math.round((item.panelWatts ?? 0) * peakSunHours * deratingFactor * panelFactor),
            );
            break;
          }
          case 'alternator': {
            map.set(
              item.id,
              Math.round(
                (item.alternatorAmps ?? 0) *
                  systemVoltage *
                  (item.motoringHoursPerDay ?? 0) *
                  ALTERNATOR_EFFICIENCY,
              ),
            );
            break;
          }
          case 'shore': {
            map.set(
              item.id,
              Math.round(
                (item.shoreChargerAmps ?? 0) * systemVoltage * (item.shoreHoursPerDay ?? 0),
              ),
            );
            break;
          }
        }
        break;
      }
      case 'store': {
        // Stores don't have a Wh/day concept in the same way
        map.set(item.id, 0);
        break;
      }
    }
  }

  return map;
}

// --- Local component: EquipmentGroup ---

interface EquipmentGroupProps {
  title: string;
  items: EquipmentInstance[];
  whPerDayMap: Map<string, number>;
  onCardClick: (id: string) => void;
  onToggle: (id: string) => void;
  onAddClick: () => void;
}

function EquipmentGroup({
  title,
  items,
  whPerDayMap,
  onCardClick,
  onToggle,
  onAddClick,
}: EquipmentGroupProps) {
  const totalWh = items.reduce((sum, item) => sum + (whPerDayMap.get(item.id) ?? 0), 0);
  return (
    <Stack gap="sm">
      <Title
        order={4}
        ff={HEADING_FONT}
        tt="uppercase"
        c="dimmed"
        fz="sm"
        style={{
          letterSpacing: '1px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          paddingBottom: 8,
        }}
      >
        {title}
        {totalWh > 0 ? ` — ${Math.round(totalWh)} Wh/day` : ''}
      </Title>
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }}>
        {items.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            whPerDay={whPerDayMap.get(item.id) ?? 0}
            onClick={() => onCardClick(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
        <Paper
          withBorder
          p="sm"
          style={{
            cursor: 'pointer',
            borderStyle: 'dashed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 60,
          }}
          onClick={onAddClick}
        >
          <Text size="sm" c="dimmed">
            + Add equipment
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}

// --- Main inner component ---

function EnergyPlannerInner() {
  // Store state
  const equipment = useSolarStore((s) => s.equipment);
  const viewMode = useSolarStore((s) => s.viewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const acCircuitVoltage = useSolarStore((s) => s.acCircuitVoltage);
  const regionName = useSolarStore((s) => s.regionName);
  const deratingFactor = useSolarStore((s) => s.deratingFactor);

  // Store actions
  const toggleEquipment = useSolarStore((s) => s.toggleEquipment);
  const updateEquipment = useSolarStore((s) => s.updateEquipment);
  const duplicateEquipment = useSolarStore((s) => s.duplicateEquipment);
  const removeEquipment = useSolarStore((s) => s.removeEquipment);
  const addEquipment = useSolarStore((s) => s.addEquipment);
  const setCrewSize = useSolarStore((s) => s.setCrewSize);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const setAcCircuitVoltage = useSolarStore((s) => s.setAcCircuitVoltage);

  // Local state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addType, setAddType] = useState<'drain' | 'charge' | 'store' | null>(null);

  // Catalog for add drawer
  const { data: catalog } = useApplianceCatalog();

  // Derived data
  const peakSunHours = useMemo(() => {
    const region = REGIONS.find((r) => r.label === regionName);
    return region?.psh ?? 4.5;
  }, [regionName]);

  const drains = useMemo(
    () => equipment.filter((e): e is DrainEquipment => e.type === 'drain'),
    [equipment],
  );
  const charges = useMemo(
    () => equipment.filter((e): e is ChargeEquipment => e.type === 'charge'),
    [equipment],
  );
  const stores = useMemo(
    () => equipment.filter((e): e is StoreEquipment => e.type === 'store'),
    [equipment],
  );

  const drainResult = useMemo(
    () => calculateDrainFromEquipment(drains, viewMode, crewSize),
    [drains, viewMode, crewSize],
  );
  const chargeResult = useMemo(
    () =>
      calculateChargeFromEquipment(charges, {
        peakSunHours,
        deratingFactor,
        systemVoltage,
        acCircuitVoltage,
      }),
    [charges, peakSunHours, deratingFactor, systemVoltage, acCircuitVoltage],
  );
  const storageResult = useMemo(
    () => calculateStorageFromEquipment(stores, systemVoltage, drainResult.totalWhPerDay),
    [stores, systemVoltage, drainResult.totalWhPerDay],
  );

  const whPerDayMap = useMemo(
    () => buildWhPerDayMap(equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage),
    [equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage],
  );

  // Legacy hook for ConsumptionDonut and RecommendationTiers
  const { consumption, recommendation } = useSolarCalculation(peakSunHours);

  // Selected item for drawer
  const selectedItem = selectedId ? equipment.find((e) => e.id === selectedId) ?? null : null;

  // Drawer handlers
  const handleCardClick = (id: string) => setSelectedId(id);

  const handleDuplicate = () => {
    if (selectedId) {
      duplicateEquipment(selectedId);
      setSelectedId(null);
    }
  };

  const handleRemove = () => {
    if (!selectedItem) return;
    if (selectedItem.origin === 'stock') {
      toggleEquipment(selectedItem.id);
    } else {
      removeEquipment(selectedItem.id);
    }
    setSelectedId(null);
  };

  const handleAdd = (item: EquipmentInstance) => {
    addEquipment(item);
    setAddType(null);
    setSelectedId(item.id);
  };

  const netBalance = chargeResult.totalWhPerDay - drainResult.totalWhPerDay;

  return (
    <>
      <Container size="lg" py="xl" pb={80}>
        <Stack gap="xl">
          {/* Zone 1: Boat Bar */}
          <Title order={2} ff={HEADING_FONT}>
            Energy Planner
          </Title>
          <BoatSelector />
          <Group>
            <NumberInput
              label="Crew"
              value={crewSize}
              min={1}
              max={20}
              style={{ width: 80 }}
              onChange={(val) => setCrewSize(Number(val) || 2)}
            />
          </Group>
          <SummaryBar
            drainWh={drainResult.totalWhPerDay}
            chargeWh={chargeResult.totalWhPerDay}
            netBalance={netBalance}
            daysAutonomy={storageResult.daysAutonomy}
          />

          {/* Zone 2: Equipment Grid */}
          <Group gap="md">
            <SegmentedControl
              value={String(systemVoltage)}
              onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
              data={[
                { value: '12', label: '12V' },
                { value: '24', label: '24V' },
                { value: '48', label: '48V' },
              ]}
            />
            <SegmentedControl
              value={String(acCircuitVoltage)}
              onChange={(val) => setAcCircuitVoltage(Number(val) as 110 | 220)}
              data={[
                { value: '110', label: '110V AC' },
                { value: '220', label: '220V AC' },
              ]}
            />
          </Group>

          <EquipmentGroup
            title="Drain"
            items={drains}
            whPerDayMap={whPerDayMap}
            onCardClick={handleCardClick}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('drain')}
          />
          <EquipmentGroup
            title="Charge"
            items={charges}
            whPerDayMap={whPerDayMap}
            onCardClick={handleCardClick}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('charge')}
          />
          <EquipmentGroup
            title="Store"
            items={stores}
            whPerDayMap={whPerDayMap}
            onCardClick={handleCardClick}
            onToggle={toggleEquipment}
            onAddClick={() => setAddType('store')}
          />

          {/* Zone 3: Results */}
          <Title
            order={3}
            ff={HEADING_FONT}
            tt="uppercase"
            c="dimmed"
            fz="sm"
            style={{
              letterSpacing: '1px',
              borderBottom: '1px solid var(--mantine-color-default-border)',
              paddingBottom: 8,
            }}
          >
            Results
          </Title>
          <ConsumptionDonut
            breakdown={consumption.breakdownByCategory}
            viewMode={viewMode}
            totalWh={
              viewMode === 'anchor'
                ? consumption.totalWhPerDayAnchor
                : consumption.totalWhPerDayPassage
            }
          />
          <RecommendationTiers
            recommendation={recommendation}
            batteryChemistry={useSolarStore.getState().batteryChemistry}
          />
        </Stack>
      </Container>

      {/* Drawers (outside Container) */}
      <EquipmentDrawer
        opened={selectedId !== null}
        onClose={() => setSelectedId(null)}
        item={selectedItem}
        onUpdate={updateEquipment}
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
        viewMode={viewMode}
        crewSize={crewSize}
        systemVoltage={systemVoltage}
        acCircuitVoltage={acCircuitVoltage}
        peakSunHours={peakSunHours}
        deratingFactor={deratingFactor}
      />
      <AddEquipmentDrawer
        opened={addType !== null}
        onClose={() => setAddType(null)}
        onAdd={handleAdd}
        catalog={catalog ?? []}
        filterType={addType ?? 'drain'}
      />
      <SaveBar isAuthenticated={false} />
    </>
  );
}

export function EnergyPlanner() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <EnergyPlannerInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
