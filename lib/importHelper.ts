// lib/importHelper.ts
import { useAppStore } from './store';

export function handleImportQuestions(text: string) {
  if (!text || !text.trim()) {
    alert('❌ 文本为空，无法导入');
    return;
  }
  try {
    useAppStore.getState().importFromText(text);
    alert('✅ 导入成功！');
  } catch (error) {
    console.error('导入失败:', error);
    alert('❌ 导入错误，请检查文本格式');
  }
}