# Projectile.gd
# Flying projectile (Meteor) - sử dụng Area3D signals
extends Area3D
class_name Projectile

@export var speed: float = 10.0
@export var damage: int = 30
@export var radius: float = 1.0  # Bán kính va chạm

var target_pos: Vector3
var caster: Node3D

# Mesh hiển thị
var mesh_instance: MeshInstance3D

func _ready() -> void:
	# Tạo mesh hình cầu màu cam
	mesh_instance = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radial_segments = 16
	sphere.rings = 8
	sphere.radius = 0.5
	mesh_instance.mesh = sphere
	
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(1, 0.5, 0)
	mesh_instance.material_override = mat
	add_child(mesh_instance)

	# Thêm collision shape cho Area3D
	var col_shape = CollisionShape3D.new()
	var shape = SphereShape3D.new()
	shape.radius = radius
	col_shape.shape = shape
	add_child(col_shape)

	# Dùng Area3D signal thay vì manual physics
	area_entered.connect(_on_area_entered)
	
	# Sync scale theo radius
	_update_mesh_scale()

func _update_mesh_scale() -> void:
	if mesh_instance:
		mesh_instance.scale = Vector3.ONE * radius

func _physics_process(delta: float) -> void:
	if target_pos == Vector3.ZERO:
		return
		
	var dir = target_pos - global_transform.origin
	var distance = dir.length()
	
	if distance < 0.5:
		hit_target()
		return
		
	dir = dir.normalized()
	var move_dist = min(speed * delta, distance)
	global_translate(dir * move_dist)

func _on_area_entered(area: Node) -> void:
	# Kiểm tra nếu va vào player
	if area.is_in_group("Player"):
		if area.has_method("take_damage"):
			area.take_damage(damage)
			print("Player hit by ", name, " for ", damage, " HP")
		queue_free()

func hit_target() -> void:
	# Fallback: kiểm tra player gần đó
	var player = get_tree().get_first_node_in_group("Player")
	if player:
		var player_pos = player.global_transform.origin
		var dist = (Vector3(player_pos.x, 0, player_pos.z) - Vector3(global_transform.origin.x, 0, global_transform.origin.z)).length()
		if dist <= radius:
			if player.has_method("take_damage"):
				player.take_damage(damage)
				print("Player hit by ", name, " for ", damage, " HP")
	queue_free()
