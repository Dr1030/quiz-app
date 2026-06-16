import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Folder, Quiz, Question, QuestionType, PracticeConfig, PracticeSession } from './types';

interface AppState {
  folders: Folder[];
  quizzes: Quiz[];
  questions: Question[];

  activeView: { quizId: string | null; mode: 'manager' | 'practice' } | null;
  setActiveView: (quizId: string, mode: 'manager' | 'practice') => void;
  clearActiveView: () => void;

  addFolder: (name: string, parentId: string | null) => void;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  ensureFolderPath: (path: string) => string;

  addQuiz: (name: string, folderId: string) => void;
  deleteQuiz: (id: string) => void;
  renameQuiz: (id: string, name: string) => void;

  addQuestion: (question: Omit<Question, 'id'>) => void;
  deleteQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void;
  importFromText: (text: string) => void;

  // 练习相关
  currentPractice: PracticeSession | null;
  startPractice: (config: PracticeConfig) => void;
  endPractice: () => void;
  submitAnswer: (questionId: string, selectedAnswers: number[]) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      folders: [],
      quizzes: [],
      questions: [],
      activeView: null,
      currentPractice: null,

      setActiveView: (quizId, mode) => set({ activeView: { quizId, mode } }),
      clearActiveView: () => set({ activeView: null }),

      addFolder: (name, parentId) =>
        set((s) => ({
          folders: [...s.folders, { id: `folder-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, name, parentId }],
        })),

      renameFolder: (id, name) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),

      ensureFolderPath: (path) => {
        const parts = path.split('/').map((p) => p.trim()).filter(Boolean);
        let currentParentId: string | null = null;
        for (const part of parts) {
          const state = get();
          let existing = state.folders.find((f) => f.name === part && f.parentId === currentParentId);
          if (!existing) {
            const newFolder: Folder = {
              id: `folder-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
              name: part,
              parentId: currentParentId,
            };
            set((s) => ({ folders: [...s.folders, newFolder] }));
            existing = newFolder;
          }
          currentParentId = existing.id;
        }
        return currentParentId!;
      },

      deleteFolder: (id) => {
        const state = get();
        const folderIdsToDelete = new Set<string>();
        const collect = (pid: string) => {
          folderIdsToDelete.add(pid);
          state.folders.filter((f) => f.parentId === pid).forEach((f) => collect(f.id));
        };
        collect(id);
        const quizIds = state.quizzes.filter((q) => folderIdsToDelete.has(q.folderId)).map((q) => q.id);
        set((s) => ({
          folders: s.folders.filter((f) => !folderIdsToDelete.has(f.id)),
          quizzes: s.quizzes.filter((q) => !folderIdsToDelete.has(q.folderId)),
          questions: s.questions.filter((q) => !quizIds.includes(q.quizId)),
        }));
      },

      addQuiz: (name, folderId) =>
        set((s) => ({
          quizzes: [...s.quizzes, { id: `quiz-${Date.now()}`, name, folderId, questionIds: [] }],
        })),

      renameQuiz: (id, name) =>
        set((s) => ({ quizzes: s.quizzes.map((q) => (q.id === id ? { ...q, name } : q)) })),

      deleteQuiz: (id) =>
        set((s) => ({
          quizzes: s.quizzes.filter((q) => q.id !== id),
          questions: s.questions.filter((q) => q.quizId !== id),
        })),

      addQuestion: (question) => {
        const newId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((s) => ({
          questions: [...s.questions, { ...question, id: newId }],
          quizzes: s.quizzes.map((q) =>
            q.id === question.quizId ? { ...q, questionIds: [...q.questionIds, newId] } : q
          ),
        }));
      },

      updateQuestion: (id, updates) =>
        set((s) => ({
          questions: s.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),

      deleteQuestion: (id) => {
        const state = get();
        const target = state.questions.find((q) => q.id === id);
        if (!target) return;
        set((s) => ({
          questions: s.questions.filter((q) => q.id !== id),
          quizzes: s.quizzes.map((q) =>
            q.id === target.quizId
              ? { ...q, questionIds: (q.questionIds ?? []).filter((qid) => qid !== id) }
              : q
          ),
        }));
      },

      importFromText: (text) => {
        const lines = text.split('\n');
        let currentCategoryPath: string | null = null;
        let currentQuizName: string | null = null;
        let currentQuizId: string | null = null;
        let tempContent = '',
          tempOptions: string[] = [],
          tempAnswer: number[] = [],
          tempAnalysis = '';

        const save = () => {
          if (tempContent && currentQuizId) {
            get().addQuestion({
              quizId: currentQuizId,
              content: tempContent.trim(),
              options: tempOptions,
              correctAnswers: tempAnswer,
              type: tempAnswer.length > 1 ? 'multiple' : 'single',
              analysis: tempAnalysis.trim() || undefined,
            });
          }
          tempContent = '';
          tempOptions = [];
          tempAnswer = [];
          tempAnalysis = '';
        };

        for (const line of lines) {
          const t = line.trim();
          if (!t) continue;
          if (t.startsWith('[分类]')) {
            save();
            currentCategoryPath = t.replace('[分类]', '').trim();
            currentQuizName = null;
            currentQuizId = null;
            continue;
          }
          if (t.startsWith('[题库]')) {
            save();
            currentQuizName = t.replace('[题库]', '').trim();
            const folderId = currentCategoryPath
              ? get().ensureFolderPath(currentCategoryPath)
              : get().ensureFolderPath('未分类题库');
            const state = get();
            let quiz = state.quizzes.find((q) => q.name === currentQuizName && q.folderId === folderId);
            if (!quiz) {
              get().addQuiz(currentQuizName!, folderId);
              quiz = get().quizzes.find((q) => q.name === currentQuizName && q.folderId === folderId)!;
            }
            currentQuizId = quiz.id;
            continue;
          }
          if (t.startsWith('[题目]')) {
            save();
            tempContent = t.replace('[题目]', '').trim();
            continue;
          }
          const optMatch = t.match(/^\[([A-Z])\]\s*(.*)$/i);
          if (optMatch) {
            tempOptions.push(optMatch[2]);
            continue;
          }
          if (t.startsWith('[答案]')) {
            const ans = t.replace('[答案]', '').trim();
            tempAnswer = ans.replace(/,/g, '').split('').map((c) => c.toUpperCase().charCodeAt(0) - 65);
            continue;
          }
          if (t.startsWith('[解析]')) {
            tempAnalysis = t.replace('[解析]', '').trim();
            continue;
          }
        }
        save();
      },

      // ✅ 练习方法
      startPractice: (config) => {
        const state = get();
        const questionIdsSet = new Set<string>();
        config.quizIds.forEach((qid) => {
          const quiz = state.quizzes.find((q) => q.id === qid);
          if (quiz) quiz.questionIds.forEach((id) => questionIdsSet.add(id));
        });
        let questions = Array.from(questionIdsSet)
          .map((id) => state.questions.find((q) => q.id === id))
          .filter(Boolean) as Question[];

        if (questions.length === 0) {
          alert('所选题库中没有题目');
          return;
        }

        if (config.shuffle) {
          for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
          }
        } else {
          // 按题库顺序和题目原始顺序排列
          const ordered: Question[] = [];
          config.quizIds.forEach((qid) => {
            const quiz = state.quizzes.find((q) => q.id === qid);
            if (quiz) {
              quiz.questionIds.forEach((id) => {
                const q = state.questions.find((q) => q.id === id);
                if (q && !ordered.some((existing) => existing.id === q.id)) {
                  ordered.push(q);
                }
              });
            }
          });
          questions = ordered;
        }

        const session: PracticeSession = {
          config,
          questions,
          currentIndex: 0,
          answers: questions.map((q) => ({ questionId: q.id, selectedAnswers: [] })),
          startTime: Date.now(),
        };
        set({ currentPractice: session });
      },

      endPractice: () => {
        set((s) => {
          if (!s.currentPractice) return s;
          const session = s.currentPractice;
          const answers = session.answers.map((ans) => {
            const question = session.questions.find((q) => q.id === ans.questionId);
            if (!question) return ans;
            const correct = arraysEqual(ans.selectedAnswers.slice().sort(), question.correctAnswers.slice().sort());
            return { ...ans, isCorrect: correct };
          });
          return { currentPractice: { ...session, answers, endTime: Date.now() } };
        });
      },

      submitAnswer: (questionId, selectedAnswers) => {
        set((s) => {
          if (!s.currentPractice) return s;
          const answers = s.currentPractice.answers.map((a) =>
            a.questionId === questionId ? { ...a, selectedAnswers } : a
          );
          return { currentPractice: { ...s.currentPractice, answers } };
        });
      },

      goToQuestion: (index) =>
        set((s) => {
          if (!s.currentPractice) return s;
          if (index < 0 || index >= s.currentPractice.questions.length) return s;
          return { currentPractice: { ...s.currentPractice, currentIndex: index } };
        }),

      nextQuestion: () =>
        set((s) => {
          if (!s.currentPractice) return s;
          const next = s.currentPractice.currentIndex + 1;
          if (next >= s.currentPractice.questions.length) return s;
          return { currentPractice: { ...s.currentPractice, currentIndex: next } };
        }),

      prevQuestion: () =>
        set((s) => {
          if (!s.currentPractice) return s;
          const prev = s.currentPractice.currentIndex - 1;
          if (prev < 0) return s;
          return { currentPractice: { ...s.currentPractice, currentIndex: prev } };
        }),
    }),
    {
      name: 'quiz-app-store',
      partialize: (state) => ({
        folders: state.folders,
        quizzes: state.quizzes,
        questions: state.questions,
        // 练习状态不持久化
      }),
      merge: (persistedState: any, currentState: AppState): AppState => {
        const rawQuestions: Question[] = persistedState?.questions || [];
        const seen = new Set<string>();
        const uniqueQuestions = rawQuestions
          .filter((q: Question) => {
            if (seen.has(q.id)) return false;
            seen.add(q.id);
            return true;
          })
          .map((q: Question) => {
            if (!q.id.includes('-', 2)) {
              return { ...q, id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            }
            return q;
          });

        const validQuestionIds = new Set(uniqueQuestions.map((q: Question) => q.id));
        const fixedQuizzes = (persistedState?.quizzes || []).map((quiz: Quiz) => ({
          ...quiz,
          questionIds: (quiz.questionIds || []).filter((qid: string) => validQuestionIds.has(qid)),
        }));

        return {
          ...currentState,
          ...persistedState,
          questions: uniqueQuestions,
          quizzes: fixedQuizzes,
          currentPractice: null, // 确保不保留上次练习状态
        } as AppState;
      },
    }
  )
);

// 辅助函数
function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}