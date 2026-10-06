import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function editSlotKey(kind: string, id: string | number | null | undefined): string {
  return `${kind}:${id ?? ''}`;
}

function findSlot(key: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const nodes = document.querySelectorAll<HTMLElement>('[data-edit-slot]');
  for (const n of Array.from(nodes)) {
    if (n.dataset.editSlot === key) return n;
  }
  return null;
}

interface InlineEditorPortalProps {
  kind: string;
  editId?: string | number | null;
  children: React.ReactNode;
}

export default function InlineEditorPortal({ kind, editId, children }: InlineEditorPortalProps) {
  const hasId = editId !== undefined && editId !== null && String(editId) !== '';
  const key = hasId ? editSlotKey(kind, editId) : '';
  const slot = key ? findSlot(key) : null;

  useEffect(() => {
    if (!key) return;
    const timer = window.setTimeout(() => {
      findSlot(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [key]);

  return slot ? createPortal(children, slot) : <>{children}</>;
}
