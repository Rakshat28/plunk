import {type Editor} from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Undo,
  Variable,
} from 'lucide-react';
import {Button, Input} from '@plunk/ui';
import {useEffect, useState} from 'react';

interface ToolbarProps {
  editor: Editor | null;
  onInsertVariable: () => void;
  onInsertImage: () => void;
  canUploadImages: boolean;
}

export function Toolbar({editor, onInsertVariable, onInsertImage, canUploadImages}: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [customColor, setCustomColor] = useState('');
  const [, forceUpdate] = useState({});

  // Force re-render when editor state changes
  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      forceUpdate({});
    };

    editor.on('selectionUpdate', updateHandler);
    editor.on('transaction', updateHandler);

    return () => {
      editor.off('selectionUpdate', updateHandler);
      editor.off('transaction', updateHandler);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      // If updating an existing link, extend selection to cover the entire link first
      if (editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').setLink({href: linkUrl}).run();
      } else {
        editor.chain().focus().setLink({href: linkUrl}).run();
      }
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setSelectedColor(color);
  };

  const applyCustomColor = () => {
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      setColor(customColor);
      setCustomColor('');
      setShowColorPicker(false);
    }
  };

  // Tailwind color palette organized by hue
  const colorGroups = [
    {
      name: 'Neutrals',
      colors: ['#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF'],
    },
    {
      name: 'Reds',
      colors: ['#7F1D1D', '#991B1B', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'],
    },
    {
      name: 'Oranges',
      colors: ['#7C2D12', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
    },
    {
      name: 'Yellows',
      colors: ['#713F12', '#A16207', '#CA8A04', '#EAB308', '#FACC15', '#FDE047', '#FEF08A'],
    },
    {
      name: 'Greens',
      colors: ['#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'],
    },
    {
      name: 'Blues',
      colors: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
    },
    {
      name: 'Purples',
      colors: ['#581C87', '#6B21A8', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF'],
    },
    {
      name: 'Pinks',
      colors: ['#831843', '#9F1239', '#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'],
    },
  ];

  return (
    <div className="border-b border-neutral-200 bg-neutral-50 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
      {/* History */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Text formatting */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-active={editor.isActive('strike')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-active={editor.isActive('code')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Headings */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
          data-active={editor.isActive('heading', {level: 1})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
          data-active={editor.isActive('heading', {level: 2})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
          data-active={editor.isActive('heading', {level: 3})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Lists */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Alignment */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          data-active={editor.isActive({textAlign: 'left'})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          data-active={editor.isActive({textAlign: 'center'})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          data-active={editor.isActive({textAlign: 'right'})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          data-active={editor.isActive({textAlign: 'justify'})}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      {/* Color picker */}
      <div className="relative pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="h-8 w-8"
        >
          <Palette className="h-4 w-4" />
        </Button>
        {showColorPicker && (
          <div
            className="absolute top-10 left-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 z-20 max-h-96 overflow-y-auto"
            style={{width: '280px'}}
          >
            {/* Custom color input */}
            <div className="mb-3 pb-3 border-b border-neutral-200">
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Custom Color</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value.toUpperCase())}
                  placeholder="#000000"
                  className="h-8 text-xs font-mono"
                  maxLength={7}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      applyCustomColor();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onMouseDown={e => e.preventDefault()}
                  onClick={applyCustomColor}
                  disabled={!customColor || !/^#[0-9A-F]{6}$/i.test(customColor)}
                  className="h-8"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Color palette */}
            <div className="space-y-3">
              {colorGroups.map(group => (
                <div key={group.name}>
                  <label className="text-xs font-medium text-neutral-600 mb-1.5 block">{group.name}</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {group.colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setColor(color);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded border-2 border-neutral-300 hover:border-neutral-500 hover:scale-110 transition-all relative group"
                        style={{backgroundColor: color}}
                        title={color}
                      >
                        {selectedColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Link */}
      <div className="relative pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (editor.isActive('link')) {
              // Get the current link URL and show the input to edit it
              const previousUrl = editor.getAttributes('link').href || '';
              setLinkUrl(previousUrl);
              setShowLinkInput(true);
            } else {
              setShowLinkInput(!showLinkInput);
              setLinkUrl('');
            }
          }}
          data-active={editor.isActive('link')}
          className="h-8 w-8 data-[active=true]:bg-neutral-200"
        >
          <Link className="h-4 w-4" />
        </Button>
        {showLinkInput && (
          <div className="absolute top-10 right-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 z-20 min-w-max">
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="px-2 py-1 text-sm border border-neutral-200 rounded w-64"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addLink();
                  } else if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }
                }}
                autoFocus
              />
              <Button type="button" size="sm" onMouseDown={e => e.preventDefault()} onClick={addLink}>
                {editor.isActive('link') ? 'Update' : 'Add'}
              </Button>
            </div>
            {editor.isActive('link') && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onMouseDown={e => e.preventDefault()}
                  onClick={removeLink}
                >
                  Remove Link
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="flex gap-0.5 pr-2 border-r border-neutral-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={onInsertImage}
          disabled={!canUploadImages}
          className="h-8 w-8"
          title={canUploadImages ? 'Insert image' : 'Storage not configured'}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="h-4 w-4" />
        </Button>
      </div>

      {/* Variable */}
      <div className="flex gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={e => e.preventDefault()}
          onClick={onInsertVariable}
          className="h-8 w-8"
          title="Insert variable"
        >
          <Variable className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
