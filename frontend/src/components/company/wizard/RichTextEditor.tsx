import { useEffect } from 'react';
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
                class: 'prose prose-slate max-w-none focus:outline-none text-sm leading-relaxed px-4 py-3 text-foreground [&_*]:text-foreground',
            },
        },
    });

    useEffect(() => {
        if (!editor || editor.getHTML() === value) return;
        editor.commands.setContent(value || '', { emitUpdate: false });
    }, [editor, value]);

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
                    ? 'bg-teal-600 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
        >
            {children}
        </button>
    );

    return (
        <div
            className={cn(
                'glass-card rounded-xl overflow-hidden transition-all duration-200',
                'border border-border bg-card focus-within:border-teal-500/40 focus:ring-4 focus:ring-teal-500/5 shadow-sm',
                error && 'border-red-500/50 bg-red-50/10'
            )}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/50">
                <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
                    <Bold size={14} />
                </ToolBtn>
                <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
                    <Italic size={14} />
                </ToolBtn>
                <div className="w-px h-4 bg-muted mx-1" />
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
                className="cursor-text [&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child]:before:text-muted-foreground/60 [&_.tiptap_p.is-editor-empty:first-child]:before:float-left [&_.tiptap_p.is-editor-empty:first-child]:before:h-0 [&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none"
            />
        </div>
    );
}
