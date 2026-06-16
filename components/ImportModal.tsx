// components/ImportModal.tsx
"use client";

import { useState } from "react";
// 确保路径正确，如果你的文件在 lib 下，通常是 @/lib/importHelper
import { handleImportQuestions } from "@/lib/importHelper";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [text, setText] = useState("");

  // 如果弹窗没打开，就不渲染任何内容
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!text.trim()) {
      alert("⚠️ 请先粘贴题目文本！");
      return;
    }

    try {
      // 1. 调用导入逻辑
      // 注意：这里不需要接收返回值，因为我们在 helper 里直接用 alert 报错了
      handleImportQuestions(text);

      // 2. 如果没有报错（try 块正常走完），说明导入大概率成功了
      // 清空输入框并关闭弹窗
      setText("");
      onClose();

      // 3. 给用户一个成功的反馈
      // (如果你想做得更精细，可以在 helper 里 throw new Error，这里 catch 住)
      alert("✅ 导入完成！请检查列表。");

    } catch (error) {
      console.error(error);
      alert("❌ 发生未知错误，请查看控制台。");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* 弹窗主体 */}
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          批量导入题目
        </h2>

        {/* 输入区域 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴题目文本...&#10;格式示例：&#10;[分类] 前端基础&#10;1. React是什么？&#10;[A] 库&#10;[B] 框架&#10;[答案] A"
          className="mb-4 h-64 w-full rounded border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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