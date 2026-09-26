# Smart Home — Design System Rules

Этот файл содержит обязательные правила дизайна для всех UI-экранов и компонентов проекта.
**Стиль: Premium Dark Mode в духе Apple iOS.**

## Эталонный скриншот

Утверждённый дизайн Экрана 1.1 (AuthScreen): `docs/design-reference-auth-screen.png`

---

## 1. Цветовая палитра (iOS Dark Mode — строго)

| Токен | Значение | Назначение |
|-------|----------|------------|
| `--sys-bg` | `#000000` | Фон приложения и страницы |
| `--sys-bg-secondary` | `#1C1C1E` | Приподнятые поверхности (карточки) |
| `--sys-bg-tertiary` | `#2C2C2E` | Третичный фон |
| `--sys-label` | `#FFFFFF` | Основной текст (заголовки) |
| `--sys-label-secondary` | `rgba(235, 235, 245, 0.60)` | Подзаголовки, описания |
| `--sys-label-tertiary` | `rgba(235, 235, 245, 0.30)` | Placeholder, hint |
| `--accent` | `#BF5AF2` | Кнопки, активные элементы (Apple systemPurple) |
| `--accent-hover` | `#D07EF7` | Hover-состояние |
| `--accent-active` | `#A94AD6` | Active/pressed-состояние |
| `--sys-separator` | `rgba(84, 84, 88, 0.65)` | Разделители |
| `--sys-fill` | `rgba(120, 120, 128, 0.36)` | Disabled-элементы |

**Запрещено:** светлые/пастельные фоны, серые цвета вместо iOS-системных, тени на кнопках.

## 2. Типографика

- **Шрифт:** `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif`
- **Large Title (H1):** 34px, Bold (700), letter-spacing: -0.4px, line-height: 1.24, цвет: `#FFFFFF`
- **Body / Subtitle:** 17px, Regular (400), line-height: 1.47, цвет: `rgba(235,235,245,0.6)`
- **Button text:** 17px, SemiBold (600), letter-spacing: -0.2px, цвет: `#FFFFFF`
- Обязательно: `text-rendering: optimizeLegibility`, `-webkit-font-smoothing: antialiased`

## 3. Кнопки

- **Primary:** фон `#BF5AF2`, текст `#FFFFFF`, `border-radius: 14px`, `min-height: 50px`, `padding: 16px 20px`
- **НЕТ теней** — кнопки плоские (flat), как в iOS Dark Mode
- **Active:** `scale(0.975)` + чуть темнее
- **Disabled:** `rgba(120,120,128,0.36)` фон, `rgba(235,235,245,0.30)` текст
- Анимации через `cubic-bezier(0.22, 1, 0.36, 1)` (spring)

## 4. Лейаут экранов

- **Мобильный контейнер:** `max-width: 430px`, `min-height: 100dvh`, центрирован на десктопе
- **Контент:** `flex: 1`, `justify-content: center`, `align-items: center`, `text-align: center`
- **Footer (кнопка):** прижат к низу, `padding: 12px 24px`, `padding-bottom` учитывает safe-area / Home Indicator (34px)
- **Home Indicator:** 134×5px, `rgba(255,255,255,0.30)`, `border-radius: 100px`

## 5. Визуальные эффекты

- **Ambient Glow:** радиальный градиент `rgba(191,90,242,0.28)` → transparent, `filter: blur(50px)`, анимация пульсации 6s
- **Второй слой:** индиго `rgba(10,132,255,0.14)`, blur 40px, reverse-анимация 8s — для глубины
- **Логотип:** iOS squircle (`border-radius: 22.5%`), белый фон, multi-layer shadow, padding: 4px
- **Entrance animations:** stagger fadeInUp (logo 0s → text 0.15s → button 0.3s), ease-out-expo

## 6. Glass / Materials (для карточек)

- `background: rgba(30, 30, 30, 0.75)`
- `backdrop-filter: saturate(180%) blur(20px)`
- `border: 1px solid rgba(255, 255, 255, 0.08)`

## 7. Общие правила

- Все CSS-переменные определены в `src/styles/global.css`
- Компоненты используют CSS Modules (`.module.css`)
- Отступы по сетке 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48
- `color-scheme: dark` на `<html>`
- `viewport-fit=cover` в `<meta viewport>`
- React + TypeScript + Vite
- Каждый экран — отдельный компонент в `src/screens/`
- Каждый UI-элемент — в `src/components/`
