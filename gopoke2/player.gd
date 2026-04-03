# player.gd
# Player controller với orbit movement và Arrow skill
# Đã fix: animation _ready, input handling, target tracking
extends CharacterBody3D
class_name Player

# --- CONFIG ---
@export var speed: float = 5.0
@export var orbit_angle_speed: float = 3.0
@export var zoom_speed: float = 20.0
@export var max_hp: int = 1000  # Theo REQUIREMENTS

# --- SKILL CONFIG ---
@export var arrow_skill_data: SkillData

# --- Player SKILL REGISTRY ---
const PLAYER_SKILL_REGISTRY: Dictionary = {
	"Arrow": preload("res://skills/scripts/Arrow.gd"),
}

# --- NODES ---
@onready var camera: Camera3D = $CameraPivot/Camera3D

# Target marker
var target_marker: MeshInstance3D

# --- STATE ---
var current_target: Node = null
var orbit_angle: float = 0.0
var orbit_radius: float = 3.0
var hp: int
var _arrow_cooldown: bool = true

# Animation
var anim_player: AnimationPlayer

signal hp_changed(current: int, max: int)

func _ready() -> void:
	# Tìm AnimationPlayer
	anim_player = _find_animation_player()
	if anim_player and anim_player.has_animation("Idle"):
		anim_player.play("Idle")
	
	# Setup GameManager
	var gm = get_tree().get_first_node_in_group("GameManager")
	if gm:
		gm.register_player(self)
	
	# Init HP
	hp = max_hp
	emit_signal("hp_changed", hp, max_hp)
	
	# Khởi tạo target marker
	_setup_marker()

func _find_animation_player() -> AnimationPlayer:
	# Thử các tên phổ biến
	var names = ["megasceptile2", "AnimationPlayer", "Model"]
	for n in names:
		if has_node(n):
			var node = get_node(n)
			if node is AnimationPlayer:
				return node
	
	# Tìm đệ quy
	return find_child("AnimationPlayer", true, false)

func _setup_marker() -> void:
	target_marker = MeshInstance3D.new()
	target_marker.name = "TargetMarker"
	target_marker.mesh = SphereMesh.new()
	target_marker.scale = Vector3(0.3, 0.3, 0.3)
	
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color.RED
	mat.emission_enabled = true
	mat.emission = Color(0.5, 0, 0)
	target_marker.material_override = mat
	
	get_parent().add_child.call_deferred(target_marker)
	target_marker.visible = false

# --- Public Methods ---

func get_current_target() -> Node:
	return current_target

func take_damage(amount: int) -> void:
	hp = max(0, hp - amount)
	print("Player took ", amount, " damage. HP = ", hp)
	emit_signal("hp_changed", hp, max_hp)
	if hp <= 0:
		die()

func heal(amount: int) -> void:
	hp = clamp(hp + amount, 0, max_hp)
	emit_signal("hp_changed", hp, max_hp)

func die() -> void:
	print("Player died!")
	# Cleanup marker
	if target_marker:
		target_marker.queue_free()
	queue_free()
	
	# Notify GameManager
	var gm = get_tree().get_first_node_in_group("GameManager")
	if gm and gm.has_method("on_player_died"):
		gm.on_player_died()

# --- Arrow Skill ---

func _cast_arrow() -> void:
	if not _arrow_cooldown or arrow_skill_data == null:
		return
	if current_target == null:
		print("No target locked — cannot cast Arrow")
		return

	_arrow_cooldown = false
	
	var script_class = PLAYER_SKILL_REGISTRY.get(arrow_skill_data.skill_name)
	if script_class == null:
		push_error("Arrow skill not found in PLAYER_SKILL_REGISTRY")
		return

	var skill: SkillBase = script_class.new()
	skill.data = arrow_skill_data
	skill.caster = self
	
	skill.cast(current_target.global_transform.origin)

	# Cooldown
	if arrow_skill_data.cooldown > 0:
		await get_tree().create_timer(arrow_skill_data.cooldown).timeout
	_arrow_cooldown = true

# --- Input Handling ---

func _unhandled_input(event: InputEvent) -> void:
	# Click để lock target hoặc cast Arrow
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_handle_click(event.position)
	
	# Phím F để cast Arrow
	if event is InputEventKey and event.pressed and event.keycode == Key.KEY_F:
		_cast_arrow()

func _handle_click(screen_pos: Vector2) -> void:
	var cam = get_viewport().get_camera_3d()
	if not cam:
		return

	var from = cam.project_ray_origin(screen_pos)
	var dir = cam.project_ray_normal(screen_pos)
	var to = from + dir * 100

	var params = PhysicsRayQueryParameters3D.new()
	params.from = from
	params.to = to
	params.collision_mask = 1

	var space_state = get_world_3d().direct_space_state
	var result = space_state.intersect_ray(params)

	if result:
		var collider = result.collider
		if collider == self or collider.is_in_group("Player"):
			# Click lên chính mình → cast Arrow
			_cast_arrow()
		elif collider.is_in_group("Enemy"):
			lock_target(collider)
	else:
		# Click vào khoảng trống → cast Arrow nếu có target
		if current_target:
			_cast_arrow()

# --- Target Locking ---

func lock_target(target_node: Node) -> void:
	# Ngắt signal cũ
	if current_target and current_target.has_signal("died"):
		if current_target.died.is_connected(_on_target_died):
			current_target.died.disconnect(_on_target_died)

	current_target = target_node
	target_marker.visible = true
	
	# Lắng nghe khi target chết
	if target_node.has_signal("died"):
		target_node.died.connect(_on_target_died)

	# Tính orbit ban đầu
	var flat_player_pos = Vector3(global_transform.origin.x, target_node.global_transform.origin.y, global_transform.origin.z)
	orbit_radius = (flat_player_pos - target_node.global_transform.origin).length()
	orbit_angle = atan2(
		global_transform.origin.z - target_node.global_transform.origin.z,
		global_transform.origin.x - target_node.global_transform.origin.x
	)

	print("Locked target: ", target_node.name, " Orbit radius: ", orbit_radius)

func _on_target_died() -> void:
	current_target = null
	if target_marker:
		target_marker.visible = false

# --- Movement ---

func _physics_process(delta: float) -> void:
	if current_target and is_instance_valid(current_target):
		_update_orbit_movement(delta)
		_update_marker_position()

func _update_orbit_movement(delta: float) -> void:
	# Marker luôn bám đầu target
	target_marker.global_transform.origin = current_target.global_transform.origin + Vector3(0, 2, 0)
	
	# Orbit input
	var orbit_input = 0
	if Input.is_key_pressed(Key.KEY_LEFT):
		orbit_input += 1
	if Input.is_key_pressed(Key.KEY_RIGHT):
		orbit_input -= 1
	
	if orbit_input != 0:
		orbit_angle += orbit_input * orbit_angle_speed * delta
	
	# Zoom input
	var zoom_input = 0
	if Input.is_key_pressed(Key.KEY_UP):
		zoom_input -= 1
	if Input.is_key_pressed(Key.KEY_DOWN):
		zoom_input += 1
	
	if zoom_input != 0:
		orbit_radius += zoom_input * delta * zoom_speed
		orbit_radius = max(1.0, orbit_radius)
	
	# Tính vị trí mới
	var target_pos = current_target.global_transform.origin
	var new_pos = Vector3(
		target_pos.x + orbit_radius * cos(orbit_angle),
		global_transform.origin.y,
		target_pos.z + orbit_radius * sin(orbit_angle)
	)
	global_transform.origin = new_pos
	
	# Quay về target mượt
	var desired_rotation = (target_pos - global_transform.origin).normalized()
	var current_forward = -global_transform.basis.z
	var lerped_dir = current_forward.lerp(desired_rotation, delta * 10.0).normalized()
	
	if abs(lerped_dir.y) < 0.99:
		look_at(global_transform.origin + lerped_dir, Vector3.UP)

func _update_marker_position() -> void:
	if current_target and is_instance_valid(current_target):
		target_marker.global_transform.origin = current_target.global_transform.origin + Vector3(0, 2, 0)