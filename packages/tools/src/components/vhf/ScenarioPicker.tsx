import React, { useEffect, useState } from 'react';
import { VHFApiClient } from '@/lib/vhf/api-client';
import type { Scenario } from '@/lib/vhf/types';

const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_VHF_API_URL || 'http://localhost:8080';

interface ScenarioPickerProps {
  onSelect: (scenarioId: string) => void;
  activeScenarioId: string | null;
}

export function ScenarioPicker({ onSelect, activeScenarioId }: ScenarioPickerProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new VHFApiClient(API_URL);
    client.getScenarios()
      .then(data => {
        setScenarios(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load scenarios');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ color: '#8b8b9e', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '10px' }}>
        Loading scenarios…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#f87171', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '10px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {scenarios.map((scenario) => {
        const isActive = scenario.id === activeScenarioId;
        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            style={{
              background: isActive ? 'rgba(74, 222, 128, 0.08)' : '#16213e',
              border: isActive ? '1px solid #4ade80' : '1px solid #2d2d4a',
              borderRadius: '6px',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              minWidth: '180px',
              maxWidth: '260px',
              flex: '1 1 180px',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#1a2340';
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#16213e';
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
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
                fontSize: '11px',
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
