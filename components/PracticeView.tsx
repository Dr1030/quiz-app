// components/PracticeView.tsx
'use client';

import { useAppStore } from '@/lib/store';
import { useState, useEffect, useCallback } from 'react';

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

  // 本地记录逐题提交结果（对错、是否已提交）
  const [submissions, setSubmissions] = useState<Record<string, SubmissionResult>>({});

  // 每秒更新一次当前时间，实现实时计时
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!session) return null;

  const { questions, currentIndex, answers, startTime, endTime } = session;
  const currentQ = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQ.id);
  const currentSubmission = submissions[currentQ.id];

  // 点击选项（已提交后禁止修改）
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

  // 提交本题：判断对错并显示解析
  const handleSubmitQuestion = useCallback(() => {
    if (!currentAnswer || currentSubmission?.submitted) return;
    if (currentAnswer.selectedAnswers.length === 0) {
      alert('请至少选择一个选项');
      return;
    }

    // 判断对错
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

  // 结束整个练习（原交卷逻辑）
  const handleEndPractice = () => {
    if (!window.confirm('确定要结束练习吗？未提交的题目将不计入正确率。')) return;
    endPractice();          // 会设置 endTime，store 中可能会根据已有答案统计
    setShowResult(true);
  };

  // ---- 统计数据（基于已提交的题目） ----
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

  // ---- 练习完成结果页 ----
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

  // ---- 选项样式（根据提交状态染色） ----
  const getOptionStyle = (optIdx: number) => {
    const isSelected = currentAnswer?.selectedAnswers.includes(optIdx);
    if (!currentSubmission?.submitted) {
      return isSelected
        ? 'border-blue-400 bg-blue-50'
        : 'border-gray-200 hover:bg-gray-50';
    }
    // 已提交
    const isCorrectOption = currentQ.correctAnswers.includes(optIdx);
    if (isCorrectOption) {
      return 'border-green-400 bg-green-50 text-green-800';
    }
    if (isSelected && !isCorrectOption) {
      return 'border-red-400 bg-red-50 text-red-800';
    }
    return 'border-gray-200 text-gray-400';
  };

  // ---- 底部题号样式 ----
  const getQuestionDotStyle = (index: number) => {
    const q = questions[index];
    const ans = answers[index];
    const sub = submissions[q.id];
    if (sub?.submitted) {
      return sub.isCorrect
        ? 'bg-green-500 text-white border-green-500'
        : 'bg-red-500 text-white border-red-500';
    }
    if (ans?.selectedAnswers.length > 0) {
      return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    }
    return 'bg-white border-gray-300';
  };

  // ---- 主刷题界面 ----
  return (
    <div className="flex flex-col h-full p-6">
      {/* 顶部信息栏：进度、正确率、计时 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          进度 {currentIndex + 1} / {totalQuestions}
        </span>
        <span className="text-sm text-gray-500">
          正确率 {accuracy}%（{correctCount}/{submittedCount}）
        </span>
        <span className="text-sm text-gray-500">
          计时：{formatTime(elapsed)}
        </span>
        <button
          onClick={handleEndPractice}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          结束练习
        </button>
      </div>

      {/* 进度条：已提交题目占比 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${totalQuestions > 0 ? (submittedCount / totalQuestions) * 100 : 0}%` }}
        />
      </div>

      {/* 题目卡片 */}
      <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {currentIndex + 1}. {currentQ.content}
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

        {/* 选项列表 */}
        <div className="space-y-2 ml-4">
          {currentQ.options.map((opt, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                currentSubmission?.submitted ? 'cursor-default' : 'cursor-pointer'
              } ${getOptionStyle(idx)}`}
            >
              <input
                type={currentQ.type === 'single' ? 'radio' : 'checkbox'}
                name={`question-${currentQ.id}`}
                checked={currentAnswer?.selectedAnswers.includes(idx) || false}
                onChange={() => handleOptionToggle(idx)}
                disabled={currentSubmission?.submitted}
                className="shrink-0"
              />
              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {/* 提交按钮 / 解析区域 */}
        <div className="mt-6">
          {!currentSubmission?.submitted ? (
            <button
              onClick={handleSubmitQuestion}
              disabled={!currentAnswer || currentAnswer.selectedAnswers.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交本题
            </button>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800 mb-1">📖 解析</h4>
              <p className="text-blue-900">{currentQ.analysis || '暂无解析'}</p>
            </div>
          )}
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
              className={`w-6 h-6 rounded-full text-xs font-medium border ${getQuestionDotStyle(
                i
              )} ${i === currentIndex ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
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