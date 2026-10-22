# AeroScatter 3D 整理与开发日志

日期：2026-10-21（Asia/Shanghai）。记录按工作阶段整理；早期阶段依据已有源码、构建产物与 VALIDATION.md 回溯，不虚构逐分钟时间或 Git 提交。

## 目标与授权范围

把气溶胶散射三维演示整理为可开源的小项目；修复打开问题；新增折射率虚部；整理技术与跨聊天状态。所有改动仅在 `/Users/lemon/Documents/ResearchCode/projects/aeroscatter-3d`。未创建远程仓库、提交、推送、公开部署或安装原生 App。

## 阶段记录

| 阶段 | 有效操作 | 结果与证据 |
| --- | --- | --- |
| 原型 | 展示强度网格、两种偏振分量；按用户要求保留散射角，散射平面改为可选 | `web/app.js`、`web/geometry.js` |
| v0.1 网页化 | 数值与界面拆分，加入方位角、参数记忆、说明、PWA、macOS 启动入口、MIT 与 Pages 工作流 | `README.md`、`scripts/`、`.github/workflows/pages.yml` |
| 无吸收基准 | 使用本机已有 py312/miepython 2.5.5 固化独立数值；保留瑞利、几何、角积分等测试 | `tests/miepython-reference.json`、`tests/mie.test.mjs` |
| 打开故障修复 | 用户从聊天框选择 Chrome 后看不到图；实际 URL 未获取，未认定唯一根因。改为普通脚本 bundle，加入启动错误/超时提示 | `web/startup.js`、`scripts/bundle.mjs` |
| 单文件交付 | 构建 CSS/JS/SVG 全内嵌 `AeroScatter.html`，不再要求用户先开本地服务 | `scripts/build.mjs`；启动回归后共 26 项测试 |
| v0.2 复折射率 | 复数对数导数递推及系数分式，κ 控件 0–1、步长 0.001，默认 0；旧状态缺少 κ 时回落为 0 | `web/mie.js`、`web/app.js`、`web/index.html` |
| 吸收读数 | 输出 Qsca、Qext、Qabs、SSA，保留逐组归一化强度网格，明确效率非百分比 | `model()`、网页技术说明 |
| 独立吸收基准 | 新增 45 组参考，显式转换 miepython 负虚部约定；原始无吸收 fixture 不覆盖 | `scripts/reference-absorbing.py`、`tests/absorbing-reference.json` |
| 数值回归 | 74 项通过，990 个独立参考量；144 组吸收参数组合的能量、被动性与 SSA 约束 | `tests/absorbing.test.mjs`、`reports/verification-v0.2.json` |
| 实际 UI 检查 | κ 从 0 改为 0.1，效率与偏振联动；窄屏 320 px 无溢出；控制台无告警；恢复默认参数 | `VALIDATION.md`、`preview-v02.jpg` |
| 旧缓存混用修复 | 实际遇到新 HTML 载入旧 bundle 导致 κ 无读数；脚本与样式加版本查询参数，更新 worker 预缓存 | `web/index.html`、`web/sw.js` |
| 交接整理 | 维护当前状态、技术算法、证据入口、可粘贴提示词；历史记录不冒充当前能力 | `PROJECT_STATE.md`、`docs/TECHNICAL.md`、`HANDOFF.md` |

## 关键决定

1. 界面/内部用 `m=n+iκ`，`exp(−iωt)`，正 κ 表示吸收；miepython 基准用 `n−iκ`，转换写在脚本里。
2. 吸收是系数算法变化，不只是滑块或显示文字；κ=0 保留旧数值回归。
3. 图形半径正比于强度平方根，逐组归一化；新增效率读数避免把归一化图当作绝对散射量。
4. 单文件用于便捷打开；PWA 安装仍须 localhost/HTTPS，二者不是同一入口。
5. 不重写生成文件，不自动覆盖独立参考，不推断气溶胶来源，不自动发布。

## 验证摘要

- `npm test`：74/74；`npm run build`：生成 `dist/` 和 `AeroScatter.html`。
- 误差阈值沿用相对 1e−5 + 绝对 1e−18；不等于全域误差保证。
- κ=0.1 示例：Qsca=0.1529、Qabs=0.2431、Qext=0.3960、SSA=0.3862（默认其他参数）。
- `preview.jpg` 与 `preview-fixed.jpg` 为历史截图，`preview-v02.jpg` 才是吸收版截图。
- 基准再生成使用现有 py312 环境；未安装新依赖。用户浏览与 Node 测试无需 Python。

## 限制与未做事项

未做非球形、粒径分布、多次散射、偏振入射、实际观测反演、原生 .app/.exe、GitHub 发布。PWA 的跨浏览器实际安装和单文件 v0.2 的 Chrome/Safari file:// 实机检查仍待完成。浏览器工具拒绝 file://，未绕过；用户曾确认此前单文件打开修复可用，但这不替代 v0.2 实机记录。

## 后续单一建议

在用户常用 Chrome 中打开更新后的 `AeroScatter.html`，改变 κ 并确认三维图与效率均联动，再按用户选择决定下一项功能。扩展前先明确授权，勿自动开展所有未来方向。
