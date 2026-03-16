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
  battery: '#60a5fa',
  'dc-drain': '#f87171',
  'ac-drain': '#f87171',
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
  if (watts > 500) return 2.5;
  if (watts > 200) return 2;
  return 1.5;
}

function formatWatts(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kWh`;
  return `${watts} Wh`;
}

function nodeIcon(type: SchematicNode['type'], x: number, y: number, w: number): JSX.Element {
  const cx = x + w / 2;
  const cy = y + 12;
  const stroke = NODE_STROKE[type] ?? '#8b8b9e';

  switch (type) {
    case 'solar-panel':
      return <circle cx={cx} cy={cy} r={5} fill="none" stroke={stroke} strokeWidth={1.5} />;
    case 'battery':
      return (
        <g>
          <rect x={cx - 7} y={cy - 4} width={14} height={8} rx={2} fill="none" stroke={stroke} strokeWidth={1.5} />
          <line x1={cx + 7} y1={cy - 2} x2={cx + 7} y2={cy + 2} stroke={stroke} strokeWidth={1.5} />
        </g>
      );
    case 'inverter':
      return (
        <g>
          <circle cx={cx} cy={cy} r={5} fill="none" stroke={stroke} strokeWidth={1.5} />
          <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7} fill={stroke}>~</text>
        </g>
      );
    case 'dc-drain':
    case 'ac-drain':
      return (
        <g>
          <circle cx={cx} cy={cy} r={4} fill={stroke} fillOpacity={0.15} stroke={stroke} strokeWidth={1} />
        </g>
      );
    default:
      return <rect x={cx - 4} y={cy - 4} width={8} height={8} rx={2} fill="none" stroke={stroke} strokeWidth={1.5} />;
  }
}

/** Truncate long labels to fit node width */
function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return label.substring(0, maxChars - 1) + '…';
}

export function SchematicCanvas({ graph, selectedId, onNodeClick }: SchematicCanvasProps) {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const vw = graph.width || 400;
  const vh = graph.height || 200;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width="100%"
      style={{ overflow: 'visible', maxHeight: '600px' }}
      role="img"
      aria-label="Energy system schematic"
    >
      {/* Edges — curved paths for fan-out */}
      {graph.edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;

        const x1 = fromNode.x + fromNode.width / 2;
        const y1 = fromNode.y + fromNode.height;
        const x2 = toNode.x + toNode.width / 2;
        const y2 = toNode.y;

        const color = edge.enabled ? EDGE_COLORS[edge.type] : '#2d2d4a';
        const thickness = edge.enabled ? edgeThickness(edge.watts) : 1;

        const edgeClasses = edge.enabled
          ? `schematic-edge-active ${edgeSpeedClass(edge.watts)}`
          : 'schematic-edge-disabled';

        // Use cubic bezier for smooth curves
        const midY = (y1 + y2) / 2;
        const d = `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;

        return (
          <path
            key={edge.id}
            data-edge-id={edge.id}
            d={d}
            fill="none"
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

        const maxChars = Math.floor(node.width / 7);

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
              rx={6}
              fill="none"
              stroke={NODE_STROKE[node.type] ?? '#8b8b9e'}
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            {nodeIcon(node.type, node.x, node.y, node.width)}
            <text className="schematic-label" x={node.x + node.width / 2} y={node.y + 30}>
              {truncateLabel(node.label, maxChars)}
            </text>
            <text className="schematic-watts" x={node.x + node.width / 2} y={node.y + 42}>
              {formatWatts(node.watts)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
