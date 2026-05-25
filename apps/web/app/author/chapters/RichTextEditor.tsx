'use client';

import { useEffect, useRef, useState } from 'react';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function looksLikeHtml(s: string): boolean {
  return /<(p|br|strong|b|em|i|u|s|ul|ol|li|blockquote|hr|span|div)\b[^>]*>/i.test(s);
}

/** Convert legacy plain-text chapters into paragraphs so they load in the editor. */
function toInitialHtml(content: string): string {
  if (!content) return '<p><br></p>';
  if (looksLikeHtml(content)) return content;
  return content
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>'))
    .join('');
}

type Cmd = { label: string; command: string; value?: string; title: string };

const GROUPS: Cmd[][] = [
  [
    { label: 'B', command: 'bold', title: '粗体' },
    { label: 'I', command: 'italic', title: '斜体' },
    { label: 'U', command: 'underline', title: '下划线' },
  ],
  [
    { label: '左', command: 'justifyLeft', title: '左对齐' },
    { label: '中', command: 'justifyCenter', title: '居中' },
    { label: '右', command: 'justifyRight', title: '右对齐' },
  ],
  [
    { label: '• 列表', command: 'insertUnorderedList', title: '无序列表' },
    { label: '1. 列表', command: 'insertOrderedList', title: '有序列表' },
    { label: '引用', command: 'formatBlock', value: 'blockquote', title: '引用' },
    { label: '分隔线', command: 'insertHorizontalRule', title: '分隔线' },
  ],
  [
    { label: '清除格式', command: 'removeFormat', title: '清除格式' },
    { label: '撤销', command: 'undo', title: '撤销' },
    { label: '重做', command: 'redo', title: '重做' },
  ],
];

export function RichTextEditor({
  name,
  defaultValue,
  onChange,
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue ?? '');
  const [chars, setChars] = useState(0);
  const [words, setWords] = useState(0);

  function recount() {
    const text = editorRef.current?.textContent ?? '';
    setChars(text.replace(/\s/g, '').length);
    setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
  }

  // Initialise editor content once on mount (avoids contentEditable React churn).
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = toInitialHtml(defaultValue ?? '');
      setHtml(editorRef.current.innerHTML);
      onChange?.(editorRef.current.innerHTML);
      recount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    if (!editorRef.current) return;
    setHtml(editorRef.current.innerHTML);
    onChange?.(editorRef.current.innerHTML);
    recount();
  }

  function exec(cmd: Cmd) {
    editorRef.current?.focus();
    if (cmd.command === 'formatBlock') {
      // toggle blockquote back to paragraph if already quoted
      document.execCommand('formatBlock', false, cmd.value);
    } else {
      document.execCommand(cmd.command, false, cmd.value);
    }
    sync();
  }

  return (
    <div className="rounded-md border border-stone-300 focus-within:border-brand">
      <input type="hidden" name={name} value={html} readOnly />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1 border-r border-stone-200 pr-1.5 last:border-r-0">
            {group.map((cmd) => (
              <button
                key={cmd.title}
                type="button"
                title={cmd.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(cmd)}
                className={`rounded px-2 py-1 text-xs text-stone-600 hover:bg-stone-200 ${
                  cmd.command === 'bold' ? 'font-bold' : ''
                } ${cmd.command === 'italic' ? 'italic' : ''} ${
                  cmd.command === 'underline' ? 'underline' : ''
                }`}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Writing canvas */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        role="textbox"
        aria-multiline="true"
        className="gy-chapter-content min-h-[600px] w-full overflow-y-auto px-4 py-4 text-[16px] leading-8 text-stone-800 focus:outline-none"
      />

      {/* Footer / counts */}
      <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-400">
        <span>支持加粗 / 斜体 / 对齐 / 列表 / 引用，表情文字如 XD、QAQ、T_T 正常显示。</span>
        <span>
          {words} 词 · {chars} 字
        </span>
      </div>
    </div>
  );
}
