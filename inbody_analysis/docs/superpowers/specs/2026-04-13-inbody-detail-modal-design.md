# InBody Detail Modal Design

**Created:** 2026-04-13
**Status:** Approved

---

## Overview

This design specifies the implementation of a detail modal for viewing individual InBody measurement reports in a modern, glassmorphism-inspired UI.

## Design Principles

- **Glassmorphism**: Translucent backgrounds with blur effects
- **Modern Cards**: Rounded corners, subtle shadows, hover states
- **Color Coding**: Blue for muscle, red for fat, cyan for hydration
- **Clean Typography**: Readable fonts, proper spacing
- **Responsive**: Scroll if needed, never broken layout

---

## Page Structure

### 1. Header Section
- Logo/Title: "💪 InBody Tracker" centered
- Minimal navigation

### 2. Dashboard Row (8 Metrics)
Cards showing current values with trend indicators:
- **Cân nặng** (kg) - better when lower
- **BMI** (unitless) - better when lower
- **% Mỡ** (%) - better when lower
- **Cơ xương** (kg) - better when higher
- **Điểm InBody** (unitless) - better when higher
- **BMR** (kcal) - better when higher
- **Vòng eo** (cm) - better when lower
- **Nước** (L) - neutral

Each card displays current value, unit, and change indicator (↑/↓) with color coding.

### 3. Charts Row (4 Charts)
- **Weight & BMI** - Line chart with dual Y-axis
- **Fat & Muscle** - Bar chart comparing % fat vs muscle mass
- **InBody Score** - Line chart showing score over time
- **Hydration** - Line chart for body water

### 4. Report List (Cards instead of table)
Each report card shows:
- Date measured
- InBody Score
- Weight
- Body Fat %
- BMI

Clicking a card opens the detail modal.

---

## Modal Specification

### Modal Dimensions
- **Width**: 1200px
- **Height**: auto (max-height with scroll)
- **Position**: Centered overlay

### Modal Layout (5 Columns)

#### Column 1: Body Composition (Tổng quan)
```
- Ngày đo
- Điểm InBody (large, prominent)
- Cân nặng (kg)
- BMI (kg/m²)
- Tỷ lệ mỡ cơ thể (%)
- Khối lượng cơ xương (kg)
- Tỷ lệ trao đổi chất cơ bản (kcal)
- Vòng eo (cm)
- Mức độ chất béo nội tạng (Level)
```

#### Column 2: Muscle-Fat Analysis (Phân tích cơ-béo)
```
Cánh tay phải:
  - Cơ: [kg]
  - Mỡ: [kg]

Cánh tay trái:
  - Cơ: [kg]
  - Mỡ: [kg]

Thân mình:
  - Cơ: [kg]
  - Mỡ: [kg]

Chân phải:
  - Cơ: [kg]
  - Mỡ: [kg]

Chân trái:
  - Cơ: [kg]
  - Mỡ: [kg]
```

#### Column 3: Water Analysis (Phân tích nước)
```
- Lượng nước trong cơ thể (L)
- Nước nội bào (L)
- Nước ngoại bào (L)
- Tỷ lệ ECW (ECW/TTW %)
```

#### Column 4: Segmental Lean Analysis (Phân tích đoạn thân)
```
Bên trái:
  - Tay trái: Cơ [kg], Mỡ [kg], ECW% [x.xx]
  - Thân mình: Cơ [kg], Mỡ [kg], ECW% [x.xx]
  - Chân trái: Cơ [kg], Mỡ [kg], ECW% [x.xx]

Bên phải:
  - Tay phải: Cơ [kg], Mỡ [kg], ECW% [x.xx]
  - Thân mình: Cơ [kg], Mỡ [kg], ECW% [x.xx]
  - Chân phải: Cơ [kg], Mỡ [kg], ECW% [x.xx]
```

#### Column 5: Health Assessment (Đánh giá sức khỏe)
```
- Trên-Dưới (T-D Balance)
- Phần trên (Upper Body)
- Phần dưới (Lower Body)
- Mức độ cơ chân (Level)
- Khối lượng cơ bắp chân (kg)
- Protein (kg)
- Khoáng chất (kg)
- Hàm lượng khoáng trong xương (kg)
- Khối lượng tế bào cơ thể (kg)
- Chỉ số khối cơ xương (kg/m²)
- Góc pha toàn bộ cơ thể (°)
```

---

## UI Components

### Card Component
```css
.background: rgba(255, 255, 255, 0.1)
backdrop-filter: blur(10px)
border: 1px solid rgba(255, 255, 255, 0.2)
border-radius: 15px
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2)
transition: transform 0.3s ease
```

### Color Coding
```css
--color-muscle: #10b981  (green/teal)
--color-fat: #ef4444      (red)
--color-water: #06b6d4    (cyan)
--color-score: #8b5cf6    (purple)
--color-positive: #10b981
--color-negative: #ef4444
```

### Typography
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
--label-size: 0.9em;
--value-size: 2em;
--unit-size: 0.4em;
```

---

## Data Flow

1. User clicks report card → trigger `openModal(reportId)`
2. Modal overlays with fade-in animation
3. Renders selected report data in 5-column layout
4. Close modal on:
   - Click X button
   - Click outside modal
   - Press ESC key

---

## Implementation Notes

- Use vanilla JavaScript (no framework needed for this simple app)
- Keep existing index.html structure, add modal at end of body
- Modal markup hidden by default, shown via inline styles
- CSS in `<style>` tag, extend existing styles
- No new dependencies required (Chart.js already loaded)

---

## Excluded Features
- ❌ QR code display
- ❌ Calories Expenditive of Exercise
- ❌ Tracking change history in detail modal (already in main view)
