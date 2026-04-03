# skill_base.gd
# Base class for all skills
extends Node
class_name SkillBase

@export var data: SkillData
var caster: Node3D

## Entry point để cast skill
func cast(target_pos: Vector3) -> void:
	# Kiểm tra caster còn tồn tại
	if caster == null or not is_instance_valid(caster):
		return
	
	# Hiển thị indicator trước khi cast
	await show_indicator(target_pos)
	
	# Thực thi skill
	execute(target_pos)
	
	# Cooldown
	if data and data.cooldown > 0:
		await get_tree().create_timer(data.cooldown).timeout

## Hiển thị Indicator - override ở subclass nếu cần
func show_indicator(target_pos: Vector3):
	if data == null:
		return
		
	var indicator = AreaIndicator.new()
	indicator.setup(data.shape, data.size)
	
	var current_scene = get_tree().get_current_scene()
	if current_scene:
		current_scene.add_child(indicator)
		indicator.global_transform.origin = get_indicator_position(target_pos)
		
		# Chờ cast_time rồi xóa
		if data.cast_time > 0:
			await get_tree().create_timer(data.cast_time).timeout
			indicator.queue_free()

## Override để thay đổi vị trí indicator (VD: Quake ở caster)
func get_indicator_position(target_pos: Vector3) -> Vector3:
	return target_pos

## Override ở subclass để thực thi skill
func execute(_target_pos: Vector3) -> void:
	pass

## Optional: Cancel skill đang cast
func cancel() -> void:
	# Override ở subclass nếu cần cleanup
	pass