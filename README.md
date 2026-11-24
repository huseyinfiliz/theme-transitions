# Theme Transitions
![](https://www.huseyinfiliz.com/assets/og/theme-transitions.png)

Smooth, customizable View Transition animations for [Flarum](https://flarum.org) 2 theme switching.

Theme Transitions enhances Flarum 2's built-in color scheme switcher, user settings page, and companion toggle extensions such as [Simple Dark Mode](https://github.com/huseyinfiliz/simple-dark-mode) with hardware-accelerated animations powered by the **View Transitions API** and **Web Animations API**.

![](https://www.huseyinfiliz.com/assets/uploads/2026/12/theme.gif)

## Features

- **14 Customizable Transition Effects**:
  - **Radial Reveals**: Circle Reveal (Telegram), Circle Shrink, Circle Blur
  - **Geometric & Mask Wipes**: Directional Wipe, Diagonal Sweep, Split Curtain, Diamond Burst, Camera Iris, Venetian Blinds
  - **Cinematic & Motion**: Smooth Crossfade, Blur Dissolve, Focal Zoom, Parallax Slide, 3D Card Flip
- **True Code-Splitting & Lazy Loading**: Each effect is compiled into its own separate JS chunk (`js/dist/common/transitions/effects/*.js`). Visitors only download the single active effect configured by the administrator.
- **Full Customization**: Duration (`100–2000 ms`), 6 built-in easing curves plus custom `cubic-bezier(...)`, origin point (`trigger`, `center`, corners), sweep direction, polarity-based reverse modes, slat count, and blur intensity.
- **Live Admin Preview**: Test any combination of effect and timing settings directly in the admin dashboard without overwriting your saved user preference.
- **Zero-Conflict Architecture**: Intercepts `Application#setColorScheme` on genuine user interactions while keeping initial page load, boot synchronization, and OS `prefers-color-scheme` changes instant.
- **Progressive Enhancement & Accessibility**: Automatically respects `prefers-reduced-motion`, offers an optional mobile toggle, and falls back gracefully to instant switching on unsupported browsers.

## Compatibility

Works seamlessly with:
- Flarum 2.x built-in `ThemeSwitcher` and User Appearance Settings
- [Simple Dark Mode](https://github.com/huseyinfiliz/simple-dark-mode) (`huseyinfiliz/simple-dark-mode`)
- Any Flarum 2 extension that switches themes via `app.setColorScheme()`

## Installation

```bash
composer require huseyinfiliz/theme-transitions:"*"
php flarum cache:clear
```

Then enable **Theme Transitions** in your Flarum Admin Panel and choose your preferred transition style.

## Updating

```bash
composer update huseyinfiliz/theme-transitions:"*"
php flarum cache:clear
```

## Removing

```bash
composer remove huseyinfiliz/theme-transitions
php flarum cache:clear
```

## License

[MIT License](LICENSE.md)
