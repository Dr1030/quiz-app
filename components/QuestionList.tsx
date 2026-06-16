// components/QuestionList.tsx
'use client';

import { useAppStore } from '@/lib/store';

interface Props {
  quizId: string | null;
}

export default function QuestionList({ quizId }: Props) {
  const questions = useAppStore((s) => s.questions);
  const deleteQuestion = useAppStore((s) => s.deleteQuestion);

  if (!quizId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        👈 请在左侧选择一个题库
      </div>
    );
  }

  const filtered = questions.filter((q) => q.quizId === quizId);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <span>📭 该题库暂无题目</span>
        <span className="text-xs">点击上方「📥 批量导入题目」添加</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full">
      {filtered.map((q, idx) => (
        <div
          key={q.id}
          className="border rounded-lg p-4 bg-white shadow-sm relative group"
        >
          {/* 右上角删除按钮 */}
          <button
            onClick={() => {
              if (confirm('确定要删除这道题吗？')) deleteQuestion(q.id);
            }}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-lg font-bold leading-none"
            title="删除题目"
          >
            ✕
          </button>

          {/* 题干 */}
          <p className="font-medium mb-3 pr-6">
            <span className="text-blue-600 mr-2">{idx + 1}.</span>
            {q.content}
          </p>

          {/* 选项 */}
          <div className="space-y-1.5 ml-6">
            {q.options.map((opt, optIdx) => {
              const isCorrect = q.correctAnswers.includes(optIdx);
              return (
                <div
                  key={optIdx}
                  className={`flex items-start gap-2 text-sm px-2 py-1 rounded ${
                    isCorrect
                      ? 'bg-green-50 text-green-700 font-medium border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="shrink-0 w-5">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <span>{opt || <span className="italic text-gray-300">(空选项)</span>}</span>
                  {isCorrect && <span className="ml-auto text-green-600 text-xs">✓ 正确答案</span>}
                </div>
              );
            })}
          </div>

          {/* 解析 */}
          {q.analysis && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-1 text-blue-600 text-sm font-medium mb-1">
                💡 <span>解析：</span>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md leading-relaxed">
                {q.analysis}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}