# skyrocks · DSH plugins

Four small plugins for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`):
two dock balance and quota readouts under the composer, one labels every GO model with its monthly
limit in the model picker, and one turns "switch model" into tools the model itself can call.

| Plugin | What it does | Shape |
| --- | --- | --- |
| [dsh-deepseek-cost](https://github.com/skyrocks/dsh-deepseek-cost) | DeepSeek balance · current-turn / day / week / month / lifetime spend | dock under the composer |
| [dsh-go-quota](https://github.com/skyrocks/dsh-go-quota) | OpenCode GO 5-hour / weekly / monthly windows | dock under the composer |
| [dsh-go-model-limits](https://github.com/skyrocks/dsh-go-model-limits) | Official monthly limit for each OpenCode GO model, colour-coded by size | model menu tag |
| [dsh-model-switcher](https://github.com/skyrocks/dsh-model-switcher) | `find_models` / `switch_model` tools, so the model can look up and switch models in chat | no UI (host tools) |

<p align="center">
  <img src="assets/deepseek-cost-dock.png" alt="DeepSeek balance and spend dock" width="720">
</p>

<p align="center">
  <img src="assets/go-quota-dock.png" alt="OpenCode GO quota dock" width="720">
</p>

<p align="center">
  <img src="assets/go-model-limits-menu.png" alt="Monthly limit tags in the model picker" width="720">
</p>

## Install

In the desktop app: Settings → Plugins → Add plugin, paste one of the specs below. Or use the CLI:

```sh
# DeepSeek balance & spend (CDN, reliable behind firewalls)
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-deepseek-cost-0.2.3.tgz"

# OpenCode GO quota
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-go-quota-0.1.9.tgz"

# OpenCode GO model monthly limits
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-go-model-limits-0.1.0.tgz"

# Model switcher tools
dsh plugin --profile desktop add "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/dist/skyrocks-dsh-model-switcher-0.2.1.tgz"

# Or track the GitHub default branch
dsh plugin --profile desktop add github:skyrocks/dsh-deepseek-cost
dsh plugin --profile desktop add github:skyrocks/dsh-go-quota
dsh plugin --profile desktop add github:skyrocks/dsh-go-model-limits
dsh plugin --profile desktop add github:skyrocks/dsh-model-switcher
```

Fully quit and relaunch DSH afterwards (host plugins load at startup). For `dsh web`, use
`--profile web`.

## Plugin index

Add this URL in the experimental plugin market's Discover tab to browse and install all four:

```
https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/index.json
https://raw.githubusercontent.com/skyrocks/dsh-plugins/main/index.json
```

Requires the `@deepseek-ai/dsh-experimental-plugin-market-bundle` bundle to be enabled.

## About the monthly limit labels

It only changes the model menu: a small tag after each `opencode-go` model row, colour-coded by
size (`<$30` amber, `$30–$99` blue, `≥$100` green, unlimited violet). The data comes from the
official OpenCode Go pricing docs and is baked into the bundle at release time; no runtime network
or API key is needed. Official DeepSeek account and other providers show no tag.

<p align="center">
  <img src="assets/go-model-limits-tooltip.png" alt="All three plans on hover" width="720">
</p>

Note: the `/model` command popup is not covered (it has no plugin extension point), and the number
is a cap, not the remaining budget for the month.

## About the model switcher

It is not a UI plugin: switching models by hand stays on the built-in `/model` popup. It registers
two tools for the model — `find_models` reads what the session can actually switch to, and
`switch_model` applies an exact pick. When one model family has several versions (say `glm-5.3` /
`glm-5.3-flash` / `glm-5.2`), the candidates are listed for you to choose instead of being guessed.

So you just say, in chat:

```
switch to glm
use the fastest one
move to deepseek reasoning
```

It needs DSH `>= 0.2.1-rc.3`; earlier builds exposed the model catalog through
`apiProxy.sessions`, an interface that has since been removed.

## Why

- Quota and spend live under the composer — no settings page, no dashboard.
- Reads only the key already configured in your DSH profile; never sent to the browser.
- Zero runtime dependencies, no native modules.
- The two docks hide themselves when the session is not on the matching provider.
- Model switching never guesses: candidates come from DSH's own catalog, and multiple versions
  are always listed for the user.

## Compatibility

| Plugin | DSH |
| --- | --- |
| dsh-deepseek-cost | `>= 0.2.1-rc.2 < 0.3.0` |
| dsh-go-quota | `>= 0.2.1-rc.2 < 0.3.0` |
| dsh-go-model-limits | `>= 0.2.1-rc.3 < 0.3.0` |
| dsh-model-switcher | `>= 0.2.1-rc.3 < 0.3.0` |

Node `>= 18` (the desktop build ships Node 24). Verified on macOS; Windows and Linux expected
to work.

## Privacy

- Credentials are read from the current DSH profile and used only in the host process.
- No telemetry, no third-party services.
- None of the four plugins modifies conversation content: the two docks read usage metadata, the
  switcher only calls DSH's own model catalog and selection interfaces, and the limits plugin only
  reads the catalog and renders labels in the menu.

## License

MIT
