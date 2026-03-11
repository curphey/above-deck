import { useState } from 'react';
import {
  Modal,
  Radio,
  Textarea,
  Button,
  Stack,
  Text,
  Group,
} from '@mantine/core';
import { createSupabaseClient } from '@/lib/supabase';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'off-topic', label: 'Off-topic' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

interface FlagModalProps {
  opened: boolean;
  contentType: 'discussion' | 'reply';
  contentId: string;
  reporterId: string;
  onClose: () => void;
}

export function FlagModal({
  opened,
  contentType,
  contentId,
  reporterId,
  onClose,
}: FlagModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { error: insertError } = await supabase.from('reports').insert({
        content_type: contentType,
        content_id: contentId,
        reporter_id: reporterId,
        reason,
        details: details.trim() || null,
      });
      if (insertError) throw insertError;

      // Reset and close
      setReason(null);
      setDetails('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason(null);
    setDetails('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Report Content"
      size="md"
      styles={{
        title: { fontFamily: "'Space Mono', monospace", fontWeight: 700 },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Why are you reporting this {contentType}?
        </Text>

        <Radio.Group value={reason ?? ''} onChange={setReason}>
          <Stack gap="xs">
            {REASONS.map((r) => (
              <Radio key={r.value} value={r.value} label={r.label} />
            ))}
          </Stack>
        </Radio.Group>

        <Textarea
          label="Additional details (optional)"
          placeholder="Provide any additional context..."
          minRows={3}
          value={details}
          onChange={(e) => setDetails(e.currentTarget.value)}
        />

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!reason}
            color="red"
          >
            Submit Report
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
