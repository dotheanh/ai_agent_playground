# hud.gd
# Heads-up display cho player HP
extends CanvasLayer
class_name HUD

var player: Node = null
var hp_bar: ProgressBar

func _ready() -> void:
	# Tìm HP bar bằng find_child thay vì @export
	hp_bar = find_child("HPBar", true, false) as ProgressBar
	
	if hp_bar == null:
		push_warning("HUD: HPBar not found!")

func bind_player(p: Node) -> void:
	player = p
	print("HUD binding player: ", player)
	
	if player and player.has_signal("hp_changed"):
		if not player.hp_changed.is_connected(_on_player_hp_changed):
			player.hp_changed.connect(self._on_player_hp_changed)
		
		# Init values
		if "max_hp" in player and "hp" in player:
			_update_hp_display(player.hp, player.max_hp)

func _on_player_hp_changed(hp: int, max_hp: int) -> void:
	_update_hp_display(hp, max_hp)

func _update_hp_display(current: int, max_val: int) -> void:
	if hp_bar:
		hp_bar.max_value = max_val
		hp_bar.value = current