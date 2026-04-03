# monster_skill_caster.gd
# Quản lý việc khởi tạo và cast skill cho Monster.
# Sử dụng proper null checks và cleaner code.
extends Node
class_name MonsterSkillCaster

# Skill Registry
const SKILL_REGISTRY: Dictionary = {
	"Meteor": preload("res://skills/scripts/Meteor.gd"),
	"Quake": preload("res://skills/scripts/Quake.gd"),
	# Thêm skill mới ở đây:
	# "Dash": preload("res://skills/scripts/Dash.gd"),
	# "Slash": preload("res://skills/scripts/Slash.gd"),
}

# Kéo thả SkillData .tres vào đây từ Inspector
# Mỗi slot là một SkillData riêng biệt
@export var skill_slot_1: SkillData = null
@export var skill_slot_2: SkillData = null
@export var skill_slot_3: SkillData = null

# Helper để lấy tất cả skill data đã set
func _get_skill_data_array() -> Array:
	var result: Array = []
	if skill_slot_1: result.append(skill_slot_1)
	if skill_slot_2: result.append(skill_slot_2)
	if skill_slot_3: result.append(skill_slot_3)
	return result

# Debug - gọi trong _ready để check skill data
func _check_skills() -> void:
	var list = _get_skill_data_array()
	print("MonsterSkillCaster: Checking ", list.size(), " skills")
	for s in list:
		if s:
			print("  - ", s.skill_name, " (type ", s.skill_poke_type, ")")
		else:
			print("  - NULL")

# Runtime state
var _skill_instances: Array[SkillBase] = []
var _can_cast: bool = true
var _caster: Node3D

func _ready() -> void:
	_check_skills()

var caster: Node3D:
	get: return _caster
	set(v):
		_caster = v
		_build_skill_instances()

func _build_skill_instances() -> void:
	_skill_instances.clear()

	var skill_data_list = _get_skill_data_array()

	for data in skill_data_list:
		if data == null or data.skill_name.is_empty():
			continue

		var script_class = SKILL_REGISTRY.get(data.skill_name)
		if script_class == null:
			push_warning("MonsterSkillCaster: Unknown skill '%s'. Add to SKILL_REGISTRY." % data.skill_name)
			continue

		var inst: SkillBase = script_class.new()
		inst.data = data
		inst.caster = _caster
		_skill_instances.append(inst)

	print("SkillCaster built ", _skill_instances.size(), " skills for ", _caster.name if _caster else "unknown")

func cast(skill: SkillBase, target_pos: Vector3) -> void:
	if not _can_cast or skill == null:
		return
		
	_can_cast = false
	skill.caster = _caster
	await skill.cast(target_pos)
	_can_cast = true

func cast_random(player_pos: Vector3) -> void:
	if _skill_instances.is_empty():
		return
		
	var skill = _skill_instances[randi() % _skill_instances.size()]
	cast(skill, player_pos)

func get_skill_count() -> int:
	return _skill_instances.size()