# Victory.gd
# Victory screen - shown when all enemies are defeated
extends CanvasLayer

func _ready() -> void:
	# Tạo background
	var bg = ColorRect.new()
	bg.name = "Background"
	bg.color = Color(0, 0, 0, 0.6)
	bg.anchor_left = 0
	bg.anchor_top = 0
	bg.anchor_right = 1
	bg.anchor_bottom = 1
	add_child(bg)

	# Tạo label
	var label = Label.new()
	label.name = "VictoryLabel"
	label.text = "VICTORY!"
	label.add_theme_font_size_override("font_size", 64)
	label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.anchor_left = 0.2
	label.anchor_right = 0.8
	label.anchor_top = 0.3
	label.anchor_bottom = 0.5
	add_child(label)

	# Tạo button
	var btn = Button.new()
	btn.name = "ReplayButton"
	btn.text = "Replay"
	btn.anchor_left = 0.4
	btn.anchor_right = 0.6
	btn.anchor_top = 0.55
	btn.anchor_bottom = 0.65
	btn.pressed.connect(_on_replay_pressed)
	add_child(btn)

func _on_replay_pressed() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()