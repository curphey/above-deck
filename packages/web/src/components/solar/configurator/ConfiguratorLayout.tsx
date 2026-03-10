import { useState, useMemo } from 'react';
import { Paper, Stack, Text, Box } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { HEADING_FONT } from '@/theme/fonts';
import { buildWhPerDayMap } from '@/lib/solar/wh-per-day';
import { findRegionByName } from '@/lib/solar/regions';
import { BoatBar } from './BoatBar';
import { EquipmentGroup } from './EquipmentGroup';
import { AddEquipmentModal } from './AddEquipmentModal';
import { EquipmentDrawer } from '../EquipmentDrawer';
import type { EquipmentInstance } from '@/lib/solar/types';

export function ConfiguratorLayout() {
  const equipment = useSolarStore((s) => s.equipment);
  const viewMode = useSolarStore((s) => s.viewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const regionName = useSolarStore((s) => s.regionName);
  const deratingFactor = useSolarStore((s) => s.deratingFactor);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const acCircuitVoltage = useSolarStore((s) => s.acCircuitVoltage);
  const previousMetrics = useSolarStore((s) => s.previousMetrics);
  const updateEquipment = useSolarStore((s) => s.updateEquipment);
  const toggleEquipment = useSolarStore((s) => s.toggleEquipment);
  const removeEquipment = useSolarStore((s) => s.removeEquipment);
  const duplicateEquipment = useSolarStore((s) => s.duplicateEquipment);
  const addEquipment = useSolarStore((s) => s.addEquipment);

  // Derive peak sun hours from region
  const region = findRegionByName(regionName);
  const peakSunHours = region?.psh ?? 4.5;

  // Filter equipment by type
  const drainItems = useMemo(
    () => equipment.filter((e) => e.type === 'drain'),
    [equipment],
  );
  const chargeItems = useMemo(
    () => equipment.filter((e) => e.type === 'charge'),
    [equipment],
  );
  const storeItems = useMemo(
    () => equipment.filter((e) => e.type === 'store'),
    [equipment],
  );

  // Build Wh/day map
  const whPerDayMap = useMemo(
    () => buildWhPerDayMap(equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage),
    [equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage],
  );

  // Drawer state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = selectedId
    ? equipment.find((e) => e.id === selectedId) ?? null
    : null;

  // Add modal state
  const [addType, setAddType] = useState<'drain' | 'charge' | 'store' | null>(null);

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
  };

  const equipmentPanel = (
    <Paper withBorder p="md">
      <Stack gap="xl">
        <EquipmentGroup
          title="DRAIN"
          items={drainItems}
          whPerDayMap={whPerDayMap}
          previousTotal={previousMetrics?.drainWhPerDay ?? null}
          onCardClick={handleCardClick}
          onToggle={(id) => toggleEquipment(id)}
          onAddClick={() => setAddType('drain')}
        />
        <EquipmentGroup
          title="CHARGE"
          items={chargeItems}
          whPerDayMap={whPerDayMap}
          previousTotal={previousMetrics?.chargeWhPerDay ?? null}
          onCardClick={handleCardClick}
          onToggle={(id) => toggleEquipment(id)}
          onAddClick={() => setAddType('charge')}
        />
        <EquipmentGroup
          title="STORE"
          items={storeItems}
          whPerDayMap={whPerDayMap}
          previousTotal={null}
          onCardClick={handleCardClick}
          onToggle={(id) => toggleEquipment(id)}
          onAddClick={() => setAddType('store')}
        />
      </Stack>
    </Paper>
  );

  const schematicPanel = (
    <Paper
      data-testid="schematic-panel"
      withBorder
      p="md"
      style={{ position: 'sticky', top: 60, alignSelf: 'start' }}
    >
      <Text fw={700} ff={HEADING_FONT} mb="md">
        System Schematic
      </Text>
      <Text size="sm" c="dimmed">
        A live system diagram will appear here showing energy flow
        between your charging sources, loads, and battery storage.
      </Text>
    </Paper>
  );

  return (
    <div data-testid="configurator-layout">
      <BoatBar
        onEdit={() => {}}
        onShare={() => {}}
      />

      <Box
        mt="md"
        style={{
          display: 'grid',
          gap: 'var(--mantine-spacing-md)',
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
        className="configurator-grid"
      >
        {equipmentPanel}
        {schematicPanel}
      </Box>

      <style>{`
        @media (min-width: 1024px) {
          .configurator-grid {
            grid-template-columns: minmax(0, 1fr) 340px !important;
          }
        }
      `}</style>

      {/* Equipment detail drawer */}
      <EquipmentDrawer
        opened={selectedItem !== null}
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

      {/* Add equipment modal */}
      <AddEquipmentModal
        opened={addType !== null}
        onClose={() => setAddType(null)}
        onAdd={handleAdd}
        filterType={addType ?? 'drain'}
      />
    </div>
  );
}
