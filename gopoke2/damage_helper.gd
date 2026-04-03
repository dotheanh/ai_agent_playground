# damage_helper.gd
# Helper for calculating type effectiveness and spawning damage popups
extends Node
class_name DamageHelper

const DamagePopup = preload("res://damage_popup.gd")

## Calculate damage with type effectiveness
static func calculate_damage(base_damage: int, attacker_type: int, defender_type: int) -> int:
	var effectiveness = _get_type_effectiveness(attacker_type, defender_type)
	return int(base_damage * effectiveness)

## Get type effectiveness from PokemonType resource
static func _get_type_effectiveness(attacker_type: int, defender_type: int) -> float:
	var pokemon_type_resource = load("res://configs/pokemon_type.gd")
	if pokemon_type_resource:
		return pokemon_type_resource.get_effectiveness(attacker_type, defender_type)
	return 1.0

## Spawn damage popup at position
static func spawn_popup(node_3d: Node3D, damage: int, effectiveness: float) -> void:
	if node_3d == null:
		return

	var popup = DamagePopup.new()
	popup.set_damage(damage, effectiveness)
	popup.position = node_3d.global_transform.origin + Vector3(0, 2, 0)

	var scene = node_3d.get_tree().get_current_scene()
	if scene:
		scene.add_child(popup)

## Damage player with type calculation
static func damage_player(player: Node, skill_type: int, base_damage: int, player_type: int) -> int:
	var effectiveness = _get_type_effectiveness(skill_type, player_type)
	var actual_damage = calculate_damage(base_damage, skill_type, player_type)

	if player and player.has_method("take_damage"):
		player.take_damage(actual_damage)

	spawn_popup(player, actual_damage, effectiveness)
	return actual_damage

## Damage monster with type calculation
static func damage_monster(monster: Node, skill_type: int, base_damage: int, monster_type: int) -> int:
	var effectiveness = _get_type_effectiveness(skill_type, monster_type)
	var actual_damage = calculate_damage(base_damage, skill_type, monster_type)

	if monster and monster.has_method("take_damage"):
		monster.take_damage(actual_damage)

	spawn_popup(monster, actual_damage, effectiveness)
	return actual_damage
