# monster.gd
# Base script cho Monster và Boss
# Đã fix: AI state machine, null-safe config access, simplified HP bar
extends CharacterBody3D
class_name Monster

## AI States
enum AIState { IDLE, APPROACHING, FACING, CASTING }

# --- Config (kéo thả MonsterConfig .tres vào Inspector) ---
@export var config: MonsterConfig

# --- Runtime stats ---
var max_hp: int = 100
var hp: int = 100
var _rotation_speed: float = 5.0
var _idle_animation: String = "Idle"

# --- Nodes ---
@onready var skill_caster: MonsterSkillCaster = $MonsterSkillCaster if has_node("MonsterSkillCaster") else null

# Animation
var anim_player: AnimationPlayer

# HP bar
var hp_bar_fill: MeshInstance3D
var hp_name_label: Label3D
var hp_num_label: Label3D
var _bar_max_size: float = 2.0

# --- AI State ---
var _ai_state: AIState = AIState.IDLE
var _target_yaw: float = 0.0
var _pending_skill: SkillBase = null
var _pending_cast_pos: Vector3 = Vector3.ZERO
var _face_update_timer: float = 0.0
var _ai_active: bool = true

# Config values
var _face_update_interval: float = 0.8
var _move_speed: float = 2.5
var _melee_range: float = 2.0

# --- Signals ---
signal hp_changed(current: int, max_hp: int)
signal died

const PI = 3.141592653589793
const TAU = PI * 2.0

# --- Lifecycle ---

func _ready() -> void:
	# Tìm AnimationPlayer
	anim_player = _find_animation_player()
	
	# Tìm HP bar nodes
	hp_bar_fill = get_node_or_null("HPBarFill")
	hp_name_label = get_node_or_null("HPNameLabel")
	hp_num_label = get_node_or_null("HPNumLabel")
	
	# Apply config
	if config != null:
		_apply_config()
	else:
		_apply_defaults()
	
	# Setup SkillCaster
	if skill_caster:
		skill_caster.caster = self
	
	# Start AI after delay
	var delay = 1.0
	if config and "delay_before_first_cast" in config:
		delay = config.delay_before_first_cast
		
	await get_tree().create_timer(delay).timeout
	
	if skill_caster and skill_caster.get_skill_count() > 0:
		_start_ai_loop()

func _find_animation_player() -> AnimationPlayer:
	var common_names = ["megaswampert2", "rayquaza3d", "megasceptile2"]
	for name in common_names:
		if has_node(name):
			var node = get_node(name)
			if node.has_node("AnimationPlayer"):
				return node.get_node("AnimationPlayer")
	
	return find_child("AnimationPlayer", true, false)

# --- Config ---

func _apply_config() -> void:
	if config == null:
		return
		
	max_hp = config.max_hp
	hp = max_hp
	_rotation_speed = config.rotation_speed
	_move_speed = config.move_speed
	_idle_animation = config.idle_animation
	
	if "face_update_interval" in config:
		_face_update_interval = config.face_update_interval
	if "melee_cast_range" in config:
		_melee_range = config.melee_cast_range
	
	# Play idle animation
	if anim_player and anim_player.has_animation(_idle_animation):
		anim_player.play(_idle_animation)
	
	# Setup HP bar
	_setup_hp_bar_display()

func _apply_defaults() -> void:
	max_hp = 100
	hp = max_hp
	_rotation_speed = 5.0
	_move_speed = 2.5
	_melee_range = 2.0
	_idle_animation = "Idle"
	
	if anim_player and anim_player.has_animation(_idle_animation):
		anim_player.play(_idle_animation)
	
	_setup_hp_bar_display()

func _setup_hp_bar_display() -> void:
	var display_name = config.display_name if config and "display_name" in config else name
	
	if hp_name_label:
		hp_name_label.text = display_name
	if hp_num_label:
		hp_num_label.text = "%d/%d" % [hp, max_hp]
	
	if hp_bar_fill and hp_bar_fill.mesh is BoxMesh:
		_bar_max_size = (hp_bar_fill.mesh as BoxMesh).size.x
		hp_changed.connect(_on_hp_bar_update)

# --- Combat ---

func take_damage(amount: int) -> void:
	hp = max(0, hp - amount)
	emit_signal("hp_changed", hp, max_hp)
	if hp <= 0:
		die()

func die() -> void:
	_ai_active = false
	_pending_skill = null
	
	# Cleanup HP bar
	_cleanup_hp_bar()
	
	# Death animation
	var tween = create_tween()
	tween.tween_property(self, "scale", Vector3.ZERO, 0.4).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	await tween.finished
	
	emit_signal("died")
	queue_free()

func _cleanup_hp_bar() -> void:
	if hp_name_label:
		hp_name_label.queue_free()
	if hp_num_label:
		hp_num_label.queue_free()
	if hp_bar_fill:
		hp_bar_fill.queue_free()
	var hp_bg = get_node_or_null("HPBarBg")
	if hp_bg:
		hp_bg.queue_free()

# --- AI ---

func _start_ai_loop() -> void:
	while _ai_active and hp > 0:
		await get_tree().process_frame
		_update_ai()

func _update_ai() -> void:
	var player = _get_player()
	if player == null:
		return
		
	var player_pos = player.global_transform.origin
	var dist = global_transform.origin.distance_to(player_pos)
	
	# State machine
	match _ai_state:
		AIState.IDLE:
			# Chuyển sang APPROACHING nếu là melee và chưa đủ gần
			if config and config.is_melee() and dist > _melee_range:
				_ai_state = AIState.APPROACHING
			elif config and config.is_ranged():
				# Ranged: chuyển thẳng sang CASTING
				skill_caster.cast_random(player_pos)
		
		AIState.APPROACHING:
			if config and config.is_melee():
				if dist > _melee_range:
					# Di chuyển về phía player
					var dir = (player_pos - global_transform.origin).normalized()
					velocity = dir * _move_speed
					move_and_slide()
				else:
					# Đủ gần, chuyển sang FACING
					_ai_state = AIState.FACING
					_update_face_target(player_pos)
			else:
				_ai_state = AIState.IDLE
		
		AIState.FACING:
			var diff = _short_angle_diff(rotation.y, _target_yaw)
			if abs(diff) < 0.02:
				rotation.y = _target_yaw
				_ai_state = AIState.CASTING
				_pending_cast_pos = player_pos
				skill_caster.cast_random(_pending_cast_pos)
				# Sau khi cast xong, quay về IDLE
				await get_tree().create_timer(1.0).timeout
				_ai_state = AIState.IDLE
			else:
				# Quay từ từ
				var step = _rotation_speed * get_physics_process_delta_time()
				rotation.y += clamp(diff, -step, step)
		
		AIState.CASTING:
			# Đợi cast hoàn thành
			await get_tree().create_timer(0.5).timeout
			_ai_state = AIState.IDLE

func _get_player() -> Node3D:
	return get_tree().get_first_node_in_group("Player")

func _update_face_target(pos: Vector3) -> void:
	var dir = pos - global_transform.origin
	dir.y = 0
	if dir.length() > 0.001:
		_target_yaw = atan2(-dir.x, -dir.z)

func _short_angle_diff(from_angle: float, to_angle: float) -> float:
	var d = to_angle - from_angle
	while d > PI: d -= TAU
	while d < -PI: d += TAU
	return d

# --- HP Bar ---

func _hp_color_ratio(ratio: float) -> Color:
	if ratio > 0.5:
		return Color(0.2, 1.0, 0.2)
	elif ratio > 0.25:
		return Color(1.0, 0.8, 0.0)
	else:
		return Color(1.0, 0.2, 0.2)

func _on_hp_bar_update(current: int, max_val: int) -> void:
	var ratio = float(current) / float(max_val) if max_val > 0 else 0.0
	
	if hp_bar_fill and hp_bar_fill.mesh is BoxMesh:
		var box: BoxMesh = hp_bar_fill.mesh as BoxMesh
		var new_size = maxf(ratio * _bar_max_size, 0.01)
		var half_diff = (_bar_max_size - new_size) / 2.0
		box.size.x = new_size
		hp_bar_fill.position.x = half_diff
		
		if hp_bar_fill.material_override == null:
			hp_bar_fill.material_override = StandardMaterial3D.new()
		hp_bar_fill.material_override.albedo_color = _hp_color_ratio(ratio)
	
	if hp_name_label:
		var display = config.display_name if config and "display_name" in config else name
		hp_name_label.text = display
	if hp_num_label:
		hp_num_label.text = "%d/%d" % [current, max_val]

func aim_at(target_pos: Vector3, skill: SkillBase) -> void:
	_update_face_target(target_pos)
	_pending_skill = skill
	_pending_cast_pos = target_pos