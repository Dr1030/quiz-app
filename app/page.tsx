// app/page.tsx
'use client';

import { useState, useRef } from 'react';
import FolderTree from '@/components/FolderTree';
import QuestionList from '@/components/QuestionList';
import PracticeView from '@/components/PracticeView';
import ImportModal from '@/components/ImportModal';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const currentPractice = useAppStore((s) => s.currentPractice);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 导出全部数据（题库 + 练习记录） ==========
  const handleExport = () => {
    const state = useAppStore.getState();
    const backupData = {
      folders: state.folders,
      quizzes: state.quizzes,
      questions: state.questions,
      practiceHistory: state.practiceHistory,   // ✅ 包含练习记录
      exportDate: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-full-backup-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ========== 导入全部数据（完全覆盖） ==========
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // 校验基本结构
        if (!data.folders || !data.quizzes || !data.questions) {
          alert('❌ 文件格式不正确，缺少 folders/quizzes/questions 数据');
          return;
        }

        // 确认覆盖
        if (!confirm('导入将完全覆盖当前所有题库和练习记录，是否继续？')) return;

        // 完全覆盖状态，包括练习记录
        useAppStore.setState({
          folders: data.folders,
          quizzes: data.quizzes,
          questions: data.questions,
          practiceHistory: data.practiceHistory || [], // ✅ 兼容旧备份无此字段
          activeView: null,
          currentPractice: null,
        });

        alert('✅ 导入成功！题库和练习记录已同步。');
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert('❌ 文件解析失败，请检查是否为 JSON 格式');
      }
    };
    reader.readAsText(file);

    // 重置 input，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <div className="flex h-screen">
      {/* 隐藏的文件导入 input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* 题库弹窗（已包含刷题入口） */}
      <FolderTree
        selectedId={selectedQuizId}
        onSelect={setSelectedQuizId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* 顶部工具栏 */}
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

            {/* 按钮组 */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                📤 全部导出
              </button>
              <button
                onClick={handleImportClick}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                📂 全部导入
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                📥 批量导入
              </button>
            </div>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-auto">
          {currentPractice ? (
            <PracticeView />
          ) : (
            <QuestionList quizId={selectedQuizId} />
          )}
        </div>
      </main>

      {/* 原有的文本批量导入弹窗 */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}