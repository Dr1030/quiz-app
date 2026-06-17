// components/ImportModal.tsx
"use client";

import { useState } from "react";
import { handleImportQuestions } from "@/lib/importHelper";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 格式示例文本（数分题库，包含单选与多选，支持 LaTeX 公式）
const SAMPLE_TEXT = `[分类] 数学分析 / 极限与连续性
[题库] Quiz-1

[题目] 设函数 $f(x)=\\frac{x^2-1}{x-1}$，则 $\\lim_{x\\to 1} f(x)$ 等于？
[A] $0$
[B] $1$
[C] $2$
[D] 不存在
[答案] C
[解析] 当 $x\\neq 1$ 时，$f(x)=x+1$，故 $\\lim_{x\\to 1}f(x)=2$。

[题目] 以下哪些条件可以保证函数 $f$ 在点 $x_0$ 处连续？（多选）
[A] $\\lim_{x\\to x_0} f(x)$ 存在
[B] $\\lim_{x\\to x_0} f(x) = f(x_0)$
[C] $f$ 在 $x_0$ 处可导
[D] $\\lim_{x\\to x_0^+} f(x) = \\lim_{x\\to x_0^-} f(x)$
[答案] BC
[解析] 连续性定义要求极限存在且等于函数值，故 B 正确。可导必连续，故 C 正确。A 仅要求极限存在，未要求等于函数值；D 左右极限相等但可能不等于函数值，均不充分。`;

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
              📋 格式参考（支持 $LaTeX$ 公式，点击按钮可填入下方输入框）
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
          placeholder="在此粘贴题目文本，支持 $LaTeX$ 数学公式..."
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