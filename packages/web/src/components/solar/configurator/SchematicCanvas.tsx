import type { SchematicGraph, SchematicNode, SchematicEdge } from '../../../lib/solar/schematic';
import './schematic.css';

interface SchematicCanvasProps {
  graph: SchematicGraph;
  selectedId: string | null;
  onNodeClick: (equipmentIds: string[]) => void;
}

const EDGE_COLORS: Record<SchematicEdge['type'], string> = {
  charge: '#4ade80',
  drain: '#f87171',
  storage: '#60a5fa',
};

const NODE_STROKE: Record<string, string> = {
  'solar-panel': '#4ade80',
  mppt: '#4ade80',
  'battery-bank': '#60a5fa',
  'dc-loads': '#f87171',
  'ac-loads': '#f87171',
  inverter: '#f87171',
  alternator: '#4ade80',
  regulator: '#4ade80',
  'shore-charger': '#4ade80',
};

function edgeSpeedClass(watts: number): string {
  if (watts > 500) return 'schematic-edge-fast';
  if (watts > 200) return 'schematic-edge-medium';
  return 'schematic-edge-slow';
}

function edgeThickness(watts: number): number {
  if (watts > 500) return 3;
  if (watts > 200) return 2;
  return 1.5;
}

function formatWatts(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kWh`;
  return `${watts} Wh`;
}

function nodeIcon(type: SchematicNode['type'], x: number, y: number, w: number): JSX.Element {
  const cx = x + w / 2;
  const cy = y + 14;
  const stroke = NODE_STROKE[type] ?? '#8b8b9e';

  switch (type) {
    case 'solar-panel':
      return <circle cx={cx} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={1.5} />;
    case 'battery-bank':
      return (
        <g>
          <rect x={cx - 8} y={cy - 5} width={16} height={10} rx={2} fill="none" stroke={stroke} strokeWidth={1.5} />
          <line x1={cx + 8} y1={cy - 3} x2={cx + 8} y2={cy + 3} stroke={stroke} strokeWidth={1.5} />
        </g>
      );
    case 'inverter':
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={1.5} />
          <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7} fill={stroke}>~</text>
        </g>
      );
    default:
      return <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={2} fill="none" stroke={stroke} strokeWidth={1.5} />;
  }
}

export function SchematicCanvas({ graph, selectedId, onNodeClick }: SchematicCanvasProps) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 500 460"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Energy system schematic"
    >
      {/* Edges rendered first (behind nodes) */}
      {graph.edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;

        const x1 = fromNode.x + fromNode.width / 2;
        const y1 = fromNode.y + fromNode.height;
        const x2 = toNode.x + toNode.width / 2;
        const y2 = toNode.y;

        const color = edge.enabled ? EDGE_COLORS[edge.type] : '#2d2d4a';
        const thickness = edge.enabled ? edgeThickness(edge.watts) : 1.5;

        const edgeClasses = edge.enabled
          ? `schematic-edge-active ${edgeSpeedClass(edge.watts)}`
          : 'schematic-edge-disabled';

        return (
          <line
            key={edge.id}
            data-edge-id={edge.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={thickness}
            className={edgeClasses}
          />
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((node) => {
        const isSelected = selectedId != null && node.equipmentIds.includes(selectedId);
        const classes = [
          'schematic-node',
          !node.enabled && 'schematic-node-disabled',
          isSelected && 'schematic-node-selected',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <g
            key={node.id}
            data-node-id={node.id}
            className={classes}
            onClick={() => onNodeClick(node.equipmentIds)}
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={8}
              fill="none"
              stroke={NODE_STROKE[node.type] ?? '#8b8b9e'}
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            {nodeIcon(node.type, node.x, node.y, node.width)}
            <text className="schematic-label" x={node.x + node.width / 2} y={node.y + 36}>
              {node.label}
            </text>
            <text className="schematic-watts" x={node.x + node.width / 2} y={node.y + 50}>
              {formatWatts(node.watts)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
