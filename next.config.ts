/** @type {import('next').NextConfig} */
const nextConfig = {
  // 删除 output: 'export'，让 Next.js 使用默认 SSR 模式
  // 删除 images: { unoptimized: true }，Netlify 插件会处理图片优化
}

module.exports = nextConfig