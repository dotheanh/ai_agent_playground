# Buddy Hatch Animation Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm nút "Hatch Buddy" bên dưới "Pet Buddy". Khi bấm: buddy hiện tại fade out → egg xuất hiện → wobble → crack → burst → buddy mới emerge → idle animation.

**Architecture:** CSS + JS state machine điều khiển `hatchPhase` state (`idle → laying → wobble → crack → burst → emerge → idle`). Timing dùng `setInterval` đúng pattern (1 interval duy nhất, clear khi kết thúc). Tách biệt sprite data, animation logic, và state transitions.

**Tech Stack:** Vanilla JS + CSS (không framework mới)

---

## Task 1: Thêm hatch sprite data

**Files:**
- Modify: `index.html` — thêm `EGG_SPRITES`, `HATCH_FRAMES`, `HATCH_DURATION`, `hatchPhase` state

---

- [ ] **Step 1: Thêm EGG_SPRITES và HATCH_FRAMES**

Tìm dòng `// Animation state`, thêm sau `let petAnimationId = null;`:

```javascript
// Hatch animation state
const HATCH_DURATION = 3000; // tổng thời gian hatch (ms)
const HATCH_PHASES = ['laying', 'wobble', 'crack', 'burst', 'emerge'];
// 5 giai đoạn: laying(0-20%) → wobble(20-40%) → crack(40-55%) → burst(55-70%) → emerge(70-100%)

const EGG_SPRITES = {
  laying: [
    ['      ___      ', '    ,\'  \'._  ', '   /  \\/  \\  ', '   \\__/\\__/  ', '      ||      '],
    ['      ___      ', '    ,\'  \'._  ', '   /  \\/  \\  ', '   \\__/\\__/  ', '      ||      '],
  ],
  wobble: [
    ['     ___      ', '   ,\'  \\ \'._  ', '  /  \\/  \\  ', '  \\__/\\__/  ', '      ||      '],
    ['      ___      ', '    ,\'  / \'._  ', '   /  \\/  \\  ', '   \\__/\\__/  ', '      ||      '],
    ['     ___      ', '   ,\'  \'._  ,  ', '  /  \\/  \\  ', '  \\__/\\__/  ', '      ||      '],
  ],
  crack: [
    ['     __*_     ', '   ,\'  \\*\'._  ', '  /  \\*/  \\  ', '  \\__/\\__/  ', '      ||      '],
    ['     __*_     ', '   ,\'  \\* \'._  ', '  /  *\\/  \\  ', '  \\__/\\__/  ', '      ||      '],
    ['     __*__    ', '   ,\'* \\*\'*._  ', '  /*  \\*/  \\  ', '  \\__/\\__/  ', '     \\|/      '],
  ],
  burst: [
    ['   *  ___  *   ', '  / \\ *   * \\  ', '  \\/  |   |  \\/', '       |       '],
    ['    * ___ *    ', '   /* |   | *\\  ', '  *  /___\\  *  ', '      | |       '],
  ],
};

let hatchPhase = 'idle';
let hatchProgress = 0; // 0-1, phần trăm hoàn thành
let hatchIntervalId = null;
let hatchBuddyData = null; // { species, rarity, eye, hat, shiny, stats } của buddy sẽ xuất hiện
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add hatch sprite data and phase constants"
```

---

## Task 2: Thêm hatch sprite rendering

**Files:**
- Modify: `index.html` — thêm `renderHatchSprite()`, update `updatePreview()` để handle hatch phase

---

- [ ] **Step 1: Thêm renderHatchSprite()**

Tìm `function startAnimation()`, thêm TRƯỚC nó:

```javascript
// Render hatch animation frame
// phase: 'laying' | 'wobble' | 'crack' | 'burst' | 'emerge'
function renderHatchSprite(phase, frame) {
  const frames = EGG_SPRITES[phase];
  if (!frames) return [];
  return frames[frame % frames.length];
}

// Get hatch display lines (egg/buddy tùy phase)
function getHatchDisplay(species, eye, hat, phase, frame) {
  if (phase === 'idle' || phase === 'emerge' || phase === 'burst') {
    // emerge cuối: hiện buddy mới đang xuất hiện
    // burst: hiện mảnh vỡ
    if (phase === 'burst') {
      const lines = renderHatchSprite('burst', frame);
      return lines.map(l => l.replace(/\*/g, '·'));
    }
    // emerge: fade in buddy
    return renderSprite(species, eye, hat, 0);
  }
  // laying, wobble, crack: hiện trứng
  return renderHatchSprite(phase, frame);
}
```

- [ ] **Step 2: Update updatePreview() để render hatch phase**

Tìm `function updatePreview()` trong code. Thay đổi logic rendering:

```javascript
function updatePreview() {
  const preview = document.getElementById('buddyPreview');
  const species = state.species || 'duck';
  const rarity = state.rarity || 'legendary';
  const eye = state.eye || '·';
  const hat = state.hat || 'none';
  const shiny = state.shiny === 'true';
  const rarityColor = RARITY_COLORS[rarity];
  const floor = RARITY_FLOOR[rarity];

  // Determine what to render
  let displayLines, displayRarityColor, isShiny;
  if (hatchPhase !== 'idle') {
    displayLines = getHatchDisplay(species, eye, hat, hatchPhase, Math.floor(hatchProgress * 10) % 3);
    displayRarityColor = hatchPhase === 'burst' ? '#ffffff' : '#888888';
    isShiny = false;
  } else {
    // Normal idle/preview
    const stats = { /* ... */ };
    displayRarityColor = rarityColor;
    isShiny = shiny;
  }

  // Render tùy mode
  if (hatchPhase === 'idle') {
    // ... existing preview rendering code (giữ nguyên)
    const stats = { /* ... */ };
    let sparkles = '';
    if (shiny) { /* ... */ }
    let html = `<div class="preview-card rarity-${rarity}">...`;
    preview.innerHTML = html;
    startAnimation(species, eye, hat);
  } else {
    // Hatch animation rendering
    const opacity = hatchPhase === 'emerge'
      ? Math.min(1, (hatchProgress - 0.7) / 0.3)  // fade in ở emerge
      : hatchPhase === 'burst'
      ? Math.max(0, 1 - (hatchProgress - 0.55) / 0.15) // fade out egg
      : 1;

    const scale = hatchPhase === 'burst'
      ? 1 + (hatchProgress - 0.55) * 0.5  // scale up khi burst
      : 1;

    let html = `
      <div class="preview-card" style="border-color: ${displayRarityColor}; opacity: ${opacity}; transform: scale(${scale}); transition: opacity 0.3s, transform 0.3s;">
        <div class="preview-header" style="color: ${displayRarityColor}">
          <span class="preview-species-name">${hatchPhase === 'burst' ? '✨ HATCHING!' : '🥚 EGG'}</span>
        </div>
        <div class="sprite-container">
          <div class="sprite-bob">
            <pre style="font-family: 'Fira Code', monospace; font-size: 1rem; font-weight: bold; line-height: 1.1; margin: 0; color: ${displayRarityColor}; text-shadow: 0 0 10px ${displayRarityColor}40;">${displayLines.join('\n')}</pre>
          </div>
        </div>
        <div class="preview-info">
          <div style="color: var(--text-muted); font-size: 0.75rem;">${hatchPhase.toUpperCase()}</div>
        </div>
      </div>
    `;
    preview.innerHTML = html;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add hatch sprite rendering in updatePreview"
```

---

## Task 3: Implement startHatch() state machine

**Files:**
- Modify: `index.html` — thêm `startHatch()`, gắn button handler

---

- [ ] **Step 1: Thêm Hatch Buddy button vào HTML**

Tìm `<button class="pet-btn" id="petBtn">`, thêm SAU nó:

```html
<button class="pet-btn" id="hatchBtn" onclick="startHatch()" style="margin-top: 0.5rem;">
  <span>🥚</span>
  <span>Hatch Buddy</span>
</button>
```

Thêm CSS cho `hatchBtn` (tìm `.pet-btn:hover`, thêm sau):

```css
#hatchBtn:hover {
  background: var(--bg-hover);
  color: var(--success);
  border-color: var(--success);
}

#hatchBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```

- [ ] **Step 2: Thêm startHatch() function**

Tìm `// === PET ANIMATION ===`, thêm TRƯỚC nó:

```javascript
// === HATCH ANIMATION ===
function startHatch() {
  // 1. Disable hatch button
  const hatchBtn = document.getElementById('hatchBtn');
  if (hatchBtn) { hatchBtn.disabled = true; }

  // 2. Clear all existing animations
  if (animationInterval) { clearInterval(animationInterval); animationInterval = null; }
  if (petAnimationId) { clearInterval(petAnimationId); petAnimationId = null; }

  // 3. Capture current buddy data for emerge phase
  hatchBuddyData = {
    species: state.species || 'duck',
    rarity: state.rarity || 'legendary',
    eye: state.eye || '·',
    hat: state.hat || 'none',
    shiny: state.shiny === 'true',
  };

  // 4. Reset hatch state
  hatchPhase = 'laying';
  hatchProgress = 0;
  const startTime = Date.now();

  // Phase durations (ms)
  const PHASE_DURATIONS = {
    laying:  HATCH_DURATION * 0.20,  // 0-20%: egg xuất hiện
    wobble: HATCH_DURATION * 0.20,    // 20-40%: egg rung lắc
    crack:  HATCH_DURATION * 0.15,    // 40-55%: vỡ
    burst:  HATCH_DURATION * 0.15,    // 55-70%: mảnh văng
    emerge: HATCH_DURATION * 0.30,    // 70-100%: buddy xuất hiện
  };

  // Phase boundaries (0-1)
  const PHASE_START = {
    laying: 0.00,
    wobble: 0.20,
    crack:  0.40,
    burst:  0.55,
    emerge: 0.70,
  };

  // 5. Start animation interval (1 interval DUY NHẤT - đúng pattern đã fix pet animation)
  hatchIntervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const rawProgress = elapsed / HATCH_DURATION;

    if (rawProgress >= 1.0) {
      // Done!
      clearInterval(hatchIntervalId);
      hatchIntervalId = null;
      hatchPhase = 'idle';
      hatchProgress = 0;
      hatchBuddyData = null;

      // Re-enable hatch button
      if (hatchBtn) { hatchBtn.disabled = false; }

      // Show final buddy
      updatePreview();
      return;
    }

    hatchProgress = rawProgress;

    // Determine current phase from progress
    let newPhase = 'laying';
    if (rawProgress >= 0.70) newPhase = 'emerge';
    else if (rawProgress >= 0.55) newPhase = 'burst';
    else if (rawProgress >= 0.40) newPhase = 'crack';
    else if (rawProgress >= 0.20) newPhase = 'wobble';

    hatchPhase = newPhase;

    // Re-render
    updatePreview();

  }, 50); // 20fps

  // Initial render
  updatePreview();
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: implement startHatch() state machine with interval cleanup"
```

---

## Task 4: Integrate emerge phase với buddy mới

**Files:**
- Modify: `index.html` — update `getHatchDisplay()` và `updatePreview()` để hiện buddy thật ở emerge phase

---

- [ ] **Step 1: Update getHatchDisplay() để dùng hatchBuddyData ở emerge**

Thay toàn bộ `getHatchDisplay()`:

```javascript
function getHatchDisplay(phase, frame) {
  if (!hatchBuddyData) {
    return ['ERROR', 'no data', '', '', ''];
  }

  const { species, eye, hat } = hatchBuddyData;

  if (phase === 'idle' || phase === 'laying' || phase === 'wobble' || phase === 'crack') {
    return renderHatchSprite(phase, frame);
  }

  if (phase === 'burst') {
    const lines = renderHatchSprite('burst', frame);
    // Thay * bằng · cho mảnh vỡ
    return lines.map(l => l.replace(/\*/g, '·'));
  }

  if (phase === 'emerge') {
    // Fade in buddy
    return renderSprite(species, eye, hat, frame);
  }

  return renderHatchSprite('laying', 0);
}
```

- [ ] **Step 2: Update updatePreview() — hatch section dùng hatchBuddyData**

Trong phần hatch rendering (phase !== 'idle'), sửa species/eye/hat để lấy từ `hatchBuddyData`:

```javascript
// Trong updatePreview(), hatch section:
const hatchBuddy = hatchBuddyData || { species: 'duck', rarity: 'legendary', eye: '·', hat: 'none', shiny: false };
const displayLines = getHatchDisplay(hatchPhase, Math.floor(hatchProgress * 10) % 3);
const displayRarityColor = hatchPhase === 'burst' ? '#ffffff'
  : hatchBuddy.rarity ? RARITY_COLORS[hatchBuddy.rarity] : '#888888';
```

Và update label cho emerge:

```javascript
// emerge phase: hiện buddy thật
const headerLabel = hatchPhase === 'emerge'
  ? `${hatchBuddy.species?.toUpperCase() || 'BUDDY'} EMERGING!`
  : hatchPhase === 'burst'
  ? '✨ HATCHING!'
  : '🥚 EGG';
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: connect emerge phase to real buddy data"
```

---

## Task 5: Handle pet during hatch + UX polish

**Files:**
- Modify: `index.html` — disable pet button during hatch, add hatch heartbeat feel, polish

---

- [ ] **Step 1: Disable Pet button during hatch**

Trong `petBuddy()`, thêm check ở đầu:

```javascript
function petBuddy() {
  // Disable pet during hatch animation
  if (hatchPhase !== 'idle') return;

  // ... existing code giữ nguyên
}
```

Trong `startHatch()`, khi đang hatch thì disable petBtn:

```javascript
// Trong startHatch():
const petBtn = document.getElementById('petBtn');
if (petBtn) { petBtn.disabled = true; }

// Khi hatch kết thúc:
if (petBtn) { petBtn.disabled = false; }
```

- [ ] **Step 2: Add wobble CSS shake animation**

Thêm CSS (tìm `@keyframes pet-pulse`, thêm SAU nó):

```css
@keyframes wobble-shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  20% { transform: translateX(-4px) rotate(-3deg); }
  40% { transform: translateX(4px) rotate(3deg); }
  60% { transform: translateX(-3px) rotate(-2deg); }
  80% { transform: translateX(3px) rotate(2deg); }
}

@keyframes burst-expand {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes emerge-pop {
  0% { transform: scale(0.3) translateY(20px); opacity: 0; }
  50% { transform: scale(1.1) translateY(-5px); opacity: 0.8; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.preview-card.hatch-laying { animation: none; }
.preview-card.hatch-wobble { animation: wobble-shake 0.3s ease-in-out infinite; }
.preview-card.hatch-burst { animation: burst-expand 0.5s ease-out forwards; }
.preview-card.hatch-emerge { animation: emerge-pop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
```

- [ ] **Step 3: Apply CSS class theo phase**

Trong `updatePreview()`, phần hatch rendering thêm class:

```javascript
let html = `
  <div class="preview-card hatch-${hatchPhase}" style="...">
`;
```

- [ ] **Step 4: Update hatch button label/emoji theo phase**

Trong `startHatch()`, update hatch button trong quá trình hatch:

```javascript
// Trong hatch interval, cập nhật button label:
if (hatchBtn) {
  if (hatchPhase === 'laying') hatchBtn.innerHTML = '<span>🥚</span><span>Growing...</span>';
  else if (hatchPhase === 'wobble') hatchBtn.innerHTML = '<span>🥚</span><span>Wobbling!</span>';
  else if (hatchPhase === 'crack') hatchBtn.innerHTML = '<span>🥚</span><span>Cracking!</span>';
  else if (hatchPhase === 'burst') hatchBtn.innerHTML = '<span>✨</span><span>Hatching!</span>';
  else if (hatchPhase === 'emerge') hatchBtn.innerHTML = '<span>🐣</span><span>Almost there!</span>';
}

// Khi kết thúc:
hatchBtn.innerHTML = '<span>🥚</span><span>Hatch Buddy</span>';
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add hatch CSS animations and UX polish"
```

---

## Task 6: Test trong trình duyệt

**Files:**
- Test: Mở `index.html` trong trình duyệt

---

- [ ] **Step 1: Test 1 — Hatch animation completes**

1. Mở `index.html` trong Chrome/Firefox
2. Chọn species "cat", rarity "legendary"
3. Bấm nút "Hatch Buddy"
4. Quan sát: laying → wobble → crack → burst → emerge → idle
5. Kết quả: Buddy mới hiện đúng species đã chọn
6. **PASS**: Animation chạy mượt, không crash, button re-enabled

- [ ] **Step 2: Test 2 — Pet button disabled during hatch**

1. Bấm "Hatch Buddy"
2. Trong khi animation chạy, bấm "Pet Buddy"
3. **PASS**: Pet không xảy ra (button disabled hoặc click ignored)

- [ ] **Step 3: Test 3 — Change species during hatch**

1. Bấm "Hatch Buddy" → ngay lập tức đổi species trong dropdown
2. **PASS**: Buddy emerge đúng species lúc BẮT ĐẦU hatch (snapshot từ hatchBuddyData)

- [ ] **Step 4: Test 4 — No setInterval leak**

1. Bấm Hatch 3 lần liên tiếp nhanh
2. Mở DevTools → Performance Monitor → Timers
3. **PASS**: Không có timer count tăng liên tục (chỉ tối đa 1 hatch interval tại 1 thời điểm)

- [ ] **Step 5: Update docs/spec.md**

Thêm mục "Hatch Animation" vào `docs/spec.md`:

```markdown
### Animation System

| Animation | Trigger | Duration | Notes |
|-----------|---------|-----------|-------|
| Idle | Default | ∞ | 15-step sequence, 500ms tick |
| Pet | Pet button | 4000ms | Hearts + fast frames |
| Hatch | Hatch button | 3000ms | laying→wobble→crack→burst→emerge |
```

---

## Self-Review Checklist

1. **Spec coverage:** Tất cả requirements đều có task:
   - Hatch button bên dưới Pet ✅
   - Buddy fade out → egg appear ✅
   - Egg wobble → crack → burst ✅
   - Buddy emerge ✅
   - Idle animation sau hatch ✅

2. **No placeholders:** Không có TBD/TODO trong code blocks ✅

3. **Type consistency:** hatchPhase là string literal type, các phase names khớp nhau xuyên suốt ✅

4. **Pattern consistency:** setInterval được gán vào biến, clear khi kết thúc — đúng pattern đã fix pet animation ✅

---

## Execution Options

**1. Subagent-Driven (recommended)** — Dispatch subagent per task, review between tasks

**2. Inline Execution** — Execute tasks sequentially in this session using `superpowers:executing-plans`

Which approach?
