import { useState } from 'react';
import { Drawer, Paper, Stack, Text, TextInput } from '@mantine/core';
import type {
  Appliance,
  ChargeEquipment,
  DrainEquipment,
  EquipmentInstance,
  StoreEquipment,
} from '@/lib/solar/types';

const HEADING_FONT = "'Space Mono', monospace";

export interface AddEquipmentDrawerProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentInstance) => void;
  catalog: Appliance[];
  filterType: 'drain' | 'charge' | 'store';
}

function catalogToDrain(item: Appliance): DrainEquipment {
  return {
    id: `drain-${item.id}-${Date.now()}`,
    catalogId: item.id,
    name: item.name,
    type: 'drain',
    enabled: true,
    origin: 'added',
    notes: '',
    category: item.category,
    wattsTypical: item.wattsTypical,
    wattsMin: item.wattsMin,
    wattsMax: item.wattsMax,
    hoursPerDayAnchor: item.hoursPerDayAnchor,
    hoursPerDayPassage: item.hoursPerDayPassage,
    dutyCycle: item.dutyCycle,
    crewScaling: item.crewScaling,
    powerType: 'dc',
  };
}

function makeChargeTemplates(): ChargeEquipment[] {
  return [
    {
      id: `charge-solar-${Date.now()}`,
      catalogId: null,
      name: 'Solar Panels',
      type: 'charge',
      enabled: true,
      origin: 'added',
      notes: '',
      sourceType: 'solar',
      panelWatts: 200,
      panelType: 'rigid',
      regionName: 'Mediterranean',
    },
    {
      id: `charge-alternator-${Date.now()}`,
      catalogId: null,
      name: 'Engine Alternator',
      type: 'charge',
      enabled: true,
      origin: 'added',
      notes: '',
      sourceType: 'alternator',
      alternatorAmps: 75,
      motoringHoursPerDay: 1.5,
    },
    {
      id: `charge-shore-${Date.now()}`,
      catalogId: null,
      name: 'Shore Power',
      type: 'charge',
      enabled: true,
      origin: 'added',
      notes: '',
      sourceType: 'shore',
      shoreHoursPerDay: 2,
      shoreChargerAmps: 30,
    },
  ];
}

function makeStoreTemplate(): StoreEquipment {
  return {
    id: `store-${Date.now()}`,
    catalogId: null,
    name: 'Battery Bank',
    type: 'store',
    enabled: true,
    origin: 'added',
    notes: '',
    chemistry: 'lifepo4',
    capacityAh: 200,
  };
}

export function AddEquipmentDrawer({
  opened,
  onClose,
  onAdd,
  catalog,
  filterType,
}: AddEquipmentDrawerProps) {
  const [search, setSearch] = useState('');

  const filteredCatalog = catalog.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Text fw={700} size="lg" ff={HEADING_FONT}>
          Add Equipment
        </Text>
      }
    >
      <Stack gap="md">
        {filterType === 'drain' && (
          <>
            <TextInput
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            {filteredCatalog.map((item) => (
              <Paper
                key={item.id}
                p="sm"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => onAdd(catalogToDrain(item))}
              >
                <Text fw={500}>{item.name}</Text>
                <Text size="sm" c="dimmed">
                  {item.wattsTypical}W &middot; {item.category}
                </Text>
              </Paper>
            ))}
          </>
        )}

        {filterType === 'charge' &&
          makeChargeTemplates().map((tpl) => (
            <Paper
              key={tpl.sourceType}
              p="sm"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onAdd(tpl)}
            >
              <Text fw={500}>{tpl.name}</Text>
            </Paper>
          ))}

        {filterType === 'store' && (
          <Paper
            p="sm"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => onAdd(makeStoreTemplate())}
          >
            <Text fw={500}>Battery Bank</Text>
            <Text size="sm" c="dimmed">
              LiFePO4 &middot; 200Ah
            </Text>
          </Paper>
        )}
      </Stack>
    </Drawer>
  );
}
