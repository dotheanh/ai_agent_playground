@tool
class_name GPAssetCommands
extends Node

## GPAssetCommands — Resource, Theme, AnimationTree, Analysis, Test

var editor_plugin: EditorPlugin

func get_commands() -> Dictionary:
	return {
		# Resource
		"resource_get_properties":         _read_resource,
		"resource_edit":         _edit_resource,
		"resource_create":       _create_resource,
		"resource_get_preview":  _get_resource_preview,
		# Theme
		"theme_create":          _create_theme,
		"theme_set_color":       _set_theme_color,
		"theme_set_constant":    _set_theme_constant,
		"theme_set_font_size":   _set_theme_font_size,
		"theme_set_stylebox":    _set_theme_stylebox,
		"theme_get_info":        _get_theme_info,
		# AnimationTree
		"anim_create_tree":         _create_animation_tree,
		"anim_get_tree_structure":  _get_animation_tree_structure,
		"anim_add_state":       _add_state_machine_state,
		"anim_remove_state":    _remove_state_machine_state,
		"anim_add_transition":  _add_state_machine_transition,
		"anim_remove_transition": _remove_state_machine_transition,
		"anim_add_blend_node":           _set_blend_tree_node,
		"anim_set_tree_param":            _set_tree_parameter,
		# Analysis
		"resource_find_unused":       _find_unused_resources,
		"analyze_signal_flow":         _analyze_signal_flow,
		"analyze_scene_complexity":    _analyze_scene_complexity,
		"script_find_references":      _find_script_references,
		"scene_detect_circular_deps": _detect_circular_dependencies,
		"project_get_statistics":      _get_project_statistics,
		# Test (editor-side orchestration, delegates to runtime IPC)
		"test_run_scenario":    _run_test_scenario,
		"test_assert_node_state":    _assert_node_state,
		"test_assert_screen_text":   _assert_screen_text,
		"test_run_stress":      _run_stress_test,
		"test_get_report":      _get_test_report,
	}


# ── Helpers ────────────────────────────────────────────────────────────────────

func _ei() -> EditorInterface: return editor_plugin.get_editor_interface()
func _ur() -> EditorUndoRedoManager: return editor_plugin.get_undo_redo()
func _ok(data: Dictionary = {}) -> Dictionary: return GPUtils.mcp_ok_json(data)
func _err(msg: String, code: int = -1) -> Dictionary: return GPUtils.mcp_err(msg, code)

func _require_scene() -> Node:
	return _ei().get_edited_scene_root()

func _find_node(path: String) -> Node:
	var root := _require_scene()
	if root == null: return null
	if path == "." or path == "": return root
	return root.get_node_or_null(NodePath(path))

func _parse_color(v: Variant, default: Color = Color.WHITE) -> Color:
	if v is String:
		var s: String = v
		if s.begins_with("#"): return Color.html(s)
		if Color.html_is_valid(s): return Color.html(s)
	if v is Dictionary:
		var d: Dictionary = v
		return Color(float(d.get("r", 1)), float(d.get("g", 1)), float(d.get("b", 1)), float(d.get("a", 1)))
	return default

func _game_ipc() -> Node:
	return editor_plugin.game_ipc

func _send_game_command(command: String, cmd_params: Dictionary, timeout_sec: float = 30.0) -> Dictionary:
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < 10000:
			await _ei().get_base_control().get_tree().process_frame
		if not ipc.has_game_connection():
			return _err("Game runtime not connected — is GPRuntime autoload enabled and game running?")
	var result: Dictionary = await ipc.send_game_command(command, cmd_params, timeout_sec)
	if result.has("error"):
		return _err(str(result["error"]))
	return {"result": result}

# Accumulated test results
var _test_results: Array = []


# ═══════════════════════════════════════════════════════════════════════════════
# RESOURCE
# ═══════════════════════════════════════════════════════════════════════════════

func _read_resource(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var res := load(path)
	if res == null: return _err("Cannot load resource: %s" % path)
	var props: Dictionary = {}
	for pi in res.get_property_list():
		var pn: String = pi["name"]
		if not (pi["usage"] & PROPERTY_USAGE_EDITOR) or pn.begins_with("_") or pn == "script": continue
		props[pn] = GPUtils.serialize_value(res.get(pn))
	return _ok({"path": path, "type": res.get_class(), "properties": props})


func _edit_resource(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var properties: Dictionary = params.get("properties", {})
	if path.is_empty(): return _err("path is required")
	if properties.is_empty(): return _err("properties is required")
	var res := load(path)
	if res == null: return _err("Cannot load resource: %s" % path)
	for k: String in properties:
		var current: Variant = res.get(k)
		res.set(k, GPUtils.parse_value(properties[k], typeof(current)))
	var err := ResourceSaver.save(res, path)
	if err != OK: return _err("Failed to save resource: %s" % error_string(err))
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path, "updated": properties.keys()})


func _create_resource(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var type: String = params.get("type", "")
	if path.is_empty() or type.is_empty(): return _err("path and type are required")
	if not params.get("overwrite", false) and FileAccess.file_exists(path):
		return _err("File already exists: %s (use overwrite:true)" % path)
	if not ClassDB.class_exists(type): return _err("Unknown resource type: %s" % type)
	var res: Resource = ClassDB.instantiate(type)
	if not res is Resource: return _err("Type is not a Resource: %s" % type)
	var props: Dictionary = params.get("properties", {})
	for k: String in props:
		var current: Variant = res.get(k)
		res.set(k, GPUtils.parse_value(props[k], typeof(current)))
	var dir_path := path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir_path): DirAccess.make_dir_recursive_absolute(dir_path)
	var err := ResourceSaver.save(res, path)
	if err != OK: return _err("Failed to save: %s" % error_string(err))
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path, "type": type})


func _get_resource_preview(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var max_size: int = params.get("max_size", 256)
	var image: Image = null
	if path.get_extension().to_lower() in ["png", "jpg", "jpeg", "webp", "svg"]:
		image = Image.load_from_file(ProjectSettings.globalize_path(path))
	else:
		var res := load(path)
		if res is Texture2D: image = (res as Texture2D).get_image()
	if image == null: return _err("Cannot get image from: %s" % path)
	var w := image.get_width(); var h := image.get_height()
	if w > max_size or h > max_size:
		var scale := float(max_size) / float(maxi(w, h))
		image.resize(int(w * scale), int(h * scale), Image.INTERPOLATE_BILINEAR)
	var png := image.save_png_to_buffer()
	var b64 := Marshalls.raw_to_base64(png)
	var w2 := image.get_width(); var h2 := image.get_height()
	return GPUtils.mcp_ok([GPUtils.mcp_image(b64), GPUtils.mcp_text("Preview: %dx%d %s" % [w2, h2, path])])


# ═══════════════════════════════════════════════════════════════════════════════
# THEME
# ═══════════════════════════════════════════════════════════════════════════════

func _create_theme(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var theme := Theme.new()
	if params.has("default_font_size"): theme.default_font_size = int(params["default_font_size"])
	var err := ResourceSaver.save(theme, path)
	if err != OK: return _err("Failed to save theme: %s" % error_string(err))
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path})


func _set_theme_color(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var name: String = params.get("name", "")
	if path.is_empty() or name.is_empty() or not params.has("color"): return _err("path, name and color are required")
	var node := _find_node(path)
	if node == null or not node is Control: return _err("Control node not found: %s" % path)
	var ctrl: Control = node
	var theme_type: String = params.get("theme_type", ctrl.get_class())
	ctrl.add_theme_color_override(name, _parse_color(params["color"]))
	return _ok({"path": path, "name": name})


func _set_theme_constant(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var name: String = params.get("name", "")
	if path.is_empty() or name.is_empty() or not params.has("value"): return _err("path, name and value are required")
	var node := _find_node(path)
	if node == null or not node is Control: return _err("Control node not found: %s" % path)
	(node as Control).add_theme_constant_override(name, int(params["value"]))
	return _ok({"path": path, "name": name, "value": params["value"]})


func _set_theme_font_size(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var name: String = params.get("name", "font_size")
	if path.is_empty() or not params.has("size"): return _err("path and size are required")
	var node := _find_node(path)
	if node == null or not node is Control: return _err("Control node not found: %s" % path)
	(node as Control).add_theme_font_size_override(name, int(params["size"]))
	return _ok({"path": path, "name": name, "size": params["size"]})


func _set_theme_stylebox(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var name: String = params.get("name", "panel")
	if path.is_empty(): return _err("path is required")
	var node := _find_node(path)
	if node == null or not node is Control: return _err("Control node not found: %s" % path)
	var sb := StyleBoxFlat.new()
	if params.has("bg_color"): sb.bg_color = _parse_color(params["bg_color"])
	if params.has("border_color"): sb.border_color = _parse_color(params["border_color"])
	if params.has("border_width"):
		var bw := int(params["border_width"])
		sb.border_width_top = bw; sb.border_width_bottom = bw; sb.border_width_left = bw; sb.border_width_right = bw
	if params.has("corner_radius"):
		var cr := int(params["corner_radius"])
		sb.corner_radius_top_left = cr; sb.corner_radius_top_right = cr
		sb.corner_radius_bottom_left = cr; sb.corner_radius_bottom_right = cr
	if params.has("padding"):
		var pad := int(params["padding"])
		sb.content_margin_left = pad; sb.content_margin_right = pad
		sb.content_margin_top = pad; sb.content_margin_bottom = pad
	(node as Control).add_theme_stylebox_override(name, sb)
	return _ok({"path": path, "name": name})


func _get_theme_info(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var node := _find_node(path)
	if node == null or not node is Control: return _err("Control node not found: %s" % path)
	var ctrl: Control = node
	var info: Dictionary = {"path": path, "type": ctrl.get_class(),
		"theme": str(ctrl.theme.resource_path) if ctrl.theme else null,
		"overrides": {}}
	# Không có API để list tất cả overrides, trả về theme resource info
	if ctrl.theme:
		info["default_font_size"] = ctrl.theme.default_font_size
	return _ok(info)


# ═══════════════════════════════════════════════════════════════════════════════
# ANIMATION TREE
# ═══════════════════════════════════════════════════════════════════════════════

func _get_state_machine(tree: AnimationTree, sm_path: String) -> AnimationNodeStateMachine:
	var root_node: AnimationNode = tree.tree_root
	if sm_path.is_empty() or sm_path == "":
		if root_node is AnimationNodeStateMachine: return root_node
		return null
	var parts := sm_path.split("/")
	var current: AnimationNode = root_node
	for part: String in parts:
		if current is AnimationNodeStateMachine:
			current = (current as AnimationNodeStateMachine).get_node(part)
		elif current is AnimationNodeBlendTree:
			current = (current as AnimationNodeBlendTree).get_node(part)
		else:
			return null
	if current is AnimationNodeStateMachine: return current
	return null


func _create_animation_tree(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(path)
	if parent == null: return _err("Node not found: %s" % path)
	var tree := AnimationTree.new()
	tree.name = params.get("name", "AnimationTree")
	tree.tree_root = AnimationNodeStateMachine.new()
	var anim_player: String = params.get("anim_player", "")
	if not anim_player.is_empty(): tree.anim_player = NodePath(anim_player)
	_ur().create_action("Create AnimationTree")
	_ur().add_do_method(parent, "add_child", tree)
	_ur().add_do_method(tree, "set_owner", root)
	_ur().add_undo_method(parent, "remove_child", tree)
	_ur().commit_action()
	tree.owner = root
	return _ok({"path": str(root.get_path_to(tree))})


func _get_animation_tree_structure(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var tree: AnimationTree = node
	var result: Dictionary = {"path": path, "active": tree.active}
	if tree.tree_root:
		result["root_type"] = tree.tree_root.get_class()
		if tree.tree_root is AnimationNodeStateMachine:
			var sm: AnimationNodeStateMachine = tree.tree_root
			var states: Array = []
			for state_name: String in sm.get_node_list():
				states.append({"name": state_name, "type": sm.get_node(state_name).get_class()})
			result["states"] = states
	return _ok(result)


func _add_state_machine_state(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var state_name: String = params.get("state_name", "")
	if path.is_empty() or state_name.is_empty(): return _err("path and state_name are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var sm := _get_state_machine(node, params.get("state_machine_path", ""))
	if sm == null: return _err("StateMachine not found")
	var state_type: String = params.get("state_type", "animation")
	var anim_node: AnimationNode
	match state_type:
		"animation":
			var an := AnimationNodeAnimation.new()
			if params.has("animation"): an.animation = params["animation"]
			anim_node = an
		"blend_tree": anim_node = AnimationNodeBlendTree.new()
		"state_machine": anim_node = AnimationNodeStateMachine.new()
		_: return _err("Unknown state_type: %s" % state_type)
	sm.add_node(state_name, anim_node, Vector2(float(params.get("position_x", 0)), float(params.get("position_y", 0))))
	return _ok({"state_name": state_name, "type": anim_node.get_class()})


func _remove_state_machine_state(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var state_name: String = params.get("state_name", "")
	if path.is_empty() or state_name.is_empty(): return _err("path and state_name are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var sm := _get_state_machine(node, params.get("state_machine_path", ""))
	if sm == null: return _err("StateMachine not found")
	if not sm.has_node(state_name): return _err("State not found: %s" % state_name)
	sm.remove_node(state_name)
	return _ok({"removed": state_name})


func _add_state_machine_transition(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var from_state: String = params.get("from_state", "")
	var to_state: String = params.get("to_state", "")
	if path.is_empty() or from_state.is_empty() or to_state.is_empty():
		return _err("path, from_state and to_state are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var sm := _get_state_machine(node, params.get("state_machine_path", ""))
	if sm == null: return _err("StateMachine not found")
	var trans := AnimationNodeStateMachineTransition.new()
	match params.get("switch_mode", "immediate"):
		"at_end": trans.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_AT_END
		"sync":   trans.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_SYNC
		_:        trans.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_IMMEDIATE
	match params.get("advance_mode", "enabled"):
		"disabled": trans.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_DISABLED
		"auto":     trans.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO
		_:          trans.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_ENABLED
	if params.has("advance_expression"): trans.advance_expression = params["advance_expression"]
	if params.has("xfade_time"): trans.xfade_time = float(params["xfade_time"])
	sm.add_transition(from_state, to_state, trans)
	return _ok({"from": from_state, "to": to_state})


func _remove_state_machine_transition(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var from_state: String = params.get("from_state", "")
	var to_state: String = params.get("to_state", "")
	if path.is_empty() or from_state.is_empty() or to_state.is_empty():
		return _err("path, from_state and to_state are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var sm := _get_state_machine(node, params.get("state_machine_path", ""))
	if sm == null: return _err("StateMachine not found")
	sm.remove_transition(from_state, to_state)
	return _ok({"removed": "%s → %s" % [from_state, to_state]})


func _set_blend_tree_node(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var bt_state: String = params.get("blend_tree_state", "")
	var bt_node_name: String = params.get("bt_node_name", "")
	var bt_node_type: String = params.get("bt_node_type", "Animation")
	if path.is_empty() or bt_state.is_empty() or bt_node_name.is_empty(): return _err("path, blend_tree_state and bt_node_name are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var sm := _get_state_machine(node, params.get("state_machine_path", ""))
	if sm == null or not sm.has_node(bt_state): return _err("BlendTree state not found: %s" % bt_state)
	var bt: AnimationNodeBlendTree = sm.get_node(bt_state) as AnimationNodeBlendTree
	if bt == null: return _err("State is not a BlendTree: %s" % bt_state)
	var new_node: AnimationNode
	match bt_node_type:
		"Animation":
			var an := AnimationNodeAnimation.new()
			if params.has("animation"): an.animation = params["animation"]
			new_node = an
		"Add2": new_node = AnimationNodeAdd2.new()
		"Blend2": new_node = AnimationNodeBlend2.new()
		"TimeScale": new_node = AnimationNodeTimeScale.new()
		"OneShot": new_node = AnimationNodeOneShot.new()
		_: return _err("Unknown bt_node_type: %s" % bt_node_type)
	bt.add_node(bt_node_name, new_node, Vector2(float(params.get("position_x", 0)), float(params.get("position_y", 0))))
	if params.has("connect_to"):
		bt.connect_node(params["connect_to"], int(params.get("connect_port", 0)), bt_node_name)
	return _ok({"state": bt_state, "name": bt_node_name, "type": new_node.get_class()})


func _set_tree_parameter(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var parameter: String = params.get("parameter", "")
	if path.is_empty() or parameter.is_empty() or not params.has("value"): return _err("path, parameter and value are required")
	var node := _find_node(path)
	if node == null or not node is AnimationTree: return _err("AnimationTree not found: %s" % path)
	var tree: AnimationTree = node
	var full_param := parameter if parameter.begins_with("parameters/") else "parameters/" + parameter
	tree.set(full_param, GPUtils.parse_value(params["value"]))
	return _ok({"parameter": full_param, "value": params["value"]})


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

const _ASSET_EXTENSIONS := ["tres", "tscn", "png", "jpg", "jpeg", "webp", "svg", "wav", "ogg", "mp3", "ttf", "otf", "gdshader", "glb", "gltf", "obj"]
const _CODE_EXTENSIONS := ["tscn", "gd", "tres"]


func _find_unused_resources(params: Dictionary) -> Dictionary:
	var root_path: String = params.get("path", "res://")
	var include_addons: bool = params.get("include_addons", false)
	var excludes := PackedStringArray([] if include_addons else ["addons"])

	var all_assets := GPUtils.find_files(root_path,
		func(p: String) -> bool: return p.get_extension().to_lower() in _ASSET_EXTENSIONS, -1, excludes)
	var code_files := GPUtils.find_files(root_path,
		func(p: String) -> bool: return p.get_extension().to_lower() in _CODE_EXTENSIONS, -1, excludes)

	# Build reference set từ tất cả code files
	var referenced: Dictionary = {}
	for cf: String in code_files:
		var f := FileAccess.open(cf, FileAccess.READ)
		if f == null: continue
		var content := f.get_as_text()
		f.close()
		for asset: String in all_assets:
			var rel := asset.replace("res://", "")
			if content.contains(rel) or content.contains(asset):
				referenced[asset] = true

	var unused: Array = []
	for asset: String in all_assets:
		if not referenced.has(asset):
			unused.append(asset)
	return _ok({"unused": unused, "count": unused.size(), "total_scanned": all_assets.size()})


func _analyze_signal_flow(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var connections: Array = []
	_collect_signal_connections(root, connections)
	return _ok({"connections": connections, "count": connections.size()})


func _collect_signal_connections(node: Node, out: Array) -> void:
	for sig in node.get_signal_list():
		var sig_name: String = sig["name"]
		for conn: Dictionary in node.get_signal_connection_list(sig_name):
			out.append({
				"source_node": str(node.name),
				"source_path": str(node.get_path()),
				"signal": sig_name,
				"target_node": str(conn["callable"].get_object().name) if conn["callable"].get_object() else "?",
				"method": conn["callable"].get_method(),
			})
	for child in node.get_children():
		_collect_signal_connections(child, out)


func _analyze_scene_complexity(params: Dictionary) -> Dictionary:
	var root: Node
	var scene_path: String = params.get("path", "")
	if scene_path.is_empty():
		root = _require_scene()
		if root == null: return _err("No scene open")
	else:
		var ps := load(scene_path) as PackedScene
		if ps == null: return _err("Cannot load scene: %s" % scene_path)
		root = ps.instantiate()

	var node_count := 0
	var max_depth := 0
	var type_counts: Dictionary = {}
	var scripts: Array = []
	var issues: Array = []
	_walk_complexity(root, 0, node_count, max_depth, type_counts, scripts)
	node_count = _count_nodes(root)
	if node_count > 200: issues.append("High node count: %d" % node_count)
	if max_depth > 10: issues.append("Deep nesting: depth %d" % max_depth)
	if not scene_path.is_empty(): root.queue_free()
	return _ok({"node_count": node_count, "max_depth": max_depth, "types": type_counts, "issues": issues})


func _count_nodes(node: Node) -> int:
	var count := 1
	for child in node.get_children(): count += _count_nodes(child)
	return count


func _walk_complexity(node: Node, depth: int, count: int, max_depth: int, types: Dictionary, scripts: Array) -> void:
	if depth > max_depth: max_depth = depth
	var cls := node.get_class()
	types[cls] = types.get(cls, 0) + 1
	var script: Script = node.get_script()
	if script and not script.resource_path.is_empty(): scripts.append(script.resource_path)
	for child in node.get_children():
		_walk_complexity(child, depth + 1, count, max_depth, types, scripts)


func _find_script_references(params: Dictionary) -> Dictionary:
	var query: String = params.get("query", "")
	if query.is_empty(): return _err("query is required")
	var root_path: String = params.get("path", "res://")
	var include_addons: bool = params.get("include_addons", false)
	var excludes := PackedStringArray([] if include_addons else ["addons"])
	var matches := GPUtils.search_in_files(root_path, query, PackedStringArray(["tscn", "gd", "tres"]), 100, excludes)
	return _ok({"query": query, "matches": matches, "count": matches.size()})


func _detect_circular_dependencies(params: Dictionary) -> Dictionary:
	var root_path: String = params.get("path", "res://")
	var include_addons: bool = params.get("include_addons", false)
	var excludes := PackedStringArray([] if include_addons else ["addons"])
	var scene_files := GPUtils.find_files(root_path,
		func(p: String) -> bool: return p.get_extension() == "tscn", -1, excludes)

	# Build adjacency: scene → [instanced scenes]
	var deps: Dictionary = {}
	for sf: String in scene_files:
		var f := FileAccess.open(sf, FileAccess.READ)
		if f == null: continue
		var content := f.get_as_text()
		f.close()
		var scene_deps: Array = []
		for line in content.split("\n"):
			if "path=\"res://" in line and ".tscn\"" in line:
				var start := line.find("res://")
				var end := line.find(".tscn\"", start)
				if start >= 0 and end >= 0:
					var dep := line.substr(start, end - start + 5)
					if dep != sf: scene_deps.append(dep)
		deps[sf] = scene_deps

	# DFS detect cycles
	var cycles: Array = []
	var visited: Dictionary = {}
	for scene: String in deps:
		_dfs_cycle(scene, deps, [], visited, cycles)
	return _ok({"cycles": cycles, "has_circular": not cycles.is_empty()})


func _dfs_cycle(scene: String, deps: Dictionary, path: Array, visited: Dictionary, cycles: Array) -> void:
	if scene in path:
		var cycle_start := path.find(scene)
		cycles.append(path.slice(cycle_start) + [scene])
		return
	if visited.has(scene): return
	visited[scene] = true
	var new_path := path + [scene]
	for dep: String in deps.get(scene, []):
		_dfs_cycle(dep, deps, new_path, visited, cycles)


func _get_project_statistics(params: Dictionary) -> Dictionary:
	var root_path: String = params.get("path", "res://")
	var include_addons: bool = params.get("include_addons", false)
	var excludes := PackedStringArray([] if include_addons else ["addons"])

	var all_files := GPUtils.find_files(root_path, func(_p: String) -> bool: return true, -1, excludes)
	var ext_counts: Dictionary = {}
	var total_lines := 0
	for f: String in all_files:
		var ext := f.get_extension().to_lower()
		ext_counts[ext] = ext_counts.get(ext, 0) + 1
		if ext == "gd":
			var fa := FileAccess.open(f, FileAccess.READ)
			if fa: total_lines += fa.get_as_text().split("\n").size(); fa.close()

	var autoloads: Array = []
	for key in ProjectSettings.get_property_list():
		var pname: String = key["name"]
		if pname.begins_with("autoload/"):
			autoloads.append(pname.replace("autoload/", ""))

	return _ok({"file_counts": ext_counts, "total_files": all_files.size(),
		"total_gd_lines": total_lines, "autoloads": autoloads})


# ═══════════════════════════════════════════════════════════════════════════════
# TEST (editor-side orchestration, delegates game commands via IPC)
# ═══════════════════════════════════════════════════════════════════════════════

func _write_input_raw(json: String) -> void:
	_game_ipc().send_input(json)


func _run_test_scenario(params: Dictionary) -> Dictionary:
	if not params.has("steps") or not params["steps"] is Array:
		return _err("Missing required parameter: steps (Array)")
	var steps: Array = params["steps"]
	if steps.is_empty():
		return _err("Steps array is empty")

	var scene_path: String = params.get("scene_path", "")
	var ei := _ei()

	var target_scene: String = ""  # scene cần verify đã load (chỉ dùng khi gọi play_custom_scene)
	if not scene_path.is_empty():
		if ei.is_playing_scene():
			ei.stop_playing_scene()
			await ei.get_base_control().get_tree().create_timer(0.5).timeout
		match scene_path:
			"main":
				ei.play_main_scene()
			"current":
				ei.play_current_scene()
			_:
				if not FileAccess.file_exists(scene_path):
					return _err("Scene file not found: %s" % scene_path)
				ei.play_custom_scene(scene_path)
				target_scene = scene_path

		# Chờ tối đa 10 giây để scene được start
		var wait_start := Time.get_ticks_msec()
		while not ei.is_playing_scene():
			if Time.get_ticks_msec() - wait_start > 10000:
				return _err("Timeout waiting for scene to start")
			await ei.get_base_control().get_tree().create_timer(0.2).timeout

		# Nếu là play_custom_scene, chờ thêm để đảm bảo scene đúng đã load
		# (Godot có thể chạy loading/boot scene trước)
		if not target_scene.is_empty():
			var scene_wait_start := Time.get_ticks_msec()
			while true:
				var playing := ei.get_playing_scene()
				# Normalize path để so sánh (loại bỏ res:// prefix nếu cần)
				if playing == target_scene or playing.ends_with(target_scene.trim_prefix("res://")):
					break
				if Time.get_ticks_msec() - scene_wait_start > 10000:
					# Timeout nhưng vẫn tiếp tục — scene có thể đã load nhưng path khác nhau
					break
				await ei.get_base_control().get_tree().create_timer(0.2).timeout
		else:
			# Chờ thêm 1.5 giây để scene hoàn tất init
			await ei.get_base_control().get_tree().create_timer(1.5).timeout

	if not ei.is_playing_scene():
		return _err("No scene is currently playing — provide scene_path or use play_scene first")

	var results: Array = []
	var pass_count := 0
	var fail_count := 0
	var error_count := 0

	for i in steps.size():
		var step: Dictionary = steps[i]
		if not step.has("type"):
			results.append({"step": i, "error": "Missing 'type' field"})
			error_count += 1
			continue

		var step_type: String = str(step["type"])
		var step_result: Dictionary = {"step": i, "type": step_type}

		match step_type:
			"input":
				var ir := await _scenario_input_step(step)
				step_result.merge(ir)
				if ir.has("error"): error_count += 1

			"wait":
				var wr := await _scenario_wait_step(step)
				step_result.merge(wr)
				if wr.has("error"): error_count += 1

			"assert":
				var ar := await _scenario_assert_step(step)
				step_result.merge(ar)
				if ar.get("passed", false):
					pass_count += 1
				else:
					fail_count += 1
				_test_results.append(ar)

			"screenshot":
				var sr := await _send_game_command("capture_frames", {
					"count": 1, "frame_interval": 1,
					"half_resolution": step.get("half_resolution", true),
				}, 5.0)
				if sr.has("error"):
					step_result["captured"] = false
					step_result["error"] = "Screenshot capture failed"
					error_count += 1
				else:
					step_result["captured"] = true

			_:
				step_result["error"] = "Unknown step type: %s" % step_type
				error_count += 1

		results.append(step_result)

		if not ei.is_playing_scene():
			results.append({"step": i + 1, "error": "Game stopped unexpectedly"})
			error_count += 1
			break

	return _ok({
		"total_steps": steps.size(),
		"completed_steps": results.size(),
		"assertions_passed": pass_count,
		"assertions_failed": fail_count,
		"errors": error_count,
		"all_passed": fail_count == 0 and error_count == 0,
		"results": results,
	})


func _scenario_input_step(step: Dictionary) -> Dictionary:
	## Hỗ trợ: action, key, text, mouse_click, mouse_move. Auto-detect từ fields có mặt.
	var input_type: String = step.get("input_type", "")

	if input_type.is_empty():
		if step.has("text") and (step.has("label") or step.has("path")): input_type = "input_text_to_element"
		elif step.has("text"): input_type = "text"
		elif step.has("action"): input_type = "action"
		elif step.has("keycode"): input_type = "key"
		elif step.has("relative_x") or step.has("relative_y"): input_type = "mouse_move"
		elif step.has("x") or step.has("button"): input_type = "mouse_click"
		else: input_type = "action"

	match input_type:
		"action":
			var action: String = step.get("action", "")
			if action.is_empty(): return {"error": "Input step 'action' requires 'action' field"}
			var pressed: bool = step.get("pressed", true)
			var events: Array = [{"type": "action", "action": action, "pressed": pressed, "strength": float(step.get("strength", 1.0))}]
			if pressed and step.get("auto_release", true):
				events.append({"type": "action", "action": action, "pressed": false, "strength": 0.0})
			_write_input_raw(JSON.stringify({"sequence_events": events, "frame_delay": int(step.get("frame_delay", 1))}))
			return {"sent": true, "input_type": "action", "action": action}

		"key":
			var keycode: String = step.get("keycode", "")
			if keycode.is_empty(): return {"error": "Input step 'key' requires 'keycode' field"}
			var pressed: bool = step.get("pressed", true)
			var events: Array = [{"type": "key", "keycode": keycode, "pressed": pressed,
				"shift": step.get("shift", false), "ctrl": step.get("ctrl", false), "alt": step.get("alt", false)}]
			if pressed and step.get("auto_release", true):
				events.append({"type": "key", "keycode": keycode, "pressed": false})
			_write_input_raw(JSON.stringify({"sequence_events": events, "frame_delay": int(step.get("frame_delay", 1))}))
			return {"sent": true, "input_type": "key", "keycode": keycode}

		"mouse_click":
			var button := int(step.get("button", 1))
			var x := float(step.get("x", 0)); var y := float(step.get("y", 0))
			var press := {"type": "mouse_button", "button": button, "pressed": true,
				"double_click": step.get("double_click", false), "position": {"x": x, "y": y}}
			var release := press.duplicate(); release["pressed"] = false
			_write_input_raw(JSON.stringify({"sequence_events": [press, release], "frame_delay": int(step.get("frame_delay", 1))}))
			return {"sent": true, "input_type": "mouse_click", "button": button, "position": {"x": x, "y": y}}

		"mouse_move":
			var event := {"type": "mouse_motion",
				"position": {"x": float(step.get("x", 0)), "y": float(step.get("y", 0))},
				"relative": {"x": float(step.get("relative_x", 0)), "y": float(step.get("relative_y", 0))}}
			_write_input_raw(JSON.stringify([event]))
			return {"sent": true, "input_type": "mouse_move"}

		"text":
			# Inject text trực tiếp vào focused LineEdit/TextEdit — không phụ thuộc keycode.
			var text: String = str(step.get("text", ""))
			if text.is_empty(): return {"error": "Input step 'text' requires 'text' field"}
			_write_input_raw(JSON.stringify([{"type": "text", "text": text}]))
			return {"sent": true, "input_type": "text", "text": text}

		"input_text_to_element":
			# Tìm element theo label/path, grab_focus rồi inject text — đảm bảo focus đúng.
			var text: String = str(step.get("text", ""))
			if text.is_empty(): return {"error": "Input step requires 'text' field"}
			var cmd_params: Dictionary = {"text": text}
			if step.has("label"): cmd_params["label"] = str(step["label"])
			if step.has("path"): cmd_params["path"] = str(step["path"])
			if step.has("clear"): cmd_params["clear"] = step["clear"]
			var r := await _send_game_command("input_text_to_element", cmd_params)
			if r.has("error"): return r
			return {"sent": true, "input_type": "input_text_to_element", "text": text,
				"path": r.get("path", ""), "element_type": r.get("element_type", "")}

		_:
			return {"error": "Unknown input_type: '%s'. Use action/key/text/mouse_click/mouse_move" % input_type}


func _scenario_wait_step(step: Dictionary) -> Dictionary:
	if step.has("path"):
		var timeout := float(step.get("timeout", 5.0))
		var result := await _send_game_command("wait_for_node", {
			"path": str(step["path"]), "timeout": timeout,
			"poll_frames": int(step.get("poll_frames", 5)),
		}, timeout + 2.0)
		if result.has("error"): return {"error": "Wait for node failed: %s" % str(result["error"])}
		return {"waited_for": str(step["path"]), "found": true}
	else:
		var seconds := float(step.get("seconds", 1.0))
		await _ei().get_base_control().get_tree().create_timer(seconds).timeout
		return {"waited_seconds": seconds}


func _scenario_assert_step(step: Dictionary) -> Dictionary:
	if step.has("text"):
		var result := await _send_game_command("assert_screen_text", {
			"text": str(step["text"]),
			"partial": step.get("partial", true),
			"case_sensitive": step.get("case_sensitive", true),
		}, 5.0)
		if result.has("error"): return {"passed": false, "error": str(result["error"])}
		return result.get("result", {"passed": false, "error": "No result"})
	elif step.has("path") and step.has("property"):
		var result := await _send_game_command("assert_node_state", {
			"path": str(step["path"]), "property": str(step["property"]),
			"expected": step.get("expected"), "operator": str(step.get("operator", "eq")),
		}, 5.0)
		if result.has("error"): return {"passed": false, "error": str(result["error"])}
		return result.get("result", {"passed": false, "error": "No result"})
	else:
		return {"passed": false, "error": "Assert step requires 'text' or 'path'+'property'"}


func _assert_node_state(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	var property: String = params.get("property", "")
	if path.is_empty(): return _err("path is required")
	if property.is_empty(): return _err("property is required")
	if not params.has("expected"): return _err("expected is required")
	var valid_ops := ["eq", "neq", "gt", "lt", "gte", "lte", "contains", "type_is"]
	var operator: String = params.get("operator", "eq")
	if operator not in valid_ops: return _err("Invalid operator '%s'. Valid: %s" % [operator, str(valid_ops)])
	var result := await _send_game_command("assert_node_state", {
		"path": path, "property": property,
		"expected": params["expected"], "operator": operator,
	}, 5.0)
	if result.has("result"): _test_results.append(result["result"])
	return result


func _assert_screen_text(params: Dictionary) -> Dictionary:
	var text: String = params.get("text", "")
	if text.is_empty(): return _err("text is required")
	var result := await _send_game_command("assert_screen_text", {
		"text": text,
		"partial": params.get("partial", true),
		"case_sensitive": params.get("case_sensitive", true),
	}, 5.0)
	if result.has("result"): _test_results.append(result["result"])
	return result


func _run_stress_test(params: Dictionary) -> Dictionary:
	var duration := float(params.get("duration", 5.0))
	if duration <= 0 or duration > 60: return _err("Duration must be between 0 and 60 seconds")
	var ei := _ei()
	if not ei.is_playing_scene(): return _err("No scene is currently playing")

	var actions := ["ui_up", "ui_down", "ui_left", "ui_right", "ui_accept", "ui_cancel"]
	for action in params.get("actions", []):
		actions.append(str(action))

	var events_sent := 0
	var start_time := Time.get_ticks_msec()
	var duration_ms := int(duration * 1000.0)

	while Time.get_ticks_msec() - start_time < duration_ms:
		if not ei.is_playing_scene():
			return _ok({"completed": false, "crashed": true,
				"elapsed_seconds": (Time.get_ticks_msec() - start_time) / 1000.0,
				"events_sent": events_sent})
		var batch: Array = []
		for _j in 3:
			var action_name: String = actions[randi() % actions.size()]
			batch.append({"type": "action", "action": action_name, "pressed": true, "strength": 1.0})
			batch.append({"type": "action", "action": action_name, "pressed": false, "strength": 0.0})
		_write_input_raw(JSON.stringify({"sequence_events": batch, "frame_delay": 1}))
		events_sent += batch.size()
		await ei.get_base_control().get_tree().create_timer(0.1).timeout

	return _ok({
		"completed": true, "crashed": not ei.is_playing_scene(),
		"duration_seconds": (Time.get_ticks_msec() - start_time) / 1000.0,
		"events_sent": events_sent, "game_still_running": ei.is_playing_scene(),
	})


func _get_test_report(params: Dictionary) -> Dictionary:
	var pass_count := 0; var fail_count := 0
	for result: Dictionary in _test_results:
		if result.get("passed", false): pass_count += 1
		else: fail_count += 1
	var report := {
		"total": _test_results.size(), "passed": pass_count, "failed": fail_count,
		"pass_rate": ("%.1f%%" % (100.0 * pass_count / _test_results.size())) if not _test_results.is_empty() else "N/A",
		"all_passed": fail_count == 0 and not _test_results.is_empty(),
		"details": _test_results.duplicate(),
	}
	if bool(params.get("clear", true)): _test_results.clear()
	return _ok(report)
