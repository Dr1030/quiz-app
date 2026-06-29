// components/QuestionList.tsx
'use client';

import { useAppStore } from '@/lib/store';
import { generateQuizExportText } from '@/lib/exportHelper';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  quizId: string | null;
}

const MarkdownInline = ({ children }: { children: React.ReactNode }) => {
  const text = typeof children === 'string' ? children : '';
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ p: 'span' }}
    >
      {text}
    </ReactMarkdown>
  );
};

export default function QuestionList({ quizId }: Props) {
  const questions = useAppStore((s) => s.questions);
  const deleteQuestion = useAppStore((s) => s.deleteQuestion);
  const practiceHistory = useAppStore((s) => s.practiceHistory);
  const quizzes = useAppStore((s) => s.quizzes);

  if (!quizId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        👈 请在左侧选择一个题库
      </div>
    );
  }

  const filtered = questions.filter((q) => q.quizId === quizId);

  const relatedRecords = practiceHistory
    .filter((rec) => rec.quizIds.includes(quizId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (filtered.length === 0 && relatedRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <span>📭 该题库暂无题目</span>
        <span className="text-xs">点击上方「📥 批量导入题目」添加</span>
      </div>
    );
  }

  const handleExportQuiz = () => {
    if (!quizId) return;
    const text = generateQuizExportText(quizId);
    if (!text) {
      alert('该题库没有题目');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const shouldView = window.confirm(
        '✅ 文本已复制到剪贴板！\n\n是否查看导出的文本内容？'
      );
      if (shouldView) {
        alert(text);
      }
    }).catch(() => {
      alert('自动复制失败，请手动复制以下文本：\n\n' + text);
    });
  };

  const getQuizNames = (record: (typeof relatedRecords)[0]) => {
    return record.quizIds
      .map((qid) => {
        const qz = quizzes.find((q) => q.id === qid);
        return qz ? qz.name : '(已删除)';
      })
      .join(', '); // ✅ 一定要有 join
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b-2 border-gray-300 bg-gray-50 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          共 {filtered.length} 道题
        </span>
        <button
          onClick={handleExportQuiz}
          className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors"
        >
          📤 导出文本
        </button>
      </div>

      {relatedRecords.length > 0 && (
        <div className="px-4 py-2 border-b-2 border-gray-200 bg-blue-50">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-blue-800">
              📊 练习记录 ({relatedRecords.length})
            </summary>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {relatedRecords.map((rec) => {
                const accuracy = rec.answeredQuestions > 0
                  ? Math.round((rec.correctCount / rec.answeredQuestions) * 100)
                  : 0;
                const date = new Date(rec.date);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                const isMixed = rec.quizIds.length > 1;
                return (
                  <div key={rec.id} className="bg-white rounded p-2 border border-gray-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dateStr}</span>
                      {isMixed && (
                        <span className="bg-yellow-100 text-yellow-700 px-1 rounded">混合练习</span>
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <span>完成率：{rec.answeredQuestions}/{rec.totalQuestions}</span>
                      <span>正确率：{accuracy}%</span>
                      <span>正确：{rec.correctCount}</span>
                      <span>用时：{Math.floor(rec.timeSpent / 60)}分{rec.timeSpent % 60}秒</span>
                    </div>
                    {isMixed && (
                      <div className="mt-1 text-gray-500 truncate">
                        题库：{getQuizNames(rec)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}

      <div className="flex-1 space-y-4 p-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">暂无题目</div>
        ) : (
          filtered.map((q, idx) => (
            <div
              key={q.id}
              className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm relative group"
            >
              <button
                onClick={() => {
                  if (confirm('确定要删除这道题吗？')) deleteQuestion(q.id);
                }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-lg font-bold leading-none"
                title="删除题目"
              >
                ✕
              </button>

              <p className="font-medium mb-3 pr-6">
                <span className="text-blue-600 mr-2">{idx + 1}.</span>
                <MarkdownInline>{q.content}</MarkdownInline>
              </p>

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
                      <span className="flex-1">
                        <MarkdownInline>{opt || '(空选项)'}</MarkdownInline>
                      </span>
                      {isCorrect && <span className="ml-auto text-green-600 text-xs">✓ 正确答案</span>}
                    </div>
                  );
                })}
              </div>

              {q.analysis && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium mb-1">
                    💡 <span>解析：</span>
                  </div>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {q.analysis}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}