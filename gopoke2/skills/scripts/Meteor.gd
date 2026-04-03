# Meteor.gd
# Skill meteor rơi từ trên xuống
extends SkillBase
class_name MeteorSkill

func execute(target_pos: Vector3) -> void:
	if caster == null or not is_instance_valid(caster):
		return

	# Tạo projectile
	var meteor = Projectile.new()
	meteor.speed = data.speed if data else 10.0
	meteor.damage = data.damage if data else 30
	meteor.radius = data.size.x if data else 1.0
	meteor.target_pos = Vector3(target_pos.x, 0, target_pos.z)
	meteor.caster = caster

	# Thêm vào scene
	var current_scene = get_tree().get_current_scene()
	if current_scene:
		current_scene.add_child(meteor)
		meteor.global_transform.origin = caster.global_transform.origin + Vector3(0, 5, 0)
		meteor._update_mesh_scale()
		print("Meteor cast by: ", caster.name)