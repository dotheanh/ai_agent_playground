@tool
class_name GPCoreCommands
extends Node

## GPCoreCommands — Scene + Node + Script commands
## Các lệnh cốt lõi để thao tác với scene, node, và script

var editor_plugin: EditorPlugin


func get_commands() -> Dictionary:
	return {
		# Scene
		"scene_get_tree": _get_scene_tree,
		"scene_get_file_content": _get_scene_file_content,
		"scene_create": _create_scene,
		"scene_open": _open_scene,
		"scene_delete": _delete_scene,
		"scene_save": _save_scene,
		"scene_add_instance": _add_scene_instance,
		"scene_play": _play_scene,
		"scene_stop": _stop_scene,
		"scene_get_export_vars": _get_scene_exports,
		# Node
		"node_add": _add_node,
		"node_delete": _delete_node,
		"node_duplicate": _duplicate_node,
		"node_move": _move_node,
		"node_rename": _rename_node,
		"node_set_property": _update_property,
		"node_get_properties": _get_node_properties,
		"node_set_subresource": _add_resource,
		"node_set_anchor_preset": _set_anchor_preset,
		"node_connect_signal": _connect_signal,
		"node_disconnect_signal": _disconnect_signal,
		"node_get_groups": _get_node_groups,
		"node_set_groups": _set_node_groups,
		"node_find_in_group": _find_nodes_in_group,
		# Script
		"script_list": _list_scripts,
		"script_read": _read_script,
		"script_create": _create_script,
		"script_edit": _edit_script,
		"script_attach": _attach_script,
		"script_get_open": _get_open_scripts,
		"script_validate": _validate_script,
	}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

func _ei() -> EditorInterface:
	return editor_plugin.get_editor_interface()

## Lấy GPDebugCommands sibling để kiểm tra breakpoints hiện có
func _find_debug_commands() -> GPDebugCommands:
	if get_parent() == null:
		return null
	for sibling in get_parent().get_children():
		if sibling is GPDebugCommands:
			return sibling as GPDebugCommands
	return null

func _ur() -> EditorUndoRedoManager:
	return editor_plugin.get_undo_redo()

func _edited_root() -> Node:
	return _ei().get_edited_scene_root()

func _ok(data: Dictionary = {}) -> Dictionary: return GPUtils.mcp_ok_json(data)

func _err(code: int, msg: String, data: Dictionary = {}) -> Dictionary:
	var e_msg := msg
	if not data.is_empty():
		if data.has("suggestion"):
			e_msg += " | Suggestion: %s" % data["suggestion"]
	return GPUtils.mcp_err(e_msg, code)

func _err_params(msg: String) -> Dictionary:
	return _err(-32602, msg)

func _err_not_found(what: String, hint: String = "") -> Dictionary:
	var d := {}
	if hint: d["suggestion"] = hint
	return _err(-32001, "%s not found" % what, d)

func _err_no_scene() -> Dictionary:
	return _err(-32000, "No scene is currently open", {"suggestion": "Use open_scene first"})

func _err_internal(msg: String) -> Dictionary:
	return _err(-32603, "Internal error: %s" % msg)

func _require_string(params: Dictionary, key: String) -> Array:
	if not params.has(key) or not params[key] is String or (params[key] as String).is_empty():
		return [null, _err_params("Missing required parameter: %s" % key)]
	return [params[key] as String, null]

func _optional_string(params: Dictionary, key: String, default: String = "") -> String:
	if params.has(key) and params[key] is String: return params[key] as String
	return default

func _optional_bool(params: Dictionary, key: String, default: bool = false) -> bool:
	if params.has(key) and params[key] is bool: return params[key] as bool
	return default

func _optional_int(params: Dictionary, key: String, default: int = 0) -> int:
	if params.has(key): return int(params[key])
	return default

func _require_scene(scene_path: String = "") -> Array:
	var editor := _ei()
	if not scene_path.is_empty():
		if not FileAccess.file_exists(scene_path):
			return [null, _err(-32001, "Scene file not found: %s" % scene_path)]
		var current_root := editor.get_edited_scene_root()
		var current_path := current_root.scene_file_path if current_root else ""
		if current_path != scene_path:
			editor.open_scene_from_path(scene_path)
			current_root = editor.get_edited_scene_root()
			if current_root == null or current_root.scene_file_path != scene_path:
				return [null, _err(-32000, "Failed to open scene: %s" % scene_path)]
		return [current_root, null]
	var root := editor.get_edited_scene_root()
	if root == null: return [null, _err_no_scene()]
	return [root, null]

func _find_node(root: Node, node_path: String) -> Node:
	if not is_instance_valid(root): return null
	if node_path == "." or node_path == root.name: return root
	if root.has_node(node_path): return root.get_node(node_path)
	if node_path.begins_with(root.name + "/"):
		var rel := node_path.substr(root.name.length() + 1)
		if root.has_node(rel): return root.get_node(rel)
	return null



# ══════════════════════════════════════════════════════════════════════════════
# SCENE COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_scene_tree(params: Dictionary) -> Dictionary:
	var sr := _require_scene(_optional_string(params, "scene_path"))
	if sr[1] != null: return sr[1]
	var root: Node = sr[0]
	var tree := GPUtils.get_node_tree(root, _optional_int(params, "max_depth", -1))
	return _ok({"scene_path": root.scene_file_path, "tree": tree})


func _get_scene_file_content(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Scene file '%s'" % path)
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return _err_internal("Cannot read file")
	var content := file.get_as_text(); file.close()
	return _ok({"path": path, "content": content, "size": content.length()})


func _create_scene(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	var root_type := _optional_string(params, "root_type", "Node2D")
	var root_name := _optional_string(params, "root_name", "")
	if not ClassDB.class_exists(root_type): return _err_params("Unknown node type: %s" % root_type)
	var root: Node = ClassDB.instantiate(root_type)
	if root_name.is_empty(): root_name = path.get_file().get_basename()
	root.name = root_name
	var scene := PackedScene.new()
	var err := scene.pack(root); root.queue_free()
	if err != OK: return _err_internal("Failed to pack scene")
	var dir_path := path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir_path): DirAccess.make_dir_recursive_absolute(dir_path)
	err = ResourceSaver.save(scene, path)
	if err != OK: return _err_internal("Failed to save scene")
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path, "root_type": root_type, "root_name": root_name})


func _open_scene(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Scene file '%s'" % path)
	_ei().open_scene_from_path(path)
	return _ok({"path": path, "opened": true})


func _delete_scene(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Scene file '%s'" % path)
	var err := DirAccess.remove_absolute(path)
	if err != OK: return _err_internal("Failed to delete: %s" % error_string(err))
	var import_path := path + ".import"
	if FileAccess.file_exists(import_path): DirAccess.remove_absolute(import_path)
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path, "deleted": true})


func _save_scene(params: Dictionary) -> Dictionary:
	var root := _edited_root()
	if root == null: return _err_no_scene()
	var path := _optional_string(params, "path", root.scene_file_path)
	if path.is_empty(): return _err_params("No save path specified")
	var scene := PackedScene.new()
	var err := scene.pack(root)
	if err != OK: return _err_internal("Failed to pack")
	err = ResourceSaver.save(scene, path)
	if err != OK: return _err_internal("Failed to save")
	return _ok({"path": path, "saved": true})


func _add_scene_instance(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "scene_path"); if r[1]: return r[1]
	var scene_path: String = r[0]
	var parent_path := _optional_string(params, "parent_path", ".")
	var instance_name := _optional_string(params, "name")
	var sr := _require_scene(_optional_string(params, "target_scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	if not FileAccess.file_exists(scene_path): return _err_not_found("Scene '%s'" % scene_path)
	var parent := _find_node(root, parent_path)
	if parent == null: return _err_not_found("Parent node '%s'" % parent_path)
	var packed: PackedScene = load(scene_path)
	if packed == null: return _err_internal("Failed to load scene")
	var instance := packed.instantiate()
	if not instance_name.is_empty(): instance.name = instance_name
	var ur := _ur()
	ur.create_action("MCP: Add scene instance")
	ur.add_do_method(parent, "add_child", instance)
	ur.add_do_method(instance, "set_owner", root)
	ur.add_do_reference(instance)
	ur.add_undo_method(parent, "remove_child", instance)
	ur.commit_action()
	GPUtils.set_owner_recursive(instance, root)
	return _ok({"path": str(root.get_path_to(instance)), "scene_path": scene_path, "name": instance.name})


## Tìm button trên Run Bar bằng tooltip (dùng để simulate click với debugger)
func _find_run_bar_btn(node: Node, tooltip_fragment: String) -> Button:
	if node is Button:
		var b: Button = node
		if b.tooltip_text.contains(tooltip_fragment) or b.text == tooltip_fragment:
			return b
	for child in node.get_children():
		var found := _find_run_bar_btn(child, tooltip_fragment)
		if found:
			return found
	return null


## Khi có breakpoints active, simulate click nút Run trên toolbar để game launch
## với debugger attached (is_debuggable = true). Nếu không có breakpoints,
## dùng EditorInterface.play_*() như bình thường.
func _play_scene(params: Dictionary) -> Dictionary:
	var mode := _optional_string(params, "mode", "main")
	var with_debugger: bool = params.get("with_debugger", false)
	var ei := _ei()

	# Nếu yêu cầu debug mode hoặc có breakpoints, simulate click nút Run trên toolbar
	# để game được launch với debugger attached (is_debuggable = true)
	var debug_commands := _find_debug_commands()
	var has_breakpoints: bool = debug_commands != null and not debug_commands._breakpoints.is_empty()

	if with_debugger or has_breakpoints:
		var base := ei.get_base_control()
		# Nút Run trên toolbar có tooltip "Play" hoặc "Run Project" tùy locale
		var run_btn := _find_run_bar_btn(base, "Play the Project")
		if run_btn == null:
			run_btn = _find_run_bar_btn(base, "Run Project")
		if run_btn == null:
			run_btn = _find_run_bar_btn(base, "Play")
		if run_btn != null and run_btn.visible and not run_btn.disabled:
			# Nếu cần custom/current scene, mở scene đó trước rồi click "Run Current Scene"
			if mode != "main":
				if mode != "current":
					# Custom scene — mở scene đó rồi dùng "Run Current Scene"
					if ResourceLoader.exists(mode):
						ei.open_scene_from_path(mode)
					else:
						return _err_not_found("Scene '%s'" % mode)
				var current_btn := _find_run_bar_btn(base, "Play Current Scene")
				if current_btn == null:
					current_btn = _find_run_bar_btn(base, "Run Current Scene")
				if current_btn != null and current_btn.visible and not current_btn.disabled:
					current_btn.pressed.emit()
					return _ok({"playing": true, "mode": mode, "debugger": true, "method": "toolbar_button"})
			else:
				run_btn.pressed.emit()
				return _ok({"playing": true, "mode": mode, "debugger": true, "method": "toolbar_button"})

	# Fallback: dùng EditorInterface (không có debugger attached)
	match mode:
		"main": ei.play_main_scene()
		"current": ei.play_current_scene()
		_:
			if not ResourceLoader.exists(mode): return _err_not_found("Scene '%s'" % mode)
			ei.play_custom_scene(mode)
	return _ok({"playing": true, "mode": mode, "debugger": false, "method": "editor_interface"})


func _stop_scene(params: Dictionary) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene():
		return _ok({"stopped": false, "message": "No scene is currently playing"})
	ei.stop_playing_scene()
	return _ok({"stopped": true})


func _get_scene_exports(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Scene '%s'" % path)
	var packed: PackedScene = load(path)
	if packed == null: return _err_internal("Failed to load scene")
	var instance: Node = packed.instantiate()
	var nodes_data: Array = []
	_collect_exports(instance, instance, nodes_data)
	instance.queue_free()
	return _ok({"path": path, "nodes": nodes_data, "count": nodes_data.size()})


func _collect_exports(node: Node, root: Node, nodes_data: Array) -> void:
	var script: Script = node.get_script()
	if script != null:
		var exports: Dictionary = {}
		for prop_info in script.get_script_property_list():
			var usage: int = prop_info["usage"]
			if (usage & PROPERTY_USAGE_EDITOR) and (usage & PROPERTY_USAGE_SCRIPT_VARIABLE):
				var pn: String = prop_info["name"]
				exports[pn] = {
					"value": GPUtils.serialize_value(node.get(pn)),
					"type": prop_info["type"],
					"hint": prop_info.get("hint", 0),
					"hint_string": prop_info.get("hint_string", ""),
				}
		if not exports.is_empty():
			nodes_data.append({
				"path": "." if node == root else str(root.get_path_to(node)),
				"name": node.name,
				"type": node.get_class(),
				"script": script.resource_path,
				"exports": exports,
			})
	for child in node.get_children():
		_collect_exports(child, root, nodes_data)


# ══════════════════════════════════════════════════════════════════════════════
# NODE COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _add_node(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "type"); if r[1]: return r[1]
	var type: String = r[0]
	if not ClassDB.class_exists(type): return _err_params("Unknown node type: %s" % type)
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var parent := _find_node(root, _optional_string(params, "parent_path", "."))
	if parent == null: return _err_not_found("Parent node")
	var node: Node = ClassDB.instantiate(type)
	var node_name := _optional_string(params, "name")
	if not node_name.is_empty(): node.name = node_name
	var properties: Dictionary = params.get("properties", {})
	for prop_name: String in properties:
		var prop_exists := false
		for prop in node.get_property_list():
			if prop["name"] == prop_name: prop_exists = true; break
		if prop_exists:
			var current: Variant = node.get(prop_name)
			node.set(prop_name, GPUtils.parse_value(properties[prop_name], typeof(current)))
	var ur := _ur()
	ur.create_action("MCP: Add %s" % type)
	ur.add_do_method(parent, "add_child", node)
	ur.add_do_method(node, "set_owner", root)
	ur.add_do_reference(node)
	ur.add_undo_method(parent, "remove_child", node)
	ur.commit_action()
	return _ok({"path": str(root.get_path_to(node)), "type": type, "name": str(node.name)})


func _delete_node(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r[0])
	if node == null: return _err_not_found("Node '%s'" % r[0])
	if node == root: return _err_params("Cannot delete the root node")
	var parent := node.get_parent()
	var node_name := str(node.name)
	var ur := _ur()
	ur.create_action("MCP: Delete %s" % node_name)
	ur.add_do_method(parent, "remove_child", node)
	ur.add_undo_method(parent, "add_child", node)
	ur.add_undo_method(node, "set_owner", root)
	ur.add_undo_reference(node)
	ur.commit_action()
	return _ok({"deleted": node_name})


func _duplicate_node(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r[0])
	if node == null: return _err_not_found("Node '%s'" % r[0])
	var new_name := _optional_string(params, "name", str(node.name) + "_copy")
	var dup := node.duplicate(); dup.name = new_name
	var parent := node.get_parent()
	var ur := _ur()
	ur.create_action("MCP: Duplicate %s" % node.name)
	ur.add_do_method(parent, "add_child", dup)
	ur.add_do_method(dup, "set_owner", root)
	ur.add_do_reference(dup)
	ur.add_undo_method(parent, "remove_child", dup)
	ur.commit_action()
	GPUtils.set_owner_recursive(dup, root)
	return _ok({"original": str(root.get_path_to(node)), "duplicate": str(root.get_path_to(dup)), "name": str(dup.name)})


func _move_node(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "new_parent_path"); if r2[1]: return r2[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r1[0])
	if node == null: return _err_not_found("Node '%s'" % r1[0])
	if node == root: return _err_params("Cannot move the root node")
	var new_parent := _find_node(root, r2[0])
	if new_parent == null: return _err_not_found("Target parent '%s'" % r2[0])
	if new_parent == node or node.is_ancestor_of(new_parent): return _err_params("Cannot move a node into its own subtree")
	var old_parent := node.get_parent()
	var ur := _ur()
	ur.create_action("MCP: Move %s" % node.name)
	ur.add_do_method(old_parent, "remove_child", node)
	ur.add_do_method(new_parent, "add_child", node)
	ur.add_do_method(node, "set_owner", root)
	ur.add_undo_method(new_parent, "remove_child", node)
	ur.add_undo_method(old_parent, "add_child", node)
	ur.add_undo_method(node, "set_owner", root)
	ur.commit_action()
	GPUtils.set_owner_recursive(node, root)
	return _ok({"name": str(node.name), "old_parent": str(root.get_path_to(old_parent)), "new_parent": str(root.get_path_to(new_parent)), "path": str(root.get_path_to(node))})


func _rename_node(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "new_name"); if r2[1]: return r2[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r1[0])
	if node == null: return _err_not_found("Node '%s'" % r1[0])
	var old_name := str(node.name)
	var ur := _ur()
	ur.create_action("MCP: Rename %s → %s" % [old_name, r2[0]])
	ur.add_do_property(node, "name", r2[0])
	ur.add_undo_property(node, "name", old_name)
	ur.commit_action()
	return _ok({"old_name": old_name, "new_name": str(node.name), "path": str(root.get_path_to(node))})


func _update_property(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "property"); if r2[1]: return r2[1]
	if not params.has("value"): return _err_params("Missing required parameter: value")
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r1[0])
	if node == null: return _err_not_found("Node '%s'" % r1[0])
	var property: String = r2[0]
	if not property in node:
		var available: Array = []
		for prop in node.get_property_list():
			if prop["usage"] & PROPERTY_USAGE_EDITOR: available.append(prop["name"])
		return _err_not_found("Property '%s' on %s" % [property, node.get_class()], "Available: %s" % str(available.slice(0, 20)))
	var old_value: Variant = node.get(property)
	var parsed_value: Variant = GPUtils.parse_value(params["value"], typeof(old_value))
	var ur := _ur()
	ur.create_action("MCP: Set %s.%s" % [node.name, property])
	ur.add_do_property(node, property, parsed_value)
	ur.add_undo_property(node, property, old_value)
	ur.commit_action()
	return _ok({"path": str(root.get_path_to(node)), "property": property, "old_value": GPUtils.serialize_value(old_value), "new_value": GPUtils.serialize_value(node.get(property))})


func _get_node_properties(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r[0])
	if node == null: return _err_not_found("Node '%s'" % r[0])
	var category := _optional_string(params, "category")
	var props := GPUtils.get_node_properties_dict(node)
	if not category.is_empty():
		var filtered: Dictionary = {}
		for key: String in props:
			if key.begins_with(category): filtered[key] = props[key]
		props = filtered
	return _ok({"path": str(root.get_path_to(node)), "type": node.get_class(), "properties": props})


func _add_resource(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "property"); if r2[1]: return r2[1]
	var r3 := _require_string(params, "resource_type"); if r3[1]: return r3[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r1[0])
	if node == null: return _err_not_found("Node '%s'" % r1[0])
	var resource_type: String = r3[0]
	if not ClassDB.class_exists(resource_type): return _err_params("Unknown resource type: %s" % resource_type)
	if not ClassDB.is_parent_class(resource_type, "Resource"): return _err_params("'%s' is not a Resource" % resource_type)
	var resource: Resource = ClassDB.instantiate(resource_type)
	if resource == null: return _err_internal("Failed to create resource")
	for prop_name: String in params.get("resource_properties", {}):
		if prop_name in resource:
			resource.set(prop_name, GPUtils.parse_value(params["resource_properties"][prop_name], typeof(resource.get(prop_name))))
	var old_value: Variant = node.get(r2[0]) if r2[0] in node else null
	var ur := _ur()
	ur.create_action("MCP: Add %s to %s" % [resource_type, node.name])
	ur.add_do_property(node, r2[0], resource)
	ur.add_undo_property(node, r2[0], old_value)
	ur.commit_action()
	return _ok({"path": str(root.get_path_to(node)), "property": r2[0], "resource_type": resource_type})


func _set_anchor_preset(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "preset"); if r2[1]: return r2[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r1[0])
	if node == null: return _err_not_found("Node '%s'" % r1[0])
	if not node is Control: return _err_params("Node '%s' is not a Control" % r1[0])
	var control: Control = node
	var presets := {
		"top_left": Control.PRESET_TOP_LEFT, "top_right": Control.PRESET_TOP_RIGHT,
		"bottom_left": Control.PRESET_BOTTOM_LEFT, "bottom_right": Control.PRESET_BOTTOM_RIGHT,
		"center_left": Control.PRESET_CENTER_LEFT, "center_top": Control.PRESET_CENTER_TOP,
		"center_right": Control.PRESET_CENTER_RIGHT, "center_bottom": Control.PRESET_CENTER_BOTTOM,
		"center": Control.PRESET_CENTER, "left_wide": Control.PRESET_LEFT_WIDE,
		"top_wide": Control.PRESET_TOP_WIDE, "right_wide": Control.PRESET_RIGHT_WIDE,
		"bottom_wide": Control.PRESET_BOTTOM_WIDE, "vcenter_wide": Control.PRESET_VCENTER_WIDE,
		"hcenter_wide": Control.PRESET_HCENTER_WIDE, "full_rect": Control.PRESET_FULL_RECT,
	}
	var preset_name: String = r2[0]
	if not presets.has(preset_name): return _err_params("Unknown preset: '%s'. Available: %s" % [preset_name, presets.keys()])
	var keep_offsets := _optional_bool(params, "keep_offsets", false)
	var old_anchors := [control.anchor_left, control.anchor_top, control.anchor_right, control.anchor_bottom]
	var old_offsets := [control.offset_left, control.offset_top, control.offset_right, control.offset_bottom]
	control.set_anchors_and_offsets_preset(presets[preset_name],
		Control.PRESET_MODE_KEEP_SIZE if keep_offsets else Control.PRESET_MODE_MINSIZE)
	var ur := _ur()
	ur.create_action("MCP: Set anchor preset on %s" % node.name)
	for prop in ["anchor_left", "anchor_top", "anchor_right", "anchor_bottom", "offset_left", "offset_top", "offset_right", "offset_bottom"]:
		ur.add_do_property(control, prop, control.get(prop))
	for i in 4:
		ur.add_undo_property(control, ["anchor_left", "anchor_top", "anchor_right", "anchor_bottom"][i], old_anchors[i])
		ur.add_undo_property(control, ["offset_left", "offset_top", "offset_right", "offset_bottom"][i], old_offsets[i])
	ur.commit_action()
	return _ok({"path": str(root.get_path_to(control)), "preset": preset_name})


func _connect_signal(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "source"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "signal_name"); if r2[1]: return r2[1]
	var r3 := _require_string(params, "target_path"); if r3[1]: return r3[1]
	var r4 := _require_string(params, "method_name"); if r4[1]: return r4[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var source := _find_node(root, r1[0]); if source == null: return _err_not_found("Source node '%s'" % r1[0])
	var target := _find_node(root, r3[0]); if target == null: return _err_not_found("Target node '%s'" % r3[0])
	var signal_name: String = r2[0]; var method_name: String = r4[0]
	if not source.has_signal(signal_name): return _err_params("Signal '%s' not found on %s" % [signal_name, source.get_class()])
	if source.is_connected(signal_name, Callable(target, method_name)): return _ok({"already_connected": true})
	source.connect(signal_name, Callable(target, method_name))
	return _ok({"source": str(root.get_path_to(source)), "signal": signal_name, "target": str(root.get_path_to(target)), "method": method_name, "connected": true})


func _disconnect_signal(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "source"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "signal_name"); if r2[1]: return r2[1]
	var r3 := _require_string(params, "target_path"); if r3[1]: return r3[1]
	var r4 := _require_string(params, "method_name"); if r4[1]: return r4[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var source := _find_node(root, r1[0]); if source == null: return _err_not_found("Source node '%s'" % r1[0])
	var target := _find_node(root, r3[0]); if target == null: return _err_not_found("Target node '%s'" % r3[0])
	var signal_name: String = r2[0]; var method_name: String = r4[0]
	if not source.is_connected(signal_name, Callable(target, method_name)): return _ok({"was_connected": false})
	source.disconnect(signal_name, Callable(target, method_name))
	return _ok({"source": str(root.get_path_to(source)), "signal": signal_name, "target": str(root.get_path_to(target)), "method": method_name, "disconnected": true})


func _get_node_groups(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r[0]); if node == null: return _err_not_found("Node '%s'" % r[0])
	var groups: Array = []
	for group: StringName in node.get_groups():
		var g := str(group)
		if not g.begins_with("_"): groups.append(g)
	return _ok({"path": str(root.get_path_to(node)), "groups": groups, "count": groups.size()})


func _set_node_groups(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	if not params.has("groups") or not params["groups"] is Array: return _err_params("'groups' array is required")
	var desired_groups: Array = params["groups"]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var node := _find_node(root, r[0]); if node == null: return _err_not_found("Node '%s'" % r[0])
	var current_groups: Array = []
	for group: StringName in node.get_groups():
		var g := str(group)
		if not g.begins_with("_"): current_groups.append(g)
	var added: Array = []; var removed: Array = []
	for group: String in current_groups:
		if group not in desired_groups: node.remove_from_group(group); removed.append(group)
	for group in desired_groups:
		var g: String = str(group)
		if g not in current_groups: node.add_to_group(g, true); added.append(g)
	return _ok({"path": str(root.get_path_to(node)), "groups": desired_groups, "added": added, "removed": removed})


func _find_nodes_in_group(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "group"); if r[1]: return r[1]
	var sr := _require_scene(_optional_string(params, "scene_path")); if sr[1]: return sr[1]
	var root: Node = sr[0]
	var group_name: String = r[0]
	var matches: Array = []
	_find_in_group(root, root, group_name, matches)
	return _ok({"group": group_name, "nodes": matches, "count": matches.size()})


func _find_in_group(node: Node, root: Node, group_name: String, matches: Array) -> void:
	if node.is_in_group(group_name):
		matches.append({"name": node.name, "path": str(root.get_path_to(node)), "type": node.get_class()})
	for child in node.get_children():
		_find_in_group(child, root, group_name, matches)


# ══════════════════════════════════════════════════════════════════════════════
# SCRIPT COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _list_scripts(params: Dictionary) -> Dictionary:
	var path := _optional_string(params, "path", "res://")
	var recursive := _optional_bool(params, "recursive", true)
	var excludes: PackedStringArray = [] if recursive else PackedStringArray(DirAccess.get_directories_at(path))
	var paths := GPUtils.find_files(path,
		func(p: String) -> bool: return p.get_extension() in ["gd", "cs", "gdshader"], -1, excludes)
	var scripts: Array = []
	for full_path: String in paths:
		var info := {"path": full_path, "type": full_path.get_extension()}
		var file := FileAccess.open(full_path, FileAccess.READ)
		if file:
			info["size"] = file.get_length()
			var first_line := file.get_line().strip_edges()
			if first_line.begins_with("class_name "): info["class_name"] = first_line.substr(11).strip_edges()
			elif first_line.begins_with("extends "): info["extends"] = first_line.substr(8).strip_edges()
			file.close()
		scripts.append(info)
	return _ok({"scripts": scripts, "count": scripts.size()})


func _read_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Script '%s'" % path)
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return _err_internal("Cannot read script")
	var content := file.get_as_text(); file.close()
	var show_line := _optional_bool(params, "show_line", false)
	var final_content := content
	if show_line:
		var lines := content.split("\n")
		var numbered := PackedStringArray()
		for i in range(lines.size()):
			numbered.append("%4d\t%s" % [i + 1, lines[i]])
		final_content = "\n".join(numbered)
	return _ok({"path": path, "content": final_content, "line_count": content.count("\n") + 1, "size": content.length()})


func _create_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	var content := _optional_string(params, "content")
	var base_class := _optional_string(params, "extends", "Node")
	var class_name_str := _optional_string(params, "class_name")
	if content.is_empty():
		var lines: PackedStringArray = []
		if not class_name_str.is_empty(): lines.append("class_name %s" % class_name_str)
		lines.append("extends %s" % base_class)
		lines.append(""); lines.append("")
		lines.append("func _ready() -> void:"); lines.append("\tpass"); lines.append("")
		content = "\n".join(lines)
	var dir_path := path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir_path): DirAccess.make_dir_recursive_absolute(dir_path)
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null: return _err_internal("Cannot create script")
	file.store_string(content); file.close()
	_ei().get_resource_filesystem().scan()
	if ResourceLoader.exists(path):
		var script = load(path)
		if script is Script: script.reload(true)
	return _ok({"path": path, "created": true})


func _edit_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Script '%s'" % path)
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return _err_internal("Cannot read script")
	var content := file.get_as_text(); file.close()
	var changes_made := 0
	if params.has("replacements") and params["replacements"] is Array:
		for replacement in params["replacements"] as Array:
			if replacement is Dictionary:
				var search: String = replacement.get("search", "")
				var replace: String = replacement.get("replace", "")
				if not search.is_empty():
					if replacement.get("regex", false):
						var regex := RegEx.new()
						if regex.compile(search) == OK:
							var new_content := regex.sub(content, replace, true)
							if new_content != content: content = new_content; changes_made += 1
					else:
						if content.contains(search): content = content.replace(search, replace); changes_made += 1
	elif params.has("content"):
		content = str(params["content"]); changes_made = 1
	elif params.has("insert_at_line") and params.has("text"):
		var line_num := clampi(int(params["insert_at_line"]), 0, content.split("\n").size())
		var lines := content.split("\n"); lines.insert(line_num, str(params["text"]))
		content = "\n".join(lines); changes_made = 1
	if changes_made == 0: return _ok({"path": path, "changes_made": 0, "message": "No changes applied"})
	file = FileAccess.open(path, FileAccess.WRITE)
	if file == null: return _err_internal("Cannot write script")
	file.store_string(content); file.close()
	_reload_script(path)
	return _ok({"path": path, "changes_made": changes_made})


func _reload_script(path: String) -> void:
	_ei().get_resource_filesystem().scan()
	if ResourceLoader.exists(path):
		var script = load(path)
		if script is Script: script.reload(true)
	_ei().get_script_editor().notification(Control.NOTIFICATION_VISIBILITY_CHANGED)


func _attach_script(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "script"); if r2[1]: return r2[1]
	var root := _edited_root(); if root == null: return _err_no_scene()
	var node := _find_node(root, r1[0]); if node == null: return _err_not_found("Node '%s'" % r1[0])
	var script_path: String = r2[0]
	if not FileAccess.file_exists(script_path): return _err_not_found("Script '%s'" % script_path)
	var script: Script = load(script_path)
	if script == null: return _err_internal("Failed to load script")
	var old_script: Variant = node.get_script()
	var ur := _ur()
	ur.create_action("MCP: Attach script to %s" % node.name)
	ur.add_do_method(node, "set_script", script)
	ur.add_undo_method(node, "set_script", old_script)
	ur.commit_action()
	return _ok({"path": str(root.get_path_to(node)), "script": script_path, "attached": true})


func _validate_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var path: String = r[0]
	if not FileAccess.file_exists(path): return _err_not_found("Script '%s'" % path)
	# Use cached script with CACHE_MODE_REPLACE to force re-read from disk
	var script: Script = ResourceLoader.load(path, "Script", ResourceLoader.CACHE_MODE_REPLACE)
	if script == null: return _err_internal("Cannot load script '%s'" % path)
	var err := script.reload(true)
	if err == OK: return _ok({"path": path, "valid": true, "message": "Script compiles successfully"})
	return _ok({"path": path, "valid": false, "error_code": err, "error_string": error_string(err), "message": "Compilation failed"})


func _get_open_scripts(params: Dictionary) -> Dictionary:
	var script_editor := _ei().get_script_editor()
	var open_scripts: Array = []
	for script_base in script_editor.get_open_scripts():
		open_scripts.append({"path": script_base.resource_path, "type": script_base.get_class()})
	return _ok({"scripts": open_scripts, "count": open_scripts.size()})
