import { useState, useMemo } from 'react';
import {
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { HEADING_FONT } from '@/theme/fonts';
import type {
  EquipmentInstance,
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from '@/lib/solar/types';

// --- Equipment templates ---

interface DrainTemplate {
  name: string;
  category: string;
  watts: number;
  hoursAnchor: number;
  hoursPassage: number;
  dutyCycle: number;
  powerType: 'dc' | 'ac';
}

const DRAIN_CATEGORIES: Record<string, DrainTemplate[]> = {
  Navigation: [
    { name: 'Chartplotter', category: 'navigation', watts: 25, hoursAnchor: 2, hoursPassage: 12, dutyCycle: 1, powerType: 'dc' },
    { name: 'Radar', category: 'navigation', watts: 48, hoursAnchor: 0, hoursPassage: 8, dutyCycle: 1, powerType: 'dc' },
    { name: 'AIS', category: 'navigation', watts: 5, hoursAnchor: 24, hoursPassage: 24, dutyCycle: 1, powerType: 'dc' },
    { name: 'Autopilot', category: 'navigation', watts: 60, hoursAnchor: 0, hoursPassage: 10, dutyCycle: 0.5, powerType: 'dc' },
    { name: 'VHF Radio', category: 'navigation', watts: 25, hoursAnchor: 12, hoursPassage: 24, dutyCycle: 0.1, powerType: 'dc' },
  ],
  Refrigeration: [
    { name: 'Fridge', category: 'refrigeration', watts: 60, hoursAnchor: 24, hoursPassage: 24, dutyCycle: 0.33, powerType: 'dc' },
    { name: 'Freezer', category: 'refrigeration', watts: 80, hoursAnchor: 24, hoursPassage: 24, dutyCycle: 0.33, powerType: 'dc' },
  ],
  Lighting: [
    { name: 'LED Interior', category: 'lighting', watts: 20, hoursAnchor: 6, hoursPassage: 4, dutyCycle: 1, powerType: 'dc' },
    { name: 'LED Nav Lights', category: 'lighting', watts: 15, hoursAnchor: 0, hoursPassage: 12, dutyCycle: 1, powerType: 'dc' },
    { name: 'Anchor Light', category: 'lighting', watts: 10, hoursAnchor: 12, hoursPassage: 0, dutyCycle: 1, powerType: 'dc' },
  ],
  'Water Systems': [
    { name: 'Water Pump', category: 'water', watts: 60, hoursAnchor: 0.5, hoursPassage: 0.5, dutyCycle: 1, powerType: 'dc' },
    { name: 'Watermaker', category: 'water', watts: 200, hoursAnchor: 2, hoursPassage: 2, dutyCycle: 1, powerType: 'dc' },
  ],
  'Comfort/Galley': [
    { name: 'Fan', category: 'comfort', watts: 15, hoursAnchor: 8, hoursPassage: 8, dutyCycle: 1, powerType: 'dc' },
    { name: 'Microwave', category: 'comfort', watts: 800, hoursAnchor: 0.1, hoursPassage: 0.1, dutyCycle: 1, powerType: 'ac' },
    { name: 'Coffee Maker', category: 'comfort', watts: 600, hoursAnchor: 0.2, hoursPassage: 0.2, dutyCycle: 1, powerType: 'ac' },
  ],
  Communication: [
    { name: 'SSB Radio', category: 'communication', watts: 150, hoursAnchor: 1, hoursPassage: 2, dutyCycle: 0.3, powerType: 'dc' },
    { name: 'Satellite Phone', category: 'communication', watts: 30, hoursAnchor: 0.5, hoursPassage: 1, dutyCycle: 1, powerType: 'dc' },
    { name: 'WiFi Router', category: 'communication', watts: 12, hoursAnchor: 12, hoursPassage: 12, dutyCycle: 1, powerType: 'dc' },
  ],
  'Sailing/Safety': [
    { name: 'Windlass', category: 'sailing', watts: 500, hoursAnchor: 0.05, hoursPassage: 0.05, dutyCycle: 1, powerType: 'dc' },
    { name: 'Bilge Pump', category: 'sailing', watts: 25, hoursAnchor: 0.5, hoursPassage: 0.5, dutyCycle: 0.1, powerType: 'dc' },
    { name: 'Wind Instruments', category: 'sailing', watts: 5, hoursAnchor: 24, hoursPassage: 24, dutyCycle: 1, powerType: 'dc' },
  ],
};

interface ChargeTemplate {
  name: string;
  sourceType: 'solar' | 'alternator' | 'shore';
  panelWatts?: number;
  alternatorAmps?: number;
  motoringHoursPerDay?: number;
  shoreChargerAmps?: number;
  shoreHoursPerDay?: number;
}

const CHARGE_CATEGORIES: Record<string, ChargeTemplate[]> = {
  Solar: [
    { name: '100W Solar Panel', sourceType: 'solar', panelWatts: 100 },
    { name: '200W Solar Panel', sourceType: 'solar', panelWatts: 200 },
    { name: '300W Solar Panel', sourceType: 'solar', panelWatts: 300 },
    { name: '400W Solar Panel', sourceType: 'solar', panelWatts: 400 },
  ],
  Alternator: [
    { name: '50A Alternator', sourceType: 'alternator', alternatorAmps: 50, motoringHoursPerDay: 1.5 },
    { name: '75A Alternator', sourceType: 'alternator', alternatorAmps: 75, motoringHoursPerDay: 1.5 },
    { name: '100A Alternator', sourceType: 'alternator', alternatorAmps: 100, motoringHoursPerDay: 1.5 },
    { name: '120A Alternator', sourceType: 'alternator', alternatorAmps: 120, motoringHoursPerDay: 1.5 },
  ],
  'Shore Power': [
    { name: '15A Shore Charger', sourceType: 'shore', shoreChargerAmps: 15, shoreHoursPerDay: 8 },
    { name: '30A Shore Charger', sourceType: 'shore', shoreChargerAmps: 30, shoreHoursPerDay: 8 },
    { name: '50A Shore Charger', sourceType: 'shore', shoreChargerAmps: 50, shoreHoursPerDay: 8 },
  ],
};

interface StoreTemplate {
  name: string;
  chemistry: 'agm' | 'lifepo4';
  capacityAh: number;
}

const STORE_TEMPLATES: StoreTemplate[] = [
  { name: '100Ah AGM Battery Bank', chemistry: 'agm', capacityAh: 100 },
  { name: '200Ah AGM Battery Bank', chemistry: 'agm', capacityAh: 200 },
  { name: '100Ah LiFePO4 Battery Bank', chemistry: 'lifepo4', capacityAh: 100 },
  { name: '200Ah LiFePO4 Battery Bank', chemistry: 'lifepo4', capacityAh: 200 },
  { name: '300Ah LiFePO4 Battery Bank', chemistry: 'lifepo4', capacityAh: 300 },
  { name: '400Ah LiFePO4 Battery Bank', chemistry: 'lifepo4', capacityAh: 400 },
];

// --- Helpers ---

function createDrainItem(template: DrainTemplate): DrainEquipment {
  return {
    id: crypto.randomUUID(),
    catalogId: null,
    name: template.name,
    type: 'drain',
    enabled: true,
    origin: 'added',
    notes: '',
    category: template.category,
    wattsTypical: template.watts,
    wattsMin: Math.round(template.watts * 0.5),
    wattsMax: Math.round(template.watts * 2),
    hoursPerDayAnchor: template.hoursAnchor,
    hoursPerDayPassage: template.hoursPassage,
    dutyCycle: template.dutyCycle,
    crewScaling: false,
    powerType: template.powerType,
  };
}

function createChargeItem(template: ChargeTemplate): ChargeEquipment {
  return {
    id: crypto.randomUUID(),
    catalogId: null,
    name: template.name,
    type: 'charge',
    enabled: true,
    origin: 'added',
    notes: '',
    sourceType: template.sourceType,
    panelWatts: template.panelWatts,
    panelType: template.sourceType === 'solar' ? 'rigid' : undefined,
    alternatorAmps: template.alternatorAmps,
    motoringHoursPerDay: template.motoringHoursPerDay,
    shoreChargerAmps: template.shoreChargerAmps,
    shoreHoursPerDay: template.shoreHoursPerDay,
  };
}

function createStoreItem(template: StoreTemplate): StoreEquipment {
  return {
    id: crypto.randomUUID(),
    catalogId: null,
    name: template.name,
    type: 'store',
    enabled: true,
    origin: 'added',
    notes: '',
    chemistry: template.chemistry,
    capacityAh: template.capacityAh,
  };
}

// --- Props ---

export interface AddEquipmentModalProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentInstance) => void;
  filterType: 'drain' | 'charge' | 'store';
}

// --- Template item row ---

function TemplateRow({
  name,
  detail,
  onAdd,
}: {
  name: string;
  detail: string;
  onAdd: () => void;
}) {
  return (
    <Paper withBorder p="xs">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="sm" fw={500}>
            {name}
          </Text>
          <Text size="xs" c="dimmed">
            {detail}
          </Text>
        </div>
        <Button size="xs" variant="light" onClick={onAdd}>
          Add
        </Button>
      </Group>
    </Paper>
  );
}

// --- Sub-panels ---

function DrainPanel({
  onAdd,
  search,
}: {
  onAdd: (item: EquipmentInstance) => void;
  search: string;
}) {
  const categories = Object.keys(DRAIN_CATEGORIES);
  const [activeTab, setActiveTab] = useState(categories[0]);

  const items = useMemo(() => {
    const templates = DRAIN_CATEGORIES[activeTab] ?? [];
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [activeTab, search]);

  // Also search across all categories
  const allFiltered = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    const results: { category: string; template: DrainTemplate }[] = [];
    for (const [cat, templates] of Object.entries(DRAIN_CATEGORIES)) {
      for (const t of templates) {
        if (t.name.toLowerCase().includes(q)) {
          results.push({ category: cat, template: t });
        }
      }
    }
    return results;
  }, [search]);

  if (search && allFiltered && allFiltered.length > 0) {
    return (
      <Stack gap="xs">
        {allFiltered.map((r) => (
          <TemplateRow
            key={r.template.name}
            name={r.template.name}
            detail={`${r.template.watts}W · ${r.category}`}
            onAdd={() => onAdd(createDrainItem(r.template))}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Tabs value={activeTab} onChange={(val) => setActiveTab(val ?? categories[0])}>
      <Tabs.List mb="sm">
        {categories.map((cat) => (
          <Tabs.Tab key={cat} value={cat}>
            {cat}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {categories.map((cat) => (
        <Tabs.Panel key={cat} value={cat}>
          <Stack gap="xs">
            {(search ? items : (DRAIN_CATEGORIES[cat] ?? [])).map((template) => (
              <TemplateRow
                key={template.name}
                name={template.name}
                detail={`${template.watts}W · ${template.powerType.toUpperCase()}`}
                onAdd={() => onAdd(createDrainItem(template))}
              />
            ))}
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

function ChargePanel({
  onAdd,
  search,
}: {
  onAdd: (item: EquipmentInstance) => void;
  search: string;
}) {
  const categories = Object.keys(CHARGE_CATEGORIES);
  const [activeTab, setActiveTab] = useState(categories[0]);

  const allFiltered = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    const results: ChargeTemplate[] = [];
    for (const templates of Object.values(CHARGE_CATEGORIES)) {
      for (const t of templates) {
        if (t.name.toLowerCase().includes(q)) {
          results.push(t);
        }
      }
    }
    return results;
  }, [search]);

  if (search && allFiltered && allFiltered.length > 0) {
    return (
      <Stack gap="xs">
        {allFiltered.map((t) => (
          <TemplateRow
            key={t.name}
            name={t.name}
            detail={t.sourceType}
            onAdd={() => onAdd(createChargeItem(t))}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Tabs value={activeTab} onChange={(val) => setActiveTab(val ?? categories[0])}>
      <Tabs.List mb="sm">
        {categories.map((cat) => (
          <Tabs.Tab key={cat} value={cat}>
            {cat}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {categories.map((cat) => (
        <Tabs.Panel key={cat} value={cat}>
          <Stack gap="xs">
            {(CHARGE_CATEGORIES[cat] ?? []).map((template) => (
              <TemplateRow
                key={template.name}
                name={template.name}
                detail={template.sourceType}
                onAdd={() => onAdd(createChargeItem(template))}
              />
            ))}
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

function StorePanel({
  onAdd,
  search,
}: {
  onAdd: (item: EquipmentInstance) => void;
  search: string;
}) {
  const filtered = useMemo(() => {
    if (!search) return STORE_TEMPLATES;
    const q = search.toLowerCase();
    return STORE_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Stack gap="xs">
      <Text size="sm" fw={700} ff={HEADING_FONT}>
        Battery Bank
      </Text>
      {filtered.map((template) => (
        <TemplateRow
          key={template.name}
          name={template.name}
          detail={`${template.chemistry === 'lifepo4' ? 'LiFePO4' : 'AGM'} · ${template.capacityAh}Ah`}
          onAdd={() => onAdd(createStoreItem(template))}
        />
      ))}
    </Stack>
  );
}

// --- Main component ---

const TITLES: Record<string, string> = {
  drain: 'Add Equipment',
  charge: 'Add Charging Source',
  store: 'Add Battery Storage',
};

export function AddEquipmentModal({
  opened,
  onClose,
  onAdd,
  filterType,
}: AddEquipmentModalProps) {
  const [search, setSearch] = useState('');

  const handleAdd = (item: EquipmentInstance) => {
    onAdd(item);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} ff={HEADING_FONT}>
          {TITLES[filterType]}
        </Text>
      }
      size="lg"
    >
      <div data-testid="add-equipment-modal">
        <TextInput
          placeholder="Search equipment..."
          leftSection={<IconSearch size={16} />}
          mb="md"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        {filterType === 'drain' && (
          <DrainPanel onAdd={handleAdd} search={search} />
        )}
        {filterType === 'charge' && (
          <ChargePanel onAdd={handleAdd} search={search} />
        )}
        {filterType === 'store' && (
          <StorePanel onAdd={handleAdd} search={search} />
        )}
      </div>
    </Modal>
  );
}
