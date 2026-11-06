# skyrocks · DSH 插件

三个给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）用的小插件：
两个把余额 / 额度常驻在**对话输入框下方**，一个把「切模型」做成**模型自己可调用的工具**。

| 插件 | 做什么 | 形态 |
| --- | --- | --- |
| [dsh-deepseek-cost](https://github.com/skyrocks/dsh-deepseek-cost) | DeepSeek 余额 · 本轮 / 今日 / 本周 / 本月 / 累计花费 | 输入框下方 dock |
| [dsh-go-quota](https://github.com/skyrocks/dsh-go-quota) | OpenCode GO 套餐的 5 小时 / 周 / 月三窗口 | 输入框下方 dock |
| [dsh-model-switcher](https://github.com/skyrocks/dsh-model-switcher) | `find_models` / `switch_model` 两个工具，让模型在对话里自己查、自己切模型 | 无界面（Host 工具） |

<p align="center">
  <img src="assets/deepseek-cost-dock.png" alt="输入框下方的 DeepSeek 余额与花费" width="720">
</p>

<p align="center">
  <img src="assets/go-quota-dock.png" alt="输入框下方的 GO 用量条" width="720">
</p>

> 截图为界面示意图，实际样式跟随 DSH 主题（明 / 暗）。

## 安装

在 DSH 桌面端：设置 →「插件」→「添加插件」，粘贴下面的地址；或者直接用命令行：

```sh
# DeepSeek 余额与花费（国内推荐，CDN 直下）
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-deepseek-cost-0.2.3.tgz"

# OpenCode GO 用量
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-go-quota-0.1.9.tgz"

# 模型切换工具
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-model-switcher-0.2.1.tgz"

# 或者跟随 GitHub 默认分支
dsh plugin --profile desktop add github:skyrocks/dsh-deepseek-cost
dsh plugin --profile desktop add github:skyrocks/dsh-go-quota
dsh plugin --profile desktop add github:skyrocks/dsh-model-switcher
```

装完**完全退出 DSH 再打开**（Host 插件只在启动时加载）。`dsh web` 用户把
`--profile desktop` 换成 `--profile web`。

## 一键索引（可选）

DSH 的实验性插件市场支持自定义索引。添加这个地址，就能在 Discover 里浏览并安装上面三个插件：

```
https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/index.json   # 国内推荐
https://raw.githubusercontent.com/skyrocks/dsh-plugins/main/index.json
```

需要先启用实验性 bundle `@deepseek-ai/dsh-experimental-plugin-market-bundle`
（设置 →「插件」里启用），然后到 Discover 页添加索引地址。

## 关于模型切换工具

它和另外两个不一样：**没有界面**，手动切模型继续用内置的 `/model`。它注册两个工具给模型
调用——`find_models` 读当前会话真正能选到的模型，`switch_model` 精确切换。同一模型有多个
版本时（比如 `glm-5.3` / `glm-5.3-flash` / `glm-5.2`），它会把候选列出来让你选，不替你猜。

所以你的用法是在对话里说：

```
换到 glm
用最快的那个
切到 deepseek 推理
```

要求 DSH `>= 0.2.1-rc.3`（更早的版本用 `apiProxy.sessions` 暴露模型目录，该接口已被移除）。

## 为什么值得装

- **不用切页面**：余额、本轮花费、GO 三窗口都在输入框下方，悬浮看明细，点击立即刷新。
- **只读你已经在 DSH 里配置的 Key**：不读 `auth.json`、不扫描无关环境变量，Key 不进浏览器。
- **零运行时依赖**：纯 ESM + 浏览器 bundle，没有原生模块，目录直装也不缺包。
- **不干扰其它模型**：两个 dock 在当前会话不是对应路由时整条自动隐藏。
- **数据口径清楚**：余额、累计、日 / 周 / 月直接读官网接口；只有「本轮」是按官方价目表本地估算。
- **切模型不靠猜**：候选来自 DSH 自己的目录，多版本一律列出待选。

## 兼容性

| 插件 | DSH |
| --- | --- |
| dsh-deepseek-cost | `>= 0.2.1-rc.2 < 0.3.0` |
| dsh-go-quota | `>= 0.2.1-rc.2 < 0.3.0` |
| dsh-model-switcher | `>= 0.2.1-rc.3 < 0.3.0` |

Node `>= 18`（桌面版内置 Node 24）。macOS 已验证；Windows / Linux 预期可用。

## 隐私

- 凭据只从当前 DSH profile 的配置读取，只在 Host 进程里用于请求官方接口。
- 不发送遥测，不写第三方服务。
- 三个插件都不修改会话内容；前两个只读用量与账单元数据，第三个只调 DSH 本来的模型目录与选择接口。

## License

MIT
