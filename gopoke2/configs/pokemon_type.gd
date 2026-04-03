# pokemon_type.gd
# 17 Pokemon types với effectiveness matrix và colors
extends Resource
class_name PokemonType

enum Type {
	NORMAL = 0,
	FIRE = 1,
	WATER = 2,
	GRASS = 3,
	ELECTRIC = 4,
	ICE = 5,
	FIGHTING = 6,
	POISON = 7,
	GROUND = 8,
	FLYING = 9,
	PSYCHIC = 10,
	BUG = 11,
	ROCK = 12,
	GHOST = 13,
	DRAGON = 14,
	DARK = 15,
	STEEL = 16
}

## Type effectiveness matrix - attacker row, defender col
const EFFECTIVENESS: Dictionary = {
	Type.NORMAL:   [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.0, 1.0, 1.0, 0.5],
	Type.FIRE:     [1.0, 0.5, 0.5, 2.0, 1.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 0.5, 1.0, 0.5, 1.0, 2.0],
	Type.WATER:    [1.0, 2.0, 0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 1.0, 2.0, 1.0, 0.5, 1.0, 1.0],
	Type.GRASS:    [1.0, 0.5, 2.0, 0.5, 1.0, 1.0, 1.0, 1.0, 2.0, 0.5, 1.0, 0.5, 2.0, 1.0, 0.5, 1.0, 0.5],
	Type.ELECTRIC: [1.0, 1.0, 2.0, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 2.0, 1.0, 1.0, 1.0, 1.0, 0.5, 1.0, 1.0],
	Type.ICE:      [1.0, 0.5, 0.5, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 0.5],
	Type.FIGHTING: [2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 0.5, 1.0, 0.5, 0.5, 0.5, 2.0, 0.0, 1.0, 2.0, 0.5],
	Type.POISON:   [1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 1.0, 0.5, 0.5, 1.0, 1.0, 1.0, 0.5, 0.5, 1.0, 1.0, 0.5],
	Type.GROUND:   [1.0, 2.0, 1.0, 0.5, 2.0, 1.0, 1.0, 2.0, 1.0, 0.5, 1.0, 0.5, 2.0, 1.0, 1.0, 1.0, 2.0],
	Type.FLYING:  [1.0, 1.0, 1.0, 2.0, 0.5, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0, 2.0, 0.5, 1.0, 1.0, 1.0, 0.5],
	Type.PSYCHIC: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0, 1.0, 0.5, 0.5],
	Type.BUG:     [1.0, 0.5, 1.0, 2.0, 1.0, 1.0, 0.5, 0.5, 1.0, 0.5, 2.0, 1.0, 1.0, 0.5, 1.0, 2.0, 0.5],
	Type.ROCK:    [1.0, 2.0, 1.0, 1.0, 1.0, 2.0, 0.5, 1.0, 0.5, 2.0, 1.0, 2.0, 1.0, 1.0, 1.0, 1.0, 0.5],
	Type.GHOST:   [0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 2.0, 1.0, 0.5, 1.0],
	Type.DRAGON:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 0.5],
	Type.DARK:    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 2.0, 1.0, 0.5, 1.0],
	Type.STEEL:   [1.0, 0.5, 0.5, 1.0, 0.5, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 1.0, 0.5]
}

## Type names
const TYPE_NAMES: Dictionary = {
	Type.NORMAL: "Normal",
	Type.FIRE: "Fire",
	Type.WATER: "Water",
	Type.GRASS: "Grass",
	Type.ELECTRIC: "Electric",
	Type.ICE: "Ice",
	Type.FIGHTING: "Fighting",
	Type.POISON: "Poison",
	Type.GROUND: "Ground",
	Type.FLYING: "Flying",
	Type.PSYCHIC: "Psychic",
	Type.BUG: "Bug",
	Type.ROCK: "Rock",
	Type.GHOST: "Ghost",
	Type.DRAGON: "Dragon",
	Type.DARK: "Dark",
	Type.STEEL: "Steel"
}

## Type colors
const TYPE_COLORS: Dictionary = {
	Type.NORMAL: Color(0xA9, 0xA9, 0x71),
	Type.FIRE: Color(0xEF, 0x53, 0x50),
	Type.WATER: Color(0x36, 0x96, 0xF4),
	Type.GRASS: Color(0x78, 0xC8, 0x50),
	Type.ELECTRIC: Color(0xF4, 0xD7, 0x44),
	Type.ICE: Color(0x64, 0x90, 0xF6),
	Type.FIGHTING: Color(0xC2, 0x2E, 0x2E),
	Type.POISON: Color(0xA3, 0x3E, 0xC2),
	Type.GROUND: Color(0xE4, 0xC1, 0x56),
	Type.FLYING: Color(0xA8, 0x90, 0xF0),
	Type.PSYCHIC: Color(0xF0, 0x45, 0x78),
	Type.BUG: Color(0xA6, 0xB9, 0x45),
	Type.ROCK: Color(0xA6, 0xA8, 0x7A),
	Type.GHOST: Color(0x73, 0x56, 0xD0),
	Type.DRAGON: Color(0x6F, 0x39, 0xD0),
	Type.DARK: Color(0x55, 0x55, 0x55),
	Type.STEEL: Color(0xB4, 0xB8, 0xC4)
}

## Get effectiveness multiplier
static func get_effectiveness(attacker_type: int, defender_type: int) -> float:
	if not EFFECTIVENESS.has(attacker_type) or not EFFECTIVENESS.has(defender_type):
		return 1.0
	return EFFECTIVENESS[attacker_type][defender_type]

## Get type color
static func get_type_color(type_id: int) -> Color:
	return TYPE_COLORS.get(type_id, Color.WHITE)

## Get type name
static func get_type_name(type_id: int) -> String:
	return TYPE_NAMES.get(type_id, "Unknown")

## Check if super effective
static func is_super_effective(attacker_type: int, defender_type: int) -> bool:
	return get_effectiveness(attacker_type, defender_type) > 1.0

## Check if not very effective
static func is_resistant(attacker_type: int, defender_type: int) -> bool:
	return get_effectiveness(attacker_type, defender_type) < 1.0 and get_effectiveness(attacker_type, defender_type) > 0.0

## Check if immune
static func is_immune(attacker_type: int, defender_type: int) -> bool:
	return get_effectiveness(attacker_type, defender_type) == 0.0

## Get damage text color based on effectiveness
static func get_effectiveness_color(effectiveness: float) -> Color:
	if effectiveness >= 2.0:
		return Color.YELLOW  # Super effective
	elif effectiveness <= 0.5 and effectiveness > 0:
		return Color.CYAN  # Not very effective
	elif effectiveness == 0:
		return Color.GRAY  # No effect
	else:
		return Color.WHITE  # Neutral

## Get effectiveness text
static func get_effectiveness_text(effectiveness: float) -> String:
	if effectiveness >= 2.0:
		return "It's super effective!"
	elif effectiveness <= 0.5 and effectiveness > 0:
		return "It's not very effective..."
	elif effectiveness == 0:
		return "It had no effect..."
	return ""
