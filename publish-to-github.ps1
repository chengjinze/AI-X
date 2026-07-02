# ============================================
# AI-X GitHub 开源发布脚本 v3 (最终版)
# ============================================
Set-Location "C:\Users\musk6\Desktop\AI-X"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI-X 开源发布 v3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- 1. 清理备份文件 ----
Write-Host "[1/4] 清理临时文件 ..." -ForegroundColor Yellow
Remove-Item .env.local.backup -Force -ErrorAction SilentlyContinue
Remove-Item .codex-preview.log -Force -ErrorAction SilentlyContinue

# ---- 2. 重建仓库 ----
Write-Host "[2/4] 重建 git 仓库 ..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
git init
git config user.name "jinze"
git config user.email "chengjinze36@gmail.com"

# ---- 3. 暂存并提交 (.env*.local 已在 .gitignore 中排除) ----
Write-Host "[3/4] 暂存并提交 ..." -ForegroundColor Yellow
git add -A
git commit -m "🎉 开源发布: AI-X 企业级 AI 战略咨询 Agent 系统

- Next.js 14 + TypeScript 单入口 AI 战略工作台
- 多 AI Provider: OpenAI / Anthropic / Gemini / DeepSeek / Ollama
- 聚合搜索: Tavily + Serper + Bocha
- 递归需求澄清 + 深度研究模式 + 战略分析
- Supabase 持久化 + 会话管理"

# ---- 4. 推送 ----
Write-Host "[4/4] 推送到 GitHub ..." -ForegroundColor Yellow
git remote add origin https://github.com/chengjinze/AI-X.git 2>$null
git branch -M main
git push -u origin main --force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  发布成功! https://github.com/chengjinze/AI-X" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
