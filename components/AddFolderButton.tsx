// components/AddFolderButton.tsx
'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface AddFolderButtonProps {
  parentId?: string | null; // ✅ 支持根级(null) 或 子文件夹(parentId)
}

export default function AddFolderButton({ parentId = null }: AddFolderButtonProps) {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const addFolder = useAppStore((state) => state.addFolder);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addFolder(name.trim(), parentId); // 使用传入的 parentId
    setName('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <form onSubmit={handleSubmit} className="mt-3 px-2 flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="文件夹名称..."
          className="flex-1 min-w-0 text-sm border rounded px-2 py-1 outline-none focus:border-blue-500"
        />
        <button type="submit" className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 shrink-0">
          ✓
        </button>
        <button type="button" onClick={() => setIsAdding(false)} className="text-sm px-2 py-1 rounded hover:bg-gray-100 shrink-0">
          ✕
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="mt-3 w-full text-sm border border-dashed border-gray-300 rounded py-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
    >
      + 新建文件夹
    </button>
  );
}