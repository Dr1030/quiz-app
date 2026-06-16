// components/PracticeView.tsx
'use client';

import { useAppStore } from '@/lib/store';
import { useState } from 'react';

export default function PracticeView() {
  const session = useAppStore((s) => s.currentPractice);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const nextQuestion = useAppStore((s) => s.nextQuestion);
  const prevQuestion = useAppStore((s) => s.prevQuestion);
  const goToQuestion = useAppStore((s) => s.goToQuestion);
  const endPractice = useAppStore((s) => s.endPractice);
  const [showResult, setShowResult] = useState(false);

  if (!session) return null;

  const { questions, currentIndex, answers, startTime, endTime } = session;
  const currentQ = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQ.id);

  const handleOptionToggle = (optIdx: number) => {
    if (!currentAnswer) return;
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

  const handleSubmit = () => {
    if (!window.confirm('确定要交卷吗？')) return;
    endPractice();
    setShowResult(true);
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const total = questions.length;
  const elapsed = endTime ? Math.floor((endTime - startTime) / 1000) : Math.floor((Date.now() - startTime) / 1000);
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${s}秒`;
  };

  if (showResult && endTime) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">练习完成！</h2>
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <p>总题数：<strong>{total}</strong></p>
          <p>正确数：<strong className="text-green-600">{correctCount}</strong></p>
          <p>正确率：<strong>{total > 0 ? Math.round((correctCount / total) * 100) : 0}%</strong></p>
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

  return (
    <div className="flex flex-col h-full p-6">
      {/* 顶部信息栏 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          题目 {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-sm text-gray-500">
          计时：{formatTime(Math.floor((Date.now() - startTime) / 1000))}
        </span>
        <button
          onClick={handleSubmit}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          交卷
        </button>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 题目区域 */}
      <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">
          {currentIndex + 1}. {currentQ.content}
        </h3>
        <div className="space-y-2 ml-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = currentAnswer?.selectedAnswers.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                  isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type={currentQ.type === 'single' ? 'radio' : 'checkbox'}
                  name={`question-${currentQ.id}`}
                  checked={isSelected}
                  onChange={() => handleOptionToggle(idx)}
                  className="shrink-0"
                />
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="flex justify-between mt-4">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          上一题
        </button>
        <span className="flex gap-2 items-center text-sm">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goToQuestion(i)}
              className={`w-6 h-6 rounded-full text-xs font-medium border ${
                i === currentIndex
                  ? 'bg-blue-500 text-white border-blue-500'
                  : answers[i]?.selectedAnswers.length > 0
                  ? 'bg-green-200 border-green-300'
                  : 'bg-white border-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </span>
        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          下一题
        </button>
      </div>
    </div>
  );
}