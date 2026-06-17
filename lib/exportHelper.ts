// lib/exportHelper.ts
import { useAppStore } from '@/lib/store';
import type { Question } from '@/lib/types';

/**
 * 根据题库 ID 生成自定义格式的导出文本
 */
export function generateQuizExportText(quizId: string): string {
  const store = useAppStore.getState();
  const quiz = store.quizzes.find((q) => q.id === quizId);
  if (!quiz) return '';

  // 获取该题库的所有题目，并按照原始顺序排列（questionIds 中的顺序）
  const questions: Question[] = [];
  quiz.questionIds.forEach((qid) => {
    const q = store.questions.find((q) => q.id === qid);
    if (q) questions.push(q);
  });

  if (questions.length === 0) return '';

  // 构建分类路径（递归向上查找文件夹名称，用 / 连接）
  let categoryPath = '';
  if (quiz.folderId) {
    const folderNames: string[] = [];
    let currentFolderId: string | null = quiz.folderId;
    while (currentFolderId) {
      const folder = store.folders.find((f) => f.id === currentFolderId);
      if (folder) {
        folderNames.unshift(folder.name);
        currentFolderId = folder.parentId;
      } else {
        break;
      }
    }
    categoryPath = folderNames.join(' / ');
  } else {
    categoryPath = '未分类';
  }

  const lines: string[] = [];

  // [分类] 行
  lines.push(`[分类] ${categoryPath}`);
  // [题库] 行
  lines.push(`[题库] ${quiz.name}`);
  lines.push(''); // 空行

  // 逐题输出
  questions.forEach((q) => {
    lines.push(`[题目] ${q.content}`);

    // 选项：按原始索引顺序输出
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        lines.push(`[${letter}] ${opt}`);
      });
    }

    // 答案：字母按正确答案索引排序后连接
    const answerLetters = q.correctAnswers
      .slice()
      .sort((a, b) => a - b)
      .map((idx) => String.fromCharCode(65 + idx))
      .join('');
    lines.push(`[答案] ${answerLetters}`);

    // 解析（可选）
    if (q.analysis) {
      lines.push(`[解析] ${q.analysis}`);
    }

    lines.push(''); // 题目之间空行
  });

  return lines.join('\n').trimEnd();
}