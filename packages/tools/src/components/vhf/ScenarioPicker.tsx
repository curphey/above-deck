import React from 'react';
import type { Scenario } from '@/lib/vhf/types';

interface ScenarioPickerProps {
  scenarios: Scenario[];
  onSelect: (id: string) => void;
  activeScenarioId?: string | null;
}

export function ScenarioPicker({ scenarios, onSelect, activeScenarioId }: ScenarioPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {scenarios.map((scenario) => {
        const isActive = scenario.id === activeScenarioId;
        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            style={{
              background: isActive ? 'rgba(74, 222, 128, 0.08)' : '#1a1a2e',
              border: isActive ? '1px solid #4ade80' : '1px solid #2d2d4a',
              borderRadius: '6px',
              padding: '12px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                fontWeight: 'bold',
                color: isActive ? '#4ade80' : '#e0e0e0',
                marginBottom: '4px',
              }}
            >
              {scenario.name}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#8b8b9e',
                lineHeight: 1.4,
              }}
            >
              {scenario.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
