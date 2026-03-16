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

function build(equipment: EquipmentInstance[], overrides: Partial<typeof defaultCtx> = {}) {
  const ctx = { ...defaultCtx, ...overrides };
  return buildSchematicGraph(equipment, ctx.viewMode, ctx.crewSize, ctx.peakSunHours, ctx.deratingFactor, ctx.systemVoltage);
}

describe('buildSchematicGraph', () => {
  it('returns empty graph for empty equipment', () => {
    const graph = build([]);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('creates individual nodes for each equipment item', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeSolarPanel({ id: 'p2', name: 'Second Panel', panelWatts: 100 }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1', name: 'LED Lights' }),
      makeDCDrain({ id: 'd2', name: 'Radar' }),
    ];

    const graph = build(equipment);

    // Individual nodes: 2 solar + 1 MPPT + 1 battery + 2 DC drains = 6
    expect(graph.nodes).toHaveLength(6);

    // Each equipment has its own node
    expect(graph.nodes.find((n) => n.id === 'node-p1')).toBeDefined();
    expect(graph.nodes.find((n) => n.id === 'node-p2')).toBeDefined();
    expect(graph.nodes.find((n) => n.id === 'node-b1')).toBeDefined();
    expect(graph.nodes.find((n) => n.id === 'node-d1')).toBeDefined();
    expect(graph.nodes.find((n) => n.id === 'node-d2')).toBeDefined();
    // Plus infrastructure
    expect(graph.nodes.find((n) => n.id === 'node-mppt')).toBeDefined();
  });

  it('builds solar + battery + DC drain topology with individual nodes', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    // Nodes: solar panel + MPPT + battery + DC drain = 4
    expect(graph.nodes).toHaveLength(4);

    const nodeTypes = graph.nodes.map((n) => n.type).sort();
    expect(nodeTypes).toEqual(['battery', 'dc-drain', 'mppt', 'solar-panel']);

    // Edges: solar→mppt, mppt→battery, battery→drain = 3
    expect(graph.edges).toHaveLength(3);

    const solarToMppt = graph.edges.find((e) => e.from === 'node-p1' && e.to === 'node-mppt');
    const mpptToBat = graph.edges.find((e) => e.from === 'node-mppt' && e.to === 'node-b1');
    const batToDrain = graph.edges.find((e) => e.from === 'node-b1' && e.to === 'node-d1');

    expect(solarToMppt).toBeDefined();
    expect(mpptToBat).toBeDefined();
    expect(batToDrain).toBeDefined();

    expect(solarToMppt!.type).toBe('charge');
    expect(mpptToBat!.type).toBe('charge');
    expect(batToDrain!.type).toBe('drain');
  });

  it('connects each solar panel individually to MPPT', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1', panelWatts: 200 }),
      makeSolarPanel({ id: 'p2', panelWatts: 100 }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const p1ToMppt = graph.edges.find((e) => e.from === 'node-p1' && e.to === 'node-mppt');
    const p2ToMppt = graph.edges.find((e) => e.from === 'node-p2' && e.to === 'node-mppt');

    expect(p1ToMppt).toBeDefined();
    expect(p2ToMppt).toBeDefined();

    // Individual panel Wh: 200 * 5 * 0.85 * 1.0 = 850
    expect(p1ToMppt!.watts).toBe(850);
    // 100 * 5 * 0.85 * 1.0 = 425
    expect(p2ToMppt!.watts).toBe(425);
  });

  it('connects battery to each individual DC drain', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1', name: 'LED Lights', wattsTypical: 20, hoursPerDayAnchor: 6 }),
      makeDCDrain({ id: 'd2', name: 'Radar', wattsTypical: 48, hoursPerDayAnchor: 24 }),
    ];

    const graph = build(equipment);

    const batToD1 = graph.edges.find((e) => e.from === 'node-b1' && e.to === 'node-d1');
    const batToD2 = graph.edges.find((e) => e.from === 'node-b1' && e.to === 'node-d2');

    expect(batToD1).toBeDefined();
    expect(batToD2).toBeDefined();

    // LED: 20W * 6h * 1.0 * 1.0 = 120 Wh
    expect(batToD1!.watts).toBe(120);
    // Radar: 48W * 24h * 1.0 * 1.0 = 1152 Wh
    expect(batToD2!.watts).toBe(1152);
  });

  it('includes inverter and individual AC drains', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeACDrain({ id: 'ac1', name: 'Microwave', wattsTypical: 800, hoursPerDayAnchor: 0.25 }),
    ];

    const graph = build(equipment);

    const inverterNode = graph.nodes.find((n) => n.type === 'inverter');
    const acNode = graph.nodes.find((n) => n.id === 'node-ac1');

    expect(inverterNode).toBeDefined();
    expect(acNode).toBeDefined();
    expect(acNode!.type).toBe('ac-drain');

    // Battery → inverter
    const batToInv = graph.edges.find((e) => e.from === 'node-b1' && e.to === 'node-inverter');
    expect(batToInv).toBeDefined();
    expect(batToInv!.type).toBe('drain');

    // Inverter → individual AC drain
    const invToAc = graph.edges.find((e) => e.from === 'node-inverter' && e.to === 'node-ac1');
    expect(invToAc).toBeDefined();
    expect(invToAc!.type).toBe('drain');

    // AC drain watts: 800 * 0.25 = 200 Wh
    expect(acNode!.watts).toBe(200);
    // Inverter watts include efficiency: 200 / 0.85 = 235
    expect(inverterNode!.watts).toBe(Math.round(200 / INVERTER_EFFICIENCY));
  });

  it('includes regulator node when alternator + LiFePO4 battery', () => {
    const equipment: EquipmentInstance[] = [
      makeAlternator({ id: 'alt-1' }),
      makeBattery({ id: 'b1', chemistry: 'lifepo4' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const regNode = graph.nodes.find((n) => n.type === 'regulator');
    expect(regNode).toBeDefined();

    const altToReg = graph.edges.find((e) => e.from === 'node-alt-1' && e.to === 'node-regulator');
    const regToBat = graph.edges.find((e) => e.from === 'node-regulator' && e.to === 'node-b1');
    expect(altToReg).toBeDefined();
    expect(regToBat).toBeDefined();
  });

  it('skips regulator for alternator + AGM battery', () => {
    const equipment: EquipmentInstance[] = [
      makeAlternator({ id: 'alt-1' }),
      makeBattery({ id: 'b1', chemistry: 'agm' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).not.toContain('regulator');

    // Alternator connects directly to battery
    const altToBat = graph.edges.find((e) => e.from === 'node-alt-1' && e.to === 'node-b1');
    expect(altToBat).toBeDefined();
  });

  it('includes shore-charger connecting to battery', () => {
    const equipment: EquipmentInstance[] = [
      makeShore({ id: 'shore-1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const shoreNode = graph.nodes.find((n) => n.id === 'node-shore-1');
    expect(shoreNode).toBeDefined();
    expect(shoreNode!.type).toBe('shore-charger');

    const shoreToBat = graph.edges.find((e) => e.from === 'node-shore-1' && e.to === 'node-b1');
    expect(shoreToBat).toBeDefined();
    expect(shoreToBat!.type).toBe('charge');
  });

  it('marks nodes enabled: false when equipment is disabled', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1', enabled: false }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1', enabled: false }),
    ];

    const graph = build(equipment);

    const solarNode = graph.nodes.find((n) => n.id === 'node-p1');
    const mpptNode = graph.nodes.find((n) => n.type === 'mppt');
    const drainNode = graph.nodes.find((n) => n.id === 'node-d1');
    const batNode = graph.nodes.find((n) => n.id === 'node-b1');

    expect(solarNode!.enabled).toBe(false);
    expect(mpptNode!.enabled).toBe(false);
    expect(drainNode!.enabled).toBe(false);
    expect(batNode!.enabled).toBe(true);
  });

  it('calculates correct watts per individual drain item', () => {
    const drain = makeDCDrain({ id: 'd1', wattsTypical: 20, hoursPerDayAnchor: 6, dutyCycle: 1 });
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      drain,
    ];

    const graph = build(equipment);

    const drainNode = graph.nodes.find((n) => n.id === 'node-d1');
    // 20W * 6h * 1.0 * 1.0 = 120 Wh
    expect(drainNode!.watts).toBe(120);
  });

  it('positions nodes in vertical rows: sources > controllers > battery > loads', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const solarNode = graph.nodes.find((n) => n.id === 'node-p1')!;
    const mpptNode = graph.nodes.find((n) => n.type === 'mppt')!;
    const batNode = graph.nodes.find((n) => n.id === 'node-b1')!;
    const drainNode = graph.nodes.find((n) => n.id === 'node-d1')!;

    expect(solarNode.y).toBeLessThan(mpptNode.y);
    expect(mpptNode.y).toBeLessThan(batNode.y);
    expect(batNode.y).toBeLessThan(drainNode.y);
  });

  it('uses passage mode hours when viewMode is passage', () => {
    const drain = makeDCDrain({
      id: 'd1',
      wattsTypical: 20,
      hoursPerDayAnchor: 6,
      hoursPerDayPassage: 10,
      dutyCycle: 1,
    });
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      drain,
    ];

    const graph = build(equipment, { viewMode: 'passage' });

    const drainNode = graph.nodes.find((n) => n.id === 'node-d1');
    // 20W * 10h * 1.0 * 1.0 = 200 Wh
    expect(drainNode!.watts).toBe(200);
  });

  it('returns dynamic width/height based on node count', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
      makeDCDrain({ id: 'd2', name: 'Radar' }),
      makeDCDrain({ id: 'd3', name: 'AIS' }),
      makeDCDrain({ id: 'd4', name: 'Pump' }),
      makeDCDrain({ id: 'd5', name: 'GPS' }),
    ];

    const graph = build(equipment);

    expect(graph.width).toBeGreaterThan(0);
    expect(graph.height).toBeGreaterThan(0);
    // With 5 drain items in the load row, width should be wider than minimum
    expect(graph.width).toBeGreaterThanOrEqual(400);
  });

  it('sets equipmentIds to the specific equipment ID for individual nodes', () => {
    const equipment: EquipmentInstance[] = [
      makeSolarPanel({ id: 'p1' }),
      makeBattery({ id: 'b1' }),
      makeDCDrain({ id: 'd1' }),
    ];

    const graph = build(equipment);

    const solarNode = graph.nodes.find((n) => n.id === 'node-p1')!;
    expect(solarNode.equipmentIds).toEqual(['p1']);

    const batNode = graph.nodes.find((n) => n.id === 'node-b1')!;
    expect(batNode.equipmentIds).toEqual(['b1']);
  });
});
