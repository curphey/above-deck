import { useState } from 'react';
import { Button, Checkbox, Group, Modal, Stack, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useApplianceCatalog } from '@/hooks/use-appliance-catalog';
import type { Appliance } from '@/lib/solar/types';

interface AddEquipmentModalProps {
  existingIds: string[];
  onAdd: (appliances: Appliance[]) => void;
}

export function AddEquipmentModal({ existingIds, onAdd }: AddEquipmentModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { data: catalog } = useApplianceCatalog();

  const filtered = (catalog ?? []).filter(
    (a) =>
      !existingIds.includes(a.id) &&
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const toAdd = filtered
      .filter((a) => selected.includes(a.id))
      .map((a) => ({ ...a, origin: 'catalog' as const }));
    onAdd(toAdd);
    setSelected([]);
    setSearch('');
    close();
  };

  return (
    <>
      <Button variant="light" leftSection={<IconPlus size={16} />} onClick={open}>
        Add equipment
      </Button>
      <Modal opened={opened} onClose={close} title="Add equipment" size="lg">
        <Stack>
          <TextInput placeholder="Search appliances..."
            leftSection={<IconSearch size={16} />}
            value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <Stack gap="xs" mah={400} style={{ overflowY: 'auto' }}>
            {filtered.map((a) => (
              <Checkbox key={a.id} label={`${a.name} (${a.wattsTypical}W — ${a.category})`}
                checked={selected.includes(a.id)}
                onChange={(e) => {
                  setSelected(e.currentTarget.checked
                    ? [...selected, a.id]
                    : selected.filter((id) => id !== a.id));
                }} />
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={close}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selected.length === 0}>
              Add {selected.length} item{selected.length !== 1 ? 's' : ''}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
