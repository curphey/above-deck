import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';
import { useEquipmentCatalog, catalogRowToEquipment } from '@/hooks/use-equipment-catalog';
import type { CatalogRow } from '@/hooks/use-equipment-catalog';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment } from '@/lib/solar/types';

export interface AddEquipmentModalProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentInstance) => void;
  filterType: 'drain' | 'charge' | 'store';
}

function formatCategory(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function specDetail(row: CatalogRow): string {
  if (row.type === 'drain') {
    return `${row.specs.wattsTypical}W · ${(row.specs.powerType as string)?.toUpperCase() ?? 'DC'}`;
  }
  if (row.type === 'charge') {
    const src = row.specs.sourceType as string;
    if (src === 'solar') return `${row.specs.panelWatts}W`;
    if (src === 'alternator') return `${row.specs.alternatorAmps}A`;
    if (src === 'shore') return `${row.specs.shoreChargerAmps}A`;
    return src;
  }
  if (row.type === 'store') {
    const chem = row.specs.chemistry === 'lifepo4' ? 'LiFePO4' : 'AGM';
    return `${chem} · ${row.specs.capacityAh}Ah`;
  }
  return '';
}

function CatalogItemRow({
  row,
  onAdd,
}: {
  row: CatalogRow;
  onAdd: () => void;
}) {
  return (
    <Paper withBorder p="xs">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {row.name}
            </Text>
            {!row.make && (
              <Badge size="xs" variant="light" color="gray">
                Generic
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {specDetail(row)}
          </Text>
        </div>
        <Button size="xs" variant="light" onClick={onAdd}>
          Add
        </Button>
      </Group>
    </Paper>
  );
}

function createCustomItem(type: 'drain' | 'charge' | 'store'): EquipmentInstance {
  const base = {
    id: crypto.randomUUID(),
    catalogId: null,
    name: 'Custom Item',
    enabled: true,
    origin: 'custom' as const,
    notes: '',
  };

  switch (type) {
    case 'drain':
      return {
        ...base,
        type: 'drain',
        category: 'custom',
        wattsTypical: 10,
        wattsMin: 5,
        wattsMax: 20,
        hoursPerDayAnchor: 1,
        hoursPerDayPassage: 1,
        dutyCycle: 1,
        crewScaling: false,
        powerType: 'dc',
      } satisfies DrainEquipment;
    case 'charge':
      return {
        ...base,
        type: 'charge',
        sourceType: 'solar',
        panelWatts: 100,
        panelType: 'rigid',
      } satisfies ChargeEquipment;
    case 'store':
      return {
        ...base,
        type: 'store',
        chemistry: 'lifepo4',
        capacityAh: 100,
      } satisfies StoreEquipment;
  }
}

function CatalogPanel({
  data,
  search,
  onAdd,
}: {
  data: CatalogRow[];
  search: string;
  onAdd: (item: EquipmentInstance) => void;
}) {
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.make && r.make.toLowerCase().includes(q)) ||
        (r.model && r.model.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogRow[]>();
    for (const row of filtered) {
      const list = map.get(row.category) ?? [];
      list.push(row);
      map.set(row.category, list);
    }
    return map;
  }, [filtered]);

  const categories = [...grouped.keys()];

  if (categories.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="lg">
        No equipment found
      </Text>
    );
  }

  // When searching, show flat list across categories
  if (search) {
    return (
      <Stack gap="xs">
        {filtered.map((row) => (
          <CatalogItemRow
            key={row.id}
            row={row}
            onAdd={() => onAdd(catalogRowToEquipment(row))}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Tabs defaultValue={categories[0]}>
      <Tabs.List mb="sm">
        {categories.map((cat) => (
          <Tabs.Tab key={cat} value={cat}>
            {formatCategory(cat)}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {categories.map((cat) => (
        <Tabs.Panel key={cat} value={cat}>
          <Stack gap="xs">
            {(grouped.get(cat) ?? []).map((row) => (
              <CatalogItemRow
                key={row.id}
                row={row}
                onAdd={() => onAdd(catalogRowToEquipment(row))}
              />
            ))}
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

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
  const [showOldModels, setShowOldModels] = useState(false);
  const { data, isLoading } = useEquipmentCatalog(filterType, showOldModels);

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

        <Group justify="space-between" mb="sm">
          <Checkbox
            label="Show older models"
            checked={showOldModels}
            onChange={(e) => setShowOldModels(e.currentTarget.checked)}
            size="xs"
          />
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconPlus size={14} />}
            onClick={() => handleAdd(createCustomItem(filterType))}
          >
            Add Custom
          </Button>
        </Group>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
          <CatalogPanel data={data ?? []} search={search} onAdd={handleAdd} />
        )}
      </div>
    </Modal>
  );
}
