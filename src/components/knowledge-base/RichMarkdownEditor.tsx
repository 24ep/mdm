'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useState, useCallback, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichMarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showToolbar?: boolean
}

export function RichMarkdownEditor({
  content,
  onChange,
  placeholder = 'Start typing "/" for commands...',
  editable = true,
  className,
  showToolbar = false
}: RichMarkdownEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const insertSlashCommand = useCallback((command: string) => {
    if (!editor) return

    const { state } = editor
    const { selection } = state
    const { $from } = selection
    
    // Find and remove the slash command
    const textBefore = $from.nodeBefore?.textContent || ''
    const currentText = $from.parent.textContent
    const match = currentText.match(/\/([a-z]*)$/)
    
    if (match) {
      const startPos = $from.pos - match[0].length
      editor.chain()
        .focus()
        .deleteRange({ from: startPos, to: $from.pos })
        .insertContent(getSlashCommandContent(command))
        .run()
    }
    
    setShowSlashMenu(false)
  }, [editor])

  const slashCommands = [
    { id: 'heading1', label: 'Heading 1', icon: Heading1, keywords: ['h1', 'heading', 'title'] },
    { id: 'heading2', label: 'Heading 2', icon: Heading2, keywords: ['h2', 'heading', 'subtitle'] },
    { id: 'heading3', label: 'Heading 3', icon: Heading3, keywords: ['h3', 'heading'] },
    { id: 'bold', label: 'Bold', icon: Bold, keywords: ['bold', 'strong'] },
    { id: 'italic', label: 'Italic', icon: Italic, keywords: ['italic', 'emphasis'] },
    { id: 'bulletList', label: 'Bullet List', icon: List, keywords: ['list', 'bullet', 'ul'] },
    { id: 'orderedList', label: 'Numbered List', icon: ListOrdered, keywords: ['numbered', 'ordered', 'ol'] },
    { id: 'code', label: 'Code Block', icon: Code, keywords: ['code', 'snippet'] },
    { id: 'blockquote', label: 'Quote', icon: Quote, keywords: ['quote', 'blockquote'] },
    { id: 'link', label: 'Link', icon: LinkIcon, keywords: ['link', 'url'] },
    { id: 'image', label: 'Image', icon: ImageIcon, keywords: ['image', 'img', 'picture'] },
    { id: 'table', label: 'Table', icon: TableIcon, keywords: ['table', 'grid'] },
  ]

  const filteredCommands = slashCommands.filter(cmd => 
    cmd.keywords.some(kw => kw.includes(slashQuery.toLowerCase())) ||
    cmd.label.toLowerCase().includes(slashQuery.toLowerCase())
  )

  if (!mounted || !editor) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      {editable && showToolbar && (
        <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bold') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('italic') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('heading', { level: 1 }) && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('heading', { level: 2 }) && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('heading', { level: 3 }) && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('bulletList') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('orderedList') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('blockquote') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('codeBlock') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive('link') && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter image URL:')
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            }}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="relative">
        {/* Inline menus can be re-enabled when supported in current TipTap build */}
        <EditorContent 
          editor={editor}
          className={cn(
            "prose prose-sm max-w-none dark:prose-invert",
            "focus:outline-none",
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:p-6 [&_.ProseMirror]:min-h-[400px]",
            "[&_.ProseMirror_heading]:font-semibold [&_.ProseMirror_heading]:mt-6 [&_.ProseMirror_heading]:mb-4",
            "[&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h3]:text-xl",
            "[&_.ProseMirror_p]:my-4 [&_.ProseMirror_p]:leading-relaxed",
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:my-4",
            "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:my-4",
            "[&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:dark:bg-gray-800 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono",
            "[&_.ProseMirror_pre]:bg-gray-100 [&_.ProseMirror_pre]:dark:bg-gray-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-4",
            "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-gray-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4",
            "[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4",
            "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:dark:border-gray-600 [&_.ProseMirror_th]:px-4 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:bg-gray-50 [&_.ProseMirror_th]:dark:bg-gray-800 [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_th]:text-left",
            "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:dark:border-gray-600 [&_.ProseMirror_td]:px-4 [&_.ProseMirror_td]:py-2",
            "[&_.ProseMirror_placeholder]:text-gray-400 [&_.ProseMirror_placeholder]:dark:text-gray-500",
            "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-4"
          )}
        />
        
        {showSlashMenu && editable && (
          <div
            className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{
              top: `${slashMenuPosition.top}px`,
              left: `${slashMenuPosition.left}px`,
            }}
          >
            {filteredCommands.map((cmd) => {
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.id}
                  onClick={() => insertSlashCommand(cmd.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{cmd.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getSlashCommandContent(command: string): string {
  switch (command) {
    case 'heading1':
      return '<h1></h1>'
    case 'heading2':
      return '<h2></h2>'
    case 'heading3':
      return '<h3></h3>'
    case 'bold':
      return '<strong></strong>'
    case 'italic':
      return '<em></em>'
    case 'bulletList':
      return '<ul><li></li></ul>'
    case 'orderedList':
      return '<ol><li></li></ol>'
    case 'code':
      return '<pre><code></code></pre>'
    case 'blockquote':
      return '<blockquote><p></p></blockquote>'
    case 'link':
      return '<a href=""></a>'
    case 'image':
      return '<img src="" alt="" />'
    case 'table':
      return '<table><thead><tr><th></th><th></th></tr></thead><tbody><tr><td></td><td></td></tr></tbody></table>'
    default:
      return ''
  }
}

