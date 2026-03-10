import type {
  EquipmentInstance,
  DrainEquipment,
  ChargeEquipment,
  StoreEquipment,
} from './types';
import {
  INVERTER_EFFICIENCY,
  ALTERNATOR_EFFICIENCY,
  PANEL_FACTOR,
} from './equipment-calc';

// --- Types ---

export type SchematicNodeType =
  | 'solar-panel'
  | 'mppt'
  | 'battery-bank'
  | 'dc-loads'
  | 'ac-loads'
  | 'inverter'
  | 'alternator'
  | 'regulator'
  | 'shore-charger';

export interface SchematicNode {
  id: string;
  type: SchematicNodeType;
  label: string;
  watts: number;
  enabled: boolean;
  equipmentIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SchematicEdge {
  id: string;
  from: string;
  to: string;
  type: 'charge' | 'drain' | 'storage';
  watts: number;
  enabled: boolean;
}

export interface SchematicGraph {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
}

// --- Layout constants ---

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;
const ROW_Y = { sources: 20, controllers: 140, battery: 260, loads: 380 };

// --- Builder ---

export function buildSchematicGraph(
  equipment: EquipmentInstance[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
  peakSunHours: number,
  deratingFactor: number,
  systemVoltage: number,
): SchematicGraph {
  if (equipment.length === 0) {
    return { nodes: [], edges: [] };
  }

  const solarPanels = equipment.filter(
    (e): e is ChargeEquipment => e.type === 'charge' && e.sourceType === 'solar',
  );
  const alternators = equipment.filter(
    (e): e is ChargeEquipment => e.type === 'charge' && e.sourceType === 'alternator',
  );
  const shorePower = equipment.filter(
    (e): e is ChargeEquipment => e.type === 'charge' && e.sourceType === 'shore',
  );
  const batteries = equipment.filter(
    (e): e is StoreEquipment => e.type === 'store',
  );
  const dcDrains = equipment.filter(
    (e): e is DrainEquipment => e.type === 'drain' && e.powerType === 'dc',
  );
  const acDrains = equipment.filter(
    (e): e is DrainEquipment => e.type === 'drain' && e.powerType === 'ac',
  );

  const nodes: SchematicNode[] = [];
  const edges: SchematicEdge[] = [];

  // Determine if LiFePO4 is present (for regulator decision)
  const hasLifepo4 = batteries.some((b) => b.enabled && b.chemistry === 'lifepo4');

  // --- Calculate watts ---

  const solarTotalWatts = solarPanels.reduce((sum, p) => sum + (p.panelWatts ?? 0), 0);
  const solarDailyWh = solarPanels.reduce((sum, p) => {
    if (!p.enabled) return sum;
    const factor = PANEL_FACTOR[p.panelType ?? 'rigid'];
    return sum + Math.round((p.panelWatts ?? 0) * peakSunHours * deratingFactor * factor);
  }, 0);
  const solarEnabled = solarPanels.some((p) => p.enabled);

  const alternatorDailyWh = alternators.reduce((sum, a) => {
    if (!a.enabled) return sum;
    return sum + Math.round(
      (a.alternatorAmps ?? 0) * systemVoltage * (a.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY,
    );
  }, 0);
  const alternatorEnabled = alternators.some((a) => a.enabled);

  const shoreDailyWh = shorePower.reduce((sum, s) => {
    if (!s.enabled) return sum;
    return sum + Math.round(
      (s.shoreChargerAmps ?? 0) * systemVoltage * (s.shoreHoursPerDay ?? 0),
    );
  }, 0);
  const shoreEnabled = shorePower.some((s) => s.enabled);

  const dcDrainWh = computeDrainWh(dcDrains, viewMode, crewSize, false);
  const dcDrainEnabled = dcDrains.some((d) => d.enabled);

  const acDrainWh = computeDrainWh(acDrains, viewMode, crewSize, false);
  const acDrainWhWithInverter = Math.round(acDrainWh / INVERTER_EFFICIENCY);
  const acDrainEnabled = acDrains.some((d) => d.enabled);

  const batteryEnabled = batteries.some((b) => b.enabled);

  // --- Build nodes ---

  // Count source nodes for horizontal layout
  const sourceNodes: SchematicNodeType[] = [];
  if (solarPanels.length > 0) sourceNodes.push('solar-panel');
  if (alternators.length > 0) sourceNodes.push('alternator');
  if (shorePower.length > 0) sourceNodes.push('shore-charger');

  const controllerNodes: SchematicNodeType[] = [];
  if (solarPanels.length > 0) controllerNodes.push('mppt');
  if (alternators.length > 0 && hasLifepo4) controllerNodes.push('regulator');

  const loadNodes: SchematicNodeType[] = [];
  if (dcDrains.length > 0) loadNodes.push('dc-loads');
  if (acDrains.length > 0) {
    loadNodes.push('inverter');
    loadNodes.push('ac-loads');
  }

  // Solar panel
  if (solarPanels.length > 0) {
    nodes.push(makeNode('solar-panel', 'Solar Panels', solarTotalWatts, solarEnabled, solarPanels.map((p) => p.id), sourceNodes, 'sources'));
    nodes.push(makeNode('mppt', 'MPPT Controller', solarDailyWh, solarEnabled, solarPanels.map((p) => p.id), controllerNodes, 'controllers'));
    edges.push({
      id: 'edge-solar-panel-to-mppt',
      from: 'node-solar-panel',
      to: 'node-mppt',
      type: 'charge',
      watts: solarDailyWh,
      enabled: solarEnabled,
    });
  }

  // Alternator
  if (alternators.length > 0) {
    nodes.push(makeNode('alternator', 'Alternator', alternators.reduce((s, a) => s + (a.alternatorAmps ?? 0), 0) * systemVoltage, alternatorEnabled, alternators.map((a) => a.id), sourceNodes, 'sources'));

    if (hasLifepo4) {
      nodes.push(makeNode('regulator', 'Smart Regulator', alternatorDailyWh, alternatorEnabled, alternators.map((a) => a.id), controllerNodes, 'controllers'));
      edges.push({
        id: 'edge-alternator-to-regulator',
        from: 'node-alternator',
        to: 'node-regulator',
        type: 'charge',
        watts: alternatorDailyWh,
        enabled: alternatorEnabled,
      });
      edges.push({
        id: 'edge-regulator-to-battery-bank',
        from: 'node-regulator',
        to: 'node-battery-bank',
        type: 'charge',
        watts: alternatorDailyWh,
        enabled: alternatorEnabled && batteryEnabled,
      });
    } else {
      edges.push({
        id: 'edge-alternator-to-battery-bank',
        from: 'node-alternator',
        to: 'node-battery-bank',
        type: 'charge',
        watts: alternatorDailyWh,
        enabled: alternatorEnabled && batteryEnabled,
      });
    }
  }

  // Shore power
  if (shorePower.length > 0) {
    nodes.push(makeNode('shore-charger', 'Shore Charger', shoreDailyWh, shoreEnabled, shorePower.map((s) => s.id), sourceNodes, 'sources'));
    edges.push({
      id: 'edge-shore-charger-to-battery-bank',
      from: 'node-shore-charger',
      to: 'node-battery-bank',
      type: 'charge',
      watts: shoreDailyWh,
      enabled: shoreEnabled && batteryEnabled,
    });
  }

  // Battery bank
  if (batteries.length > 0) {
    nodes.push({
      id: 'node-battery-bank',
      type: 'battery-bank',
      label: 'Battery Bank',
      watts: batteries.reduce((s, b) => s + b.capacityAh, 0) * systemVoltage,
      enabled: batteryEnabled,
      equipmentIds: batteries.map((b) => b.id),
      x: horizontalCenter(1, 0),
      y: ROW_Y.battery,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  // MPPT -> battery edge
  if (solarPanels.length > 0 && batteries.length > 0) {
    edges.push({
      id: 'edge-mppt-to-battery-bank',
      from: 'node-mppt',
      to: 'node-battery-bank',
      type: 'charge',
      watts: solarDailyWh,
      enabled: solarEnabled && batteryEnabled,
    });
  }

  // DC loads
  if (dcDrains.length > 0) {
    nodes.push(makeNode('dc-loads', 'DC Loads', dcDrainWh, dcDrainEnabled, dcDrains.map((d) => d.id), loadNodes, 'loads'));
    if (batteries.length > 0) {
      edges.push({
        id: 'edge-battery-bank-to-dc-loads',
        from: 'node-battery-bank',
        to: 'node-dc-loads',
        type: 'drain',
        watts: dcDrainWh,
        enabled: batteryEnabled && dcDrainEnabled,
      });
    }
  }

  // AC loads (with inverter)
  if (acDrains.length > 0) {
    nodes.push(makeNode('inverter', 'Inverter', acDrainWhWithInverter, acDrainEnabled, acDrains.map((d) => d.id), loadNodes, 'loads'));
    nodes.push(makeNode('ac-loads', 'AC Loads', acDrainWh, acDrainEnabled, acDrains.map((d) => d.id), loadNodes, 'loads'));
    if (batteries.length > 0) {
      edges.push({
        id: 'edge-battery-bank-to-inverter',
        from: 'node-battery-bank',
        to: 'node-inverter',
        type: 'drain',
        watts: acDrainWhWithInverter,
        enabled: batteryEnabled && acDrainEnabled,
      });
    }
    edges.push({
      id: 'edge-inverter-to-ac-loads',
      from: 'node-inverter',
      to: 'node-ac-loads',
      type: 'drain',
      watts: acDrainWh,
      enabled: acDrainEnabled,
    });
  }

  return { nodes, edges };
}

// --- Helpers ---

function computeDrainWh(
  drains: DrainEquipment[],
  viewMode: 'anchor' | 'passage',
  crewSize: number,
  _includeInverter: boolean,
): number {
  let total = 0;
  for (const item of drains) {
    if (!item.enabled) continue;
    const hours = viewMode === 'anchor' ? item.hoursPerDayAnchor : item.hoursPerDayPassage;
    const crewMultiplier = item.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
    total += Math.round(item.wattsTypical * hours * item.dutyCycle * crewMultiplier);
  }
  return total;
}

function horizontalCenter(totalInRow: number, index: number): number {
  const totalWidth = totalInRow * NODE_WIDTH + (totalInRow - 1) * 40;
  const startX = (500 - totalWidth) / 2;
  return startX + index * (NODE_WIDTH + 40);
}

function makeNode(
  type: SchematicNodeType,
  label: string,
  watts: number,
  enabled: boolean,
  equipmentIds: string[],
  rowTypes: SchematicNodeType[],
  row: 'sources' | 'controllers' | 'loads',
): SchematicNode {
  const index = rowTypes.indexOf(type);
  const total = rowTypes.length;
  return {
    id: `node-${type}`,
    type,
    label,
    watts,
    enabled,
    equipmentIds,
    x: horizontalCenter(total, index >= 0 ? index : 0),
    y: ROW_Y[row],
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
}
