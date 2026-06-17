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
            className="text-sm flex-1 border-2 border-blue-300 rounded px-1 outline-none focus:border-blue-500"
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
            className="text-xs border-2 border-blue-300 rounded px-2 py-0.5 w-full outline-none focus:border-blue-500"
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
                      className="text-sm flex-1 border-2 border-blue-300 rounded px-1 outline-none"
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

// 侧边栏抽屉组件，接收 open / onClose 由外部控制
export default function FolderTree({
  selectedId,
  onSelect,
  open,
  onClose,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const folders = useAppStore((s) => s.folders);
  const quizzes = useAppStore((s) => s.quizzes);
  const startPractice = useAppStore((s) => s.startPractice);
  const rootFolders = folders.filter((f) => f.parentId === null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const [shuffle, setShuffle] = useState(false);

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
    onClose(); // 开始练习后关闭侧边栏
  };

  return (
    <>
      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 侧边栏抽屉 */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r-2 border-gray-300 z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-xl`}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 bg-gray-50 border-b-2 border-gray-300">
          <h2 className="text-lg font-bold">📂 题库目录</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            title="关闭侧边栏"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 刷题控制区 */}
        <div className="px-3 py-2 bg-gray-50 border-b-2 border-gray-300">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="w-full py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              ✏️ 选择刷题
            </button>
          ) : (
            <div className="bg-white p-2 rounded border-2 border-gray-300">
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

        {/* 文件夹树（可滚动） */}
        <div className="flex-1 overflow-y-auto bg-white px-2 py-1">
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

        {/* 新建文件夹按钮 */}
        <div className="px-3 py-2 bg-gray-50 border-t-2 border-gray-300">
          <AddFolderButton />
        </div>
      </aside>
    </>
  );
}