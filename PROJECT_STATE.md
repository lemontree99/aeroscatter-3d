# AeroScatter 3D Project State

## 当前覆盖记录：2026-10-22，v0.3.0

用户已明确授权加入长短轴并发布 GitHub，下面 v0.2 的“不发布”是历史决策，已被本次授权替代。
已加入 c/a=0.25–4 的固定 Z 轴旋转椭球；c/a=1 保留 Mie，否则为带辐射修正的小粒子电偶极近似。等体积半径 r³=a²c；要求 |m|k₀max(a,c)≤0.3，超限清空结果。不可称作通用非球形 Mie 解或任意形状解。
80 项测试通过；球体 990 个独立参考量保留。椭球只完成解析/积分一致性与物理约束测试，未做有限尺寸独立解精度验证。
公开仓库已创建并推送：https://github.com/lemontree99/aeroscatter-3d 。Pages 已配置为 Actions 部署，地址：https://lemontree99.github.io/aeroscatter-3d/ 。后续修改 main 会自动测试、构建并部署。浏览器已确认椭球示例绘图；移动实机和 PWA 安装仍未测试。

- 最近更新：2026-10-21（Asia/Shanghai）
- 当前版本：v0.2.0；本地交付，尚未公开发布。
- 工作阶段：集成开发与有限域验证已完成本轮；未进行正式 TR 阶段评审。
- 项目根目录：`/Users/lemon/Documents/ResearchCode/projects/aeroscatter-3d`

## 已确认事实

- 运行入口为自包含 [AeroScatter.html](AeroScatter.html)，PWA/开发入口为 `npm start` — [README](README.md)。
- 支持均匀可吸收球体、非偏振入射、单次散射；n=1.01–2、κ=0–1、x=0.05–16 — [数值核心](web/mie.js)。
- 可调 r/λ/n/κ/θ/φ；散射平面默认关闭，拖动只旋转相机 — [界面](web/app.js)、[几何](web/geometry.js)。
- 增加 Qsca/Qabs/Qext/SSA；κ=0.1 默认其他参数时 SSA≈0.3862 — [验证记录](VALIDATION.md)。
- 74 项测试通过，含 990 个 miepython 2.5.5 参考量与 144 组参数组合约束 — [验证清单](reports/verification-v0.2.json)。
- 网页实际浏览器检查与 320 px 布局通过；吸收版截图使用 κ=0.1，默认值仍为 0 — [截图](preview-v02.jpg)。
- 旧缓存混用问题已加版本资源路径处理；单文件不依赖 worker — [技术说明](docs/TECHNICAL.md)。

## 锁定决策

- 内部/界面 m=n+iκ、exp(−iωt)，正 κ 为吸收；miepython 基准显式用 n−iκ — [符号细节](docs/TECHNICAL.md)。
- 网格半径 ∝ √相对强度；跨参数不比较归一化图总体大小，不把效率当百分比 — [README](README.md)。
- 零外部运行依赖，源码模块→普通 bundle→网页/单文件；不手改生成文件 — [构建链](scripts/build.mjs)。
- 不静默翻转负 κ，不自动覆盖独立基准，不将参数解释为成分/来源 — [吸收测试](tests/absorbing.test.mjs)。
- 本轮不创建远程仓库、不提交/推送、不发布或安装原生程序 — [整理日志](logs/2026-10-21-development.md)。

## 活动任务

| 任务 | 当前线程 | 状态 | 产物/入口 | 下一步 |
| --- | --- | --- | --- | --- |
| 虚部与验证 | 当前本地交互线程 | 已完成 | [技术细节](docs/TECHNICAL.md) | 保留数值回归 |
| 日志与跨窗口交接 | 当前本地交互线程 | 已完成 | [HANDOFF](HANDOFF.md)、[日志](logs/2026-10-21-development.md) | 新窗口先读取本文件 |

## 待验证 / 非阻塞限制

- v0.2 单文件在用户 Chrome/Safari 中直接打开后的实机确认；浏览器工具不允许 file://。
- PWA 实际安装、iOS/Android 实机、在线 Pages 部署尚未验证。
- 未做全连续参数域精度上界、非球形、粒径分布或多次散射；不得超范围宣传。
- 历史截图与 v0.1 记录只供回溯，不代表当前吸收版能力。

## 从这里继续

1. 先在用户常用 Chrome 打开更新后的单文件，核对 κ 改变时 Qabs/SSA 联动，然后根据用户新的明确要求选择下一项功能；不要自动发布或并行扩展。
