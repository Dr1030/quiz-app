// components/FolderTree.tsx
"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import AddFolderButton from "./AddFolderButton";
import { Folder, Quiz, PracticeConfig } from "@/lib/types";

interface FolderTreeProps {
  selectedId: string | null;
  onSelect: (quizId: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function FolderTree({ selectedId, onSelect, open, onClose }: FolderTreeProps) {
  const { folders, quizzes, deleteQuiz, deleteFolder, renameFolder, renameQuiz, startPractice } =
    useAppStore();

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  // ✅ 刷题选择模式
  const [selectMode, setSelectMode] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const [shuffle, setShuffle] = useState(false);

  const rootFolders = folders.filter((f) => f.parentId === null);
  const getChildFolders = (parentId: string) => folders.filter((f) => f.parentId === parentId);
  const getQuizzesInFolder = (folderId: string) => quizzes.filter((q) => q.folderId === folderId);

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const toggleQuizSelection = (quizId: string) => {
    const newSet = new Set(selectedQuizIds);
    if (newSet.has(quizId)) newSet.delete(quizId);
    else newSet.add(quizId);
    setSelectedQuizIds(newSet);
  };

  const handleStartPractice = () => {
    if (selectedQuizIds.size === 0) {
      alert("请至少选择一个题库");
      return;
    }
    const config: PracticeConfig = {
      quizIds: Array.from(selectedQuizIds),
      shuffle,
    };
    startPractice(config);
    setSelectMode(false);
    setSelectedQuizIds(new Set());
    onClose(); // 开始练习后关闭弹窗
  };

  // 递归渲染文件夹
  const renderFolder = (folder: Folder, depth: number) => {
    const childFolders = getChildFolders(folder.id);
    const folderQuizzes = getQuizzesInFolder(folder.id);
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div key={folder.id} className="select-none">
        {/* 文件夹行 */}
        <div
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={() => toggleExpand(folder.id)}>
            <span className="text-sm">{isExpanded ? "▾" : "▸"}</span>
            {editingFolderId === folder.id ? (
              <input
                className="flex-1 px-1 py-0.5 text-sm border rounded"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => {
                  if (editText.trim()) renameFolder(folder.id, editText.trim());
                  setEditingFolderId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editText.trim()) renameFolder(folder.id, editText.trim());
                    setEditingFolderId(null);
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium truncate">{folder.name}</span>
            )}
          </div>
          <div className="flex gap-1 opacity-60 hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingFolderId(folder.id);
                setEditText(folder.name);
              }}
              className="text-xs px-1"
              title="重命名"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`确定删除文件夹"${folder.name}"及其所有内容吗？`)) deleteFolder(folder.id);
              }}
              className="text-xs px-1"
              title="删除"
            >
              🗑️
            </button>
            <AddFolderButton parentId={folder.id} />
          </div>
        </div>

        {/* 展开内容 */}
        {isExpanded && (
          <>
            {childFolders.map((child) => renderFolder(child, depth + 1))}
            {folderQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer ${
                  selectMode
                    ? "hover:bg-gray-50"
                    : `hover:bg-blue-50 dark:hover:bg-blue-900 ${
                        selectedId === quiz.id ? "bg-blue-100 dark:bg-blue-800" : ""
                      }`
                }`}
                style={{ paddingLeft: `${16 + (depth + 1) * 20}px` }}
                onClick={() => {
                  if (selectMode) {
                    toggleQuizSelection(quiz.id); // 选择模式下切换选中
                  } else {
                    onSelect(quiz.id);
                    onClose(); // 普通模式下选择题库后关闭弹窗
                  }
                }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {/* ✅ 选择模式下显示复选框 */}
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedQuizIds.has(quiz.id)}
                      onChange={() => toggleQuizSelection(quiz.id)}
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <span className="text-sm">📚</span>
                  {editingQuizId === quiz.id ? (
                    <input
                      className="flex-1 px-1 py-0.5 text-sm border rounded"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => {
                        if (editText.trim()) renameQuiz(quiz.id, editText.trim());
                        setEditingQuizId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editText.trim()) renameQuiz(quiz.id, editText.trim());
                          setEditingQuizId(null);
                        }
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate">{quiz.name}</span>
                  )}
                </div>
                {/* 非选择模式下显示操作按钮 */}
                {!selectMode && (
                  <div className="flex gap-1 opacity-60 hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingQuizId(quiz.id);
                        setEditText(quiz.name);
                      }}
                      className="text-xs px-1"
                      title="重命名"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定删除题库"${quiz.name}"吗？`)) deleteQuiz(quiz.id);
                      }}
                      className="text-xs px-1"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 max-h-[80vh] flex flex-col">
        {/* 标题栏 + 刷题按钮 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            📂 题库目录
          </h2>
          <div className="flex items-center gap-2">
            {/* ✅ 刷题按钮（仅在非选择模式显示） */}
            {!selectMode && (
              <button
                onClick={() => setSelectMode(true)}
                className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                ✏️ 刷题
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ✅ 选择模式控制栏 */}
        {selectMode && (
          <div className="mb-3 p-2 bg-gray-50 border rounded dark:bg-gray-700">
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
                className="flex-1 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                开始练习 ({selectedQuizIds.size} 个)
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedQuizIds(new Set());
                }}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 文件夹树 */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-gray-500">所有文件夹</span>
            {!selectMode && <AddFolderButton parentId={null} />}
          </div>
          {rootFolders.map((folder) => renderFolder(folder, 0))}
        </div>
      </div>
    </div>
  );
}