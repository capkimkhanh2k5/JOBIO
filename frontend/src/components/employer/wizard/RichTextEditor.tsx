import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    minHeight?: string;
    error?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = '180px', error }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: placeholder ?? 'Nhập nội dung...' }),
        ],
        content: value,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none text-sm leading-relaxed px-4 py-3 text-white [&_*]:text-white',
            },
        },
    });

    const ToolBtn = ({
        onClick,
        active,
        children,
    }: {
        onClick: () => void;
        active?: boolean;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'p-1.5 rounded-lg transition-all duration-150',
                active
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
        >
            {children}
        </button>
    );

    return (
        <div
            className={cn(
                'glass-card rounded-xl overflow-hidden transition-all duration-200',
                'border border-white/10 focus-within:border-cyan-500/40',
                error && 'border-red-500/50'
            )}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
                <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
                    <Bold size={14} />
                </ToolBtn>
                <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
                    <Italic size={14} />
                </ToolBtn>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
                    <List size={14} />
                </ToolBtn>
                <ToolBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
                    <ListOrdered size={14} />
                </ToolBtn>
            </div>

            {/* Editor area */}
            <EditorContent
                editor={editor}
                style={{ minHeight }}
                className="cursor-text [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-white/30 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
            />
        </div>
    );
}
