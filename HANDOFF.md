# 给下一个聊天窗口的交接

2026-10-22 更新：当前 v0.3.0，已获用户授权加入长短轴并 GitHub 上线。先读取 PROJECT_STATE.md 的当前覆盖记录。新增 web/spheroid.js，c/a=0.25–4、Z 轴固定、等体积半径；仅小粒子电偶极近似，超限拒绝计算，球体仍用 Mie。80 项测试通过。下方 v0.2 交接为历史材料，其中“不发布”不再适用于本轮。

将下面这段直接粘贴到新窗口即可：

```text
继续开发我的 AeroScatter 3D 项目。
项目目录：/Users/lemon/Documents/ResearchCode/projects/aeroscatter-3d
请先读取 PROJECT_STATE.md，再读 docs/TECHNICAL.md、VALIDATION.md 和 logs/2026-10-21-development.md。
当前 v0.2 支持可吸收均匀球体的 Mie 散射：r、λ、n、κ、θ、φ；界面/内部约定 m=n+iκ，κ≥0 为吸收，miepython 基准显式转换为 n−iκ。
保留三维强度与偏振分量；散射平面默认关闭；有 Qsca/Qabs/Qext/SSA。网格逐组归一化，不是绝对散射能力。
当前 74 项测试通过、990 个独立参考量；完整证据见 reports/verification-v0.2.json。这是有限域验证，不是全域科研精度保证。
直接打开 AeroScatter.html 看图；npm start 用于开发/PWA；修改 web/ 源码后运行 npm test && npm run build，不手改生成文件。
注意旧 Service Worker 混用旧脚本问题：资源版本和预缓存路径须同步更新；保留单文件入口及启动错误提示，不清空整个浏览器缓存。
先按我这次的新要求工作；未获授权不要创建/推送 GitHub 仓库、发布网站或自动扩展所有未来方向。当前建议先确认 v0.2 单文件在我的 Chrome 中 κ 联动正常。
```

## 文件入口

- [精简状态](PROJECT_STATE.md)：当前事实、范围、限制、单一下一步。
- [技术细节](docs/TECHNICAL.md)：复数算法、符号、物理量、几何与缓存。
- [整理日志](logs/2026-10-21-development.md)：从原型到 v0.2 的有效操作与决定。
- [验证记录](VALIDATION.md)：历史和当前检查，明确哪些未实测。
- [数值基准](tests/absorbing-reference.json)：独立吸收参考，不应为通过测试而覆盖。

## 可考虑但尚未授权的扩展

细化弱吸收输入、导出参数/图像/角分布、粒径分布积分、英文界面或原生打包。每次只根据用户指定的方向推进；涉及物理范围扩展时先补独立参考与测试。
