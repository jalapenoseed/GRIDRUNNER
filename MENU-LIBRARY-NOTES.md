# Menu library shortlist — 2026-09-16

Current game: Three.js with vanilla JavaScript modules and DOM menus; no React or Tailwind. Keep game commands, campaign gates, menu memory and controller routing independent of presentation.

| Candidate | Available pieces | GRIDRUNNER fit |
| --- | --- | --- |
| [Web Awesome](https://github.com/shoelace-style/webawesome) | MIT core web components; [tree](https://webawesome.com/docs/components/tree), [dropdowns with submenus](https://webawesome.com/docs/components/dropdown), drawers, tabs and dialogs | Recommended for a future migration. Framework independent, with existing keyboard behavior. Use core components and custom GRIDRUNNER styling; paid Pro patterns are separate. |
| [daisyUI](https://github.com/saadeghi/daisyui) | MIT Tailwind component library; [compact nested menu examples](https://daisyui.com/components/menu/) | Good source of ready menu markup/styles; requires Tailwind integration or a carefully scoped CSS distribution. Game commands, controller navigation and state still need adapters. |
| [Arwes](https://github.com/arwes/arwes) | MIT science-fiction UI, animation and sound primitives | Strong visual reference. Repository says it is no longer maintained and outdated; do not make it the new foundation. |

These are reusable UI components/examples, not complete ready-to-wire game menus. The best verified matches came from GitHub and official component documentation. No suitable Hugging Face game-menu template was verified.

Migration should start with one Fleet page and preserve every existing action before expanding: all ten flight patterns plus Relay Outpost; per-airframe sensors; launch/recall; task, harvesting and battery controls; keyboard/controller/touch focus and Back; campaign and save behavior. The supplied GRIDRUNNER icon atlas remains the visual reference. Web components' shadow DOM will need explicit integration with the existing menuControls/controller adapter.
