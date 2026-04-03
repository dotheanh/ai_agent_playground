@tool
class_name GPEditorCommands
extends Node

## GPEditorCommands — Editor + Project + Batch + Runtime commands
## Gộp: editor_commands, project_commands, batch_commands, input_commands, runtime_commands

var editor_plugin: EditorPlugin

const RUNTIME_CONNECT_TIMEOUT_MS: int = 10000
const RUNTIME_CONNECT_POLL_SEC: float = 0.1
const EXECUTE_SCRIPT_TIMEOUT_SEC: float = 10.0
const DEBUGGER_POLL_INTERVAL_SEC: float = 0.3
const CANCEL_SETTLE_DELAY_SEC: float = 0.1


func get_commands() -> Dictionary:
	return {
		# Editor
		"editor_get_errors": _get_editor_errors,
		"editor_get_output_log": _get_output_log,
		"editor_clear_output": _clear_output,
		"editor_get_screenshot": _get_editor_screenshot,
		"game_get_screenshot": _get_game_screenshot,
		"editor_run_gdscript": _execute_editor_script,
		"editor_reload_plugin": _reload_plugin,
		"editor_reload_project": _reload_project,
		"node_get_signals": _get_signals,
		"editor_diff_screenshots": _compare_screenshots,
		"debug_get_performance_monitors": _get_performance_monitors,
		"editor_get_performance": _get_editor_performance,
		# Project
		"project_get_info": _get_project_info,
		"project_get_filesystem_tree": _get_filesystem_tree,
		"project_find_files": _search_files,
		"project_find_in_files": _search_in_files,
		"project_get_settings": _get_project_settings,
		"project_set_setting": _set_project_setting,
		"project_get_path_from_uid": _uid_to_project_path,
		"project_get_uid_from_path": _project_path_to_uid,
		"project_add_autoload": _add_autoload,
		"project_remove_autoload": _remove_autoload,
		"project_list_export_presets": _list_export_presets,
		"project_export": _export_project,
		"project_get_export_info": _get_export_info,
		# Batch
		"node_find_by_type": _find_nodes_by_type,
		"node_find_signal_connections": _find_signal_connections,
		"node_batch_set_property": _batch_set_property,
		"node_find_usages": _find_node_references,
		"scene_find_dependencies": _get_scene_dependencies,
		"scene_bulk_set_property": _cross_scene_set_property,
		# Input
		"input_simulate_key": _simulate_key,
		"input_simulate_mouse_click": _simulate_mouse_click,
		"input_simulate_mouse_move": _simulate_mouse_move,
		"input_simulate_action": _simulate_action,
		"input_simulate_sequence": _simulate_sequence,
		"input_get_actions": _get_input_actions,
		"input_set_action": _set_input_action,
		# Runtime (editor-side IPC)
		"game_get_scene_tree": _get_game_scene_tree,
		"game_get_node_properties": _get_game_node_properties,
		"game_set_node_property": _set_game_node_property,
		"game_run_gdscript": _execute_game_script_safe,
		"game_capture_frames": _capture_frames,
		"game_monitor_properties": _monitor_properties,
		"game_start_recording": _start_recording,
		"game_stop_recording": _stop_recording,
		"game_replay_recording": _replay_recording,
		"game_find_nodes_by_script": _find_nodes_by_script,
		"game_get_autoload_properties": _get_autoload,
		"game_batch_get_properties": _batch_get_properties,
		"game_find_ui_elements": _find_ui_elements,
		"game_click_button": _click_button_by_text,
		"game_wait_for_node": _wait_for_node,
		"game_find_nearby_nodes": _find_nearby_nodes,
		"game_query_navigation": _navigate_to,
		"game_move_to": _move_to,
		"game_bulk_action": _bulk_action,
		"game_sequence": _game_sequence,
	}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

func _ei() -> EditorInterface: return editor_plugin.get_editor_interface()
func _ok(data: Dictionary = {}) -> Dictionary: return GPUtils.mcp_ok_json(data)
func _err(code: int, msg: String, data: Dictionary = {}) -> Dictionary:
	var e_msg := msg
	if not data.is_empty():
		if data.has("suggestion"):
			e_msg += " | Suggestion: %s" % data["suggestion"]
	return GPUtils.mcp_err(e_msg, code)
func _err_params(msg: String) -> Dictionary: return _err(-32602, msg)
func _err_not_found(what: String) -> Dictionary: return _err(-32001, "%s not found" % what)
func _err_internal(msg: String) -> Dictionary: return _err(-32603, "Internal error: %s" % msg)
func _require_string(params: Dictionary, key: String) -> Array:
	if not params.has(key) or not params[key] is String or (params[key] as String).is_empty():
		return [null, _err_params("Missing required parameter: %s" % key)]
	return [params[key] as String, null]
func _optional_string(params: Dictionary, key: String, default: String = "") -> String:
	if params.has(key) and params[key] is String:
		return params[key] as String
	return default
func _optional_bool(params: Dictionary, key: String, default: bool = false) -> bool:
	if params.has(key) and params[key] is bool:
		return params[key] as bool
	return default
func _optional_int(params: Dictionary, key: String, default: int = 0) -> int:
	if params.has(key):
		return int(params[key])
	return default
func _edited_root() -> Node: return _ei().get_edited_scene_root()

func _game_ipc() -> Node:
	return editor_plugin.game_ipc

func _find_rtl(node: Node, depth: int = 0) -> RichTextLabel:
	if depth > 6: return null
	if node is RichTextLabel: return node as RichTextLabel
	for child in node.get_children():
		var found: RichTextLabel = _find_rtl(child, depth + 1)
		if found: return found
	return null

func _find_code_edit(node: Node, depth: int = 0) -> CodeEdit:
	if depth > 8: return null
	if node is CodeEdit: return node as CodeEdit
	for child in node.get_children():
		var found: CodeEdit = _find_code_edit(child, depth + 1)
		if found: return found
	return null


# ══════════════════════════════════════════════════════════════════════════════
# EDITOR COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_editor_errors(params: Dictionary) -> Dictionary:
	var errors: Array = []
	var max_lines := _optional_int(params, "max_lines", 50)
	var base: Control = _ei().get_base_control()

	# 1. Output panel
	var editor_log: Node = base.find_child("Output", true, false)
	if editor_log:
		var rtl: RichTextLabel = _find_rtl(editor_log)
		if rtl:
			var content: String = rtl.get_parsed_text()
			var lines: PackedStringArray = content.split("\n")
			var start: int = maxi(0, lines.size() - max_lines)
			for i in range(start, lines.size()):
				var line: String = lines[i]
				if line.contains("ERROR") or line.contains("SCRIPT ERROR") or line.contains("Parse Error") or line.contains("WARNING"):
					errors.append(line.strip_edges())

	# 2. Script editor compile errors
	var script_errors: Array = []
	var script_editor: ScriptEditor = EditorInterface.get_script_editor()
	if script_editor:
		var current_script: Script = script_editor.get_current_script()
		var ce: CodeEdit = _find_code_edit(script_editor)
		if ce and current_script:
			var script_path: String = current_script.resource_path
			for i in range(ce.get_line_count()):
				var bg: Color = ce.get_line_background_color(i)
				if bg.r > 0.8 and bg.a > 0:
					script_errors.append("COMPILE ERROR: %s:%d - %s" % [script_path, i + 1, ce.get_line(i).strip_edges()])

	# 3. Analyzer errors
	var analyzer_errors: Array = []
	if script_editor:
		var open_editors: Array = script_editor.get_open_script_editors()
		var open_scripts: Array = script_editor.get_open_scripts()
		for ei in range(open_editors.size()):
			var editor_node: Node = open_editors[ei]
			var script_path: String = ""
			if ei < open_scripts.size() and open_scripts[ei] != null:
				script_path = (open_scripts[ei] as Resource).resource_path
			var vsplit: VSplitContainer = null
			for c in editor_node.get_children():
				if c is VSplitContainer: vsplit = c as VSplitContainer; break
			if vsplit == null: continue
			var children: Array = vsplit.get_children()
			if children.size() > 1 and children[1] is RichTextLabel:
				for line in (children[1] as RichTextLabel).get_parsed_text().split("\n"):
					var stripped := line.strip_edges().trim_prefix("[Ignore]")
					if not stripped.is_empty() and stripped != "[Ignore]":
						analyzer_errors.append(("WARNING: %s:" % script_path if not script_path.is_empty() else "WARNING: ") + stripped)
			if children.size() > 2 and children[2] is RichTextLabel:
				for line in (children[2] as RichTextLabel).get_parsed_text().split("\n"):
					var stripped := line.strip_edges()
					if not stripped.is_empty():
						analyzer_errors.append(("SCRIPT ERROR: %s:" % script_path if not script_path.is_empty() else "SCRIPT ERROR: ") + stripped)

	# 4. Debugger errors
	var debugger_errors: Array = []
	var queue: Array[Node] = [base]
	while not queue.is_empty():
		var node := queue.pop_front()
		if node.get_class() == "ScriptEditorDebugger":
			for child in node.get_children():
				if child is TabContainer:
					var tc := child as TabContainer
					for tab_idx in range(tc.get_tab_count()):
						var tab_control: Control = tc.get_tab_control(tab_idx)
						if tab_control is VBoxContainer and tab_control.name.begins_with("Errors"):
							for vchild in tab_control.get_children():
								if vchild is Tree:
									var root_item: TreeItem = (vchild as Tree).get_root()
									if root_item:
										var item: TreeItem = root_item.get_first_child()
										while item:
											var msg := item.get_text(0).strip_edges()
											var col1 := item.get_text(1).strip_edges()
											if not col1.is_empty(): msg += " " + col1 if not msg.is_empty() else col1
											if not msg.is_empty(): debugger_errors.append("DEBUGGER: " + msg)
											var sub := item.get_first_child()
											while sub:
												var sm := sub.get_text(0).strip_edges()
												var sc1 := sub.get_text(1).strip_edges()
												if not sc1.is_empty(): sm += " " + sc1 if not sm.is_empty() else sc1
												if not sm.is_empty(): debugger_errors.append("DEBUGGER:   " + sm)
												sub = sub.get_next()
											item = item.get_next()
			break
		for child in node.get_children(): queue.append(child)

	# Fallback: log file
	if errors.size() == 0 and script_errors.size() == 0 and analyzer_errors.size() == 0 and debugger_errors.size() == 0:
		var log_path := "user://logs/godot.log"
		if FileAccess.file_exists(log_path):
			var f := FileAccess.open(log_path, FileAccess.READ)
			if f:
				for line in f.get_as_text().split("\n").slice(maxi(0, f.get_as_text().split("\n").size() - max_lines)):
					if line.contains("ERROR") or line.contains("SCRIPT ERROR"): errors.append(line.strip_edges())

	errors.append_array(script_errors)
	errors.append_array(analyzer_errors)
	errors.append_array(debugger_errors)
	return _ok({"errors": errors, "count": errors.size()})


func _get_output_log(params: Dictionary) -> Dictionary:
	var max_lines := _optional_int(params, "max_lines", 100)
	var filter := _optional_string(params, "filter")
	var base: Control = _ei().get_base_control()
	var editor_log: Node = base.find_child("Output", true, false)
	if editor_log == null:
		var log_path := "user://logs/godot.log"
		if not FileAccess.file_exists(log_path): return _err_internal("Output panel not found and no log file")
		var file := FileAccess.open(log_path, FileAccess.READ)
		if file == null: return _err_internal("Cannot read log file")
		var all_lines := file.get_as_text().split("\n"); file.close()
		var output_lines: Array = []
		for i in range(maxi(0, all_lines.size() - max_lines), all_lines.size()):
			if filter.is_empty() or all_lines[i].contains(filter): output_lines.append(all_lines[i])
		return _ok({"lines": output_lines, "count": output_lines.size(), "source": "log_file"})
	var rtl: RichTextLabel = _find_rtl(editor_log)
	if rtl == null: return _err_internal("Could not find RichTextLabel in Output panel")
	var all_lines := rtl.get_parsed_text().split("\n")
	var output_lines: Array = []
	for i in range(maxi(0, all_lines.size() - max_lines), all_lines.size()):
		if filter.is_empty() or all_lines[i].contains(filter): output_lines.append(all_lines[i])
	return _ok({"lines": output_lines, "count": output_lines.size(), "source": "output_panel"})


func _clear_output(params: Dictionary) -> Dictionary:
	print("\n".repeat(50))
	return _ok({"cleared": true})


func _get_editor_screenshot(params: Dictionary) -> Dictionary:
	var base_control: Control = _ei().get_base_control()
	if base_control == null: return _err_internal("Could not access editor base control")
	var viewport: Viewport = base_control.get_viewport()
	if viewport == null: return _err_internal("Could not access editor viewport")
	var image: Image = viewport.get_texture().get_image()
	if image == null: return _err_internal("Could not get image from viewport")
	var base64 := Marshalls.raw_to_base64(image.save_png_to_buffer())
	return GPUtils.mcp_ok([GPUtils.mcp_image(base64)])


func _get_game_screenshot(params: Dictionary) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection(): return _err(-32000, "No game runtime connected")
	var result: Dictionary = await ipc.send_screenshot()
	if result.has("error"): return _err(-32000, str(result["error"]))
	if result.has("image_base64"):
		var b64: String = result["image_base64"]
		var w: int = result.get("width", 0)
		var h: int = result.get("height", 0)
		return GPUtils.mcp_ok([GPUtils.mcp_image(b64)])
	return _ok(result)


func _execute_editor_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "code"); if r[1]: return r[1]
	var code: String = r[0]
	# Normalize indentation: convert spaces to tabs to avoid "Mixed tabs and spaces" error
	var normalized_lines: PackedStringArray = []
	for line in code.split("\n"):
		var stripped := line.lstrip(" \t")
		var indent_part := line.substr(0, line.length() - stripped.length())
		var tab_indent := indent_part.replace("    ", "\t").replace("  ", "\t")
		tab_indent = tab_indent.replace(" ", "")
		normalized_lines.append(tab_indent + stripped)
	var normalized_code := "\n".join(normalized_lines)
	var wrapped_code := "@tool\nextends Node\n\nvar _mcp_output: Array = []\n\nfunc _mcp_print(value: Variant) -> void:\n\t_mcp_output.append(str(value))\n\nfunc run() -> Variant:\n"
	for line in normalized_code.split("\n"):
		wrapped_code += "\t" + line + "\n"
	wrapped_code += "\treturn _mcp_output\n"
	var script := GDScript.new()
	script.source_code = wrapped_code
	if script.reload() != OK: return _err(-32002, "Script compilation failed")
	var temp_node := Node.new()
	temp_node.set_script(script)
	add_child(temp_node)
	var output: Variant = null
	if temp_node.has_method("run"): output = temp_node.run()
	var mcp_output: Array = []
	var raw_output: Variant = temp_node.get("_mcp_output")
	if raw_output is Array: mcp_output = raw_output
	temp_node.queue_free()
	return _ok({"output": mcp_output, "return_value": str(output) if output != null else null})


func _reload_plugin(params: Dictionary) -> Dictionary:
	_deferred_reload_plugin.call_deferred(_ei(), "godot-mcp")
	return _ok({"reloading": true, "message": "Plugin will reload momentarily."})

func _deferred_reload_plugin(ei: EditorInterface, plugin_name: String) -> void:
	ei.set_plugin_enabled(plugin_name, false)
	ei.set_plugin_enabled(plugin_name, true)


func _reload_project(params: Dictionary) -> Dictionary:
	_ei().get_resource_filesystem().scan()
	return _ok({"reloaded": true})


func _get_signals(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var root := _edited_root(); if root == null: return _err(-32000, "No scene open")
	var node: Node
	if root.has_node(r[0]): node = root.get_node(r[0])
	else: return _err_not_found("Node '%s'" % r[0])
	var signals: Array = []
	for sig in node.get_signal_list():
		var sig_info: Dictionary = {"name": sig["name"], "args": []}
		for arg in sig["args"]: sig_info["args"].append({"name": arg["name"], "type": arg["type"]})
		var connections: Array = []
		for conn in node.get_signal_connection_list(sig["name"]):
			connections.append({"target": str(root.get_path_to(conn["callable"].get_object())), "method": conn["callable"].get_method()})
		sig_info["connections"] = connections
		signals.append(sig_info)
	return _ok({"path": str(root.get_path_to(node)), "type": node.get_class(), "signals": signals, "count": signals.size()})


func _load_image_from_param(value: String, label: String) -> Array:
	var img := Image.new()
	if value.begins_with("res://") or value.begins_with("user://"):
		var err := img.load(value)
		if err != OK: return [null, _err_params("Failed to load %s from path '%s'" % [label, value])]
		return [img, null]
	var buf := Marshalls.base64_to_raw(value)
	var err := img.load_png_from_buffer(buf)
	if err != OK: return [null, _err_params("Failed to decode %s from base64" % label)]
	return [img, null]


func _compare_screenshots(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "image_a"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "image_b"); if r2[1]: return r2[1]
	var threshold := _optional_int(params, "threshold", 10)
	var load_a := _load_image_from_param(r1[0], "image_a"); if load_a[1]: return load_a[1]
	var load_b := _load_image_from_param(r2[0], "image_b"); if load_b[1]: return load_b[1]
	var img_a: Image = load_a[0]; var img_b: Image = load_b[0]
	if img_a.get_size() != img_b.get_size(): return _err_params("Image sizes differ")
	var width := img_a.get_width(); var height := img_a.get_height()
	var diff_image := Image.create(width, height, false, Image.FORMAT_RGBA8)
	var changed_pixels := 0
	for y in height:
		for x in width:
			var ca := img_a.get_pixel(x, y); var cb := img_b.get_pixel(x, y)
			var max_diff := maxi(absi(int(ca.r8) - int(cb.r8)), maxi(absi(int(ca.g8) - int(cb.g8)), absi(int(ca.b8) - int(cb.b8))))
			if max_diff > threshold:
				changed_pixels += 1
				diff_image.set_pixel(x, y, Color(1, 0, 0, clampf(float(max_diff) / 255.0, 0.3, 1.0)))
			else:
				diff_image.set_pixel(x, y, Color(ca.r * 0.3, ca.g * 0.3, ca.b * 0.3, 1.0))
	var diff_percentage := (float(changed_pixels) / float(width * height)) * 100.0
	var diff_b64 := Marshalls.raw_to_base64(diff_image.save_png_to_buffer())
	var summary := "Diff: %dx%d | changed=%d/%d (%.2f%%) | identical=%s | threshold=%d" % [
		width, height, changed_pixels, width * height, snappedf(diff_percentage, 0.01),
		str(changed_pixels == 0), threshold]
	return GPUtils.mcp_ok([GPUtils.mcp_image(diff_b64), GPUtils.mcp_text(summary)])


func _get_performance_monitors(params: Dictionary) -> Dictionary:
	var monitors := {
		"fps": Performance.get_monitor(Performance.TIME_FPS),
		"frame_time_msec": Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0,
		"physics_frame_time_msec": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0,
		"memory_static": Performance.get_monitor(Performance.MEMORY_STATIC),
		"memory_static_max": Performance.get_monitor(Performance.MEMORY_STATIC_MAX),
		"object_count": Performance.get_monitor(Performance.OBJECT_COUNT),
		"object_node_count": Performance.get_monitor(Performance.OBJECT_NODE_COUNT),
		"object_orphan_node_count": Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT),
		"render_total_objects_in_frame": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
		"render_total_draw_calls_in_frame": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"render_video_mem_used": Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED),
		"physics_2d_active_objects": Performance.get_monitor(Performance.PHYSICS_2D_ACTIVE_OBJECTS),
		"physics_3d_active_objects": Performance.get_monitor(Performance.PHYSICS_3D_ACTIVE_OBJECTS),
	}
	var category := _optional_string(params, "category")
	if not category.is_empty():
		var filtered := {}
		for key: String in monitors:
			if key.begins_with(category): filtered[key] = monitors[key]
		return _ok({"monitors": filtered, "category": category})
	return _ok({"monitors": monitors})


func _get_editor_performance(params: Dictionary) -> Dictionary:
	return _ok({
		"fps": Performance.get_monitor(Performance.TIME_FPS),
		"frame_time_msec": Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0,
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"node_count": Performance.get_monitor(Performance.OBJECT_NODE_COUNT),
		"orphan_nodes": Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT),
		"memory_static_mb": Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0),
		"video_mem_mb": Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED) / (1024.0 * 1024.0),
	})


# ══════════════════════════════════════════════════════════════════════════════
# PROJECT COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_project_info(params: Dictionary) -> Dictionary:
	var info := {}
	info["project_name"] = ProjectSettings.get_setting("application/config/name", "")
	info["godot_version"] = Engine.get_version_info()
	info["project_path"] = ProjectSettings.globalize_path("res://")
	info["main_scene"] = ProjectSettings.get_setting("application/run/main_scene", "")
	info["viewport_width"] = ProjectSettings.get_setting("display/window/size/viewport_width", 0)
	info["viewport_height"] = ProjectSettings.get_setting("display/window/size/viewport_height", 0)
	info["renderer"] = ProjectSettings.get_setting("rendering/renderer/rendering_method", "")
	var autoloads := {}
	for prop in ProjectSettings.get_property_list():
		var name: String = prop["name"]
		if name.begins_with("autoload/"): autoloads[name.substr(9)] = ProjectSettings.get_setting(name)
	info["autoloads"] = autoloads
	return _ok(info)


func _get_filesystem_tree(params: Dictionary) -> Dictionary:
	var path := _optional_string(params, "path", "res://")
	var filter := _optional_string(params, "filter")
	var max_depth := _optional_int(params, "max_depth", 10)
	return _ok({"tree": _scan_dir(path, filter, max_depth, 0)})


func _scan_dir(path: String, filter: String, max_depth: int, depth: int) -> Dictionary:
	var result := {"name": path.get_file(), "path": path, "type": "directory"}
	if depth >= max_depth: return result
	var dir := DirAccess.open(path)
	if dir == null: return result
	var children: Array = []
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while not file_name.is_empty():
		if not file_name.begins_with("."):
			var full_path := path.path_join(file_name)
			if dir.current_is_dir(): children.append(_scan_dir(full_path, filter, max_depth, depth + 1))
			elif filter.is_empty() or file_name.match(filter): children.append({"name": file_name, "path": full_path, "type": "file"})
		file_name = dir.get_next()
	dir.list_dir_end()
	if not children.is_empty(): result["children"] = children
	return result


func _search_files(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "query"); if r[1]: return r[1]
	var query: String = r[0]
	var path := _optional_string(params, "path", "res://")
	var file_type := _optional_string(params, "file_type")
	var max_results := _optional_int(params, "max_results", 50)
	var matches: Array = []
	_search_recursive(path, query, file_type, matches, max_results)
	return _ok({"matches": matches, "count": matches.size()})

func _search_recursive(path: String, query: String, file_type: String, matches: Array, max_results: int) -> void:
	if matches.size() >= max_results: return
	var dir := DirAccess.open(path)
	if dir == null: return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while not file_name.is_empty() and matches.size() < max_results:
		if not file_name.begins_with("."):
			var full_path := path.path_join(file_name)
			if dir.current_is_dir(): _search_recursive(full_path, query, file_type, matches, max_results)
			else:
				if not file_type.is_empty() and file_name.get_extension() != file_type:
					file_name = dir.get_next(); continue
				if file_name.to_lower().contains(query.to_lower()) or file_name.match(query): matches.append(full_path)
		file_name = dir.get_next()
	dir.list_dir_end()


const _TEXT_EXTENSIONS: PackedStringArray = ["gd", "tscn", "tres", "cfg", "godot", "gdshader", "md", "txt", "json"]

func _search_in_files(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "query"); if r[1]: return r[1]
	var query: String = r[0]
	var path := _optional_string(params, "path", "res://")
	var max_results := _optional_int(params, "max_results", 50)
	var use_regex := _optional_bool(params, "regex", false)
	var file_type := _optional_string(params, "file_type")
	var regex: RegEx = null
	if use_regex:
		regex = RegEx.new()
		if regex.compile(query) != OK: return _err_params("Invalid regex pattern")
	var matches: Array = []
	_search_in_files_recursive(path, query, regex, file_type, matches, max_results)
	return _ok({"matches": matches, "count": matches.size(), "query": query})

func _search_in_files_recursive(path: String, query: String, regex: RegEx, file_type: String, matches: Array, max_results: int) -> void:
	if matches.size() >= max_results: return
	var dir := DirAccess.open(path)
	if dir == null: return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while not file_name.is_empty() and matches.size() < max_results:
		if not file_name.begins_with("."):
			var full_path := path.path_join(file_name)
			if dir.current_is_dir():
				if file_name != "addons" and file_name != ".godot":
					_search_in_files_recursive(full_path, query, regex, file_type, matches, max_results)
			else:
				var ext := file_name.get_extension()
				if not file_type.is_empty():
					if ext != file_type: file_name = dir.get_next(); continue
				elif ext not in _TEXT_EXTENSIONS: file_name = dir.get_next(); continue
				var file := FileAccess.open(full_path, FileAccess.READ)
				if file:
					var lines := file.get_as_text().split("\n"); file.close()
					for i in range(lines.size()):
						if matches.size() >= max_results: break
						var matched := regex.search(lines[i]) != null if regex != null else lines[i].contains(query)
						if matched: matches.append({"file": full_path, "line": i + 1, "text": lines[i].strip_edges()})
		file_name = dir.get_next()
	dir.list_dir_end()


func _get_project_settings(params: Dictionary) -> Dictionary:
	var section := _optional_string(params, "section")
	var key := _optional_string(params, "key")
	if not key.is_empty():
		if not ProjectSettings.has_setting(key): return _err_not_found("Setting '%s'" % key)
		var value = ProjectSettings.get_setting(key)
		return _ok({"key": key, "value": str(value), "type": typeof(value)})
	if section.is_empty():
		return _err_params("'section' or 'key' is required. Example sections: 'application', 'display', 'input', 'rendering', 'physics', 'audio'. Use 'key' for a specific setting.")
	var settings := {}
	for prop in ProjectSettings.get_property_list():
		var name: String = prop["name"]
		if name.begins_with(section): settings[name] = str(ProjectSettings.get_setting(name))
	return _ok({"settings": settings, "count": settings.size()})


func _set_project_setting(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "key"); if r[1]: return r[1]
	var key: String = r[0]
	if not params.has("value"): return _err_params("Missing required parameter: value")
	var value = params["value"]
	if value is String:
		var s: String = value
		if s == "true": value = true
		elif s == "false": value = false
		elif s.is_valid_int(): value = s.to_int()
		elif s.is_valid_float(): value = s.to_float()
	ProjectSettings.set_setting(key, value)
	var err := ProjectSettings.save()
	if err != OK: return _err_internal("Failed to save project settings")
	return _ok({"key": key, "value": str(ProjectSettings.get_setting(key)), "saved": true})


func _uid_to_project_path(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "uid"); if r[1]: return r[1]
	var uid := ResourceUID.text_to_id(r[0])
	if uid == ResourceUID.INVALID_ID: return _err_params("Invalid UID format")
	if not ResourceUID.has_id(uid): return _err_not_found("UID '%s'" % r[0])
	return _ok({"uid": r[0], "path": ResourceUID.get_id_path(uid)})


func _project_path_to_uid(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	if not ResourceLoader.exists(r[0]): return _err_not_found("Resource at '%s'" % r[0])
	var uid := ResourceLoader.get_resource_uid(r[0])
	if uid == ResourceUID.INVALID_ID: return _err(-32001, "No UID assigned to '%s'" % r[0])
	return _ok({"path": r[0], "uid": ResourceUID.id_to_text(uid)})


func _add_autoload(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "name"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "path"); if r2[1]: return r2[1]
	if not FileAccess.file_exists(r2[0]): return _err_not_found("File '%s'" % r2[0])
	var setting_key: String = "autoload/" + r1[0]
	if ProjectSettings.has_setting(setting_key): return _err(-32000, "Autoload '%s' already exists" % r1[0])
	ProjectSettings.set_setting(setting_key, "*" + r2[0])
	var err := ProjectSettings.save()
	if err != OK: return _err_internal("Failed to save project settings")
	return _ok({"name": r1[0], "path": r2[0], "added": true})


func _remove_autoload(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "name"); if r[1]: return r[1]
	var setting_key: String = "autoload/" + r[0]
	if not ProjectSettings.has_setting(setting_key): return _err_not_found("Autoload '%s'" % r[0])
	var old_value: String = str(ProjectSettings.get_setting(setting_key))
	ProjectSettings.clear(setting_key)
	var err := ProjectSettings.save()
	if err != OK: return _err_internal("Failed to save project settings")
	return _ok({"name": r[0], "old_path": old_value, "removed": true})


func _list_export_presets(params: Dictionary) -> Dictionary:
	var presets_path := "res://export_presets.cfg"
	if not FileAccess.file_exists(presets_path): return _ok({"presets": [], "count": 0})
	var cfg := ConfigFile.new()
	if cfg.load(presets_path) != OK: return _err_internal("Failed to read export_presets.cfg")
	var presets: Array = []
	var idx := 0
	while cfg.has_section("preset.%d" % idx):
		var section := "preset.%d" % idx
		presets.append({"index": idx, "name": cfg.get_value(section, "name", ""), "platform": cfg.get_value(section, "platform", ""), "export_path": cfg.get_value(section, "export_path", "")})
		idx += 1
	return _ok({"presets": presets, "count": presets.size()})


func _export_project(params: Dictionary) -> Dictionary:
	var preset_name := _optional_string(params, "preset_name")
	var preset_index := _optional_int(params, "preset_index", -1)
	var debug := _optional_bool(params, "debug", true)
	if not FileAccess.file_exists("res://export_presets.cfg"): return _err(-32000, "No export_presets.cfg found")
	var cfg := ConfigFile.new()
	if cfg.load("res://export_presets.cfg") != OK: return _err_internal("Failed to read export_presets.cfg")
	var target_section := ""; var target_name := ""; var target_path := ""
	if not preset_name.is_empty():
		var idx := 0
		while cfg.has_section("preset.%d" % idx):
			var section := "preset.%d" % idx
			if cfg.get_value(section, "name", "") == preset_name:
				target_section = section; target_name = preset_name; target_path = cfg.get_value(section, "export_path", ""); break
			idx += 1
	elif preset_index >= 0:
		var section := "preset.%d" % preset_index
		if cfg.has_section(section): target_section = section; target_name = cfg.get_value(section, "name", ""); target_path = cfg.get_value(section, "export_path", "")
	if target_section.is_empty(): return _err_not_found("Export preset")
	if target_path.is_empty(): return _err(-32000, "Export path not configured")
	var flag := "--export-debug" if debug else "--export-release"
	var project_path := ProjectSettings.globalize_path("res://")
	var command := '"%s" --headless --path "%s" %s "%s"' % [OS.get_executable_path(), project_path, flag, target_name]
	return _ok({"preset": target_name, "export_path": target_path, "command": command})


func _get_export_info(params: Dictionary) -> Dictionary:
	return _ok({
		"has_export_presets": FileAccess.file_exists("res://export_presets.cfg"),
		"godot_executable": OS.get_executable_path(),
		"project_path": ProjectSettings.globalize_path("res://"),
	})


# ══════════════════════════════════════════════════════════════════════════════
# BATCH COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _find_nodes_by_type(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "type"); if r[1]: return r[1]
	var type_name: String = r[0]
	var root := _edited_root(); if root == null: return _err(-32000, "No scene open")
	var recursive := _optional_bool(params, "recursive", true)
	var found := GPUtils.find_nodes(root, func(n: Node) -> bool: return n.is_class(type_name) or n.get_class() == type_name, recursive)
	var matches: Array = found.map(func(n: Node) -> Dictionary: return {"name": n.name, "path": str(root.get_path_to(n)), "type": n.get_class()})
	return _ok({"type": type_name, "matches": matches, "count": matches.size()})


func _find_signal_connections(params: Dictionary) -> Dictionary:
	var root := _edited_root(); if root == null: return _err(-32000, "No scene open")
	var signal_filter := _optional_string(params, "signal_name")
	var node_filter := _optional_string(params, "node_path")
	var connections: Array = []
	_collect_signals(root, root, signal_filter, node_filter, connections)
	return _ok({"connections": connections, "count": connections.size()})

func _collect_signals(node: Node, root: Node, signal_filter: String, node_filter: String, connections: Array) -> void:
	var node_path := str(root.get_path_to(node))
	if node_filter.is_empty() or node_path.contains(node_filter):
		for sig_info in node.get_signal_list():
			var sig_name: String = sig_info["name"]
			if not signal_filter.is_empty() and not sig_name.contains(signal_filter): continue
			for conn in node.get_signal_connection_list(sig_name):
				connections.append({"source": node_path, "signal": sig_name, "target": str(root.get_path_to(conn["callable"].get_object())), "method": conn["callable"].get_method()})
	for child in node.get_children(): _collect_signals(child, root, signal_filter, node_filter, connections)


func _batch_set_property(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "type"); if r[1]: return r[1]
	var rp := _require_string(params, "property"); if rp[1]: return rp[1]
	if not params.has("value"): return _err_params("Missing required parameter: value")
	var type_name: String = r[0]; var property: String = rp[0]; var value = params["value"]
	if value is String:
		var expr := Expression.new()
		if expr.parse(value as String) == OK:
			var parsed = expr.execute()
			if parsed != null: value = parsed
	var root := _edited_root(); if root == null: return _err(-32000, "No scene open")
	var target_nodes := GPUtils.find_nodes(root, func(n: Node) -> bool: return (n.is_class(type_name) or n.get_class() == type_name) and property in n)
	var affected: Array = []
	for node in target_nodes: node.set(property, value); affected.append(str(root.get_path_to(node)))
	return _ok({"property": property, "affected": affected, "count": affected.size()})


func _find_node_references(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "pattern"); if r[1]: return r[1]
	var matches := GPUtils.search_in_files("res://", r[0], PackedStringArray(["tscn", "gd", "tres", "gdshader"]), 100)
	return _ok({"pattern": r[0], "matches": matches, "count": matches.size()})


func _get_scene_dependencies(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	if not FileAccess.file_exists(r[0]): return _err_not_found("File '%s'" % r[0])
	var deps := ResourceLoader.get_dependencies(r[0])
	var dependencies: Array = []
	for dep: String in deps:
		var parts := dep.split("::")
		dependencies.append({"path": parts[0] if parts.size() > 0 else dep, "type": parts[2] if parts.size() > 2 else ""})
	return _ok({"path": r[0], "dependencies": dependencies, "count": dependencies.size()})


func _cross_scene_set_property(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "type"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "property"); if r2[1]: return r2[1]
	if not params.has("value"): return _err_params("Missing required parameter: value")
	var type_name: String = r1[0]; var property: String = r2[0]; var value = params["value"]
	if value is String:
		var expr := Expression.new()
		if expr.parse(value as String) == OK:
			var parsed = expr.execute()
			if parsed != null: value = parsed
	var path_filter := _optional_string(params, "path_filter", "res://")
	var exclude_addons := _optional_bool(params, "exclude_addons", true)
	var scenes_affected: Array = []; var total_nodes := 0
	var scene_files := GPUtils.find_files(path_filter, func(p: String) -> bool: return p.ends_with(".tscn"), -1,
		PackedStringArray(["addons"] if exclude_addons else []))
	for scene_path: String in scene_files:
		var packed: PackedScene = ResourceLoader.load(scene_path) as PackedScene
		if packed == null: continue
		var instance: Node = packed.instantiate()
		if instance == null: continue
		var affected_nodes: Array = []
		var target_nodes := GPUtils.find_nodes(instance, func(n: Node) -> bool: return (n.is_class(type_name) or n.get_class() == type_name) and property in n)
		for n in target_nodes: n.set(property, value); affected_nodes.append(str(instance.get_path_to(n)))
		if not affected_nodes.is_empty():
			var new_packed := PackedScene.new(); new_packed.pack(instance)
			ResourceSaver.save(new_packed, scene_path)
			scenes_affected.append({"scene": scene_path, "nodes": affected_nodes, "count": affected_nodes.size()})
			total_nodes += affected_nodes.size()
		instance.free()
	if not scenes_affected.is_empty(): _ei().get_resource_filesystem().scan()
	return _ok({"type": type_name, "property": property, "scenes_affected": scenes_affected, "total_scenes": scenes_affected.size(), "total_nodes": total_nodes})


# ══════════════════════════════════════════════════════════════════════════════
# INPUT COMMANDS
# ══════════════════════════════════════════════════════════════════════════════


func _simulate_key(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "keycode"); if r[1]: return r[1]
	var event := {"type": "key", "keycode": r[0], "pressed": _optional_bool(params, "pressed", true),
		"shift": _optional_bool(params, "shift"), "ctrl": _optional_bool(params, "ctrl"), "alt": _optional_bool(params, "alt")}
	_write_input_commands([event])
	return _ok({"sent": true, "event": event})


func _simulate_mouse_click(params: Dictionary) -> Dictionary:
	var button := _optional_int(params, "button", 1)
	var pressed := _optional_bool(params, "pressed", true)
	var double_click := _optional_bool(params, "double_click")
	var auto_release := _optional_bool(params, "auto_release", true)
	var x := float(params.get("x", 0)); var y := float(params.get("y", 0))
	var press_event := {"type": "mouse_button", "button": button, "pressed": pressed, "double_click": double_click, "position": {"x": x, "y": y}}
	if pressed and auto_release:
		var release_event := press_event.duplicate(); release_event["pressed"] = false
		_write_input_raw(JSON.stringify({"sequence_events": [press_event, release_event], "frame_delay": 1}))
		return _ok({"sent": true, "event": press_event, "auto_release": true})
	_write_input_commands([press_event])
	return _ok({"sent": true, "event": press_event})


func _simulate_mouse_move(params: Dictionary) -> Dictionary:
	var event := {"type": "mouse_motion", "position": {"x": float(params.get("x", 0)), "y": float(params.get("y", 0))},
		"relative": {"x": float(params.get("relative_x", 0)), "y": float(params.get("relative_y", 0))}}
	_write_input_commands([event])
	return _ok({"sent": true, "event": event})


func _simulate_action(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "action"); if r[1]: return r[1]
	var event := {"type": "action", "action": r[0], "pressed": _optional_bool(params, "pressed", true), "strength": float(params.get("strength", 1.0))}
	_write_input_commands([event])
	return _ok({"sent": true, "event": event})


func _simulate_sequence(params: Dictionary) -> Dictionary:
	if not params.has("events") or not params["events"] is Array: return _err_params("Missing required parameter: events (Array)")
	var events: Array = params["events"]
	if events.is_empty(): return _err_params("Events array is empty")
	var frame_delay := _optional_int(params, "frame_delay", 1)
	if frame_delay <= 0: _write_input_commands(events)
	else: _write_input_raw(JSON.stringify({"sequence_events": events, "frame_delay": frame_delay}))
	return _ok({"sent": true, "event_count": events.size(), "frame_delay": frame_delay})


func _write_input_commands(events: Array) -> void:
	_write_input_raw(JSON.stringify(events))

func _write_input_raw(json: String) -> void:
	_game_ipc().send_input(json)


func _get_input_actions(params: Dictionary) -> Dictionary:
	var filter := _optional_string(params, "filter")
	var include_builtin := _optional_bool(params, "include_builtin")
	var actions: Dictionary = {}
	for action: StringName in InputMap.get_actions():
		var action_str := str(action)
		if not include_builtin and action_str.begins_with("ui_"): continue
		if not filter.is_empty() and not action_str.contains(filter): continue
		var events: Array = []
		for event: InputEvent in InputMap.action_get_events(action): events.append(_serialize_input_event(event))
		actions[action_str] = {"deadzone": InputMap.action_get_deadzone(action), "events": events}
	return _ok({"actions": actions, "count": actions.size()})


func _set_input_action(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "action"); if r[1]: return r[1]
	var action_name: String = r[0]
	if not params.has("events") or not params["events"] is Array: return _err_params("'events' array is required")
	var deadzone := float(params.get("deadzone", 0.5))
	var events: Array[InputEvent] = []
	for event_def in params["events"] as Array:
		if event_def is Dictionary:
			var event := _parse_input_event(event_def)
			if event != null: events.append(event)
	ProjectSettings.set_setting("input/" + action_name, {"deadzone": deadzone, "events": events})
	ProjectSettings.save()
	if not InputMap.has_action(action_name): InputMap.add_action(action_name, deadzone)
	else: InputMap.action_set_deadzone(action_name, deadzone); InputMap.action_erase_events(action_name)
	for event in events: InputMap.action_add_event(action_name, event)
	return _ok({"action": action_name, "deadzone": deadzone, "events_count": events.size(), "saved": true})


func _serialize_input_event(event: InputEvent) -> Dictionary:
	if event is InputEventKey:
		var ke: InputEventKey = event
		var info := {"type": "key", "keycode": OS.get_keycode_string(ke.keycode) if ke.keycode != KEY_NONE else ""}
		if ke.ctrl_pressed: info["ctrl"] = true
		if ke.shift_pressed: info["shift"] = true
		if ke.alt_pressed: info["alt"] = true
		return info
	elif event is InputEventMouseButton:
		return {"type": "mouse_button", "button_index": (event as InputEventMouseButton).button_index}
	elif event is InputEventJoypadButton:
		return {"type": "joypad_button", "button_index": (event as InputEventJoypadButton).button_index}
	return {"type": event.get_class()}

func _parse_input_event(def: Dictionary) -> InputEvent:
	match def.get("type", ""):
		"key":
			var event := InputEventKey.new()
			var keycode_str: String = def.get("keycode", "")
			if not keycode_str.is_empty(): event.keycode = OS.find_keycode_from_string(keycode_str)
			event.ctrl_pressed = def.get("ctrl", false); event.shift_pressed = def.get("shift", false); event.alt_pressed = def.get("alt", false)
			return event
		"mouse_button":
			var event := InputEventMouseButton.new(); event.button_index = int(def.get("button_index", 1)); return event
		"joypad_button":
			var event := InputEventJoypadButton.new(); event.button_index = int(def.get("button_index", 0)); return event
	return null


# ══════════════════════════════════════════════════════════════════════════════
# RUNTIME IPC COMMANDS (editor-side)
# ══════════════════════════════════════════════════════════════════════════════

## Original _send_game_command — giữ nguyên cho các command đang hoạt động ổn định.
func _send_game_command(command: String, cmd_params: Dictionary, timeout_sec: float = 5.0) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < 10000:
			await get_tree().create_timer(0.1).timeout
			if not ei.is_playing_scene():
				return _err(-32000, "Game stopped before runtime connected")
		if not ipc.has_game_connection():
			return _err(-32000, "Game runtime not connected — is GPRuntime autoload enabled?")

	var cancel_flag := [false]
	var ipc_done := false
	var ipc_result: Dictionary = {}

	var _send_coroutine := func() -> void:
		ipc_result = await ipc.send_game_command_cancellable(command, cmd_params, cancel_flag, timeout_sec)
		ipc_done = true
	_send_coroutine.call()

	var debugger_paused := false
	while not ipc_done:
		await get_tree().create_timer(1.5).timeout
		if not ei.is_playing_scene():
			cancel_flag[0] = true
			return _err(-32000, "Game stopped during command '%s'" % command)
		if _is_debugger_paused():
			debugger_paused = true
			cancel_flag[0] = true
			break

	if debugger_paused:
		await get_tree().create_timer(0.15).timeout
		return _err_with_crash_context("Game command cancelled — debugger paused")

	if ipc_result.has("error"):
		var raw_err: String = str(ipc_result["error"])
		if raw_err.contains("timeout"):
			return _err_with_crash_context(raw_err)
		return _err(-32000, raw_err)
	return _ok(ipc_result)


## V2: Fix GDScript closure bug — primitive bool captured by value trong lambda.
## Dùng Dictionary state thay vì bool + blocking poll trực tiếp (không await).
## Các command bị timeout với v1 nên dùng hàm này.
func _send_game_command_v2(command: String, cmd_params: Dictionary, timeout_sec: float = 10.0) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < 10000:
			await get_tree().create_timer(0.1).timeout
			if not ei.is_playing_scene():
				return _err(-32000, "Game stopped before runtime connected")
		if not ipc.has_game_connection():
			return _err(-32000, "Game runtime not connected — is GPRuntime autoload enabled?")

	# Non-blocking: dùng async send_game_command (await signal) thay vì blocking poll
	# Chạy song song với monitor loop để detect game stop / debugger pause
	var state := {"done": false, "result": {}}

	# Async IPC call — yields via _response_received signal, không block editor thread
	var _send_fn := func() -> void:
		var r: Dictionary = await ipc.send_game_command(command, cmd_params, timeout_sec)
		state["result"] = r
		state["done"] = true
	_send_fn.call()

	# Monitor loop — check game stop / debugger pause mỗi 0.5s
	var debugger_paused := false
	while not state["done"]:
		await get_tree().create_timer(0.5).timeout
		if not ei.is_playing_scene():
			return _err(-32000, "Game stopped during command '%s'" % command)
		if _is_debugger_paused():
			debugger_paused = true
			break

	if debugger_paused:
		await get_tree().create_timer(0.15).timeout
		return _err_with_crash_context("Game command cancelled — debugger paused")

	var ipc_result: Dictionary = state["result"]
	if ipc_result.has("error"):
		var raw_err: String = str(ipc_result["error"])
		if raw_err.contains("timeout"):
			return _err_with_crash_context(raw_err)
		return _err(-32000, raw_err)
	return _ok(ipc_result)


## Like _send_game_command_v2 but returns raw IPC result for custom MCP content building.
## Returns {"ipc": Dictionary} on success, or {"error": ...} on failure.
func _send_game_raw(command: String, cmd_params: Dictionary, timeout_sec: float = 10.0) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < 10000:
			await get_tree().create_timer(0.1).timeout
			if not ei.is_playing_scene():
				return _err(-32000, "Game stopped before runtime connected")
		if not ipc.has_game_connection():
			return _err(-32000, "Game runtime not connected — is GPRuntime autoload enabled?")
	var state := {"done": false, "result": {}}
	var _send_fn := func() -> void:
		var r: Dictionary = await ipc.send_game_command(command, cmd_params, timeout_sec)
		state["result"] = r
		state["done"] = true
	_send_fn.call()
	var debugger_paused := false
	while not state["done"]:
		await get_tree().create_timer(0.5).timeout
		if not ei.is_playing_scene():
			return _err(-32000, "Game stopped during command '%s'" % command)
		if _is_debugger_paused():
			debugger_paused = true
			break
	if debugger_paused:
		await get_tree().create_timer(0.15).timeout
		return _err_with_crash_context("Game command cancelled — debugger paused")
	var ipc_result: Dictionary = state["result"]
	if ipc_result.has("error"):
		var raw_err: String = str(ipc_result["error"])
		if raw_err.contains("timeout"):
			return _err_with_crash_context(raw_err)
		return _err(-32000, raw_err)
	return {"ipc": ipc_result}


## Sau khi IPC timeout, kiểm tra trạng thái debugger để build error message có context.
func _err_with_crash_context(raw_err: String) -> Dictionary:
	var ei := _ei()
	if not ei.is_playing_scene():
		return _err(-32000, "Game stopped — %s" % raw_err)
	if _is_debugger_paused():
		var errors := _read_debugger_errors()
		var msg := "Game is frozen at a breakpoint or runtime error — game loop is paused and cannot process commands."
		if not errors.is_empty():
			msg += "\n\nDebugger errors:\n" + "\n".join(errors)
		msg += "\n\nTo unblock: use debug_continue to resume, or debug_step_over / debug_step_into to step through."
		return _err(-32000, msg, {"debugger_errors": errors, "state": "breaked"})
	# Game đang chạy nhưng không respond — có thể bị crash hoặc infinite loop
	var errors2 := _read_debugger_errors()
	var msg2 := "Game is not responding — it may have crashed or is stuck in an infinite loop.\n%s" % raw_err
	if not errors2.is_empty():
		msg2 += "\n\nDebugger errors:\n" + "\n".join(errors2)
	msg2 += "\n\nCheck the Godot Output/Debugger panel for details. If the game crashed, stop and restart it."
	return _err(-32000, msg2, {"debugger_errors": errors2, "state": "unresponsive"})


func _get_game_scene_tree(params: Dictionary) -> Dictionary:
	var cmd_params := {"max_depth": _optional_int(params, "max_depth", -1)}
	var script_filter := _optional_string(params, "script_filter")
	var type_filter := _optional_string(params, "type_filter")
	var named_only := _optional_bool(params, "named_only")
	if not script_filter.is_empty(): cmd_params["script_filter"] = script_filter
	if not type_filter.is_empty(): cmd_params["type_filter"] = type_filter
	if named_only: cmd_params["named_only"] = true
	return await _send_game_command_v2("get_scene_tree", cmd_params)

func _get_game_node_properties(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var cmd_params := {"path": r[0]}
	if params.has("properties") and params["properties"] is Array: cmd_params["properties"] = params["properties"]
	return await _send_game_command_v2("get_node_properties", cmd_params)

func _set_game_node_property(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "property"); if r2[1]: return r2[1]
	if not params.has("value"): return _err_params("Missing required parameter: value")
	return await _send_game_command_v2("set_node_property", {"path": r1[0], "property": r2[0], "value": params["value"]})

func _execute_game_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "code"); if r[1]: return r[1]
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < RUNTIME_CONNECT_TIMEOUT_MS:
			await get_tree().create_timer(RUNTIME_CONNECT_POLL_SEC).timeout
			if not ei.is_playing_scene():
				return _err(-32000, "Game stopped before runtime connected")
		if not ipc.has_game_connection():
			return _err(-32000, "Game runtime not connected — is GPRuntime autoload enabled?")

	# Snapshot debugger state TRƯỚC khi gửi lệnh — tránh false positive từ lần chạy trước
	var was_paused_before: bool = _is_debugger_paused()

	# Gửi lệnh qua signal-based (non-blocking) để hỗ trợ script có await
	var ipc_result: Dictionary = await ipc.send_game_command("execute_script", {"code": r[0]}, EXECUTE_SCRIPT_TIMEOUT_SEC)

	# Chỉ báo lỗi nếu debugger MỚI pause (false→true) sau khi chạy script
	if _is_debugger_paused() and not was_paused_before:
		var debugger_errors: Array = _read_debugger_errors()
		_try_debugger_continue()
		var error_msg := "Runtime error — game was paused by debugger"
		if not debugger_errors.is_empty():
			error_msg += "\n\nDebugger errors:\n" + "\n".join(debugger_errors)
		return _err(-32000, error_msg, {"debugger_errors": debugger_errors, "state": "paused"})

	if not ei.is_playing_scene():
		return _err(-32000, "Game stopped during script execution")

	if ipc_result.has("error"): return _err(-32000, str(ipc_result["error"]))
	return _ok(ipc_result)


## Safe version of game_run_gdscript — polls debugger in parallel with IPC wait.
## If game hits debugger break (e.g. standalone lambda error), detects within ~0.3s
## instead of waiting for full IPC timeout (~10s). Auto-continues debugger and returns error.
func _execute_game_script_safe(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "code"); if r[1]: return r[1]
	var ei := _ei()
	if not ei.is_playing_scene(): return _err(-32000, "No scene is currently playing", {"suggestion": "Use play_scene first"})
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < RUNTIME_CONNECT_TIMEOUT_MS:
			await get_tree().create_timer(RUNTIME_CONNECT_POLL_SEC).timeout
			if not ei.is_playing_scene():
				return _err(-32000, "Game stopped before runtime connected")
		if not ipc.has_game_connection():
			return _err(-32000, "Game runtime not connected — is GPRuntime autoload enabled?")

	# Snapshot debugger state before sending command
	var was_paused_before: bool = _is_debugger_paused()

	# Send command via IPC — use shared dict for lambda capture (GDScript captures primitives by value)
	var state: Dictionary = {"done": false, "result": {}}

	# Start IPC call as fire-and-forget coroutine (runs in parallel with poll loop)
	var ipc_task := func() -> void:
		state["result"] = await ipc.send_game_command("execute_script", {"code": r[0]}, EXECUTE_SCRIPT_TIMEOUT_SEC)
		state["done"] = true
	ipc_task.call()

	# Poll debugger state in parallel — detect pause within DEBUGGER_POLL_INTERVAL_SEC
	while not state["done"]:
		await get_tree().create_timer(DEBUGGER_POLL_INTERVAL_SEC).timeout
		if not ei.is_playing_scene():
			return _err(-32000, "Game stopped during script execution")
		# Detect NEW debugger pause (was not paused before, now paused)
		if _is_debugger_paused() and not was_paused_before:
			var debugger_errors: Array = _read_debugger_errors()
			_try_debugger_continue()
			# Wait briefly for game to resume and possibly send IPC response
			await get_tree().create_timer(0.5).timeout
			if state["done"]:
				break
			# Game IPC unrecoverable after debugger break — stop + restart scene
			push_warning("[GodotPilot] Debugger break corrupted IPC — restarting scene")
			ei.stop_playing_scene()
			await get_tree().create_timer(0.3).timeout
			ei.play_current_scene()
			var error_msg := "Runtime error — game debugger paused. Scene auto-restarted."
			if not debugger_errors.is_empty():
				error_msg += "\n\nDebugger errors:\n" + "\n".join(debugger_errors)
			return _err(-32000, error_msg, {"debugger_errors": debugger_errors, "state": "paused_restarted"})

	# Final check: debugger may have paused after IPC returned (edge case)
	if _is_debugger_paused() and not was_paused_before:
		var debugger_errors: Array = _read_debugger_errors()
		_try_debugger_continue()
		var error_msg := "Runtime error — game was paused by debugger"
		if not debugger_errors.is_empty():
			error_msg += "\n\nDebugger errors:\n" + "\n".join(debugger_errors)
		return _err(-32000, error_msg, {"debugger_errors": debugger_errors, "state": "paused"})

	var ipc_result: Dictionary = state["result"]
	if ipc_result.has("error"): return _err(-32000, str(ipc_result["error"]))
	return _ok(ipc_result)


## Kiểm tra xem debugger có đang pause game không (do runtime error hoặc breakpoint).
func _is_debugger_paused() -> bool:
	var base := EditorInterface.get_base_control()
	if base == null:
		return false
	var queue: Array[Node] = [base]
	while not queue.is_empty():
		var node := queue.pop_front()
		if node.get_class() == "ScriptEditorDebugger":
			# Khi game bị paused, nút "Continue" sẽ enabled
			var inner: Array[Node] = [node]
			while not inner.is_empty():
				var n := inner.pop_front()
				if n is Button and n.tooltip_text == "Continue":
					return n.is_visible_in_tree() and (n as Button).disabled == false
				for c in n.get_children():
					inner.append(c)
			return false
		for child in node.get_children():
			queue.append(child)
	return false


## Đọc lỗi từ debugger panel trong editor để trả về cho AI.
func _read_debugger_errors() -> Array:
	var errors: Array = []
	var base := EditorInterface.get_base_control()
	if base == null:
		return errors
	var queue: Array[Node] = [base]
	while not queue.is_empty():
		var node := queue.pop_front()
		if node.get_class() == "ScriptEditorDebugger":
			for child in node.get_children():
				if child is TabContainer:
					var tc := child as TabContainer
					for tab_idx in range(tc.get_tab_count()):
						var tab_control: Control = tc.get_tab_control(tab_idx)
						if tab_control is VBoxContainer and tab_control.name.begins_with("Errors"):
							for vchild in tab_control.get_children():
								if vchild is Tree:
									var root_item: TreeItem = (vchild as Tree).get_root()
									if root_item:
										var item: TreeItem = root_item.get_first_child()
										while item:
											var msg := item.get_text(0).strip_edges()
											var col1 := item.get_text(1).strip_edges()
											if not col1.is_empty():
												msg += " " + col1 if not msg.is_empty() else col1
											if not msg.is_empty():
												errors.append(msg)
											var sub := item.get_first_child()
											while sub:
												var sm := sub.get_text(0).strip_edges()
												var sc1 := sub.get_text(1).strip_edges()
												if not sc1.is_empty():
													sm += " " + sc1 if not sm.is_empty() else sc1
												if not sm.is_empty():
													errors.append("  " + sm)
												sub = sub.get_next()
											item = item.get_next()
			return errors
		for child in node.get_children():
			queue.append(child)
	return errors


## Bấm nút "Continue" trên debugger để resume game bị pause do runtime error.
func _try_debugger_continue() -> void:
	var base := EditorInterface.get_base_control()
	if base == null:
		return
	var queue: Array[Node] = [base]
	while not queue.is_empty():
		var node := queue.pop_front()
		if node.get_class() == "ScriptEditorDebugger":
			var inner: Array[Node] = [node]
			while not inner.is_empty():
				var n := inner.pop_front()
				if n is Button and n.tooltip_text == "Continue":
					n.emit_signal("pressed")
					push_warning("[GodotPilot] Auto-resumed debugger after runtime error")
					return
				for c in n.get_children():
					inner.append(c)
			return
		for child in node.get_children():
			queue.append(child)

func _capture_frames(params: Dictionary) -> Dictionary:
	var count := _optional_int(params, "count", 5)
	var frame_interval := _optional_int(params, "frame_interval", 10)
	var timeout := minf((count * frame_interval) / 60.0 + 2.0, 25.0)
	var raw: Dictionary = await _send_game_raw("capture_frames", {"count": count, "frame_interval": frame_interval, "half_resolution": _optional_bool(params, "half_resolution", true)}, timeout)
	if raw.has("error"): return raw
	var ipc: Dictionary = raw["ipc"]
	var content: Array = []
	var frames: Array = ipc.get("frames", [])
	for i in frames.size():
		content.append(GPUtils.mcp_image(frames[i]))
	return GPUtils.mcp_ok(content)

func _monitor_properties(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	if not params.has("properties") or not params["properties"] is Array: return _err_params("'properties' array is required")
	var frame_count := _optional_int(params, "frame_count", 60)
	var frame_interval := _optional_int(params, "frame_interval", 1)
	var timeout := minf((frame_count * frame_interval) / 60.0 + 2.0, 25.0)
	return await _send_game_command_v2("monitor_properties", {"path": r[0], "properties": params["properties"], "frame_count": frame_count, "frame_interval": frame_interval}, timeout)

func _start_recording(params: Dictionary) -> Dictionary:
	return await _send_game_command_v2("start_recording", {})

func _stop_recording(params: Dictionary) -> Dictionary:
	return await _send_game_command_v2("stop_recording", {}, 5.0)

func _replay_recording(params: Dictionary) -> Dictionary:
	if not params.has("events") or not params["events"] is Array: return _err_params("'events' array is required")
	var speed := float(params.get("speed", 1.0))
	var max_time_ms := 0
	for event_data: Dictionary in params["events"] as Array: max_time_ms = maxi(max_time_ms, int(event_data.get("time_ms", 0)))
	return await _send_game_command_v2("replay_recording", {"events": params["events"], "speed": speed}, minf((max_time_ms / 1000.0 / speed) + 5.0, 120.0))

func _find_nodes_by_script(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "script"); if r[1]: return r[1]
	var cmd_params := {"script": r[0]}
	if params.has("properties") and params["properties"] is Array: cmd_params["properties"] = params["properties"]
	return await _send_game_command_v2("find_nodes_by_script", cmd_params)

func _get_autoload(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "name"); if r[1]: return r[1]
	var cmd_params := {"name": r[0]}
	if params.has("properties") and params["properties"] is Array: cmd_params["properties"] = params["properties"]
	return await _send_game_command_v2("get_autoload", cmd_params)

func _batch_get_properties(params: Dictionary) -> Dictionary:
	if not params.has("nodes") or not params["nodes"] is Array: return _err_params("'nodes' array is required")
	return await _send_game_command_v2("batch_get_properties", {"nodes": params["nodes"]})

func _find_ui_elements(params: Dictionary) -> Dictionary:
	var cmd_params := {}
	var type_filter := _optional_string(params, "type_filter")
	if not type_filter.is_empty(): cmd_params["type_filter"] = type_filter
	return await _send_game_command_v2("find_ui_elements", cmd_params)

func _click_button_by_text(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "text"); if r[1]: return r[1]
	return await _send_game_command_v2("click_button_by_text", {"text": r[0], "partial": _optional_bool(params, "partial", true)})

func _wait_for_node(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var timeout := float(params.get("timeout", 5.0))
	return await _send_game_command_v2("wait_for_node", {"path": r[0], "timeout": timeout, "poll_frames": _optional_int(params, "poll_frames", 5)}, timeout + 2.0)

func _find_nearby_nodes(params: Dictionary) -> Dictionary:
	if not params.has("position"): return _err_params("Missing required parameter: position")
	var cmd_params: Dictionary = {"position": params["position"]}
	if params.has("radius"): cmd_params["radius"] = float(params["radius"])
	var type_filter := _optional_string(params, "type_filter")
	if not type_filter.is_empty(): cmd_params["type_filter"] = type_filter
	var group_filter := _optional_string(params, "group_filter")
	if not group_filter.is_empty(): cmd_params["group_filter"] = group_filter
	if params.has("max_results"): cmd_params["max_results"] = int(params["max_results"])
	return await _send_game_command_v2("find_nearby_nodes", cmd_params)

func _navigate_to(params: Dictionary) -> Dictionary:
	if not params.has("target"): return _err_params("Missing required parameter: target")
	var cmd_params: Dictionary = {"target": params["target"]}
	var player_path := _optional_string(params, "player_path")
	if not player_path.is_empty(): cmd_params["player_path"] = player_path
	var camera_path := _optional_string(params, "camera_path")
	if not camera_path.is_empty(): cmd_params["camera_path"] = camera_path
	if params.has("move_speed"): cmd_params["move_speed"] = float(params["move_speed"])
	return await _send_game_command_v2("navigate_to", cmd_params)

func _move_to(params: Dictionary) -> Dictionary:
	if not params.has("target"): return _err_params("Missing required parameter: target")
	var cmd_params: Dictionary = {"target": params["target"]}
	var player_path := _optional_string(params, "player_path")
	if not player_path.is_empty(): cmd_params["player_path"] = player_path
	var camera_path := _optional_string(params, "camera_path")
	if not camera_path.is_empty(): cmd_params["camera_path"] = camera_path
	if params.has("arrival_radius"): cmd_params["arrival_radius"] = float(params["arrival_radius"])
	if params.has("timeout"): cmd_params["timeout"] = float(params["timeout"])
	if params.has("run"): cmd_params["run"] = bool(params["run"])
	if params.has("look_at_target"): cmd_params["look_at_target"] = bool(params["look_at_target"])
	var game_timeout := float(params.get("timeout", 15.0))
	return await _send_game_command_v2("move_to", cmd_params, game_timeout + 5.0)


func _bulk_action(params: Dictionary) -> Dictionary:
	if not params.has("steps") or not params["steps"] is Array:
		return _err_params("'steps' array is required")
	# Estimate timeout: sum of all wait/capture steps + 10s buffer
	var estimated_sec := 10.0
	for step: Dictionary in params["steps"] as Array:
		var t := step.get("type", "")
		if t == "wait":
			estimated_sec += float(step.get("seconds", 0.5))
		elif t == "capture_frames":
			var count: int = step.get("count", 5)
			var interval: int = step.get("frame_interval", 10)
			estimated_sec += (count * interval) / 60.0
		estimated_sec += float(step.get("delay_after", 0.0))
	return await _send_game_command_v2("bulk_action", {"steps": params["steps"]}, estimated_sec)


## game_sequence — chạy tuần tự từng step, await xong mới chạy step kế tiếp.
## Expands trigger_animation into run_gdscript.
func _game_sequence(params: Dictionary) -> Dictionary:
	if not params.has("steps") or not params["steps"] is Array:
		return _err_params("'steps' array is required")
	var steps: Array = params["steps"]
	var ei := _ei()
	var images: Array = []
	var errors: Array = []

	for raw_step: Dictionary in steps:
		var step: Dictionary = raw_step
		var step_type: String = step.get("type", "")

		# Expand trigger_animation → run_gdscript
		if step_type == "trigger_animation":
			var node_path: String = step.get("node_path", "")
			var anim_name: String = step.get("animation_name", "")
			var use_tree: bool = step.get("use_tree", false)
			var code: String
			if use_tree:
				code = 'var node = get_node_or_null(NodePath("%s"))\nif node and node.get("tree"):\n\tnode.tree.travel("%s")\nelse:\n\tpush_error("trigger_animation: no AnimationTree on %s")' % [node_path, anim_name, node_path]
			else:
				code = 'var node = get_node_or_null(NodePath("%s"))\nvar player = null\nif node is AnimationPlayer: player = node\nelif node: player = node.get_node_or_null("AnimationPlayer")\nif player: player.play("%s")\nelse: push_error("trigger_animation: AnimationPlayer not found at %s")' % [node_path, anim_name, node_path]
			step = {"type": "run_gdscript", "code": code}
			step_type = "run_gdscript"

		match step_type:
			"play_scene":
				var scene_path: String = step.get("scene_path", "")
				var mode: String = "main" if scene_path.is_empty() else scene_path
				if ei.is_playing_scene(): ei.stop_playing_scene()
				match mode:
					"main": ei.play_main_scene()
					"current": ei.play_current_scene()
					_:
						if not ResourceLoader.exists(mode):
							errors.append("Scene '%s' not found" % mode)
							continue
						ei.play_custom_scene(mode)
				var wait_ready: float = step.get("wait_ready", 3.0)
				if wait_ready > 0:
					await get_tree().create_timer(wait_ready).timeout

			"stop_scene":
				if ei.is_playing_scene():
					ei.stop_playing_scene()

			"wait":
				var seconds: float = float(step.get("seconds", 0.5))
				await get_tree().create_timer(seconds).timeout

			"capture_frames":
				var raw: Dictionary = await _send_game_raw("capture_frames", {
					"count": step.get("count", 5),
					"frame_interval": step.get("frame_interval", 10),
					"half_resolution": step.get("half_resolution", true),
				}, minf((int(step.get("count", 5)) * int(step.get("frame_interval", 10))) / 60.0 + 5.0, 25.0))
				if raw.has("error"):
					errors.append("capture_frames: %s" % str(raw["error"].get("message", raw["error"])))
				else:
					var ipc: Dictionary = raw["ipc"]
					for frame: String in ipc.get("frames", []) as Array:
						images.append(GPUtils.mcp_image(frame))

			"run_gdscript", "click_button", "input_action":
				var result: Dictionary = await _send_game_command_v2("bulk_action", {"steps": [step]}, 15.0)
				if result.has("error"):
					errors.append("%s: %s" % [step_type, str(result["error"].get("message", result["error"]))])

			_:
				errors.append("Unknown step type: '%s'" % step_type)

	# Images first, then steps summary + errors at the end
	var content: Array = images.duplicate()
	content.append(GPUtils.mcp_text("Steps:\n" + JSON.stringify(steps, "  ")))
	if not errors.is_empty():
		content.append(GPUtils.mcp_text("Errors:\n" + "\n".join(errors)))
	return GPUtils.mcp_ok(content)

