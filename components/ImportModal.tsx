// components/ImportModal.tsx
"use client";

import { useState } from "react";
import { handleImportQuestions } from "@/lib/importHelper";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 格式示例文本（提取出来方便维护和填入）
const SAMPLE_TEXT = `[分类] 前端基础 / React
[题库] 核心概念测试

[题目] React 中 useState 的作用是什么？
[A] 用于处理副作用
[B] 用于在函数组件中添加状态
[C] 用于路由跳转
[D] 用于获取 DOM 元素
[答案] B
[解析] useState 是 React 提供的一个 Hook，允许我们在函数组件中添加状态。

[题目] 下列哪个生命周期方法会在组件挂载后执行？
[A] componentWillMount
[B] componentDidMount
[C] componentWillReceiveProps
[D] componentWillUnmount
[答案] B`;

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!text.trim()) {
      alert("⚠️ 请先粘贴题目文本！");
      return;
    }

    try {
      handleImportQuestions(text);
      setText("");
      onClose();
      alert("✅ 导入完成！请检查列表。");
    } catch (error) {
      console.error(error);
      alert("❌ 发生未知错误，请查看控制台。");
    }
  };

  const handleUseSample = () => {
    setText(SAMPLE_TEXT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] flex flex-col">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          批量导入题目
        </h2>

        {/* 格式示例区域（可选中复制） */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              📋 格式参考（点击按钮可填入下方输入框）
            </span>
            <button
              onClick={handleUseSample}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
            >
              使用示例
            </button>
          </div>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto max-h-32 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 select-all whitespace-pre-wrap">
            {SAMPLE_TEXT}
          </pre>
        </div>

        {/* 输入区域 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴你的题目文本，格式同上..."
          className="mb-4 flex-1 min-h-[200px] w-full rounded border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />

        {/* 按钮组 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
}