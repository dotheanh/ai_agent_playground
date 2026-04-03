# boss_hp_bar.gd
# CanvasLayer UI cho Boss HP bar - fixed ở giữa trên màn hình
extends CanvasLayer

const BAR_HEIGHT := 32.0
const MARGIN_TOP := 18.0
const BAR_SCREEN_RATIO := 0.85

var _bar_fill: ColorRect
var _name_label: Label
var _hp_label: Label
var _last_hp: int = -1
var _ui_built: bool = false
var _boss_name: String = ""

func _ready() -> void:
	_build_ui()
	_ui_built = true

func _process(_delta: float) -> void:
	if not _ui_built:
		return
	var boss = get_parent()
	if boss is Monster:
		if boss.hp != _last_hp or _boss_name == "":
			_last_hp = boss.hp
			if _boss_name == "":
				_boss_name = boss.config.display_name if boss.config and "display_name" in boss.config else boss.name
				_name_label.text = _boss_name
			_update_bar(boss.hp, boss.max_hp)

func _build_ui() -> void:
	var viewport_size: Vector2 = get_viewport().get_visible_rect().size
	var screen_w: float = viewport_size.x
	var bar_w: int = int(screen_w * BAR_SCREEN_RATIO)

	# Panel container
	var panel := PanelContainer.new()
	panel.anchor_left = 0.5
	panel.anchor_right = 0.5
	panel.anchor_top = 0.0
	panel.anchor_bottom = 0.0
	panel.offset_left = -bar_w / 2.0 - 14
	panel.offset_right = bar_w / 2.0 + 14
	panel.offset_top = MARGIN_TOP
	panel.offset_bottom = MARGIN_TOP + BAR_HEIGHT + 52

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.05, 0.08, 0.82)
	style.set_corner_radius_all(10)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)

	# Name label
	_name_label = Label.new()
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.add_theme_font_size_override("font_size", 20)
	_name_label.add_theme_color_override("font_color", Color.WHITE)
	_name_label.add_theme_constant_override("outline_size", 3)
	_name_label.add_theme_color_override("font_outline_color", Color.BLACK)
	vbox.add_child(_name_label)

	# Bar container
	var bar_root := Control.new()
	bar_root.custom_minimum_size = Vector2(bar_w, BAR_HEIGHT)
	vbox.add_child(bar_root)

	var bar_bg := ColorRect.new()
	bar_bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bar_bg.color = Color(0.15, 0.15, 0.15, 1.0)
	bar_root.add_child(bar_bg)

	_bar_fill = ColorRect.new()
	_bar_fill.anchor_left = 0.0
	_bar_fill.anchor_top = 0.0
	_bar_fill.anchor_right = 1.0
	_bar_fill.anchor_bottom = 1.0
	_bar_fill.color = Color(0.2, 1.0, 0.2, 1.0)
	bar_root.add_child(_bar_fill)

	# HP label
	_hp_label = Label.new()
	_hp_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_hp_label.offset_top = -2.0
	_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_hp_label.add_theme_font_size_override("font_size", int(BAR_HEIGHT) - 4)
	_hp_label.add_theme_color_override("font_color", Color.WHITE)
	_hp_label.add_theme_constant_override("outline_size", 4)
	_hp_label.add_theme_color_override("font_outline_color", Color.BLACK)
	bar_root.add_child(_hp_label)

func _update_bar(current: int, max_val: int) -> void:
	var ratio := float(current) / float(max_val) if max_val > 0 else 0.0

	var bar_parent = _bar_fill.get_parent()
	var max_width = bar_parent.size.x if bar_parent else 612.0
	var new_width = maxf(ratio * max_width, 1.0)
	_bar_fill.anchor_left = 0.0
	_bar_fill.anchor_top = 0.0
	_bar_fill.anchor_bottom = 1.0
	_bar_fill.anchor_right = 0.0
	_bar_fill.size = Vector2(new_width, bar_parent.size.y if bar_parent else BAR_HEIGHT)

	if ratio > 0.5:
		_bar_fill.color = Color(0.2, 1.0, 0.2)
	elif ratio > 0.25:
		_bar_fill.color = Color(1.0, 0.8, 0.0)
	else:
		_bar_fill.color = Color(1.0, 0.2, 0.2)

	_hp_label.text = "%d / %d" % [current, max_val]
