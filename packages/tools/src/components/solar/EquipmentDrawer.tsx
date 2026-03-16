import {
  Badge,
  Button,
  Drawer,
  Group,
  NumberInput,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { RegionPicker } from './RegionPicker';
import type {
  EquipmentInstance,
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
  PanelType,
} from '@/lib/solar/types';

import { HEADING_FONT } from '@above-deck/shared/theme/fonts';

// --- Constants ---
const INVERTER_EFFICIENCY = 0.85;
const PANEL_FACTOR: Record<PanelType, number> = {
  rigid: 1.0,
  'semi-flexible': 0.9,
  flexible: 0.85,
};
const ALTERNATOR_EFFICIENCY = 0.7;
const DOD: Record<'agm' | 'lifepo4', number> = { agm: 0.5, lifepo4: 0.8 };

// --- Props ---
export interface EquipmentDrawerProps {
  opened: boolean;
  onClose: () => void;
  item: EquipmentInstance | null;
  onUpdate: (id: string, updates: Partial<EquipmentInstance>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  viewMode: 'anchor' | 'passage';
  crewSize: number;
  systemVoltage: number;
  acCircuitVoltage: number;
  peakSunHours: number;
  deratingFactor: number;
}

// --- Type badge color ---
function typeBadgeColor(type: 'drain' | 'charge' | 'store') {
  if (type === 'drain') return 'red';
  if (type === 'charge') return 'green';
  return 'blue';
}

// --- Sub-components ---

interface DrainFieldsProps {
  item: DrainEquipment;
  onUpdate: (id: string, updates: Partial<DrainEquipment>) => void;
  viewMode: 'anchor' | 'passage';
  crewSize: number;
  acCircuitVoltage: number;
  locked: boolean;
}

function DrainFields({
  item,
  onUpdate,
  viewMode,
  crewSize,
  acCircuitVoltage,
  locked,
}: DrainFieldsProps) {
  const hoursKey =
    viewMode === 'anchor' ? 'hoursPerDayAnchor' : 'hoursPerDayPassage';
  const hours = item[hoursKey];
  const crewMult = item.crewScaling ? crewSize : 1;
  const inverterFactor = item.powerType === 'ac' ? 1 / INVERTER_EFFICIENCY : 1;
  const whPerDay = Math.round(
    item.wattsTypical * hours * item.dutyCycle * crewMult * inverterFactor,
  );

  return (
    <Stack gap="md">
      <NumberInput
        label={`Wattage (${item.wattsMin}–${item.wattsMax}W)`}
        value={item.wattsTypical}
        min={item.wattsMin}
        max={item.wattsMax}
        readOnly={locked}
        onChange={(val) =>
          onUpdate(item.id, { wattsTypical: Number(val) || 0 })
        }
      />

      <div>
        <Text size="sm" fw={500} mb={4}>
          Hours/day ({viewMode})
        </Text>
        <Slider
          value={hours}
          min={0}
          max={24}
          step={0.5}
          disabled={locked}
          marks={[
            { value: 0, label: '0' },
            { value: 12, label: '12' },
            { value: 24, label: '24' },
          ]}
          onChange={(val) => onUpdate(item.id, { [hoursKey]: val })}
        />
      </div>

      <NumberInput
        label="Duty cycle"
        value={item.dutyCycle}
        min={0}
        max={1}
        step={0.05}
        decimalScale={2}
        readOnly={locked}
        onChange={(val) => onUpdate(item.id, { dutyCycle: Number(val) || 0 })}
      />

      <Group>
        <Switch
          label="Crew scaling"
          checked={item.crewScaling}
          disabled={locked}
          onChange={(e) =>
            onUpdate(item.id, { crewScaling: e.currentTarget.checked })
          }
        />
        {item.crewScaling && (
          <Text size="sm" c="dimmed">
            ×{crewSize} crew
          </Text>
        )}
      </Group>

      {item.powerType === 'ac' && (
        <Text size="xs" c="dimmed">
          AC item — inverter loss applied ({acCircuitVoltage}V circuit,{' '}
          {Math.round(INVERTER_EFFICIENCY * 100)}% efficiency)
        </Text>
      )}

      <Text size="sm" fw={500} ff={HEADING_FONT}>
        This item uses {whPerDay} Wh/day at {viewMode}
      </Text>
    </Stack>
  );
}

interface ChargeFieldsProps {
  item: ChargeEquipment;
  onUpdate: (id: string, updates: Partial<ChargeEquipment>) => void;
  systemVoltage: number;
  peakSunHours: number;
  deratingFactor: number;
  locked: boolean;
}

function ChargeFields({
  item,
  onUpdate,
  systemVoltage,
  peakSunHours,
  deratingFactor,
  locked,
}: ChargeFieldsProps) {
  let whPerDay = 0;

  if (item.sourceType === 'solar') {
    const panelType = item.panelType || 'rigid';
    const watts = item.panelWatts || 0;
    whPerDay = Math.round(
      watts * peakSunHours * PANEL_FACTOR[panelType] * deratingFactor,
    );
  } else if (item.sourceType === 'alternator') {
    const amps = item.alternatorAmps || 0;
    const hours = item.motoringHoursPerDay || 0;
    whPerDay = Math.round(amps * systemVoltage * hours * ALTERNATOR_EFFICIENCY);
  } else if (item.sourceType === 'shore') {
    const amps = item.shoreChargerAmps || 0;
    const hours = item.shoreHoursPerDay || 0;
    whPerDay = Math.round(amps * systemVoltage * hours);
  }

  return (
    <Stack gap="md">
      {item.sourceType === 'solar' && (
        <>
          <NumberInput
            label="Panel wattage"
            value={item.panelWatts || 0}
            min={0}
            readOnly={locked}
            onChange={(val) =>
              onUpdate(item.id, { panelWatts: Number(val) || 0 })
            }
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              Panel type
            </Text>
            <SegmentedControl
              value={item.panelType || 'rigid'}
              disabled={locked}
              data={[
                { value: 'rigid', label: 'Rigid' },
                { value: 'semi-flexible', label: 'Semi-flex' },
                { value: 'flexible', label: 'Flexible' },
              ]}
              onChange={(val) =>
                onUpdate(item.id, { panelType: val as PanelType })
              }
            />
          </div>
          <RegionPicker />
        </>
      )}

      {item.sourceType === 'alternator' && (
        <>
          <NumberInput
            label="Alternator amps"
            value={item.alternatorAmps || 0}
            min={0}
            readOnly={locked}
            onChange={(val) =>
              onUpdate(item.id, { alternatorAmps: Number(val) || 0 })
            }
          />
          <NumberInput
            label="Motoring hours/day"
            value={item.motoringHoursPerDay || 0}
            min={0}
            max={24}
            step={0.5}
            readOnly={locked}
            onChange={(val) =>
              onUpdate(item.id, { motoringHoursPerDay: Number(val) || 0 })
            }
          />
        </>
      )}

      {item.sourceType === 'shore' && (
        <>
          <NumberInput
            label="Hours/day on shore power"
            value={item.shoreHoursPerDay || 0}
            min={0}
            max={24}
            step={0.5}
            readOnly={locked}
            onChange={(val) =>
              onUpdate(item.id, { shoreHoursPerDay: Number(val) || 0 })
            }
          />
          <NumberInput
            label="Charger amps"
            value={item.shoreChargerAmps || 0}
            min={0}
            readOnly={locked}
            onChange={(val) =>
              onUpdate(item.id, { shoreChargerAmps: Number(val) || 0 })
            }
          />
        </>
      )}

      <Text size="sm" fw={500} ff={HEADING_FONT}>
        This source provides {whPerDay} Wh/day
      </Text>
    </Stack>
  );
}

interface StoreFieldsProps {
  item: StoreEquipment;
  onUpdate: (id: string, updates: Partial<StoreEquipment>) => void;
  systemVoltage: number;
  locked: boolean;
}

function StoreFields({ item, onUpdate, systemVoltage, locked }: StoreFieldsProps) {
  const dod = DOD[item.chemistry];
  const usableWh = Math.round(item.capacityAh * systemVoltage * dod);

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" fw={500} mb={4}>
          Chemistry
        </Text>
        <SegmentedControl
          value={item.chemistry}
          disabled={locked}
          data={[
            { value: 'agm', label: 'AGM' },
            { value: 'lifepo4', label: 'LiFePO4' },
          ]}
          onChange={(val) =>
            onUpdate(item.id, {
              chemistry: val as 'agm' | 'lifepo4',
            })
          }
        />
      </div>

      <NumberInput
        label="Capacity (Ah)"
        value={item.capacityAh}
        min={0}
        readOnly={locked}
        onChange={(val) =>
          onUpdate(item.id, { capacityAh: Number(val) || 0 })
        }
      />

      <Text size="sm" fw={500} ff={HEADING_FONT}>
        Usable capacity: {usableWh} Wh ({Math.round(dod * 100)}% DoD)
      </Text>
    </Stack>
  );
}

// --- Main component ---

export function EquipmentDrawer({
  opened,
  onClose,
  item,
  onUpdate,
  onDuplicate,
  onRemove,
  viewMode,
  crewSize,
  systemVoltage,
  acCircuitVoltage,
  peakSunHours,
  deratingFactor,
}: EquipmentDrawerProps) {
  if (!item) return null;

  const isStock = item.origin === 'stock';
  const isLocked = item.origin === 'catalog';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Group gap="sm">
          <Title order={4} ff={HEADING_FONT}>
            {item.name}
          </Title>
          <Badge color={typeBadgeColor(item.type)} variant="light" size="sm">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Badge>
        </Group>
      }
    >
      <Stack gap="lg" pb={80}>
        <Switch
          label="Enabled"
          checked={item.enabled}
          onChange={(e) =>
            onUpdate(item.id, { enabled: e.currentTarget.checked })
          }
        />

        {isLocked && (
          <Text size="xs" c="dimmed" fs="italic">
            Specs from manufacturer catalog
          </Text>
        )}

        {item.type === 'drain' && (
          <DrainFields
            item={item}
            onUpdate={onUpdate}
            viewMode={viewMode}
            crewSize={crewSize}
            acCircuitVoltage={acCircuitVoltage}
            locked={isLocked}
          />
        )}

        {item.type === 'charge' && (
          <ChargeFields
            item={item}
            onUpdate={onUpdate}
            systemVoltage={systemVoltage}
            peakSunHours={peakSunHours}
            deratingFactor={deratingFactor}
            locked={isLocked}
          />
        )}

        {item.type === 'store' && (
          <StoreFields
            item={item}
            onUpdate={onUpdate}
            systemVoltage={systemVoltage}
            locked={isLocked}
          />
        )}

        <Textarea
          label="Notes"
          value={item.notes}
          onChange={(e) => onUpdate(item.id, { notes: e.currentTarget.value })}
          autosize
          minRows={2}
        />

        <Group mt="md">
          <Button variant="light" onClick={onDuplicate}>
            Duplicate
          </Button>
          <Button variant="light" color="red" onClick={onRemove}>
            {isStock ? 'Disable' : 'Remove'}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
