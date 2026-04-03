# Arrow.gd
# Skill bắn tên đường thẳng từ caster đến target position.
# Sử dụng Tween thay vì manual frame waiting.
extends SkillBase
class_name ArrowSkill

# Arrow skill - no instance tracking needed

func get_indicator_position(target_pos: Vector3) -> Vector3:
	if caster == null or not is_instance_valid(caster):
		return target_pos
	var caster_pos := caster.global_transform.origin + Vector3(0, 0.5, 0)
	var end_pos := target_pos + Vector3(0, 0.5, 0)
	return caster_pos.lerp(end_pos, 0.5)

func show_indicator(target_pos: Vector3):
	if caster == null or not is_instance_valid(caster):
		return
	
	var indicator = AreaIndicator.new()
	var caster_pos := caster.global_transform.origin
	var flight_dist := caster_pos.distance_to(target_pos)
	
	# Tạo box dài bằng khoảng cách bay
	indicator.setup(data.shape if data else "box", Vector3(0.2, 0.2, flight_dist))
	
	var current_scene = get_tree().get_current_scene()
	if current_scene:
		current_scene.add_child(indicator)
		# Đặt ở giữa đường bay, nâng nhẹ
		var mid := caster_pos.lerp(target_pos, 0.5) + Vector3(0, 0.15, 0)
		indicator.global_transform.origin = mid
		indicator.look_at(target_pos + Vector3(0, 0.15, 0), Vector3.UP)
		
		if data and data.cast_time > 0:
			await get_tree().create_timer(data.cast_time).timeout
			indicator.queue_free()

func execute(target_pos: Vector3) -> void:
	if caster == null or not is_instance_valid(caster):
		return

	# Lấy locked target từ player
	var locked_target = null
	if caster and caster.has_method("get_current_target"):
		locked_target = caster.get_current_target()

	# Tạo arrow
	var arrow = Area3D.new()
	arrow.name = "Arrow"
	
	# Mesh hình mũi tên
	var mesh = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.05
	cyl.bottom_radius = 0.15
	cyl.height = 1.5
	mesh.mesh = cyl

	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.2, 0.8, 0.2)  # Xanh lá
	mat.emission_enabled = true
	mat.emission = Color(0.1, 0.5, 0.1)
	mesh.material_override = mat
	arrow.add_child(mesh)

	# Collision shape
	var col = CollisionShape3D.new()
	var shape = CylinderShape3D.new()
	shape.radius = 0.2
	shape.height = 1.5
	col.shape = shape
	arrow.add_child(col)

	# Thiết lập metadata
	arrow.set_meta("damage", data.damage if data else 15)
	arrow.set_meta("target", locked_target)

	# Connect collision signal
	arrow.body_entered.connect(_on_arrow_hit.bind(arrow))

	# Thêm vào scene
	var current_scene = get_tree().get_current_scene()
	if current_scene:
		current_scene.add_child(arrow)
		arrow.global_transform.origin = caster.global_transform.origin + Vector3(0, 1, 0)
		arrow.look_at(target_pos + Vector3(0, 1, 0), Vector3.UP)
		arrow.rotate_object_local(Vector3.RIGHT, deg_to_rad(90))

		# Bay đến target bằng Tween
		var start_pos = arrow.global_transform.origin
		var end_pos = target_pos + Vector3(0, 1, 0)
		var speed = data.speed if data and data.speed > 0 else 30.0
		
		_fly_with_tween(arrow, start_pos, end_pos, speed)

func _fly_with_tween(arrow: Area3D, start: Vector3, end: Vector3, speed: float) -> void:
	var distance = start.distance_to(end)
	var duration = distance / speed
	
	var tween = create_tween()
	tween.tween_property(arrow, "global_transform:origin", end, duration)
	tween.tween_callback(func():
		if is_instance_valid(arrow):
			arrow.queue_free()
	)
	print("Arrow flew from ", start, " to ", end)

func _on_arrow_hit(body: Node, arrow: Area3D) -> void:
	var dmg: int = arrow.get_meta("damage")
	var locked: Node = arrow.get_meta("target")

	# Chỉ gây damage khi trúng target đã lock
	if body == locked:
		if body.has_method("take_damage"):
			body.take_damage(dmg)
			print("Arrow hit ", body.name, " for ", dmg)
		if is_instance_valid(arrow):
			arrow.queue_free()