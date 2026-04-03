# GoPoke Implementation Plan

## Overview
Refactor và implement lại game GoPoke từ project cũ, sửa các issues đã phát hiện.

---

## Phase 1: Setup Project Structure

### 1.1 Copy Core Configs
- [ ] Copy `configs/monster_config.gd` → thêm `attack_type` enum (MELEE/RANGED)
- [ ] Copy `configs/boss_config.gd` → thêm `hp_multiplier`
- [ ] Copy `configs/swampert_config.tres`
- [ ] Copy `configs/rayquaza_config.tres`
- [ ] Copy `skill_data.gd` + skill data files

### 1.2 Copy Skills System
- [ ] Copy `skills/scripts/skill_base.gd`
- [ ] Copy `skills/scripts/Meteor.gd`
- [ ] Copy `skills/scripts/Quake.gd`
- [ ] Copy `skills/scripts/Arrow.gd`
- [ ] Fix: Dùng Tweens thay vì manual frame waiting
- [ ] Fix: Thêm proper null checks

### 1.3 Copy Core Scripts
- [ ] Copy `area_indicator.gd`
- [ ] Copy `Projectile.gd` → Fix: Dùng Area3D signals
- [ ] Copy `monster_skill_caster.gd`

---

## Phase 2: Refactor Core Entities

### 2.1 Player
- [ ] Copy `player.gd` với các fixes:
  - [ ] Đọc HP từ scene/config thay vì hardcode
  - [ ] Thêm `_ready()` cho AnimationPlayer autoplay
  - [ ] Dùng biến instance thay vì `set_meta("locked_target")`
  - [ ] Dùng `_unhandled_input()` thay vì `_input()`

### 2.2 Monster
- [ ] Copy `monster.gd` với các fixes:
  - [ ] Thêm AI State Machine (IDLE → FACING → CASTING)
  - [ ] Null-safe config access
  - [ ] Simplified HP bar với @onready

### 2.3 Boss
- [ ] Copy `boss.gd` (extends Monster)
- [ ] Thêm BossHPBar overlay

### 2.4 GameManager
- [ ] Copy `game_manager.gd` với các fixes:
  - [ ] Tạo scene cho Victory/GameOver UI (thay vì code thuần)
  - [ ] Dùng `get_tree().reload_current_scene()`
  - [ ] Null-safe current_scene access

---

## Phase 3: UI System

### 3.1 HUD
- [ ] Copy `ui/hud.gd` → Dùng find_child thay vì @export
- [ ] Copy `ui/HUD.tscn` scene

### 3.2 Game Over / Victory Scenes
- [ ] Tạo `ui/GameOver.tscn`
- [ ] Tạo `ui/Victory.tscn`

---

## Phase 4: Main Scene

### 4.1 Setup Scene
- [ ] Tạo `main.tscn` với:
  - [ ] Ground plane + Arena
  - [ ] Player (Mega Sceptile)
  - [ ] Monster (Mega Swampert)
  - [ ] Boss (Rayquaza)
  - [ ] DirectionalLight3D
  - [ ] HUD instance

### 4.2 Configure Entities
- [ ] Gán configs cho Monster/Boss
- [ ] Gán skills cho SkillCaster
- [ ] Setup collision layers

---

## Phase 5: Testing

### 5.1 Core Tests
- [ ] Player movement (orbit around target)
- [ ] Target locking + marker
- [ ] Arrow skill casting
- [ ] Monster AI behavior (approach + cast)

### 5.2 Combat Tests
- [ ] Damage calculation
- [ ] HP bar updates
- [ ] Death animation
- [ ] Victory trigger

---

## Issues Fixed Summary

| Issue | Fix Applied |
|-------|-------------|
| HP hardcoded 100 → 1000 | Đọc từ scene/config |
| AnimationPlayer not playing | Thêm _ready() autoplay |
| AI loop không rõ ràng | State machine enum |
| UI bằng code thuần | Tạo .tscn scenes |
| Manual frame waiting | Dùng Tweens |
| Projectile collision | Area3D signals |
| Meta usage for target | Instance variable |

---

## Notes
- Sử dụng Godot MCP để tạo files và scenes
- Test sau mỗi phase nhỏ
- Giữ nguyên data-driven architecture từ bản cũ