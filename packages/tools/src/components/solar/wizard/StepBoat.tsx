import { useState } from 'react';
import {
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconSailboat } from '@tabler/icons-react';
import { HEADING_FONT } from '@above-deck/shared/theme/fonts';
import { useSolarStore } from '@/stores/solar';
import { BoatSelector } from '../BoatSelector';
import type { BoatType } from '@/lib/solar/types';

interface StepBoatProps {
  onNext: () => void;
}

export function StepBoat({ onNext }: StepBoatProps) {
  const [showManual, setShowManual] = useState(false);
  const [boatName, setBoatName] = useState('');
  const [lengthFt, setLengthFt] = useState<number>(40);
  const [boatType, setBoatType] = useState<BoatType>('mono');
  const [voltage, setVoltage] = useState<12 | 24 | 48>(12);

  const setStoreBoatName = useSolarStore((s) => s.setBoatName);
  const setStoreBoatLengthFt = useSolarStore((s) => s.setBoatLengthFt);
  const setStoreBoatType = useSolarStore((s) => s.setBoatType);
  const setStoreSystemVoltage = useSolarStore((s) => s.setSystemVoltage);

  const handleSkip = () => {
    setStoreBoatLengthFt(40);
    setStoreBoatType('mono');
    setStoreSystemVoltage(12);
    onNext();
  };

  const handleContinue = () => {
    setStoreBoatName(boatName);
    setStoreBoatLengthFt(lengthFt);
    setStoreBoatType(boatType);
    setStoreSystemVoltage(voltage);
    onNext();
  };

  return (
    <Stack data-testid="step-boat" gap="lg" align="center" maw={600} mx="auto">
      <IconSailboat size={48} color="#60a5fa" stroke={1.5} />
      <Title order={2} ff={HEADING_FONT} ta="center">
        Your Boat
      </Title>
      <Text c="dimmed" ta="center">
        Search for your boat or enter details manually.
      </Text>

      <Box w="100%">
        <BoatSelector />
      </Box>

      <UnstyledButton
        onClick={() => setShowManual(!showManual)}
        style={{ color: '#60a5fa', textDecoration: 'underline' }}
      >
        I don&apos;t see my boat
      </UnstyledButton>

      {showManual && (
        <Stack w="100%" gap="md">
          <TextInput
            label="Boat name"
            placeholder="e.g. Hallberg-Rassy 40"
            value={boatName}
            onChange={(e) => setBoatName(e.currentTarget.value)}
          />
          <NumberInput
            label="Length (ft)"
            min={20}
            max={100}
            value={lengthFt}
            onChange={(v) => setLengthFt(typeof v === 'number' ? v : 40)}
          />
          <Box>
            <Text size="sm" fw={500} mb={4}>
              Hull type
            </Text>
            <SegmentedControl
              value={boatType}
              onChange={(v) => setBoatType(v as BoatType)}
              data={[
                { label: 'Mono', value: 'mono' },
                { label: 'Cat', value: 'cat' },
                { label: 'Tri', value: 'tri' },
              ]}
              fullWidth
            />
          </Box>
          <Box>
            <Text size="sm" fw={500} mb={4}>
              System voltage
            </Text>
            <SegmentedControl
              value={String(voltage)}
              onChange={(v) => setVoltage(Number(v) as 12 | 24 | 48)}
              data={[
                { label: '12V', value: '12' },
                { label: '24V', value: '24' },
                { label: '48V', value: '48' },
              ]}
              fullWidth
            />
          </Box>
          <Button size="lg" variant="filled" onClick={handleContinue}>
            Continue
          </Button>
        </Stack>
      )}

      <Button variant="subtle" color="gray" onClick={handleSkip}>
        Skip — use defaults
      </Button>
    </Stack>
  );
}
