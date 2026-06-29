// lib/types.ts

export type QuestionType = 'single' | 'multiple';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Quiz {
  id: string;
  name: string;
  folderId: string;
  questionIds: string[];
}

export interface Question {
  id: string;
  quizId: string;
  content: string;
  options: string[];
  correctAnswers: number[];
  type: QuestionType;
  analysis?: string;
  originalIndex?: number;
}

export interface PracticeConfig {
  quizIds: string[];
  shuffle: boolean;
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswers: number[];
  isCorrect?: boolean;
}

export interface PracticeSession {
  config: PracticeConfig;
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
  startTime: number;
  endTime?: number;
}

// ✅ 新增：练习历史记录
export interface PracticeRecord {
  id: string;
  date: string;               // ISO 字符串
  quizIds: string[];          // 参与的题库 ID
  totalQuestions: number;
  answeredQuestions: number;  // 已提交题目数
  correctCount: number;
  timeSpent: number;          // 秒
}