# skyrocks · DSH plugins

Two small plugins for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`),
both docked under the composer so you can read quota and spend without leaving the chat.

| Plugin | What it shows | Source |
| --- | --- | --- |
| [dsh-deepseek-cost](https://github.com/skyrocks/dsh-deepseek-cost) | DeepSeek balance · current-turn / day / week / month / lifetime spend | DeepSeek platform account |
| [dsh-go-quota](https://github.com/skyrocks/dsh-go-quota) | OpenCode GO 5-hour / weekly / monthly windows | GO account usage |

<p align="center">
  <img src="assets/deepseek-cost-dock.png" alt="DeepSeek balance and spend dock" width="720">
</p>

## Install

In the desktop app: Settings → Plugins → Add plugin, paste one of the GitHub specs below. Or use the CLI:

```sh
dsh plugin --profile desktop add github:skyrocks/dsh-deepseek-cost
dsh plugin --profile desktop add github:skyrocks/dsh-go-quota
```

Or track the GitHub default branch:

```sh
dsh plugin --profile desktop add github:skyrocks/dsh-deepseek-cost
dsh plugin --profile desktop add github:skyrocks/dsh-go-quota
```

Fully quit and relaunch DSH afterwards (host plugins load at startup). For `dsh web`, use
`--profile web`.

## Plugin index

Add this URL in the experimental plugin market's Discover tab to browse and install both:

```
https://raw.githubusercontent.com/skyrocks/dsh-plugins/main/index.json
```

Requires the `@deepseek-ai/dsh-experimental-plugin-market-bundle` bundle to be enabled.

## Why

- Quota and spend live under the composer — no settings page, no dashboard.
- Reads only the key already configured in your DSH profile; never sent to the browser.
- Zero runtime dependencies, no native modules.
- Hides itself when the session is not on the matching provider.

## Compatibility

DSH `>= 0.2.1-rc.2 < 0.3.0`, Node `>= 18`. Verified on macOS; Windows and Linux expected
to work.

## License

MIT
