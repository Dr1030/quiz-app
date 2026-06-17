// components/FolderTree.tsx
'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Folder, Quiz, PracticeConfig } from '@/lib/types';
import AddFolderButton from './AddFolderButton';

interface FolderNodeProps {
  folder: Folder;
  allFolders: Folder[];
  allQuizzes: Quiz[];
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectMode?: boolean;
  selectedQuizIds?: Set<string>;
  onToggleSelect?: (quizId: string) => void;
}

function FolderNode({
  folder,
  allFolders,
  allQuizzes,
  level,
  selectedId,
  onSelect,
  selectMode,
  selectedQuizIds,
  onToggleSelect,
}: FolderNodeProps) {
  const addFolder = useAppStore((s) => s.addFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const renameFolder = useAppStore((s) => s.renameFolder);
  const renameQuiz = useAppStore((s) => s.renameQuiz);

  const [expanded, setExpanded] = useState(false);
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [subName, setSubName] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editQuizName, setEditQuizName] = useState('');

  const children = allFolders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const folderQuizzes = allQuizzes.filter((q) => q.folderId === folder.id);

  // 缩进减小为12px，适应窄屏
  const indent = level * 12;

  const handleAddSubFolder = () => {
    if (!subName.trim()) return;
    addFolder(subName.trim(), folder.id);
    setSubName('');
    setIsCreatingSub(false);
    setExpanded(true);
  };

  const handleSaveRename = () => {
    if (editName.trim() && editName !== folder.name) {
      renameFolder(folder.id, editName.trim());
    } else {
      setEditName(folder.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setIsCreatingSub(false);
      setEditName(folder.name);
      setSubName('');
    }
  };

  const handleDeleteFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除文件夹【${folder.name}】吗？\n（这会连带删除里面的所有试卷和题目！）`)) {
      deleteFolder(folder.id);
    }
  };

  const startQuizRename = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setEditQuizName(quiz.name);
  };

  const saveQuizRename = (quizId: string) => {
    if (editQuizName.trim() && editQuizName !== '') {
      renameQuiz(quizId, editQuizName.trim());
    }
    setEditingQuizId(null);
  };

  const handleQuizKeyDown = (e: React.KeyboardEvent, quizId: string) => {
    if (e.key === 'Enter') saveQuizRename(quizId);
    if (e.key === 'Escape') {
      setEditingQuizId(null);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded group select-none transition-colors cursor-pointer hover:bg-gray-100 text-gray-700`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => !isEditing && (hasChildren || folderQuizzes.length > 0) && setExpanded(!expanded)}
      >
        <span
          className={`text-xs transition-transform cursor-pointer w-4 ${expanded ? 'rotate-90' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {(hasChildren || folderQuizzes.length > 0 || isCreatingSub) ? '▶' : '•'}
        </span>

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="text-sm flex-1 border border-blue-300 rounded px-1 outline-none focus:border-blue-500"
          />
        ) : (
          <span
            className="text-sm flex-1 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="双击重命名"
          >
            📁 {folder.name}
          </span>
        )}

        {!isEditing && (
          /* 手机端始终显示，桌面端 hover 显示 */
          <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingSub(true);
                setExpanded(true);
              }}
              className="text-xs px-2 py-0.5 text-gray-600 hover:text-blue-600"
              title="新建子文件夹"
            >
              +
            </button>
            <button
              onClick={handleDeleteFolder}
              className="text-xs px-2 py-0.5 text-gray-600 hover:text-red-600"
              title="删除文件夹"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {isCreatingSub && (
        <div className="flex items-center gap-1 py-1 px-2" style={{ paddingLeft: `${(level + 1) * 12}px` }}>
          <span className="text-xs">•</span>
          <input
            autoFocus
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubFolder();
              if (e.key === 'Escape') {
                setIsCreatingSub(false);
                setSubName('');
              }
            }}
            onBlur={() => {
              if (!subName.trim()) setIsCreatingSub(false);
            }}
            placeholder="子文件夹名称..."
            className="text-xs border border-blue-300 rounded px-2 py-0.5 w-full outline-none focus:border-blue-500"
          />
        </div>
      )}

      {expanded && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              allQuizzes={allQuizzes}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              selectMode={selectMode}
              selectedQuizIds={selectedQuizIds}
              onToggleSelect={onToggleSelect}
            />
          ))}

          {folderQuizzes.map((quiz) => {
            const isSelected = selectedId === quiz.id;
            const isEditingQuiz = editingQuizId === quiz.id;

            return (
              <div key={quiz.id} className="group flex items-center w-full">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedQuizIds?.has(quiz.id) ?? false}
                    onChange={() => onToggleSelect?.(quiz.id)}
                    className="ml-2 mr-1 shrink-0"
                  />
                )}

                {isEditingQuiz ? (
                  <div
                    className="flex-1 flex items-center gap-1 py-1 px-2"
                    style={{ paddingLeft: `${(level + 1) * 12}px` }}
                  >
                    <span className="text-xs">📝</span>
                    <input
                      autoFocus
                      value={editQuizName}
                      onChange={(e) => setEditQuizName(e.target.value)}
                      onKeyDown={(e) => handleQuizKeyDown(e, quiz.id)}
                      onBlur={() => saveQuizRename(quiz.id)}
                      className="text-sm flex-1 border border-blue-300 rounded px-1 outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectMode) {
                        onToggleSelect?.(quiz.id);
                      } else {
                        onSelect(quiz.id);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startQuizRename(quiz);
                    }}
                    className={`flex-1 text-left flex items-center gap-1 py-1 px-2 rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                    style={{ paddingLeft: `${(level + 1) * 12}px` }}
                    title="双击重命名题库"
                  >
                    <span className="text-xs">📝</span>
                    <span className="text-sm truncate">{quiz.name}</span>
                  </button>
                )}

                {!selectMode && !isEditingQuiz && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除试卷【${quiz.name}】及其所有题目吗？`)) {
                        useAppStore.getState().deleteQuiz(quiz.id);
                      }
                    }}
                    /* 手机端始终显示，桌面端 hover 显示 */
                    className="mr-2 text-xs text-gray-600 hover:text-red-600 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    title="删除试卷"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const folders = useAppStore((s) => s.folders);
  const quizzes = useAppStore((s) => s.quizzes);
  const startPractice = useAppStore((s) => s.startPractice);
  const rootFolders = folders.filter((f) => f.parentId === null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const [shuffle, setShuffle] = useState(false);

  // 侧边栏折叠状态：手机屏（<640px）默认折叠
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  const toggleQuizSelection = (quizId: string) => {
    const newSet = new Set(selectedQuizIds);
    if (newSet.has(quizId)) newSet.delete(quizId);
    else newSet.add(quizId);
    setSelectedQuizIds(newSet);
  };

  const handleStartPractice = () => {
    if (selectedQuizIds.size === 0) {
      alert('请至少选择一个题库');
      return;
    }
    const config: PracticeConfig = {
      quizIds: Array.from(selectedQuizIds),
      shuffle,
    };
    startPractice(config);
    setSelectMode(false);
    setSelectedQuizIds(new Set());
  };

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-10' : 'w-64'
      } border-r border-gray-200 bg-white h-screen overflow-y-auto transition-all duration-300 flex flex-col shrink-0`}
    >
      {/* 折叠状态仅显示展开按钮 */}
      {sidebarCollapsed ? (
        <div className="flex justify-center pt-3">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="text-gray-500 hover:text-blue-600 p-1 rounded"
            title="展开侧边栏"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-lg font-bold">📂 题库目录</h2>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              title="折叠侧边栏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* 刷题控制区 */}
          <div className="mb-3 px-2 space-y-2">
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="w-full py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                ✏️ 选择刷题
              </button>
            ) : (
              <div className="bg-gray-50 p-2 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={shuffle}
                      onChange={(e) => setShuffle(e.target.checked)}
                    />
                    乱序
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStartPractice}
                    className="flex-1 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    开始 ({selectedQuizIds.size} 个)
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedQuizIds(new Set());
                    }}
                    className="px-2 py-1 bg-gray-300 rounded text-xs"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-0.5 px-2">
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                allFolders={folders}
                allQuizzes={quizzes}
                level={0}
                selectedId={selectedId}
                onSelect={onSelect}
                selectMode={selectMode}
                selectedQuizIds={selectedQuizIds}
                onToggleSelect={toggleQuizSelection}
              />
            ))}
          </div>
          <AddFolderButton />
        </>
      )}
    </aside>
  );
}