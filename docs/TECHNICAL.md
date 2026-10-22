# AeroScatter 3D 技术细节（v0.2）

更新：2026-10-21。目标是可解释的散射教学与探索工具，而不是已认证的科研反演软件。

## 1. 架构与维护边界

```text
web/mie.js + web/geometry.js + web/app.js
                 ↓ scripts/bundle.mjs
             web/app.bundle.js
                 ↓ scripts/build.mjs
        dist/ 网页 / 根目录 AeroScatter.html
```

- `web/index.html`：界面语义结构；`styles.css`：响应式与明暗外观。
- `mie.js`：唯一数值核心，不访问 DOM；测试直接导入它。
- `geometry.js`：传播方向、散射平面和偏振基。
- `app.js`：控件、参数记忆、Canvas 正交投影、PWA 非阻塞初始化。
- `startup.js`：独立错误捕获；8 秒未画出图时给出诊断，不把脚本故障误称为离线下载。
- `bundle.mjs`：按固定顺序移除三个自有源码的 import/export 并合并进 IIFE。这不是通用打包器；新增模块、动态导入或重名顶层变量时必须调整它。
- `build.mjs`：生成 bundle、复制静态目录、将 CSS/JS/SVG 图标内嵌为单文件。
- 不要手改 `app.bundle.js`、`dist/`、`AeroScatter.html`。它们都应从源码重新生成。
- 无外部运行依赖、无 CDN、无后端计算。Node.js ≥22 仅用于开发、测试、本地 HTTP 服务和构建。

## 2. 复折射率与符号约定

界面与 JS 内部统一采用：

$$m=n+i\kappa,\quad \kappa\ge0,\quad E\propto\exp(ikr-i\omega t).$$

正虚部对应沿传播方向衰减。向外传播径向函数为第一类球 Hankel 函数。代码取 `χ_l = −x y_l(x)`，因此 `ξ_l = ψ_l − iχ_l`。

独立参考 miepython 2.5.5 使用 `n−iκ`。`scripts/reference-absorbing.py` 显式传入 `complex(n, -kappa)`。两种约定下强度、效率、线偏振度一致，但**不能不经约定转换就逐项比较复振幅的虚部或相位**。

来源：[miepython 符号说明](https://miepython.readthedocs.io/en/v2.5.2/01_basics.html)、[正虚部时间约定说明](https://usask-arg.github.io/scatrs/theory/conventions.html)。κ 无量纲，不是吸收系数的长度倒数单位，也不是吸收率。

支持域：`0.05 ≤ x ≤ 16`、`1.01 ≤ n ≤ 2`、`0 ≤ κ ≤ 1`。负 κ、非有限值与越界值抛出 RangeError，不静默翻转。界面 κ 的步长为 0.001，默认 0。旧 localStorage 缺少 κ 时回落到 0。

## 3. Mie 系数算法

`coefficients(x, nReal=1.5, kappa=0)` 返回 `{n,a:[re,im],b:[re,im]}` 数组，兼容旧的两参数调用。

级数截断与导数起点：

$$L=\lceil x+4\sqrt[3]{x}+2\rceil,\quad N=\lceil\max(L,|m|x)\rceil+35.$$

复对数导数从 `D_N=0` 递推：

$$D_{l-1}(z)=\frac{l}{z}-\frac{1}{D_l(z)+l/z},\quad z=mx.$$

外部 ψ/χ 在实数 x 上向上递推。定义 `A_l=D_l/m+l/x`、`B_l=mD_l+l/x`，再计算：

$$a_l=\frac{A_l\psi_l-\psi_{l-1}}{A_l\xi_l-\xi_{l-1}},\quad b_l=\frac{B_l\psi_l-\psi_{l-1}}{B_l\xi_l-\xi_{l-1}}.$$

v0.2 的关键不是把实数 m 换个显示字符串，而是将导数递推、乘除法和分子分母全部改成复数运算。κ=0 仍走同一条计算链，并保留 v0.1 参考回归。

有限域采用双精度、固定截断余量，没有提供全连续参数域误差上界。禁止仅扩大输入范围就宣称支持更大粒子或更强吸收。

## 4. 角分布、偏振与效率

`intensity(coeff, mu)` 用标准 π/τ 角函数递推累加 S₁/S₂，`mu=cosθ`：

$$I_\perp=|S_1|^2,\quad I_\parallel=|S_2|^2,\quad I=(I_\perp+I_\parallel)/2.$$

这里分量是共同尺度量；非偏振入射下实际各分量共同含 1/2，在占比和偏振度中抵消。未引入距离、入射照度与探测器响应，不输出实际辐亮度。

$$P_s=\frac{I_\perp-I_\parallel}{I_\perp+I_\parallel},\quad \mathrm{DoLP}=|P_s|.$$

P_s 的符号只表示垂直 / 平行占优，不直接宣称通用 Stokes Q 的符号。即便某分量近零，电场轴仍标示基方向，不代表该分量有有限振幅。

$$Q_\mathrm{sca}=\frac{2}{x^2}\sum_l(2l+1)(|a_l|^2+|b_l|^2).$$

$$Q_\mathrm{ext}=\frac{2}{x^2}\sum_l(2l+1)\operatorname{Re}(a_l+b_l),\quad Q_\mathrm{abs}=Q_\mathrm{ext}-Q_\mathrm{sca}.$$

$$\mathrm{SSA}=Q_\mathrm{sca}/Q_\mathrm{ext},\quad C_j=\pi r^2Q_j.$$

Q 是无量纲截面效率，允许超过 1，不是能量百分比。`model()` 返回 x/coeff/samples/peak/qsca/qext/qabs/ssa；当 `|Qext−Qsca| < 1e−12 max(1,Qext)` 时把显示用 Qabs 置零以消除相消噪声，不是把任意负吸收裁成零。

## 5. 三维几何与显示

入射方向固定为 +X。散射方向、面内偏振基、法向偏振基分别为：

$$\hat s=(\cos\theta,\sin\theta\cos\phi,\sin\theta\sin\phi).$$

$$\hat e_\parallel=(-\sin\theta,\cos\theta\cos\phi,\cos\theta\sin\phi),\quad \hat e_\perp=(0,-\sin\phi,\cos\phi).$$

三者两两正交。改变 φ 旋转散射平面与电场基；对于非偏振入射的均匀球体，同一 θ 的总强度不依赖 φ。0°/180° 平面不唯一，使用当前 φ 的极限基。拖动或方向键只改变相机，不改变物理参数。

网格来自 721 个等 θ 样本，以 `2.7 sqrt(I/Imax)` 为三维径向长度；Canvas 2D 用正交投影画三维几何，不依赖 WebGL。它不是粒子外形、光子路径或绝对能量等值面。图形逐组归一化；看吸收影响时同时看 Qsca/Qabs/SSA，不要比较归一化图的总体尺寸。固定长度的传播箭头与粒子标记也不是同一物理尺度。

## 6. 启动、缓存和单文件

- `AeroScatter.html`：内嵌程序与样式，适合从聊天或 Finder 直接用浏览器打开；无需 Node。它不是安装包。
- `npm start` / macOS `.command`：启动本机 HTTP 服务，重新生成 bundle；适合安装 PWA 与开发。源码或 HTML 改动后需刷新。
- `npm run build`：更新 `dist/` 与独立单文件；仅运行 `npm start` 不会重新生成根目录单文件。
- v0.2 脚本/样式带 `?v=0.2.0`，避免旧 Service Worker 给新 HTML 提供旧脚本。新版本应同步修改 index 资源版本和 sw 预缓存 URL、缓存名。
- 未使用强制 skipWaiting。已有旧页面可能继续运行旧 worker；关闭该站点所有窗口后重新进入以完成切换。不能为了刷新单个项目清空整个浏览器数据。
- 离线准备失败或挂起不应阻止三维图；有独立错误及超时提示。旧版“准备中”故障的具体用户 URL 当时未获得，不能宣称已完整复现其浏览器环境。

## 7. 验证与后续开发

74 项 Node 测试；15 组无吸收 +45 组吸收参考（miepython 2.5.5），共 990 个参考量，比较阈值 `1e−5 |reference| + 1e−18`。这个阈值不是全域精度保证。另有 144 组 UI 参数组合检查能量闭合、吸收非负、SSA 有界；保留瑞利极限、几何正交、启动与离线单测。

独立参考再生成只输出 stdout，不能为“通过测试”直接覆盖 fixture。Python 仅用于可选基准复核，网页运行和 Node 测试无需 Python。

改动建议：先读 `PROJECT_STATE.md`，再查本文，修改源码，运行 `npm test && npm run build`，检查三维交互和单文件资源，更新验证记录与日志。原 v0.2 未发布；v0.3 已获发布授权，无原生安装包。

# v0.3 旋转椭球补充（2026-10-22）

q=c/a，r³=a²c，a=r/q^(1/3)，c=rq^(2/3)。对称轴固定 Z，入射 X，等权非相干入射电场 Y/Z。非球体要求 |m|k₀max(a,c)≤0.3；这只是使用门槛，不是误差上界。q=1 切回完整球体 Mie，跨模型比较须考虑近似误差。

采用体积/(4π) 极化率约定：α₀ⱼ=(r³/3)(m²−1)/[1+Lⱼ(m²−1)]；αⱼ=α₀ⱼ/[1−i(2/3)k₀³α₀ⱼ]。Lz 为均匀旋转椭球去极化因子，Lt=(1−Lz)/2；近球极限使用级数避免消减误差。未包含动态去极化和高阶多极。

Qsca=(8π/3)k₀⁴ mean(|αt|²,|αz|²)/(πr²)，Qext=4πk₀ mean(Im αt,Im αz)/(πr²)，Qabs=Qext−Qsca。角强度通过两入射电场诱导偶极到散射基的投影求和；完整实相干矩阵 J 给出 DoLP=sqrt((Jpp−Jqq)²+4Jpq²)/(Jpp+Jqq)。phi 改变强度及偏振，前后向也不一定无偏振。强度使用与球形瑞利极限一致的无量纲 k₀⁶|α|² 尺度。

测试核对 Lz 的独立数值积分、球形瑞利极限、角积分与总截面、体积和能量守恒及 UI 清空；未与 T-matrix/DDA 的有限尺寸解作独立比较，不能用于已保证精度的非球形科研反演。上方原 v0.2 内容仅定义球体分支。
