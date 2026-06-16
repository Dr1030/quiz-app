// app/quiz/[id]/page.tsx
export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  return (
    <div style={{ padding: 40 }}>
      <h1>✅ 动态路由测试成功！</h1>
      <p>当前题库 ID: <strong>{id}</strong></p>
      <a href="/">← 返回首页</a>
    </div>
  );
}