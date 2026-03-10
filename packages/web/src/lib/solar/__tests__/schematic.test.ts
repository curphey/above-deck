import { describe, it, expect } from 'vitest';
import { buildSchematicGraph } from '../schematic';
import type { EquipmentInstance, DrainEquipment, ChargeEquipment, StoreEquipment } from '../types';
import { PANEL_FACTOR, ALTERNATOR_EFFICIENCY, INVERTER_EFFICIENCY } from '../equipment-calc';

// --- Helpers ---

function makeSolarPanel(overrides: Partial<ChargeEquipment> = {}): ChargeEquipment {
  return {
    id: 'solar-1',
    catalogId: null,
    name: '200W Rigid Panel',
    type: 'charge',
    sourceType: 'solar',
    panelWatts: 200,
    panelType: 'rigid',
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

function makeAlternator(overrides: Partial<ChargeEquipment> = {}): ChargeEquipment {
  return {
    id: 'alt-1',
    catalogId: null,
    name: 'Engine Alternator',
    type: 'charge',
    sourceType: 'alternator',
    alternatorAmps: 80,
    motoringHoursPerDay: 2,
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

function makeShore(overrides: Partial<ChargeEquipment> = {}): ChargeEquipment {
  return {
    id: 'shore-1',
    catalogId: null,
    name: 'Shore Power',
    type: 'charge',
    sourceType: 'shore',
    shoreChargerAmps: 30,
    shoreHoursPerDay: 8,
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

function makeBattery(overrides: Partial<StoreEquipment> = {}): StoreEquipment {
  return {
    id: 'bat-1',
    catalogId: null,
    name: 'LiFePO4 200Ah',
    type: 'store',
    chemistry: 'lifepo4',
    capacityAh: 200,
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

function makeDCDrain(overrides: Partial<DrainEquipment> = {}): DrainEquipment {
  return {
    id: 'drain-dc-1',
    catalogId: null,
    name: 'LED Lights',
    type: 'drain',
    category: 'lighting',
    wattsTypical: 20,
    wattsMin: 10,
    wattsMax: 30,
    hoursPerDayAnchor: 6,
    hoursPerDayPassage: 4,
    dutyCycle: 1,
    crewScaling: false,
    powerType: 'dc',
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

function makeACDrain(overrides: Partial<DrainEquipment> = {}): DrainEquipment {
  return {
    id: 'drain-ac-1',
    catalogId: null,
    name: 'Microwave',
    type: 'drain',
    category: 'galley',
    wattsTypical: 800,
    wattsMin: 600,
    wattsMax: 1000,
    hoursPerDayAnchor: 0.25,
    hoursPerDayPassage: 0,
    dutyCycle: 1,
    crewScaling: false,
    powerType: 'ac',
    enabled: true,
    origin: 'stock',
    notes: '',
    ...overrides,
  };
}

const defaultCtx = {
  viewMode: 'anchor' as const,
  crewSize: 2,
  peakSunHours: 5,
  deratingFactor: 0.85,
  systemVoltage: 12,
};

describe('buildSchematicGraph', () => {
  it('returns empty graph for empty equipment', () => {
    const graph = buildSchematicGraph([], defaultCtx.viewMode, defaultCtx.crewSize, defaultCtx.peakSunHours, defaultCtx.deratingFactor, defaultCtx.systemVoltage);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('builds solar + battery + DC drain topology (4 nodes, 3 edges)', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeBattery(),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    // Should have: solar-panel, mppt, battery-bank, dc-loads
    expect(graph.nodes).toHaveLength(4);
    const nodeTypes = graph.nodes.map((n) => n.type).sort();
    expect(nodeTypes).toEqual(['battery-bank', 'dc-loads', 'mppt', 'solar-panel']);

    // Should have: solar->mppt, mppt->battery, battery->dc-loads
    expect(graph.edges).toHaveLength(3);
    const solarToMppt = graph.edges.find((e) => e.from === 'node-solar-panel' && e.to === 'node-mppt');
    const mpptToBat = graph.edges.find((e) => e.from === 'node-mppt' && e.to === 'node-battery-bank');
    const batToDc = graph.edges.find((e) => e.from === 'node-battery-bank' && e.to === 'node-dc-loads');

    expect(solarToMppt).toBeDefined();
    expect(mpptToBat).toBeDefined();
    expect(batToDc).toBeDefined();

    // All charge edges
    expect(solarToMppt!.type).toBe('charge');
    expect(mpptToBat!.type).toBe('charge');
    // Drain edge
    expect(batToDc!.type).toBe('drain');
  });

  it('includes inverter and ac-loads when AC drains exist', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeAlternator(),
      makeBattery(),
      makeACDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const nodeTypes = graph.nodes.map((n) => n.type).sort();
    expect(nodeTypes).toContain('inverter');
    expect(nodeTypes).toContain('ac-loads');
    expect(nodeTypes).toContain('alternator');

    // Battery -> inverter -> ac-loads edges
    const batToInv = graph.edges.find((e) => e.from === 'node-battery-bank' && e.to === 'node-inverter');
    const invToAc = graph.edges.find((e) => e.from === 'node-inverter' && e.to === 'node-ac-loads');
    expect(batToInv).toBeDefined();
    expect(invToAc).toBeDefined();
    expect(batToInv!.type).toBe('drain');
    expect(invToAc!.type).toBe('drain');
  });

  it('includes regulator node when alternator + LiFePO4 battery', () => {
    const equipment: EquipmentInstance[] = [
      makeAlternator(),
      makeBattery({ chemistry: 'lifepo4' }),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('regulator');

    const altToReg = graph.edges.find((e) => e.from === 'node-alternator' && e.to === 'node-regulator');
    const regToBat = graph.edges.find((e) => e.from === 'node-regulator' && e.to === 'node-battery-bank');
    expect(altToReg).toBeDefined();
    expect(regToBat).toBeDefined();
  });

  it('skips regulator for alternator + AGM battery', () => {
    const equipment: EquipmentInstance[] = [
      makeAlternator(),
      makeBattery({ chemistry: 'agm' }),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).not.toContain('regulator');

    // alternator connects directly to battery
    const altToBat = graph.edges.find((e) => e.from === 'node-alternator' && e.to === 'node-battery-bank');
    expect(altToBat).toBeDefined();
  });

  it('includes shore-charger node when shore power exists', () => {
    const equipment: EquipmentInstance[] = [
      makeShore(),
      makeBattery(),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('shore-charger');

    const shoreToBat = graph.edges.find((e) => e.from === 'node-shore-charger' && e.to === 'node-battery-bank');
    expect(shoreToBat).toBeDefined();
    expect(shoreToBat!.type).toBe('charge');
  });

  it('marks nodes enabled: false when equipment is disabled', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ enabled: false }),
      makeBattery(),
      makeDCDrain({ enabled: false }),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const solarNode = graph.nodes.find((n) => n.type === 'solar-panel');
    const mpptNode = graph.nodes.find((n) => n.type === 'mppt');
    const dcNode = graph.nodes.find((n) => n.type === 'dc-loads');
    const batNode = graph.nodes.find((n) => n.type === 'battery-bank');

    expect(solarNode!.enabled).toBe(false);
    expect(mpptNode!.enabled).toBe(false);
    expect(dcNode!.enabled).toBe(false);
    expect(batNode!.enabled).toBe(true);
  });

  it('calculates correct watts on solar charge edges', () => {
    const panel = makeSolarPanel({ panelWatts: 200, panelType: 'rigid' });
    const equipment: EquipmentInstance[] = [
      panel,
      makeBattery(),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const solarNode = graph.nodes.find((n) => n.type === 'solar-panel');
    // Solar node watts = total panel watts (nameplate)
    expect(solarNode!.watts).toBe(200);

    // Edge watts = daily Wh generation: 200 * 5 * 0.85 * 1.0 = 850
    const solarEdge = graph.edges.find((e) => e.from === 'node-solar-panel');
    expect(solarEdge!.watts).toBe(850);
  });

  it('calculates correct watts on drain edges', () => {
    const drain = makeDCDrain({ wattsTypical: 20, hoursPerDayAnchor: 6, dutyCycle: 1 });
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeBattery(),
      drain,
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const dcNode = graph.nodes.find((n) => n.type === 'dc-loads');
    // 20W * 6h * 1.0 duty * 1.0 crew(2/2) = 120 Wh
    expect(dcNode!.watts).toBe(120);

    const batToDc = graph.edges.find((e) => e.from === 'node-battery-bank' && e.to === 'node-dc-loads');
    expect(batToDc!.watts).toBe(120);
  });

  it('calculates AC drain watts with inverter efficiency', () => {
    const acDrain = makeACDrain({ wattsTypical: 800, hoursPerDayAnchor: 0.25, dutyCycle: 1 });
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeBattery(),
      acDrain,
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    // AC drain: 800 * 0.25 * 1.0 * 1.0 = 200 Wh at the AC side
    const acNode = graph.nodes.find((n) => n.type === 'ac-loads');
    expect(acNode!.watts).toBe(200);

    // Battery -> inverter edge includes inverter loss: 200 / 0.85 = 235 Wh (rounded)
    const batToInv = graph.edges.find((e) => e.from === 'node-battery-bank' && e.to === 'node-inverter');
    expect(batToInv!.watts).toBe(Math.round(200 / INVERTER_EFFICIENCY));
  });

  it('tracks equipmentIds on nodes', () => {
    const panel1 = makeSolarPanel({ id: 'p1' });
    const panel2 = makeSolarPanel({ id: 'p2', name: 'Second Panel', panelWatts: 100 });
    const equipment: EquipmentInstance[] = [panel1, panel2, makeBattery(), makeDCDrain()];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const solarNode = graph.nodes.find((n) => n.type === 'solar-panel');
    expect(solarNode!.equipmentIds).toContain('p1');
    expect(solarNode!.equipmentIds).toContain('p2');
  });

  it('positions nodes in a vertical layout', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeBattery(),
      makeDCDrain(),
    ];

    const graph = buildSchematicGraph(equipment, 'anchor', 2, 5, 0.85, 12);

    const solarNode = graph.nodes.find((n) => n.type === 'solar-panel')!;
    const mpptNode = graph.nodes.find((n) => n.type === 'mppt')!;
    const batNode = graph.nodes.find((n) => n.type === 'battery-bank')!;
    const dcNode = graph.nodes.find((n) => n.type === 'dc-loads')!;

    // Charging sources at top, controllers middle, battery center, loads bottom
    expect(solarNode.y).toBeLessThan(mpptNode.y);
    expect(mpptNode.y).toBeLessThan(batNode.y);
    expect(batNode.y).toBeLessThan(dcNode.y);
  });

  it('uses passage mode hours when viewMode is passage', () => {
    const drain = makeDCDrain({
      wattsTypical: 20,
      hoursPerDayAnchor: 6,
      hoursPerDayPassage: 10,
      dutyCycle: 1,
    });
    const equipment: EquipmentInstance[] = [
      makeSolarPanel(),
      makeBattery(),
      drain,
    ];

    const graph = buildSchematicGraph(equipment, 'passage', 2, 5, 0.85, 12);

    const dcNode = graph.nodes.find((n) => n.type === 'dc-loads');
    // 20W * 10h * 1.0 * 1.0 = 200 Wh
    expect(dcNode!.watts).toBe(200);
  });
});
