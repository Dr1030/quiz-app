// components/PracticeView.tsx
'use client';

import { useAppStore } from '@/lib/store';
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface SubmissionResult {
  isCorrect: boolean;
  submitted: boolean;
}

export default function PracticeView() {
  const session = useAppStore((s) => s.currentPractice);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const nextQuestion = useAppStore((s) => s.nextQuestion);
  const prevQuestion = useAppStore((s) => s.prevQuestion);
  const goToQuestion = useAppStore((s) => s.goToQuestion);
  const endPractice = useAppStore((s) => s.endPractice);
  const [showResult, setShowResult] = useState(false);

  const [submissions, setSubmissions] = useState<Record<string, SubmissionResult>>({});

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [optionOrders, setOptionOrders] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (session) {
      const orders: Record<string, number[]> = {};
      session.questions.forEach((q) => {
        const len = q.options.length;
        const arr = Array.from({ length: len }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        orders[q.id] = arr;
      });
      setOptionOrders(orders);
    } else {
      setOptionOrders({});
    }
  }, [session?.startTime]);

  if (!session) return null;

  const { questions, currentIndex, answers, startTime, endTime } = session;
  const currentQ = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQ.id);
  const currentSubmission = submissions[currentQ.id];

  const handleOptionToggle = (optIdx: number) => {
    if (!currentAnswer || currentSubmission?.submitted) return;
    const selected = currentAnswer.selectedAnswers;
    let newSelected;
    if (currentQ.type === 'single') {
      newSelected = selected.includes(optIdx) ? [] : [optIdx];
    } else {
      newSelected = selected.includes(optIdx)
        ? selected.filter((i) => i !== optIdx)
        : [...selected, optIdx];
    }
    submitAnswer(currentQ.id, newSelected);
  };

  const handleSubmitQuestion = useCallback(() => {
    if (!currentAnswer || currentSubmission?.submitted) return;
    if (currentAnswer.selectedAnswers.length === 0) {
      alert('请至少选择一个选项');
      return;
    }

    const correctSet = new Set(currentQ.correctAnswers);
    const selectedSet = new Set(currentAnswer.selectedAnswers);
    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every((idx) => selectedSet.has(idx));

    setSubmissions((prev) => ({
      ...prev,
      [currentQ.id]: { isCorrect, submitted: true },
    }));
  }, [currentAnswer, currentQ, currentSubmission]);

  const handleEndPractice = () => {
    if (!window.confirm('确定要结束练习吗？未提交的题目将不计入正确率。')) return;
    endPractice();
    setShowResult(true);
  };

  const totalQuestions = questions.length;
  const submittedCount = Object.keys(submissions).length;
  const correctCount = Object.values(submissions).filter((s) => s.isCorrect).length;
  const accuracy = submittedCount > 0 ? Math.round((correctCount / submittedCount) * 100) : 0;
  const elapsed = endTime
    ? Math.floor((endTime - startTime) / 1000)
    : Math.floor((now - startTime) / 1000);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${s}秒`;
  };

  if (showResult && endTime) {
    const finalCorrect = correctCount;
    const finalTotal = totalQuestions;
    const finalAccuracy = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">练习完成！</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <p>总题数：<strong>{finalTotal}</strong></p>
          <p>已提交：<strong>{submittedCount}</strong></p>
          <p>正确数：<strong className="text-green-600">{finalCorrect}</strong></p>
          <p>正确率：<strong>{finalAccuracy}%</strong>（基于已提交题目）</p>
          <p>用时：<strong>{formatTime(elapsed)}</strong></p>
        </div>
        <button
          onClick={() => useAppStore.setState({ currentPractice: null })}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    );
  }

  const getOptionStyle = (origIdx: number) => {
    const isSelected = currentAnswer?.selectedAnswers.includes(origIdx);
    if (!currentSubmission?.submitted) {
      return isSelected
        ? 'border-2 border-blue-300 bg-blue-50'
        : 'border-2 border-gray-300 hover:bg-gray-50';
    }
    const isCorrectOption = currentQ.correctAnswers.includes(origIdx);
    if (isCorrectOption) {
      return 'border-2 border-green-300 bg-green-50 text-green-800';
    }
    if (isSelected && !isCorrectOption) {
      return 'border-2 border-red-300 bg-red-50 text-red-800';
    }
    return 'border-2 border-gray-300 text-gray-400';
  };

  const currentDisplayNumber =
    currentQ.originalIndex != null ? currentQ.originalIndex + 1 : currentIndex + 1;

  const order = optionOrders[currentQ.id] ?? currentQ.options.map((_, i) => i);

  // Markdown 渲染组件，将段落变为行内元素，避免换行破坏布局
  const MarkdownInline = ({ children }: { children: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ p: 'span' }}
    >
      {children}
    </ReactMarkdown>
  );

  return (
    <div className="flex flex-col h-full p-4 sm:p-6">
      {/* 顶部信息 */}
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <div className="flex-1 min-w-[80px] bg-gray-50 border-2 border-gray-300 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">进度</div>
          <div className="font-semibold">
            {currentIndex + 1} / {totalQuestions}
          </div>
        </div>
        <div className="flex-1 min-w-[80px] bg-gray-50 border-2 border-gray-300 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">正确率</div>
          <div className="font-semibold">{accuracy}%</div>
        </div>
        <div className="flex-1 min-w-[80px] bg-gray-50 border-2 border-gray-300 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">计时</div>
          <div className="font-semibold">{formatTime(elapsed)}</div>
        </div>
        <button
          onClick={handleEndPractice}
          className="px-3 py-2 bg-red-500 text-white border-2 border-red-600 rounded text-sm hover:bg-red-600 self-stretch"
        >
          结束练习
        </button>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${totalQuestions > 0 ? (submittedCount / totalQuestions) * 100 : 0}%` }}
        />
      </div>

      {/* 题目卡片 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 sm:p-6 overflow-auto border-2 border-gray-300">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold flex-1">
            {currentDisplayNumber}.{' '}
            <MarkdownInline>{currentQ.content}</MarkdownInline>
          </h3>
          {currentSubmission?.submitted && (
            <span
              className={`text-sm font-bold px-2 py-1 rounded ${
                currentSubmission.isCorrect
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {currentSubmission.isCorrect ? '✓ 正确' : '✗ 错误'}
            </span>
          )}
        </div>

        <div className="space-y-2 ml-4">
          {order.map((origIdx, displayIdx) => {
            const opt = currentQ.options[origIdx];
            return (
              <label
                key={origIdx}
                className={`flex items-start gap-2 p-2 rounded border-2 transition-colors ${
                  currentSubmission?.submitted ? 'cursor-default' : 'cursor-pointer'
                } ${getOptionStyle(origIdx)}`}
              >
                <input
                  type={currentQ.type === 'single' ? 'radio' : 'checkbox'}
                  name={`question-${currentQ.id}`}
                  checked={currentAnswer?.selectedAnswers.includes(origIdx) || false}
                  onChange={() => handleOptionToggle(origIdx)}
                  disabled={currentSubmission?.submitted}
                  className="shrink-0 mt-0.5"
                />
                <span className="font-medium">{String.fromCharCode(65 + displayIdx)}.</span>
                <span className="whitespace-normal break-words flex-1">
                  <MarkdownInline>{opt}</MarkdownInline>
                </span>
              </label>
            );
          })}
        </div>

        {currentSubmission?.submitted && (
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded">
            <h4 className="font-semibold text-blue-800 mb-1">📖 解析</h4>
            <div className="text-blue-900">
              {currentQ.analysis ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentQ.analysis}
                </ReactMarkdown>
              ) : (
                '暂无解析'
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 border-2 border-gray-400 rounded disabled:opacity-50"
        >
          上一题
        </button>

        <div className="flex justify-center">
          {!currentSubmission?.submitted ? (
            <button
              onClick={handleSubmitQuestion}
              disabled={!currentAnswer || currentAnswer.selectedAnswers.length === 0}
              className="px-6 py-2 bg-green-600 text-white border-2 border-green-700 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交本题
            </button>
          ) : (
            <span className="text-sm text-green-600 font-medium">已提交 ✓</span>
          )}
        </div>

        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 bg-blue-500 text-white border-2 border-blue-600 rounded disabled:opacity-50"
        >
          下一题
        </button>
      </div>
    </div>
  );
}