import { useState, useMemo } from 'react';
import { Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { HEADING_FONT } from '@/theme/fonts';
import { buildWhPerDayMap } from '@/lib/solar/wh-per-day';
import { buildSchematicGraph } from '@/lib/solar/schematic';
import { findRegionByName } from '@/lib/solar/regions';
import { EquipmentGroup } from './EquipmentGroup';
import { AddEquipmentModal } from './AddEquipmentModal';
import { SchematicCanvas } from './SchematicCanvas';
import { EquipmentDrawer } from '../EquipmentDrawer';
import type { EquipmentInstance } from '@/lib/solar/types';

export function ConfiguratorLayout() {
  // Store state (selector pattern)
  const equipment = useSolarStore((s) => s.equipment);
  const viewMode = useSolarStore((s) => s.viewMode);
  const crewSize = useSolarStore((s) => s.crewSize);
  const regionName = useSolarStore((s) => s.regionName);
  const deratingFactor = useSolarStore((s) => s.deratingFactor);
  const systemVoltage = useSolarStore((s) => s.systemVoltage);
  const acCircuitVoltage = useSolarStore((s) => s.acCircuitVoltage);
  const previousMetrics = useSolarStore((s) => s.previousMetrics);

  // Store actions
  const updateEquipment = useSolarStore((s) => s.updateEquipment);
  const toggleEquipment = useSolarStore((s) => s.toggleEquipment);
  const removeEquipment = useSolarStore((s) => s.removeEquipment);
  const duplicateEquipment = useSolarStore((s) => s.duplicateEquipment);
  const addEquipment = useSolarStore((s) => s.addEquipment);
  const setSystemVoltage = useSolarStore((s) => s.setSystemVoltage);
  const setAcCircuitVoltage = useSolarStore((s) => s.setAcCircuitVoltage);

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

  // Build schematic graph
  const schematicGraph = useMemo(
    () => buildSchematicGraph(equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage),
    [equipment, viewMode, crewSize, peakSunHours, deratingFactor, systemVoltage],
  );

  // Drawer state for editing equipment
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = selectedId
    ? equipment.find((e) => e.id === selectedId) ?? null
    : null;

  // Add modal state
  const [addType, setAddType] = useState<'drain' | 'charge' | 'store' | null>(null);

  // Handlers
  const handleCardClick = (id: string) => setSelectedId(id);

  const handleNodeClick = (equipmentIds: string[]) => {
    if (equipmentIds.length > 0) {
      setSelectedId(equipmentIds[0]);
    }
  };

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

  // Shared equipment grid content
  const equipmentGrid = (
    <Paper withBorder p="md">
      <Stack gap="xl">
        <Group gap="md">
          <SegmentedControl
            size="xs"
            value={String(systemVoltage)}
            onChange={(val) => setSystemVoltage(Number(val) as 12 | 24 | 48)}
            data={[
              { value: '12', label: '12V' },
              { value: '24', label: '24V' },
              { value: '48', label: '48V' },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={String(acCircuitVoltage)}
            onChange={(val) => setAcCircuitVoltage(Number(val) as 110 | 220)}
            data={[
              { value: '110', label: '110V AC' },
              { value: '220', label: '220V AC' },
            ]}
          />
        </Group>

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

  // Shared schematic panel content
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
      {schematicGraph.nodes.length > 0 ? (
        <SchematicCanvas
          graph={schematicGraph}
          selectedId={selectedId}
          onNodeClick={handleNodeClick}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Add equipment to see the system diagram.
        </Text>
      )}
    </Paper>
  );

  return (
    <div data-testid="configurator-layout">
      {/* Responsive grid: single column on mobile, 55/45 split on desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--mantine-spacing-md)',
        }}
        className="configurator-grid"
      >
        <style>{`
          @media (min-width: 1024px) {
            .configurator-grid {
              grid-template-columns: 55fr 45fr !important;
            }
          }
        `}</style>
        {equipmentGrid}
        {schematicPanel}
      </div>

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
