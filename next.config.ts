/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',          // 导出纯静态文件
  images: { unoptimized: true }, // 禁用图片优化（静态导出必须）
}

module.exports = nextConfig