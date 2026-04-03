extends Resource
class_name SkillData

@export var skill_name: String
@export_enum("circle", "line", "cone", "box") var shape: String = "circle"
@export var size: Vector3 = Vector3(1, 0.1, 1)

@export var damage: int = 10
@export var effect_range: float = 5.0

@export var cast_time: float = 1.0   # Thời gian tụ lực
@export var cooldown: float = 3.0
@export var speed: float = 1.0       # Tốc độ projectile nếu có

## Optional: skill type cho damage calculation
@export var skill_poke_type: int = 0  # 0 = Normal