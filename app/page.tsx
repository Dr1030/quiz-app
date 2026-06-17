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
  const [importOpen, setImportOpen] = useState(false);
  const currentPractice = useAppStore((s) => s.currentPractice);

  // 侧边栏抽屉状态
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* 侧边栏抽屉 */}
      <FolderTree
        selectedId={selectedQuizId}
        onSelect={setSelectedQuizId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* 非练习时显示标题栏，包含汉堡按钮和批量导入 */}
        {!currentPractice && (
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-gray-300 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100"
                title="打开题库目录"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold">题目管理</h1>
            </div>
            <button
              onClick={() => setImportOpen(true)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              📥 批量导入
            </button>
          </div>
        )}

        {/* 内容区：练习界面或题库管理 */}
        <div className="flex-1 overflow-auto">
          {currentPractice ? (
            <PracticeView />
          ) : (
            <QuestionList quizId={selectedQuizId} />
          )}
        </div>
      </main>

      {/* 导入弹窗 */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}