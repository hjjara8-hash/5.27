# ARCHITECTURE.md: AI Agent Global Map & Context Guide

**TARGET AUDIENCE:** AI Coding Agents (Cursor, Copilot, Gemini, etc.). 
**PURPOSE:** Prevent architectural side-effects, context blindness, and performance degradation during "Search and Edit" workflows. Read this document BEFORE proposing architectural changes, adding new features, or modifying core UI/data flows.

---

## 1. Project Overview & Core Stack
**App:** Advanced AI Chat Interface powered by the Google Gemini API (`@google/genai`). Features include multi-persona character mode, Agentic RAG (Long-Term Memory), Python execution (Pyodide), Text-to-Speech (Tone.js), and Novel Archiving.
**Core Stack:**
- **Frontend:** React (TypeScript), Tailwind CSS.
- **UI Paradigm:** Zinc & Emerald Soft UI (Vercel/Linear aesthetic). Atomic Component Library.
- **State Management:** Zustand (Heavily modularized).
- **Persistence:** IndexedDB (Custom wrapper in `services/db/core.ts`).
- **Audio:** Tone.js (Web Audio API) for granular TTS playback.
- **Heavy Compute:** Web Workers (Python execution, MP3 encoding, ZIP Export/Import).

---

## 2. State Management & Data Flow
The app uses a highly modularized Zustand architecture. **NEVER** combine these stores or bloat them. 

### Core Data Stores (Persisted to IndexedDB)
- `useActiveChatStore`: Holds the *full* `currentChatSession` object (including all messages). This is the source of truth for the active UI.
- `useChatListStore`: Holds *summaries* (messages array stripped) of all chats for the sidebar.
- `useDataStore`: Handles direct IndexedDB syncs (e.g., `updateMessages`, `updateSettings`).

### Volatile / UI Stores (Not Persisted)
- `useStreamingStore`: **CRITICAL.** Holds the currently streaming text. Do NOT put streaming text into `useActiveChatStore` as it will cause the entire app to re-render on every token.
- `useGlobalUiStore`: Theme, language (RTL/LTR), font sizes.
- `useSettingsUI` / `useEditorUI` / `useConfirmationUI`: Manages modal visibility. **Rule:** Keep local UI toggles inside components via `useState`. Only use these stores for global overlays.

---

## 3. UI Architecture & Atomic Components (STRICT RULES)
We have migrated away from WET (Write Everything Twice) hardcoded Tailwind classes and deprecated the old "Aurora" theme.

### A. The Atomic Library (`components/ui/`)
You MUST use the established UI primitives for all new features. NEVER use raw `<button>`, `<input>`, or `<select>` tags for standard UI elements.
- **`<Button>`**: Use variants (`primary`, `secondary`, `danger`, `ghost`, `outline`) and sizes (`sm`, `md`, `lg`, `icon`).
- **`<Input>` / `<Textarea>` / `<Select>` / `<Switch>`**: Use these for all forms.
- **`<Badge>`**: For status indicators (e.g., Active, Error).
- **`<Dropdown>`**: For all popup menus. It handles click-outside logic automatically. Do NOT write custom `useEffect` click-outside hooks.
- **`<Accordion>`**: For collapsible content. It uses native HTML `<details>` for zero React-state overhead.

### B. Theming & Colors (Zinc & Emerald)
- **Surfaces:** Use `bg-white dark:bg-zinc-900` for main panels/modals. Use `bg-gray-50 dark:bg-black` or `dark:bg-[#0e0e11]` for deep backgrounds.
- **Borders:** Use `border-gray-200 dark:border-white/10`.
- **Accents:** Use `emerald-600` (Light) and `emerald-500` (Dark) for primary actions.
- **Radii:** Use `rounded-2xl` for large containers/modals, `rounded-xl` for buttons/inputs, `rounded-lg` for small icons.
- **Markdown Colors:** Markdown elements (bold, italic, quotes) use CSS variables (`--md-bold`, `--md-quote`) defined in `index.html` to ensure perfect contrast in both Light and Dark modes. Do NOT hardcode text colors inside `MessageContent.tsx`.

---

## 4. Performance Critical Paths (DO NOT BREAK)

### A. `ChatMessageList.tsx` & `@tanstack/react-virtual`
- **Rule:** The message list is virtualized. Elements are absolutely positioned.
- **Gotcha:** Do NOT introduce CSS that breaks height calculations (e.g., unconstrained absolute children).
- **Gotcha:** Do NOT force scroll-to-bottom on every render. Use the smart stickiness logic already implemented.

### B. `MessageItem.tsx` (Streaming Performance)
- **Rule:** This component re-renders hundreds of times per second during AI streaming.
- **Gotcha:** NEVER use `motion/react` inside `MessageItem.tsx`.
- **Gotcha:** NEVER use `useState` for toggling UI elements (like Thoughts or Python code) inside a message. You MUST use the `components/ui/Accordion.tsx` (which relies on native HTML `<details>`) to prevent React state updates from lagging the stream.

### C. Anti-FOUC (Flash of Unstyled Content)
- **Rule:** Theme initialization happens via an inline script in `index.html` reading from `localStorage('global-ui-storage')`. Do not attempt to manage the initial `dark` class injection via React `useEffect`, as it will cause a white flash on load.

---

## 5. Highly Fragile Subsystems (HANDLE WITH EXTREME CARE)

### A. The Streaming Regex Trap (`useMessageSender.ts`)
- **Danger:** The app supports hiding "Thoughts" (e.g., `<thought>...</thought>`) from the UI *during* the live stream.
- **Rule:** If you modify the streaming logic, you MUST preserve the regex logic. Failing to do so will leak raw XML tags into the user's chat UI.

### B. Audio Chunking & Deletion (`useAudioStore.ts` & `audioDb.ts`)
- **Danger:** Long TTS audio is split into chunks to bypass API limits. They are stored in IndexedDB as `${messageId}_part_${i}`.
- **Rule:** If you write logic to delete a message, you CANNOT just delete `messageId`. You MUST loop through `message.cachedAudioSegmentCount` and delete every `_part_${i}`. Otherwise, you will cause massive IndexedDB memory leaks.

### C. IndexedDB Migrations (`services/db/core.ts`)
- **Dependency:** If you add a new Object Store or change a `keyPath`, you MUST increment `DB_VERSION` and add a new `if (oldVersion < X)` block inside the `onupgradeneeded` function. Failing to do this will corrupt the app for existing users.

---

## 7. RECENT REFACTORING & CLEANUP (MARCH 2026)

### A. Dead Code Eradication
- **Manual Save Button:** Removed `ManualSaveButton.tsx` and all related logic (`handleManualSave`) from `useDataStore.ts` and `ChatHeader.tsx`. The application now relies exclusively on robust auto-save.
- **Cache Management:** Removed `clearChatCache` from `useInteractionStore.ts`. Refactored `ChatHeader.tsx` to use a native `<button>` for cache status display with dynamic i18n titles (`cacheActive`, `cacheExpired`, `cacheInvalid`).
- **Hard Reload:** Introduced a dedicated "Hard Reload App" button in `SettingsAdvanced.tsx` (wired via `SettingsPanel.tsx`) that uses `clearCacheAndReload` from `pwaService.ts`.

### B. UI Efficiency
- **Chat Header:** Simplified the header by removing redundant dividers and obsolete buttons. The cache management button now uses a clean, native approach without the overhead of the `<Badge>` component.
- **Settings UI:** Renamed `onClearCache` to `onHardReload` in `SettingsAdvanced.tsx` to better reflect its actual behavior (PWA cache clearing + page reload).

### C. Iterative Auto-Refine & Tool Loop Stability (LATE MARCH 2026)
- **Auto-Refine Service:** Introduced `services/llm/autoRefineService.ts` to handle multi-step draft/critique/refine loops. This logic is decoupled from the main chat flow to prevent state pollution.
- **Tool Loop Fix:** Resolved a critical "Tool Loop Drop-out" bug in `services/llm/chat.ts`. The `getFullChatResponse` function now correctly appends `response.text` within the tool execution loop and properly transitions to `auto_refine` mode if enabled.
- **Enhanced Thinking:** Added `'auto_refine'` as a new `enhancedThinkingMode` in `GeminiSettings`. Integrated custom critic instructions and iteration limits into the `SettingsToolsContext.tsx` UI.

### D. Chat Header Model Selector Refactor (LATE MARCH 2026)
- **Multi-line Wrapping:** Refactored the Model Selector in `ChatHeader.tsx` to support multi-line wrapping for long model names.
- **Header Dynamics:** Replaced fixed height `h-14 sm:h-16` with `min-h-[3.5rem] sm:min-h-[4rem] h-auto` to allow the header to expand vertically if needed.
- **Button Constraints:** Updated model display buttons to use `h-auto min-h-[1.5rem]` and increased `max-w` to `240px` for better readability of technical IDs.
- **Icon Protection:** Added `flex-shrink-0` to all icons within the model selector to prevent distortion during text wrapping.
- **Typography:** Removed `truncate` from model names, adding `whitespace-normal break-words` and `leading-[1.1]` for clean multi-line rendering.

### E. Settings UI Responsiveness Refactor (LATE MARCH 2026)
- **Active Capabilities Alignment:** Refactored `SettingsToolsContext.tsx` to ensure perfect layout on mobile (320px).
- **Python Mode Switcher:** Updated the Python execution mode switcher to span full-width on mobile with `flex-1` buttons and `text-[10px]`.
- **Margin & Padding Optimization:** Replaced fixed `ms-11` with responsive `ms-2 sm:ms-11` and adjusted indents for better readability on small screens.
- **Form Element Reflow:** Converted several `flex-row` layouts to `flex-col` on mobile, ensuring buttons and status boxes don't overflow.
- **Google Search Row:** Adjusted the Google Search toggle row to use `items-start` and `gap-2` to prevent clipping of long descriptions.

### F. Mobile UI Clipping & Overlapping Fixes (LATE MARCH 2026)
- **Logical Positioning:** Updated `ProgressNotification.tsx` to use `end-4` instead of `right-4` for better RTL/LTR support and added `max-w-[calc(100vw-2rem)]` to prevent clipping.
- **Toast Centering:** Refactored `ToastNotification.tsx` to ensure proper centering and responsive width on small screens.
- **Flexbox Robustness:** Added `min-w-0` to the chat title and `flex-shrink-0` to critical header elements (model selector, cache button) in `ChatHeader.tsx` to prevent layout collapse.
- **Safe Area Awareness:** Implemented `env(safe-area-inset-*)` padding in the chat header to protect against notches.
- **Global Reset:** Updated `index.html` with a global `min-width: 0; min-height: 0;` reset to prevent flex items from breaking layouts.

### G. Chat Input Area Refactor: "Dynamic Layered Row" System (LATE MARCH 2026)
- **Spatial Efficiency:** Refactored `ChatInputArea.tsx` into a layered system to maximize vertical space on mobile devices.
- **Layered Layout:**
    - **Top Layer:** A conditional loading progress bar (`h-0.5 bg-emerald-500 animate-pulse`).
    - **Layer 1:** `AutoSendControls.tsx` with a slim "Active Mode" (status bar with remaining count) and a "Config Mode" (input fields).
    - **Layer 2:** `AttachmentZone.tsx` refactored into a horizontal, scrollable row (`overflow-x-auto hide-scrollbar`) with smaller file items.
    - **Layer 3 (Conditional Toolbar):** A toggleable toolbar that switches between `CharacterBar.tsx` and `PromptButtonsBar.tsx` using a switch button (`UsersIcon` or `WrenchScrewdriverIcon`).
    - **Layer 4 (Main Input Row):** A single row containing `InputActions` (Start), `ChatTextArea`, and `InputActions` (End).
- **Unified "+" Menu:** Consolidated all secondary tools (Add Files, Attachments, Context Input, Story Manager, Strategic Protocol, User Profile) into a single `Dropdown` menu in `InputActions.tsx`.
- **Priority-Based Action Buttons:** Implemented a priority system for the right-side action buttons:
    - **Priority 1:** `StopIcon` (if `isLoading` or `isAutoSendingActive`).
    - **Priority 2:** `SendIcon` (if `!isCharacterMode`).
    - **Priority 3:** `MicrophoneIcon` (if `isCharacterMode`).
- **Responsive Padding:** Added `px-2 sm:px-4` and `p-2 sm:p-3` to ensure a tight, professional fit on small screens.

### I. Chat Status Footer & Floating Thinking Pill (LATE MARCH 2026)
- **Relocation:** Moved the "Thinking Indicator" and "Generation Timer" from the header, chat bubbles, and message list footer to a single, elegant floating pill above the `ChatInputArea.tsx`.
- **Floating Pill Implementation:** The pill uses `AnimatePresence` and `motion` for smooth entrance/exit. It is positioned absolutely above the input area (`bottom-full mb-2`), ensuring it's always centered horizontally during generation. The styling is minimalist, transparent, and significantly smaller (text size `text-[9px]`) to maintain a clean, "ghost-like" aesthetic.
- **Continue Flow Button:** The "Continue Flow" button remains at the end of the `ChatMessageList.tsx` (within the observed scrollable area) to maintain logical flow after model responses.
- **Auto-Scroll Integration:** The `ChatMessageList.tsx` footer (containing the Continue button) is part of the observed scrollable area (`virtualizerContainerRef`), ensuring that when it appears, the `ResizeObserver` triggers an auto-scroll.
- **Manual Scroll Respect:** Refactored scroll logic to strictly respect user's manual scroll position. The UI no longer forces a scroll to the bottom if the user has manually scrolled up to read history, even when new messages arrive or deletions occur. "Stickiness" is only maintained if the user is already at the bottom or explicitly clicks the "Scroll to Bottom" button.

### H. Viewport-Aware & RTL Dropdown System (LATE MARCH 2026)
- **Unified Dropdown:** Refactored the atomic `<Dropdown />` component in `components/ui/Dropdown.tsx` to be the single source of truth for all popup menus.
- **Viewport Awareness:** Implemented dynamic positioning logic using `useLayoutEffect` to calculate menu placement. Dropdowns now automatically flip vertically (up/down) and align horizontally (left/right) to prevent overflowing screen edges.
- **RTL Compatibility:** Added native support for Right-to-Left layouts (`document.documentElement.dir === 'rtl'`), ensuring menus anchor correctly to the right edge in RTL environments.
- **Migration:** Consolidated custom portal-based menus in `InputActions.tsx` (the "+" menu) and `ChatToolsMenu.tsx` (the "Wrench" menu) into the unified `<Dropdown />` component.
- **Interaction Polish:** Adopted a function-as-child pattern `({ close }) => ...` to allow menu items to explicitly close the dropdown upon interaction.
- **Animation Consistency:** Updated the global `fade-in` animation in `index.html` to be direction-neutral, ensuring smooth transitions regardless of the menu's opening direction.

### J. Chat Footer & Auto-Reveal Optimization (LATE MARCH 2026)
- **Ghost Gap Elimination:** Refactored `ChatMessageList.tsx` to conditionally render the chat status footer container only when the "Continue Flow" button is actually needed. This eliminates the empty space ("ghost gap") at the bottom of the chat when no button is present.
- **Spacing Tightening:** Reduced vertical margins on the footer container from `mt-6 mb-10` to `mt-4 mb-4` for a more compact layout.
- **Smart Stickiness Fix:** Modified the `ResizeObserver` in `ChatMessageList.tsx` to trigger auto-scroll whenever `isPinned` is true, regardless of whether streaming is active. This ensures the "Continue Flow" button is automatically revealed when it appears, and that late-loading attachments (like images) don't push the viewport away from the bottom.
- **Logic Centralization:** Centralized the "Continue Flow" visibility logic into a single `shouldShowContinueButton` constant for better maintainability.

### K. Zero-Padding Chat Layout & Ghost Footer Removal (LATE MARCH 2026)
- **Native Flexbox Layout:** Refactored the chat layout to rely entirely on native Flexbox (`flex-col` + `flex-1`). Removed all artificial bottom padding from the message list (`pb-0`).
- **Ghost Footer Fix:** Implemented strict conditional rendering for the Chat Status Footer container. The container now only renders when the "Continue Flow" button is active, ensuring it takes up zero vertical space when empty.
- **Tightened Margins:** Reduced footer margins to `mt-2 mb-2` for a more integrated look.
- **Layout Stability:** By removing dynamic padding and relying on standard CSS layout, we ensure maximum compatibility with the virtualizer's coordinate system and prevent layout jumps.

### L. Global Pure CSS Modal Animations (LATE MARCH 2026)
- **Performance Optimization:** Replaced `framer-motion` with hardware-accelerated pure CSS animations (`animate-modal-open`) for all modals and panels across the app. This eliminates mobile jank during modal mounting and unmounting.
- **Zero-Refactor Approach:** Applied the `animate-modal-open` class directly to the inner container `div` of hardcoded modals, avoiding complex refactoring while achieving global animation consistency.
- **Snappy Transitions:** Tuned the CSS animation duration to `0.2s` in `index.html` for a more responsive and professional feel.
- **BaseModal Refactor:** Refactored `BaseModal.tsx` to remove `AnimatePresence` and `motion.div`, relying on standard `div` elements and the `animate-modal-open` class. Updated the transition timeout to `200ms` to match the CSS animation.

### M. Mobile Toolbar "Fixed-Scroll-Fixed" Pattern (LATE MARCH 2026)
- **Standardization:** Standardized all toolbars (Selection ActionBar, PromptButtonsBar, CharacterBar) to use a three-part flex system: Fixed Start, Scrollable Center, and Fixed End.
- **Mobile UX:** This pattern prevents UI squashing on small screens by allowing action buttons to scroll horizontally while keeping primary navigation and status indicators pinned.
- **Logical Properties:** Enforced the use of CSS Logical Properties (`ms-`, `me-`) instead of physical ones (`ml-`, `mr-`) to ensure universal RTL/LTR compatibility.
- **Visual Clarity:** Removed `hidden sm:inline` from action buttons in the selection bar to ensure all labels are visible on mobile, and added `whitespace-nowrap` + `flex-shrink-0` to prevent text wrapping or button shrinking.
- **Critical Rule:** Never use flex items directly inside a scrollable flex container for toolbars, as this can cause unpredictable shrinking or hidden scrollbars. Always use the "Bulletproof Scrolling Pattern": an outer container with `flex-1 min-w-0 overflow-x-auto` and an inner container with `w-max flex items-center`.

1. **Feature Isolation:** When introducing a NEW feature, DO NOT bloat existing files. Create a NEW, dedicated file and import it. Every file must maintain a single responsibility.
2. **Native Alerts:** NEVER use `window.alert`, `window.confirm`, or `window.prompt`. Always use `useToastStore`, `useConfirmationUI`, or `useEditorUI.getState().openFilenameInputModal`.
3. **Zustand Selectors:** Always use `useShallow` when selecting multiple properties from a store to prevent unnecessary re-renders.
   *Bad:* `const { a, b } = useStore();`
   *Good:* `const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));`
4. **Translations:** Hardcoded English strings in UI components are strictly forbidden. Always use `const { t } = useTranslation();` and add new keys to `translations.ts`.
