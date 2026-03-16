import { useState } from 'react';
import { Box, Group, Stack } from '@mantine/core';
import { useSolarStore } from '@/stores/solar';
import { StepBoat } from './StepBoat';
import { StepRegion } from './StepRegion';
import { StepStyle } from './StepStyle';
import { StepCrew } from './StepCrew';

interface QuickStartWizardProps {
  onComplete: () => void;
}

const STEP_COUNT = 4;

export function QuickStartWizard({ onComplete }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const setWizardComplete = useSolarStore((s) => s.setWizardComplete);

  const handleStepComplete = () => {
    if (currentStep < STEP_COUNT - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleFinalComplete = () => {
    setWizardComplete();
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBoat onNext={handleStepComplete} />;
      case 1:
        return <StepRegion onNext={handleStepComplete} />;
      case 2:
        return <StepStyle onNext={handleStepComplete} />;
      case 3:
        return <StepCrew onComplete={handleFinalComplete} />;
      default:
        return null;
    }
  };

  return (
    <Stack
      data-testid="quick-start-wizard"
      gap="xl"
      align="center"
      justify="center"
      style={{ minHeight: '100%' }}
      p="xl"
    >
      <Group gap={8} justify="center">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <Box
            key={i}
            data-testid="progress-dot"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: i === currentStep ? '#60a5fa' : '#2d2d4a',
              transition: 'background-color 200ms ease',
            }}
          />
        ))}
      </Group>

      <Box
        style={{
          width: '100%',
          maxWidth: 800,
          transition: 'transform 300ms ease',
        }}
      >
        {renderStep()}
      </Box>
    </Stack>
  );
}
