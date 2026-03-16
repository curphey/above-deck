import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchematicCanvas } from '../SchematicCanvas';
import type { SchematicGraph } from '../../../../lib/solar/schematic';

function makeTestGraph(): SchematicGraph {
  return {
    width: 500,
    height: 460,
    nodes: [
      {
        id: 'node-p1',
        type: 'solar-panel',
        label: '200W Panel',
        watts: 200,
        enabled: true,
        equipmentIds: ['p1'],
        x: 200,
        y: 20,
        width: 100,
        height: 50,
      },
      {
        id: 'node-mppt',
        type: 'mppt',
        label: 'MPPT Controller',
        watts: 850,
        enabled: true,
        equipmentIds: ['p1'],
        x: 190,
        y: 150,
        width: 120,
        height: 50,
      },
      {
        id: 'node-bat-1',
        type: 'battery',
        label: 'LiFePO4 200Ah',
        watts: 2400,
        enabled: true,
        equipmentIds: ['bat-1'],
        x: 200,
        y: 280,
        width: 100,
        height: 50,
      },
      {
        id: 'node-d1',
        type: 'dc-drain',
        label: 'LED Lights',
        watts: 120,
        enabled: true,
        equipmentIds: ['d1'],
        x: 100,
        y: 410,
        width: 100,
        height: 50,
      },
      {
        id: 'node-d2',
        type: 'dc-drain',
        label: 'Radar',
        watts: 200,
        enabled: true,
        equipmentIds: ['d2'],
        x: 300,
        y: 410,
        width: 100,
        height: 50,
      },
    ],
    edges: [
      {
        id: 'edge-p1-to-mppt',
        from: 'node-p1',
        to: 'node-mppt',
        type: 'charge',
        watts: 850,
        enabled: true,
      },
      {
        id: 'edge-mppt-to-bat-1',
        from: 'node-mppt',
        to: 'node-bat-1',
        type: 'charge',
        watts: 850,
        enabled: true,
      },
      {
        id: 'edge-bat-1-to-d1',
        from: 'node-bat-1',
        to: 'node-d1',
        type: 'drain',
        watts: 120,
        enabled: true,
      },
      {
        id: 'edge-bat-1-to-d2',
        from: 'node-bat-1',
        to: 'node-d2',
        type: 'drain',
        watts: 200,
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

  it('renders individual equipment node labels', () => {
    render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    expect(screen.getByText('200W Panel')).toBeTruthy();
    expect(screen.getByText('MPPT Controller')).toBeTruthy();
    expect(screen.getByText('LiFePO4 200Ah')).toBeTruthy();
    expect(screen.getByText('LED Lights')).toBeTruthy();
    expect(screen.getByText('Radar')).toBeTruthy();
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

  it('disabled nodes have the disabled class', () => {
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
    const d1Group = container.querySelector('[data-node-id="node-d1"]');
    expect(d1Group).toBeTruthy();
    fireEvent.click(d1Group!);
    expect(handler).toHaveBeenCalledWith(['d1']);
  });

  it('renders edges as path elements with curved bezier', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const edgeElements = container.querySelectorAll('[data-edge-id]');
    expect(edgeElements.length).toBe(4); // p1→mppt, mppt→bat, bat→d1, bat→d2
    // Edges should be <path> not <line>
    expect(edgeElements[0].tagName).toBe('path');
  });

  it('disabled edges have the disabled class', () => {
    const { container } = render(
      <SchematicCanvas graph={makeDisabledGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const disabledEdges = container.querySelectorAll('.schematic-edge-disabled');
    expect(disabledEdges.length).toBe(2);
  });

  it('renders empty SVG for empty graph', () => {
    const { container } = render(
      <SchematicCanvas graph={{ nodes: [], edges: [], width: 400, height: 200 }} selectedId={null} onNodeClick={() => {}} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('uses dynamic viewBox from graph dimensions', () => {
    const { container } = render(
      <SchematicCanvas graph={makeTestGraph()} selectedId={null} onNodeClick={() => {}} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 500 460');
  });
});
