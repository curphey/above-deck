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
  | 'alternator'
  | 'shore-charger'
  | 'mppt'
  | 'regulator'
  | 'battery'
  | 'inverter'
  | 'dc-drain'
  | 'ac-drain';

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
  width: number;
  height: number;
}

// --- Layout constants ---

const EQUIP_NODE_W = 100;
const EQUIP_NODE_H = 50;
const INFRA_NODE_W = 120;
const INFRA_NODE_H = 50;
const GAP_X = 24;
const GAP_Y = 80;
const PADDING_X = 20;
const MIN_WIDTH = 400;

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
    return { nodes: [], edges: [], width: MIN_WIDTH, height: 0 };
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

  const hasLifepo4 = batteries.some((b) => b.enabled && b.chemistry === 'lifepo4');

  const nodes: SchematicNode[] = [];
  const edges: SchematicEdge[] = [];

  // --- Row definitions: collect items per row before layout ---

  // Row 0: individual charge sources
  const sourceItems: { id: string; type: SchematicNodeType; label: string; watts: number; enabled: boolean; equipId: string }[] = [];
  for (const p of solarPanels) {
    sourceItems.push({ id: p.id, type: 'solar-panel', label: p.name, watts: p.panelWatts ?? 0, enabled: p.enabled, equipId: p.id });
  }
  for (const a of alternators) {
    sourceItems.push({ id: a.id, type: 'alternator', label: a.name, watts: (a.alternatorAmps ?? 0) * systemVoltage, enabled: a.enabled, equipId: a.id });
  }
  for (const s of shorePower) {
    sourceItems.push({ id: s.id, type: 'shore-charger', label: s.name, watts: (s.shoreChargerAmps ?? 0) * systemVoltage, enabled: s.enabled, equipId: s.id });
  }

  // Row 1: infrastructure controllers (MPPT if solar, Regulator if alternator+LiFePO4)
  const controllerItems: { id: string; type: SchematicNodeType; label: string; watts: number; enabled: boolean; equipIds: string[] }[] = [];
  if (solarPanels.length > 0) {
    const solarEnabled = solarPanels.some((p) => p.enabled);
    const solarDailyWh = solarPanels.reduce((sum, p) => {
      if (!p.enabled) return sum;
      const factor = PANEL_FACTOR[p.panelType ?? 'rigid'];
      return sum + Math.round((p.panelWatts ?? 0) * peakSunHours * deratingFactor * factor);
    }, 0);
    controllerItems.push({ id: 'mppt', type: 'mppt', label: 'MPPT Controller', watts: solarDailyWh, enabled: solarEnabled, equipIds: solarPanels.map((p) => p.id) });
  }
  if (alternators.length > 0 && hasLifepo4) {
    const altEnabled = alternators.some((a) => a.enabled);
    const altDailyWh = alternators.reduce((sum, a) => {
      if (!a.enabled) return sum;
      return sum + Math.round((a.alternatorAmps ?? 0) * systemVoltage * (a.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY);
    }, 0);
    controllerItems.push({ id: 'regulator', type: 'regulator', label: 'Smart Regulator', watts: altDailyWh, enabled: altEnabled, equipIds: alternators.map((a) => a.id) });
  }

  // Row 2: individual batteries
  const batteryItems: { id: string; type: SchematicNodeType; label: string; watts: number; enabled: boolean; equipId: string }[] = [];
  for (const b of batteries) {
    batteryItems.push({ id: b.id, type: 'battery', label: b.name, watts: b.capacityAh * systemVoltage, enabled: b.enabled, equipId: b.id });
  }

  // Row 3: inverter (if AC drains) + individual drains
  const loadItems: { id: string; type: SchematicNodeType; label: string; watts: number; enabled: boolean; equipId: string }[] = [];
  for (const d of dcDrains) {
    const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
    const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
    const wh = Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
    loadItems.push({ id: d.id, type: 'dc-drain', label: d.name, watts: wh, enabled: d.enabled, equipId: d.id });
  }

  // Insert inverter before AC drains
  const hasAcDrains = acDrains.length > 0;
  if (hasAcDrains) {
    const acEnabled = acDrains.some((d) => d.enabled);
    const acTotalWh = acDrains.reduce((sum, d) => {
      if (!d.enabled) return sum;
      const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
      const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
      return sum + Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
    }, 0);
    loadItems.push({ id: 'inverter', type: 'inverter', label: 'Inverter', watts: Math.round(acTotalWh / INVERTER_EFFICIENCY), enabled: acEnabled, equipId: 'inverter' });
  }
  for (const d of acDrains) {
    const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
    const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
    const wh = Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
    loadItems.push({ id: d.id, type: 'ac-drain', label: d.name, watts: wh, enabled: d.enabled, equipId: d.id });
  }

  // --- Compute layout dimensions ---

  const rowWidths = [
    rowWidth(sourceItems.length, EQUIP_NODE_W),
    rowWidth(controllerItems.length, INFRA_NODE_W),
    rowWidth(batteryItems.length, EQUIP_NODE_W),
    rowWidth(loadItems.length, EQUIP_NODE_W),
  ];
  const canvasWidth = Math.max(MIN_WIDTH, ...rowWidths) + PADDING_X * 2;

  // --- Layout rows ---

  let currentY = 20;

  // Row 0: sources
  if (sourceItems.length > 0) {
    const positions = centerRow(sourceItems.length, EQUIP_NODE_W, canvasWidth);
    for (let i = 0; i < sourceItems.length; i++) {
      const s = sourceItems[i];
      nodes.push({
        id: `node-${s.id}`,
        type: s.type,
        label: s.label,
        watts: s.watts,
        enabled: s.enabled,
        equipmentIds: [s.equipId],
        x: positions[i],
        y: currentY,
        width: EQUIP_NODE_W,
        height: EQUIP_NODE_H,
      });
    }
    currentY += EQUIP_NODE_H + GAP_Y;
  }

  // Row 1: controllers
  if (controllerItems.length > 0) {
    const positions = centerRow(controllerItems.length, INFRA_NODE_W, canvasWidth);
    for (let i = 0; i < controllerItems.length; i++) {
      const c = controllerItems[i];
      nodes.push({
        id: `node-${c.id}`,
        type: c.type,
        label: c.label,
        watts: c.watts,
        enabled: c.enabled,
        equipmentIds: c.equipIds,
        x: positions[i],
        y: currentY,
        width: INFRA_NODE_W,
        height: INFRA_NODE_H,
      });
    }
    currentY += INFRA_NODE_H + GAP_Y;
  }

  // Row 2: batteries
  if (batteryItems.length > 0) {
    const positions = centerRow(batteryItems.length, EQUIP_NODE_W, canvasWidth);
    for (let i = 0; i < batteryItems.length; i++) {
      const b = batteryItems[i];
      nodes.push({
        id: `node-${b.id}`,
        type: b.type,
        label: b.label,
        watts: b.watts,
        enabled: b.enabled,
        equipmentIds: [b.equipId],
        x: positions[i],
        y: currentY,
        width: EQUIP_NODE_W,
        height: EQUIP_NODE_H,
      });
    }
    currentY += EQUIP_NODE_H + GAP_Y;
  }

  // Row 3: loads (DC drains + inverter + AC drains)
  if (loadItems.length > 0) {
    const positions = centerRow(loadItems.length, EQUIP_NODE_W, canvasWidth);
    for (let i = 0; i < loadItems.length; i++) {
      const l = loadItems[i];
      const w = l.type === 'inverter' ? INFRA_NODE_W : EQUIP_NODE_W;
      nodes.push({
        id: `node-${l.id}`,
        type: l.type,
        label: l.label,
        watts: l.watts,
        enabled: l.enabled,
        equipmentIds: [l.equipId],
        x: positions[i],
        y: currentY,
        width: w,
        height: EQUIP_NODE_H,
      });
    }
    currentY += EQUIP_NODE_H;
  }

  const canvasHeight = currentY + 20;

  // --- Build edges ---

  // Sources → controllers
  for (const p of solarPanels) {
    const dailyWh = p.enabled
      ? Math.round((p.panelWatts ?? 0) * peakSunHours * deratingFactor * PANEL_FACTOR[p.panelType ?? 'rigid'])
      : 0;
    edges.push({
      id: `edge-${p.id}-to-mppt`,
      from: `node-${p.id}`,
      to: 'node-mppt',
      type: 'charge',
      watts: dailyWh,
      enabled: p.enabled,
    });
  }

  for (const a of alternators) {
    const dailyWh = a.enabled
      ? Math.round((a.alternatorAmps ?? 0) * systemVoltage * (a.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY)
      : 0;
    if (hasLifepo4) {
      edges.push({
        id: `edge-${a.id}-to-regulator`,
        from: `node-${a.id}`,
        to: 'node-regulator',
        type: 'charge',
        watts: dailyWh,
        enabled: a.enabled,
      });
    } else {
      // Connect directly to first battery
      for (const b of batteries) {
        edges.push({
          id: `edge-${a.id}-to-${b.id}`,
          from: `node-${a.id}`,
          to: `node-${b.id}`,
          type: 'charge',
          watts: dailyWh,
          enabled: a.enabled && b.enabled,
        });
      }
    }
  }

  for (const s of shorePower) {
    const dailyWh = s.enabled
      ? Math.round((s.shoreChargerAmps ?? 0) * systemVoltage * (s.shoreHoursPerDay ?? 0))
      : 0;
    // Shore charger connects directly to batteries
    for (const b of batteries) {
      edges.push({
        id: `edge-${s.id}-to-${b.id}`,
        from: `node-${s.id}`,
        to: `node-${b.id}`,
        type: 'charge',
        watts: dailyWh,
        enabled: s.enabled && b.enabled,
      });
    }
  }

  // Controllers → batteries
  if (solarPanels.length > 0) {
    const solarEnabled = solarPanels.some((p) => p.enabled);
    const solarDailyWh = solarPanels.reduce((sum, p) => {
      if (!p.enabled) return sum;
      return sum + Math.round((p.panelWatts ?? 0) * peakSunHours * deratingFactor * PANEL_FACTOR[p.panelType ?? 'rigid']);
    }, 0);
    for (const b of batteries) {
      edges.push({
        id: `edge-mppt-to-${b.id}`,
        from: 'node-mppt',
        to: `node-${b.id}`,
        type: 'charge',
        watts: solarDailyWh,
        enabled: solarEnabled && b.enabled,
      });
    }
  }

  if (hasLifepo4 && alternators.length > 0) {
    const altEnabled = alternators.some((a) => a.enabled);
    const altDailyWh = alternators.reduce((sum, a) => {
      if (!a.enabled) return sum;
      return sum + Math.round((a.alternatorAmps ?? 0) * systemVoltage * (a.motoringHoursPerDay ?? 0) * ALTERNATOR_EFFICIENCY);
    }, 0);
    for (const b of batteries) {
      edges.push({
        id: `edge-regulator-to-${b.id}`,
        from: 'node-regulator',
        to: `node-${b.id}`,
        type: 'charge',
        watts: altDailyWh,
        enabled: altEnabled && b.enabled,
      });
    }
  }

  // Batteries → loads
  const batteryEnabled = batteries.some((b) => b.enabled);
  for (const d of dcDrains) {
    const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
    const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
    const wh = Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
    for (const b of batteries) {
      edges.push({
        id: `edge-${b.id}-to-${d.id}`,
        from: `node-${b.id}`,
        to: `node-${d.id}`,
        type: 'drain',
        watts: wh,
        enabled: b.enabled && d.enabled,
      });
    }
  }

  // Batteries → inverter → AC drains
  if (hasAcDrains) {
    const acEnabled = acDrains.some((d) => d.enabled);
    const acTotalWh = acDrains.reduce((sum, d) => {
      if (!d.enabled) return sum;
      const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
      const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
      return sum + Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
    }, 0);
    for (const b of batteries) {
      edges.push({
        id: `edge-${b.id}-to-inverter`,
        from: `node-${b.id}`,
        to: 'node-inverter',
        type: 'drain',
        watts: Math.round(acTotalWh / INVERTER_EFFICIENCY),
        enabled: b.enabled && acEnabled,
      });
    }
    for (const d of acDrains) {
      const hours = viewMode === 'anchor' ? d.hoursPerDayAnchor : d.hoursPerDayPassage;
      const crewMultiplier = d.crewScaling ? Math.max(crewSize, 1) / 2 : 1;
      const wh = Math.round(d.wattsTypical * hours * d.dutyCycle * crewMultiplier);
      edges.push({
        id: `edge-inverter-to-${d.id}`,
        from: 'node-inverter',
        to: `node-${d.id}`,
        type: 'drain',
        watts: wh,
        enabled: d.enabled,
      });
    }
  }

  return { nodes, edges, width: canvasWidth, height: canvasHeight };
}

// --- Helpers ---

function rowWidth(count: number, nodeWidth: number): number {
  if (count === 0) return 0;
  return count * nodeWidth + (count - 1) * GAP_X;
}

function centerRow(count: number, nodeWidth: number, canvasWidth: number): number[] {
  const totalWidth = rowWidth(count, nodeWidth);
  const startX = (canvasWidth - totalWidth) / 2;
  return Array.from({ length: count }, (_, i) => startX + i * (nodeWidth + GAP_X));
}
