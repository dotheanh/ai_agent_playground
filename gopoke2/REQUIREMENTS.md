# GoPoke - Project Requirements
> Last updated: 2026-03-23

## 1. Project Overview

**Type:** 3D Action Arena Game (Godot 4.4.1)
**Summary:** Player controls a Pokémon character in a 3D arena, fighting against Monsters and Bosses using an orbit-based movement system and monster auto-casting skills.
**Target:** Single-player arena combat against AI-controlled Pokémon enemies.

---

## 2. Architecture Overview

### Config-Driven Design
All Monster/Boss behavior is **data-driven** via `.tres` Resource files.
No hardcoded stats in scripts — every entity reads from its config.

```
gopoke/
├── configs/
│   ├── monster_config.gd      ← base config (HP, AI, skills)
│   ├── boss_config.gd          ← extends MonsterConfig (adds hp_multiplier)
│   ├── swampert_config.tres    ← Mega Swampert: 50 HP, Meteor(dmg30)+Quake(dmg20)
│   ├── rayquaza_config.tres     ← Rayquaza: 300 HP (60×5), Meteor(dmg50)+Quake(dmg20)
│   ├── meteor_skill_data.tres  ← [scene refs] meteor in swampert scene
│   ├── quake_skill_data.tres   ← [scene refs] quake in swampert scene
│   └── arrow_skill_data.tres   ← Arrow for player
└── skills/
    ├── meteor_skill.tres        ← meteor used in scene (dmg50, speed50)
    ├── quake_skill.tres         ← quake used in scene (dmg20, speed0)
    └── scripts/
        ├── skill_base.gd
        ├── Meteor.gd
        ├── Quake.gd
        └── Arrow.gd
```

**Tạo Monster mới:** Tạo `.tres` mới, gán vào `@export var config` trong Inspector. Set `attack_type` (0=ranged, 1=melee).
**Tạo Boss mới:** Tạo `.tres` từ `BossConfig`, gán vào `@export var config`.
**Tạo Skill mới:** Tạo script mới extends `SkillBase`, thêm vào `SKILL_REGISTRY`, tạo `SkillData.tres`.

---

## 3. Core Entities

### 3.1 Player
- **Script:** `res://player.gd`
- **Type:** `CharacterBody3D`
- **Model:** Mega Sceptile
- **Pokemon Type:** Grass (hiệu quả x4 với Water monster)
- **Controls:**
  - **Left Click on Enemy** → Lock target (Enemy in group "Enemy")
  - **Left Click on Player / Key F** → Cast Arrow at locked target
  - **Arrow Left/Right** → Orbit around locked target
  - **Arrow Up/Down** → Move closer/farther from target
- **Stats:** HP (scene set to 1000)
- **Skills:**
  - **Arrow** (ArrowSkill) → bắn tên đường thẳng đến target (15 dmg, 1.5s cooldown, speed 30)
  - **Trigger:** Click lên chính player HOẶC nhấn phím F (khi đã lock target)
- **Features:**
  - Red marker above locked target
  - Smooth rotation toward target
  - Arrow cooldown indicator
  - Die → Game Over screen → Restart

### 3.2 Monster
- **Script:** `res://monster.gd` (`class_name Monster`)
- **Type:** `CharacterBody3D`
- **Model:** Mega Swampert
- **Pokemon Type:** Water (bị Grass Arrow đánh x2 damage)
- **Config:** `swampert_config.tres`
- **HP:** 50 (config-driven, displayed via Label3D HP bar)
- **Attack Type:** `MELEE` (đánh gần)
- **AI Behavior:**
  - Reads stats from `@export var config: MonsterConfig`
  - **Melee Monster:** Di chuyển liên tục về phía player cho đến khi `distance <= melee_cast_range`, sau đó cast skill
  - **Ranged Monster:** Đứng yên, cast skill từ xa
  - Smooth rotation to face Player (0.8s interval) before casting
  - Each skill: cast_time, cooldown, damage, range, shape
- **Signals:** `hp_changed(current, max_hp)`, `died`
- **Features:**
  - Label3D HP bar above head (green→yellow→red by HP ratio)
  - Death animation: scale-down + fade-out in 0.4s → queue_free()

### 3.3 Boss
- **Script:** `res://boss.gd` (`extends Monster`, `class_name Boss`)
- **Type:** `CharacterBody3D`
- **Model:** Rayquaza
- **Pokemon Type:** Dragon (neutral với Grass)
- **Config:** `rayquaza_config.tres`
- **HP:** 300 (60 × 5 hp_multiplier)
- **Attack Type:** `RANGED` (đánh xa, default)
- **HP Bar:** BossHPBar CanvasLayer (màu đỏ, fixed ở trên màn hình)
- **Behavior:** Same as Monster + auto-scale HP via `hp_multiplier` + different idle animation

---

## 4. Skill System

### 4.1 Architecture

```
MonsterSkillCaster (monster_skill_caster.gd)
  ├── SKILL_REGISTRY: Dictionary  ← name → Script (preload)
  ├── @export var skills: Array[SkillData]  ← kéo thả .tres vào Inspector
  └── _skill_instances: Array[SkillBase]   ← runtime instances
        ├── SkillData (resource .tres)
        └── SkillBase (skills/scripts/skill_base.gd)
              ├── cast(target_pos)  → show_indicator + execute
              ├── show_indicator()  → AreaIndicator
              ├── execute()        → override per skill
              └── get_indicator_position() → override per skill
```

### 4.2 Skill Registry (monster_skill_caster.gd)
```gdscript
const SKILL_REGISTRY: Dictionary = {
    "Meteor": preload("res://skills/scripts/Meteor.gd"),
    "Quake":  preload("res://skills/scripts/Quake.gd"),
    # Thêm skill mới ở đây khi tạo
}
```

### 4.2b Player Skill Registry (player.gd)
```gdscript
const PLAYER_SKILL_REGISTRY: Dictionary = {
    "Arrow": preload("res://skills/scripts/Arrow.gd"),
}
```

### 4.3 SkillData Resource (skill_data.gd + .tres)
| Property | Type | Mô tả |
|----------|------|--------|
| `skill_name` | String | Tên class (phải khớp key trong SKILL_REGISTRY) |
| `shape` | String | "circle", "line", "cone", "box" |
| `size` | Vector3 | Kích thước indicator |
| `damage` | int | Sát thương |
| `effect_range` | float | Bán kính AOE |
| `cast_time` | float | Thời gian hiện indicator |
| `cooldown` | float | Thời gian chờ giữa các lần cast |
| `speed` | float | Tốc độ projectile (Meteor) |

### 4.4 Existing Skills

#### Meteor (skills/scripts/Meteor.gd)
- Spawns `Projectile` node at caster position (y+5)
- Projectile flies toward Player's last known position
- On hit → check distance to Player ≤ radius → deal damage
- `Projectile.gd` uses `Area3D` + `MeshInstance3D` (orange sphere)
- Scale mesh by `radius` property

#### Quake (skills/scripts/Quake.gd)
- Indicator spawns at **caster position** (not target)
- On execute → check Player distance to caster ≤ `effect_range` → deal damage
- No projectile

#### Arrow (skills/scripts/Arrow.gd)
- **Caster:** Player (MegasSceptile) — cast via click on player or key F
- Straight-line projectile (Area3D + CylinderMesh, green)
- Flies from caster toward locked target position
- On collision with locked target → `target.take_damage(damage)`
- Shape: box, damage 15, speed 30, cooldown 1.5s, cast_time 0.2s

### 4.5 Required New Skills (TODO)

| Skill | Shape | Behavior |
|-------|-------|----------|
| **Dash** | circle | Monster dashes toward Player, melee damage |
| **Slash** | cone | Fan-shaped sword sweep in front of monster |

### 4.6 Area Indicator (area_indicator.gd)
- `MeshInstance3D` with transparent red material
- Shapes: CylinderMesh (circle/cone), BoxMesh (line/box)
- Spawned before cast, freed after cast time

---

## 5. Player Movement System

- **Orbit model:** Player moves on a circle around locked target
- **Orbit angle** updated by Left/Right arrow keys
- **Orbit radius** updated by Up/Down arrow keys (min 1.0)
- **Camera:** Child of Player (`CameraPivot/Camera3D`), follows Player position
- **Rotation:** Player smoothly rotates to face target (lerp factor 10.0)

---

## 6. Combat & Damage

### 6.1 Player Damage
- `player.take_damage(amount)` → reduce HP → emit `hp_changed` signal
- HP reaches 0 → `die()` → `queue_free()` → `GameManager.on_player_died()`

### 6.2 Monster Damage
- `monster.take_damage(amount)` → reduce HP → emit `hp_changed` → if HP ≤ 0 → `die()`
- `die()` → emit `died` signal → `queue_free()`

### 6.3 Projectile Collision
- `Projectile` uses `Area3D` physics
- On enter radius → call `hit_target()` → deal damage to Player → `queue_free()`

---

## 7. UI System

### 7.1 HUD (res://ui/HUD.tscn)
- Scene: `res://ui/HUD.tscn` + `res://ui/hud.gd`
- Loaded in `GameManager._ensure_hud()`
- Binds to Player via `hud.bind_player(player)`
- Displays: Player HP bar (via `hp_changed` signal)

### 7.2 Game Over Screen (game_manager.gd)
- Spawned on Player death
- CanvasLayer with semi-transparent background
- "GAME OVER" label + "Restart" button
- `get_tree().paused = true`
- Restart → reload current scene

---

## 8. GameManager (Global Singleton)

**Script:** `res://game_manager.gd`
**Autoload:** `GameManagerGlobal`

Responsibilities:
- Hold reference to Player
- Instantiate and manage HUD
- Handle Player death → Game Over
- Provide `get_tree()` access to skills

---

## 9. Required Features (TODO)

### 9.1 Monster HP Bar ✅ DONE
- `Label3D` node on each Monster/Boss, positioned above head
- Display: `{name}: {current}/{max}`
- Color: green (>50%) → yellow (25–50%) → red (<25%)
- Update on `take_damage()` via `hp_changed` signal
- Boss: red tint, larger font

### 9.2 Player Skill Buttons ✅ DONE
- Arrow skill triggered by: **click on player** or **key F** or **click empty space when target locked**
- Works only when a target is locked
- Cooldown: 1.5s (controlled via `_arrow_cooldown` flag)

### 9.3 Player Offensive Skills ✅ DONE (Arrow)
- Arrow: ranged projectile, 15 dmg, flies toward locked target
- Target detection via `locked_target` meta
- On Monster HP = 0 → `die()` → scale animation → `queue_free()`
- Arrow indicator: box mesh from caster→target, rotated along flight path

### 9.4 Death & Destruction ✅ DONE
- `die()` → stop AI, scale to zero (0.4s tween) → `queue_free()`
- HP bar label auto-freed with `queue_free()`
- Boss HP = 300 (60 × 5 multiplier), Swampert HP = 50

### 9.5 Target Lock Cleanup ✅ DONE
- When locked target dies → marker hidden, `current_target` set to null
- Player listens to target's `died` signal for auto-unlock
- Previous target's signal disconnected when locking new target

### 9.6 Victory / All Enemies Dead ✅ DONE
- GameManager counts all "Enemy" group nodes at scene start
- Each enemy `died` signal → decrement counter
- When counter reaches 0 → show "VICTORY!" screen with Replay button
- Same pause + restart flow as Game Over

---

## 10. Scene Structure

```
main.tscn
├── Main (Node3D + DebugObjects.gd)
│   ├── Plane (MeshInstance3D) — ground plane
│   ├── Arena (MeshInstance3D)
│   ├── Player (CharacterBody3D + player.gd)
│   │   ├── megasceptile2 (model)
│   │   ├── CameraPivot/Camera3D
│   │   ├── CollisionShape3D
│   │   └── HPBarLabel (Label3D) ← TODO
│   ├── Monster (CharacterBody3D + monster.gd) [config=swampert_config.tres]
│   │   ├── megaswampert2 (model)
│   │   ├── HPBarLabel (Label3D) ← ✅ hiển thị HP
│   │   ├── MonsterSkillCaster [skills=[quake_skill_data.tres]]
│   │   └── CollisionShape3D
│   ├── Boss (CharacterBody3D + boss.gd) [config=rayquaza_config.tres]
│   │   ├── rayquaza3d (model)
│   │   ├── HPBarLabel (Label3D) ← ✅ hiển thị HP
│   │   ├── MonsterSkillCaster [skills=[meteor_skill_data.tres]]
│   │   └── CollisionShape3D
│   └── DirectionalLight3D
└── HUD (CanvasLayer + HUD.tscn)
```

---

## 11. File Inventory

### Core Scripts
| File | Purpose |
|------|---------|
| `res://player.gd` | Player movement, lock target, HP, Arrow skill cast |
| `res://monster.gd` | Monster AI (config-driven), auto-cast, rotation, HP bar |
| `res://boss.gd` | Boss (extends Monster, config-driven) |
| `res://game_manager.gd` | Global singleton, HUD, Game Over |
| `res://monster_skill_caster.gd` | Skill registry, instantiation & casting |
| `res://skill_data.gd` | Skill resource data class |
| `res://area_indicator.gd` | Skill area visualization |
| `res://Projectile.gd` | Flying projectile (Meteor) |
| `res://monster-hp-bar.gd` | HP bar Label3D logic (color, death cleanup) |

### Skill Scripts
| File | Purpose |
|------|---------|
| `res://player.gd` | Player movement, lock target, HP |
| `res://monster.gd` | Monster AI (config-driven), auto-cast, rotation |
| `res://boss.gd` | Boss (extends Monster, config-driven) |
| `res://game_manager.gd` | Global singleton, HUD, Game Over |
| `res://monster_skill_caster.gd` | Skill registry, instantiation & casting |
| `res://skill_data.gd` | Skill resource data class |
| `res://area_indicator.gd` | Skill area visualization |
| `res://Projectile.gd` | Flying projectile (Meteor) |

### Skill Scripts
| File | Purpose |
|------|---------|
| `res://skills/scripts/skill_base.gd` | Base class for all skills |
| `res://skills/scripts/Meteor.gd` | Meteor skill (monster) |
| `res://skills/scripts/Quake.gd` | Quake skill (monster) |
| `res://skills/scripts/Arrow.gd` | Arrow skill (player) |

### Type System & Damage
| File | Purpose |
|------|---------|
| `res://configs/pokemon_type.gd` | 17-type enum, effectiveness matrix, colors |
| `res://type_icon_builder.gd` | Procedural Sprite3D type icons |
| `res://damage_helper.gd` | Type effectiveness calc + popup spawner |
| `res://damage_popup.gd` | Floating damage Label3D |

### Config Files (`.gd` = class, `.tres` = data)
| File | Purpose |
|------|---------|
| `res://configs/monster_config.gd` | Monster base config class (attack_type, move_speed, melee_cast_range) |
| `res://configs/boss_config.gd` | Boss config class (extends MonsterConfig) |
| `res://configs/swampert_config.tres` | Mega Swampert: 50 HP, **MELEE**, move_speed=2.5 |
| `res://configs/rayquaza_config.tres` | Rayquaza: 300 HP (60×5), **RANGED**, Meteor+Quake |
| `res://configs/meteor_skill_data.tres` | Meteor SkillData |
| `res://configs/quake_skill_data.tres` | Quake SkillData |
| `res://configs/arrow_skill_data.tres` | Arrow SkillData (player) |

### UI
| File | Purpose |
|------|---------|
| `res://ui/HUD.tscn` | HUD scene |
| `res://ui/hud.gd` | HUD logic |

---

## 12. Technical Notes

- **Godot Version:** 4.4.1-stable
- **Renderer:** Mobile
- **Viewport:** 720×1280, Window: 540×960
- **Autoloads:** `GameManagerGlobal`, `MCPGameInspector`, `MCPInputService`, `MCPScreenshot`
- **Models:** Mega Sceptile (Player), Mega Swampert (Monster), Rayquaza (Boss)
- **Animations:** `Idle`, `Animation` (per model)

---

## 14. Pokemon Type System

### 14.1 Type Enum & Effectiveness Matrix
- **Script:** `res://configs/pokemon_type.gd` (`class_name PokemonType`)
- **17 Types:** Normal, Fire, Water, Grass, Electric, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel
- **Matrix:** Full type chart (same as real Pokemon games)
  - `2.0` → super effective (hiển thị **vàng**, "SUPER EFFECTIVE!")
  - `0.5` → resistant (hiển thị **xanh dương**, "NOT VERY EFFECTIVE...")
  - `0.0` → immune (hiển thị **xám**, "No effect!")
  - `1.0` → neutral (trắng)

### 14.2 Type Colors
- Fire: đỏ cam | Water: xanh dương | Grass: xanh lá
- Electric: vàng | Ice: xanh nhạt | Dragon: tím đậm
- (Xem `pokemon_type.gd` → `get_type_color()`)

### 14.3 Poke Type Assignment
- **Player (Mega Sceptile):** Grass (GRASS = 3)
- **Monster (Mega Swampert):** Water (WATER = 2)
- **Boss (Mega Rayquaza):** Dragon (DRAGON = 14)
- Config: `@export var poke_type: int` trong `MonsterConfig`

### 14.4 Damage Popup (Floating Number)
- **Script:** `res://damage_popup.gd`
- `Label3D` billboard, bay lên + fade out trong 1.0s
- Màu chữ theo effectiveness:
  - **Vàng** = super effective
  - **Xanh dương** = resistant
  - **Xám** = immune
  - **Trắng** = neutral

### 14.5 Damage Helper
- **Script:** `res://damage_helper.gd`
- `DamageHelper.damage_player(skill_type, base_damage)` → tính effectiveness + spawn popup
- `DamageHelper.damage_monster(skill_type, monster, base_damage)` → tính effectiveness + spawn popup

### 14.6 Type Icon (Procedural Sprite3D)
- **Script:** `res://type_icon_builder.gd`
- Tạo icon màu tròn procedural (không cần tải ảnh)
- `TypeIconBuilder.make_type_sprite(type)` → `Sprite3D` billboard
- Icon đặt bên trái tên Pokemon (trên HP bar label)

---

## 15. Unresolved Questions

1. ~~Arrow skill parameters~~ — ✅ DONE: 15 dmg, speed 30, 1.5s cooldown
2. ~~Player offensive skill~~ — ✅ DONE: Arrow, click on player/key F/empty click
3. ~~Monster HP bar~~ — ✅ DONE: Label3D, green→yellow→red, auto-clean on death
4. ~~Death animation~~ — ✅ DONE: scale-to-zero, 0.4s
5. ~~Boss behavior~~ — ✅ DONE: same as Monster + HP multiplier + BossHPBar overlay
6. Dash/Slash skills for monsters — still TODO
7. ~~Target lock cleanup~~ — ✅ DONE: marker hidden on target death, signal-based
8. ~~Victory screen~~ — ✅ DONE: VICTORY! screen when all enemies dead
9. ~~Pokemon Type System~~ — ✅ DONE: 17 types, effectiveness matrix, type icons, damage popup
10. Type icon cho Player HP bar — still TODO (Player hiện chưa có HP bar 3D)
