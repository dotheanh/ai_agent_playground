extends Resource
class_name MonsterConfig

## Attack type enum
enum AttackType { MELEE = 0, RANGED = 1 }

@export var display_name: String = "Monster"
@export var max_hp: int = 100
@export_enum("MELEE", "RANGED") var attack_type: int = 1  # Default: RANGED
@export var move_speed: float = 2.5
@export var melee_cast_range: float = 2.0
@export var delay_before_first_cast: float = 1.0
@export var rotation_speed: float = 5.0
@export var skills: Array[SkillData] = []
@export var idle_animation: String = "Idle"
@export var collision_radius: float = 0.5
@export var collision_height: float = 2.0
@export var poke_type: int = 2  # Default: Water type

## Helper to check if melee
func is_melee() -> bool:
	return attack_type == AttackType.MELEE

## Helper to check if ranged
func is_ranged() -> bool:
	return attack_type == AttackType.RANGED