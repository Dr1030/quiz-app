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

// ✅ 新增：练习配置
export interface PracticeConfig {
  quizIds: string[];          // 选择的题库 ID 列表
  shuffle: boolean;           // 是否随机顺序
}

// ✅ 新增：单题作答记录
export interface AnswerRecord {
  questionId: string;
  selectedAnswers: number[];  // 用户选择的选项下标
  isCorrect?: boolean;        // 交卷后整体判断，或实时判断？我们设计为交卷后统计
}

// ✅ 新增：练习会话
export interface PracticeSession {
  config: PracticeConfig;
  questions: Question[];      // 本次练习的所有题目（已排序或乱序）
  currentIndex: number;       // 当前题目索引
  answers: AnswerRecord[];    // 用户答案
  startTime: number;          // 开始时间戳
  endTime?: number;           // 结束时间戳（交卷时设置）
}