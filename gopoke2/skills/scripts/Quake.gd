# Quake.gd
# Skill địa chấn - damage vòng tròn quanh caster
extends SkillBase
class_name QuakeSkill

func get_indicator_position(target_pos: Vector3) -> Vector3:
	# Quake indicator ở vị trí caster, không phải target
	if caster == null or not is_instance_valid(caster):
		return target_pos
	return caster.global_transform.origin

func execute(target_pos: Vector3) -> void:
	if caster == null or not is_instance_valid(caster):
		return

	var caster_pos = caster.global_transform.origin
	var effect_range = data.effect_range if data else 5.0
	var damage = data.damage if data else 20

	# Kiểm tra player trong vùng ảnh hưởng
	var player = get_tree().get_first_node_in_group("Player")
	if player:
		var player_pos = player.global_transform.origin
		var dist = (Vector3(player_pos.x, 0, player_pos.z) - Vector3(caster_pos.x, 0, caster_pos.z)).length()
		if dist <= effect_range:
			if player.has_method("take_damage"):
				player.take_damage(damage)
				print("Quake hit player for ", damage)

	# Tạo hiệu ứng visual (optional)
	_create_impact_effect(caster_pos)

func _create_impact_effect(pos: Vector3) -> void:
	# Visual feedback - có thể mở rộng sau
	print("Quake impact at: ", pos)