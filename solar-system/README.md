# 3D 太阳系演示（Web）

基于 Three.js 的太阳系演示，包含太阳、八大行星（简化比例）、地月系统、轨道环、标签与控制面板。

## 运行

无需构建，直接用浏览器打开 `index.html` 即可（建议使用 Chrome/Edge/Firefox，开启硬件加速）。

如需本地服务：

```bash
# 进入项目目录
cd solar-system
# Python 简易服务器（任选其一）
python3 -m http.server 8080
# 或者
python -m SimpleHTTPServer 8080
```

然后访问 `http://localhost:8080`。

## 控制
- 时间倍率：调节公转/自转速度
- 显示轨道：开关行星轨道
- 显示标签：开关行星名称
- 聚焦天体：相机目标快速对准某个星体
- 自动旋转视角：绕目标缓慢旋转

说明：场景为演示用途，尺寸与速度未按真实比例。