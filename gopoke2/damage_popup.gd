# damage_popup.gd
# Floating damage number popup
extends Label3D
class_name DamagePopup

var tween: Tween

func _ready() -> void:
	# Setup initial state
	font_size = 24

	# Create tween for animation
	tween = create_tween()

	# Float up and fade out
	tween.tween_property(self, "position:y", position.y + 1.0, 1.0)
	tween.tween_property(self, "modulate:a", 0.0, 1.0)

	# Queue free after animation
	await tween.finished
	queue_free()

func set_damage(amount: int, effectiveness: float) -> void:
	text = str(amount)

	# Get effectiveness color
	if effectiveness >= 2.0:
		modulate = Color.YELLOW  # Super effective
		font_size = 32
	elif effectiveness <= 0.5 and effectiveness > 0:
		modulate = Color.CYAN  # Not very effective
		font_size = 20
	elif effectiveness == 0:
		modulate = Color.GRAY  # No effect
		font_size = 24
	else:
		modulate = Color.WHITE  # Neutral
		font_size = 24
