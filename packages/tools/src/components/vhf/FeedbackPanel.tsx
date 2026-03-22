import React from 'react';

export type FeedbackItem = {
  type: 'correct' | 'suggestion' | 'tip';
  label: string;
  message: string;
};

export type FeedbackPanelProps = {
  scenarioLabel: string;
  feedback: FeedbackItem[];
};

const TYPE_COLORS: Record<FeedbackItem['type'], string> = {
  correct: '#4ade80',
  suggestion: '#f87171',
  tip: '#60a5fa',
};

export function FeedbackPanel({ scenarioLabel, feedback }: FeedbackPanelProps) {
  return (
    <div
      style={{
        background: '#16213e',
        border: '1px solid #2d2d4a',
        borderRadius: '6px',
        padding: '12px',
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          color: '#8b8b9e',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: scenarioLabel ? '8px' : '0',
        }}
      >
        Instructor Feedback
      </div>

      {scenarioLabel ? (
        <div
          style={{
            display: 'inline-block',
            color: '#4ade80',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            borderRadius: '3px',
            padding: '2px 6px',
            fontSize: '9px',
            fontFamily: "'Inter', sans-serif",
            marginBottom: feedback.length > 0 ? '10px' : '0',
          }}
        >
          {scenarioLabel}
        </div>
      ) : null}

      {feedback.map((item, index) => {
        const color = TYPE_COLORS[item.type];
        return (
          <div
            key={index}
            style={{
              borderTop: index > 0 ? '1px solid rgba(45, 45, 74, 0.5)' : undefined,
              paddingTop: index > 0 ? '8px' : '0',
              marginTop: index > 0 ? '8px' : '0',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '9px',
                textTransform: 'uppercase',
                color: '#8b8b9e',
                letterSpacing: '0.05em',
                marginBottom: '3px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color,
              }}
            >
              {item.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}
