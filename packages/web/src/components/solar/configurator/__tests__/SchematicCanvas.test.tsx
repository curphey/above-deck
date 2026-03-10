import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchematicCanvas } from '../SchematicCanvas';
import type { SchematicGraph } from '../../../../lib/solar/schematic';

function makeTestGraph(): SchematicGraph {
  return {
    nodes: [
      {
        id: 'node-solar-panel',
        type: 'solar-panel',
        label: 'Solar Panels',
        watts: 200,
        enabled: true,
        equipmentIds: ['p1'],
        x: 190,
        y: 20,
        width: 120,
        height: 60,
      },
      {
        id: 'node-mppt',
        type: 'mppt',
        label: 'MPPT Controller',
        watts: 850,
        enabled: true,
        equipmentIds: ['p1'],
        x: 190,
        y: 140,
        width: 120,
        height: 60,
      },
      {
        id: 'node-battery-bank',
        type: 'battery-bank',
        label: 'Battery Bank',
        watts: 2400,
        enabled: true,
        equipmentIds: ['bat-1'],
        x: 190,
        y: 260,
        width: 120,
        height: 60,
      },
      {
        id: 'node-dc-loads',
        type: 'dc-loads',
        label: 'DC Loads',
        watts: 120,
        enabled: true,
        equipmentIds: ['d1', 'd2'],
        x: 190,
        y: 380,
        width: 120,
        height: 60,
      },
    ],
    edges: [
      {
        id: 'edge-solar-to-mppt',
        from: 'node-solar-panel',
        to: 'node-mppt',
        type: 'charge',
        watts: 850,
        enabled: true,
      },
      {
        id: 'edge-mppt-to-battery',
        from: 'node-mppt',
        to: 'node-battery-bank',
        type: 'charge',
        watts: 850,
        enabled: true,
      },
      {
        id: 'edge-battery-to-dc',
        from: 'node-battery-bank',
        to: 'node-dc-loads',
        type: 'drain',
        watts: 120,
        enabled: true,
      },
    ],
  };
}

function makeDisabledGraph(): SchematicGraph {
  const graph = makeTestGraph();
  graph.nodes[0].enabled = false; // solar disabled
  graph.nodes[1].enabled = false; // mppt disabled
  graph.edges[0].enabled = false;
  graph.edges[1].enabled = false;
  return graph;
}

describe('SchematicCanvas', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders node labels as text elements', () => {
    render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    expect(screen.getByText('Solar Panels')).toBeTruthy();
    expect(screen.getByText('MPPT Controller')).toBeTruthy();
    expect(screen.getByText('Battery Bank')).toBeTruthy();
    expect(screen.getByText('DC Loads')).toBeTruthy();
  });

  it('applies selected class when selectedId matches a node equipmentId', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId="p1" onNodeClick={() => {}} />,
    );
    const selectedGroups = container.querySelectorAll('.schematic-node-selected');
    // solar-panel and mppt both have equipmentId 'p1'
    expect(selectedGroups.length).toBe(2);
  });

  it('does not apply selected class when selectedId is null', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const selectedGroups = container.querySelectorAll('.schematic-node-selected');
    expect(selectedGroups.length).toBe(0);
  });

  it('disabled nodes have reduced opacity', () => {
    const { container } = render(
      <SchematicCanvas graph={makeDisabledGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const disabledGroups = container.querySelectorAll('.schematic-node-disabled');
    expect(disabledGroups.length).toBe(2); // solar + mppt
  });

  it('clicking a node calls onNodeClick with equipmentIds', () => {
    const handler = vi.fn();
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={handler} />,
    );
    // Click the DC loads node (has equipmentIds ['d1', 'd2'])
    const dcGroup = container.querySelector('[data-node-id="node-dc-loads"]');
    expect(dcGroup).toBeTruthy();
    fireEvent.click(dcGroup!);
    expect(handler).toHaveBeenCalledWith(['d1', 'd2']);
  });

  it('renders edges as path or line elements', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const edgeElements = container.querySelectorAll('[data-edge-id]');
    expect(edgeElements.length).toBe(3);
  });

  it('disabled edges have the disabled class', () => {
    const { container } = render(
      <SchematicCanvas graph={makeDisabledGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const disabledEdges = container.querySelectorAll('.schematic-edge-disabled');
    expect(disabledEdges.length).toBe(2); // solar->mppt, mppt->battery
  });

  it('renders empty SVG for empty graph', () => {
    const { container } = render(
      <SchematicCanvas graph={{ nodes: [], edges: [] }} selectedId={null} onNodeClick={() => {}} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
