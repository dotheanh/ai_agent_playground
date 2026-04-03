# game_manager.gd
# Global singleton để quản lý game state
# Đã fix: Scene-based UI, null-safe, simplified restart
extends Node
class_name GameManager

const HUD_SCENE := preload("res://ui/HUD.tscn")
const VICTORY_SCRIPT := preload("res://ui/Victory.gd")
const GAME_OVER_SCRIPT := preload("res://ui/GameOver.gd")

@export var player: Node3D = null
var hud: CanvasLayer = null

# Enemy tracking
var _enemy_count: int = 0

func _ready() -> void:
	add_to_group("GameManager")
	_ensure_hud()
	_count_enemies()
	print("GameManager ready. Player: ", player)

func _count_enemies() -> void:
	await get_tree().process_frame  # Chờ scene setup
	
	var enemies = get_tree().get_nodes_in_group("Enemy")
	_enemy_count = enemies.size()
	
	for enemy in enemies:
		if enemy.has_signal("died") and not enemy.died.is_connected(_on_enemy_died):
			enemy.died.connect(_on_enemy_died)
	
	print("Total enemies: ", _enemy_count)

func _on_enemy_died() -> void:
	_enemy_count -= 1
	print("Enemy died. Remaining: ", _enemy_count)
	
	if _enemy_count <= 0:
		await get_tree().create_timer(0.5).timeout
		show_victory_ui()

func _ensure_hud() -> void:
	if hud == null:
		var current = get_tree().current_scene
		if current:
			var new_hud = HUD_SCENE.instantiate()
			current.add_child(new_hud)
			hud = new_hud as CanvasLayer
			if player:
				if hud.has_method("bind_player"):
					hud.bind_player(player)

func register_player(p: Node3D) -> void:
	player = p
	_ensure_hud()
	if hud and hud.has_method("bind_player"):
		hud.bind_player(player)

func on_player_died() -> void:
	show_game_over_ui()

# --- Victory/GameOver ---

func show_victory_ui() -> void:
	get_tree().paused = true

	var current = get_tree().current_scene
	if current and VICTORY_SCRIPT:
		var victory = VICTORY_SCRIPT.new()
		current.add_child(victory)

func show_game_over_ui() -> void:
	get_tree().paused = true

	var current = get_tree().current_scene
	if current and GAME_OVER_SCRIPT:
		var game_over = GAME_OVER_SCRIPT.new()
		current.add_child(game_over)

func restart_game() -> void:
	print("Restarting game...")
	get_tree().paused = false
	get_tree().reload_current_scene()
