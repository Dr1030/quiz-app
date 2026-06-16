// lib/parser.ts

export interface ParsedQuestion {
  question: string;
  options: Record<string, string>; // 例如: { "A": "处理副作用", "B": "管理组件状态" }
  correctOptions: string[];        // 例如: ["B"] 或 ["A", "C"]
  explanation: string;
  categoryPath?: string;           // 解析出的文件夹路径，例如 "前端/React基础"
}

/**
 * 将固定格式的文本解析为结构化对象
 */
export function parseQuestionText(text: string): ParsedQuestion | null {
  try {
    // 1. 初始化结果对象
    const result: ParsedQuestion = {
      question: '',
      options: {},
      correctOptions: [],
      explanation: '',
      categoryPath: undefined,
    };

    // 2. 按行分割文本，并去除首尾空白
    const lines = text.split('\n').map((line) => line.trim());

    // 3. 定义正则表达式 (不区分大小写 /i)
    const regex = {
      question: /^\[题目\]\s*(.+)/i,
      option: /^\[([A-Z])\]\s*(.+)/i, // 匹配 [A], [B] 等
      answer: /^\[答案\]\s*(.+)/i,
      analysis: /^\[解析\]\s*(.+)/i,
      category: /^\[分类\]\s*(.+)/i,
    };

    let currentOptionKey = '';

    // 4. 遍历每一行进行匹配
    for (const line of lines) {
      if (!line) continue; // 跳过空行

      // 匹配题目
      const qMatch = line.match(regex.question);
      if (qMatch) {
        result.question = qMatch[1];
        continue;
      }

      // 匹配选项
      const oMatch = line.match(regex.option);
      if (oMatch) {
        const key = oMatch[1].toUpperCase();
        const value = oMatch[2];
        result.options[key] = value;
        currentOptionKey = key; // 记录当前正在处理的选项键，以备后续可能的多行选项（虽然目前格式是一行一个）
        continue;
      }

      // 匹配答案
      const aMatch = line.match(regex.answer);
      if (aMatch) {
        // 处理多选情况：支持 "AB", "A,B", "A, B" 等格式
        const rawAnswer = aMatch[1];
        // 移除逗号、空格，然后拆分为字符数组
        result.correctOptions = rawAnswer
          .replace(/[,，\s]/g, '') // 全局替换中英文逗号和空格
          .split('')
          .filter((char) => /[A-Z]/i.test(char)) // 只保留字母
          .map((char) => char.toUpperCase());
        continue;
      }

      // 匹配解析
      const eMatch = line.match(regex.analysis);
      if (eMatch) {
        result.explanation = eMatch[1];
        continue;
      }

      // 匹配分类/文件夹路径
      const cMatch = line.match(regex.category);
      if (cMatch) {
        result.categoryPath = cMatch[1];
        continue;
      }
    }

    // 5. 校验：如果没有题目内容，视为解析失败
    if (!result.question) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('解析题目出错:', error);
    return null;
  }
}