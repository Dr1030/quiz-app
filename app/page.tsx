// app/page.tsx
'use client';

import { useState } from 'react';
import FolderTree from '@/components/FolderTree';
import QuestionList from '@/components/QuestionList';
import PracticeView from '@/components/PracticeView';
import ImportModal from '@/components/ImportModal';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false); // ✅ 控制导入弹窗
  const currentPractice = useAppStore((s) => s.currentPractice);

  return (
    <div className="flex h-screen">
      <FolderTree selectedId={selectedQuizId} onSelect={setSelectedQuizId} />
      <main className="flex-1 overflow-hidden">
        {currentPractice ? (
          <PracticeView />
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h1 className="text-lg font-semibold">题目管理</h1>
              {/* ✅ 打开导入弹窗的按钮 */}
              <button
                onClick={() => setImportOpen(true)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                📥 批量导入
              </button>
            </div>
            <QuestionList quizId={selectedQuizId} />
          </>
        )}
      </main>

      {/* ✅ 导入弹窗 */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}