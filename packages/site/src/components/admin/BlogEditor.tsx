import { useState, useCallback, useRef } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  ActionIcon,
  Tooltip,
  Paper,
  FileButton,
} from '@mantine/core';
import {
  IconBold,
  IconItalic,
  IconH2,
  IconH3,
  IconLink,
  IconList,
  IconListNumbers,
  IconPhoto,
  IconCode,
  IconQuote,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { HEADING_FONT } from '@/theme/fonts';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  hero_image: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogEditorProps {
  post?: BlogPost;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'builder', label: 'Builder' },
  { value: 'sailing', label: 'Sailing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'destinations', label: 'Destinations' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const fileButtonRef = useRef<HTMLButtonElement>(null);

  const handleImageUpload = useCallback(
    async (file: File | null) => {
      if (!file || !editor) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/admin/blog/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // Silently fail — user can retry
      }
    },
    [editor]
  );

  const handleLinkToggle = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <Group gap={4} p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
      <Tooltip label="Heading 2">
        <ActionIcon
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <IconH2 size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Heading 3">
        <ActionIcon
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <IconH3 size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Bold">
        <ActionIcon
          size="sm"
          variant={editor.isActive('bold') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Italic">
        <ActionIcon
          size="sm"
          variant={editor.isActive('italic') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Link">
        <ActionIcon
          size="sm"
          variant={editor.isActive('link') ? 'filled' : 'subtle'}
          onClick={handleLinkToggle}
        >
          <IconLink size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Bullet List">
        <ActionIcon
          size="sm"
          variant={editor.isActive('bulletList') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconList size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Ordered List">
        <ActionIcon
          size="sm"
          variant={editor.isActive('orderedList') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconListNumbers size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Code Block">
        <ActionIcon
          size="sm"
          variant={editor.isActive('codeBlock') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <IconCode size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Blockquote">
        <ActionIcon
          size="sm"
          variant={editor.isActive('blockquote') ? 'filled' : 'subtle'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <IconQuote size={14} />
        </ActionIcon>
      </Tooltip>
      <FileButton ref={fileButtonRef} onChange={handleImageUpload} accept="image/*">
        {(props) => (
          <Tooltip label="Upload Image">
            <ActionIcon size="sm" variant="subtle" {...props}>
              <IconPhoto size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </FileButton>
    </Group>
  );
}

export function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [category, setCategory] = useState<string>(post?.category ?? 'builder');
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(', ') ?? '');
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: post?.body ?? '',
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  };

  const handleSave = async () => {
    if (!editor || !title.trim() || !slug.trim() || !description.trim()) return;
    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      slug,
      title,
      description,
      body: editor.getHTML(),
      category,
      tags,
      published,
      published_at: post?.published_at ?? null,
    };

    try {
      const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog';
      const method = post ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      onSave();
    } catch {
      // Error handling — could add notification later
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={onCancel}
          size="compact-sm"
        >
          Back to posts
        </Button>
      </Group>

      <TextInput
        label="Title"
        placeholder="Post title"
        value={title}
        onChange={(e) => handleTitleChange(e.currentTarget.value)}
        required
        styles={{ label: { fontFamily: HEADING_FONT } }}
      />

      <TextInput
        label="Slug"
        placeholder="post-slug"
        value={slug}
        onChange={(e) => handleSlugChange(e.currentTarget.value)}
        required
        styles={{ label: { fontFamily: HEADING_FONT } }}
      />

      <Textarea
        label="Description"
        placeholder="Brief description for SEO and previews"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        required
        minRows={2}
        styles={{ label: { fontFamily: HEADING_FONT } }}
      />

      <Group grow>
        <Select
          label="Category"
          data={CATEGORIES}
          value={category}
          onChange={(v) => setCategory(v ?? 'builder')}
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />

        <TextInput
          label="Tags"
          placeholder="solar, energy, batteries"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.currentTarget.value)}
          description="Comma-separated"
          styles={{ label: { fontFamily: HEADING_FONT } }}
        />
      </Group>

      <Paper withBorder style={{ overflow: 'hidden' }}>
        <EditorToolbar editor={editor} />
        <EditorContent
          editor={editor}
          style={{ minHeight: 400, padding: 'var(--mantine-spacing-md)' }}
        />
      </Paper>

      <Group justify="space-between">
        <Switch
          label="Published"
          checked={published}
          onChange={(e) => setPublished(e.currentTarget.checked)}
        />

        <Group>
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {post ? 'Update Post' : 'Create Post'}
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
