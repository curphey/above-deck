import React from 'react';
import type { AISTarget } from '@/lib/vhf/types';

interface AISTargetListProps {
  targets: AISTarget[];
  selectedMmsi: string | null;
  onSelect: (mmsi: string) => void;
}

function vesselIcon(type: AISTarget['vesselType']): string {
  switch (type) {
    case 'sailing':
      return '⛵';
    case 'cargo':
    case 'motor':
    case 'tanker':
    case 'passenger':
      return '🚢';
    case 'fishing':
      return '🎣';
    default:
      return '⚓';
  }
}

function formatBearing(bearing: number): string {
  return String(Math.round(bearing)).padStart(3, '0') + '°';
}

function formatDistance(distance: number): string {
  return `${distance}nm`;
}

function formatCpa(cpa: number): string {
  return `${cpa}nm`;
}

const LCD_TEXT_NORMAL = '#cc7a00';
const LCD_TEXT_ACTIVE = '#ffaa00';
const LCD_HEADER = '#996600';
const LCD_WARNING = '#ff6600';
const LCD_SELECTED_BG = 'rgba(255,152,0,0.1)';
const FONT = "'Fira Code', monospace";

const headerCellStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '7px',
  color: LCD_HEADER,
  textTransform: 'uppercase',
  padding: '1px 3px',
  whiteSpace: 'nowrap',
};

export function AISTargetList({ targets, selectedMmsi, onSelect }: AISTargetListProps) {
  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, width: '16px' }}></th>
            <th style={{ ...headerCellStyle, textAlign: 'left' }}>VESSEL</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>DIST</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>BRG</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>CPA</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>SOG</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((target) => {
            const isSelected = target.mmsi === selectedMmsi;
            const isCpaWarning = target.cpa < 0.5;
            const textColor = isSelected ? LCD_TEXT_ACTIVE : LCD_TEXT_NORMAL;

            const cellStyle: React.CSSProperties = {
              fontFamily: FONT,
              fontSize: '9px',
              color: textColor,
              padding: '1px 3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            };

            return (
              <tr
                key={target.mmsi}
                onClick={() => onSelect(target.mmsi)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? LCD_SELECTED_BG : 'transparent',
                }}
              >
                <td style={{ ...cellStyle, fontSize: '10px', textAlign: 'center' }}>
                  {vesselIcon(target.vesselType)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'left' }}>
                  {target.name}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {formatDistance(target.distance)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {formatBearing(target.bearing)}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                    color: isCpaWarning ? LCD_WARNING : textColor,
                    fontWeight: isCpaWarning ? 600 : 'normal',
                  }}
                >
                  {formatCpa(target.cpa)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {target.sog.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
