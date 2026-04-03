# boss.gd
# Boss - extends Monster với HP multiplier
extends Monster
class_name Boss

@export var hp_multiplier: int = 5  # HP = base_max_hp * multiplier

func _ready() -> void:
	# Apply config trước
	if config != null:
		_apply_config()
		# Apply HP multiplier
		if config is BossConfig:
			var boss_config = config as BossConfig
			max_hp = config.max_hp * boss_config.hp_multiplier
			hp = max_hp
			print("Boss HP: ", hp, " (", config.max_hp, " x ", boss_config.hp_multiplier, ")")
	
	# Setup SkillCaster
	if skill_caster:
		skill_caster.caster = self
	
	# Start AI
	var delay = 1.5  # Boss delay longer
	if config and "delay_before_first_cast" in config:
		delay = config.delay_before_first_cast
		
	await get_tree().create_timer(delay).timeout
	
	if skill_caster and skill_caster.get_skill_count() > 0:
		_start_ai_loop()