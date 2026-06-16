// components/QuestionForm.tsx
'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { QuestionType } from '@/lib/types';

interface Props {
  quizId: string;
}

export default function QuestionForm({ quizId }: Props) {
  const addQuestion = useAppStore((s) => s.addQuestion);

  const [type, setType] = useState<QuestionType>('single');
  const [content, setContent] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  // ✅ 存储正确选项的索引数组，完美匹配 QuestionList 的 correctAnswers.includes(optIdx)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState('');

  const showOptions = type === 'single' || type === 'multiple';

  // 切换选项选中状态（单选互斥，多选叠加）
  const toggleOption = (index: number) => {
    if (type === 'single') {
      setSelectedIndices([index]);
    } else {
      setSelectedIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return alert('请输入题干');
    if (showOptions && selectedIndices.length === 0) return alert('请选择正确答案');

    addQuestion({
      quizId,
      type,
      content: content.trim(),
      options: showOptions ? options.filter((o) => o.trim()) : [],
      correctAnswers: selectedIndices,
      analysis: analysis.trim() || undefined,
    });

    // 提交成功后重置表单
    setContent('');
    setOptions(['', '', '', '']);
    setSelectedIndices([]);
    setAnalysis('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl pb-6">
      {/* 1. 题型选择 */}
      <div>
        <label className="block text-sm font-medium mb-1">题型</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as QuestionType);
            setSelectedIndices([]); // 切换题型时清空已选答案
          }}
          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="single">单选题</option>
          <option value="multiple">多选题</option>
          <option value="judge">判断题</option>
          <option value="fill">填空题</option>
          <option value="short">简答题</option>
        </select>
      </div>

      {/* 2. 题干输入 */}
      <div>
        <label className="block text-sm font-medium mb-1">题干 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          placeholder="请输入题目内容..."
        />
      </div>

      {/* 3. 选项与答案设置（仅单选/多选显示） */}
      {showOptions && (
        <div>
          <label className="block text-sm font-medium mb-1">
            选项与答案 
            <span className="text-xs text-gray-400 ml-2">（点击右侧按钮设为正确答案）</span>
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                  className="flex-1 border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => toggleOption(i)}
                  className={`shrink-0 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedIndices.includes(i)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectedIndices.includes(i) ? '✓ 答案' : '设为答案'}
                </button>
              </div>
            ))}
          </div>
          {type === 'multiple' && (
            <button
              type="button"
              onClick={() => setOptions([...options, ''])}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              + 添加选项
            </button>
          )}
        </div>
      )}

      {/* 4. 解析输入 */}
      <div>
        <label className="block text-sm font-medium mb-1">解析（选填）</label>
        <textarea
          value={analysis}
          onChange={(e) => setAnalysis(e.target.value)}
          rows={2}
          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      {/* 5. 提交按钮 */}
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        ✅ 添加题目
      </button>
    </form>
  );
}