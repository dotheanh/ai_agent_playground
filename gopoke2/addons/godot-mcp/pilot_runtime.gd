## GPRuntime — Autoload duy nhất cho tất cả runtime services.
## Gộp: screenshot, input, inspector IPC, recorder, navigation.
## Được inject bởi plugin khi game chạy trong editor.
extends Node

# ── TCP IPC ────────────────────────────────────────────────────────────────────

const PORT_FILE := "user://mcp_ipc_port"
const RECONNECT_INTERVAL := 1.0

var _tcp_client: StreamPeerTCP
var _packet_peer: PacketPeerStream
var _reconnect_timer: float = 0.0
var _tcp_connected: bool = false
var _current_request_id: String = ""
var _abort_async: bool = false
var _editor_port: int = -1

# ═══════════════════════════════════════════════════════════════════════════════
# STATE
# ═══════════════════════════════════════════════════════════════════════════════

enum _State { IDLE, CAPTURING_FRAMES, MONITORING, RECORDING, MOVING_TO }
var _state: _State = _State.IDLE

# Crash recovery
var _pending_command: bool = false

# ── Recorder: frame capture ────────────────────────────────────────────────────
var _capture_frames_remaining: int = 0
var _capture_frame_interval: int = 1
var _capture_frame_counter: int = 0
var _capture_half_res: bool = true
var _captured_images: Array = []
var _capture_node_path: String = ""
var _capture_node_props: Array = []
var _capture_frame_data: Array = []
var _capture_request_id: String = ""

# ── Recorder: property monitor ────────────────────────────────────────────────
var _monitor_node_path: String = ""
var _monitor_properties: Array = []
var _monitor_frames_remaining: int = 0
var _monitor_frame_interval: int = 1
var _monitor_frame_counter: int = 0
var _monitor_timeline: Array = []
var _monitor_request_id: String = ""

# ── Recorder: input recording ─────────────────────────────────────────────────
var _recording_events: Array = []
var _recording_start_msec: int = 0

# ── Input: sequence queue ─────────────────────────────────────────────────────
var _sequence_queue: Array = []
var _sequence_frame_delay: int = 0
var _sequence_frames_waited: int = 0

# ── Navigation: move_to ───────────────────────────────────────────────────────
var _moveto_target: Vector3 = Vector3.ZERO
var _moveto_player: Node3D = null
var _moveto_camera_pivot: Node3D = null
var _moveto_arrival_radius: float = 1.5
var _moveto_timeout: float = 15.0
var _moveto_elapsed: float = 0.0
var _moveto_run: bool = false
var _moveto_look_at: bool = true
var _moveto_keys_held: Array = []


# ═══════════════════════════════════════════════════════════════════════════════
# LIFECYCLE
# ═══════════════════════════════════════════════════════════════════════════════

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_connect_to_editor()
	# Register debug message capture — chạy trong debug loop kể cả khi game freeze tại breakpoint
	EngineDebugger.register_message_capture("mcp", _on_debug_message)


## Được gọi bởi debug loop khi editor gửi message "mcp:*" qua EditorDebuggerSession.send_message
## Chạy ngay cả khi game đang pause tại breakpoint
func _on_debug_message(message: String, data: Array) -> bool:
	if message == "get_stack":
		var include_vars: bool = data.size() > 0 and data[0] == true
		var backtraces := Engine.capture_script_backtraces(include_vars)
		var result: Array = []
		for bt in backtraces:
			var bt_data := {"language": bt.get_language_name(), "frames": []}
			for i in bt.get_frame_count():
				var frame := {
					"index":    i,
					"function": bt.get_frame_function(i),
					"source":   bt.get_frame_file(i),
					"line":     bt.get_frame_line(i),
				}
				if include_vars:
					var locals: Array = []
					for j in bt.get_local_variable_count(i):
						locals.append({
							"name":  bt.get_local_variable_name(i, j),
							"value": str(bt.get_local_variable_value(i, j)),
						})
					var members: Array = []
					for j in bt.get_member_variable_count(i):
						members.append({
							"name":  bt.get_member_variable_name(i, j),
							"value": str(bt.get_member_variable_value(i, j)),
						})
					frame["locals"]  = locals
					frame["members"] = members
				bt_data["frames"].append(frame)
			result.append(bt_data)
		var f := FileAccess.open("user://mcp_stack_dump.json", FileAccess.WRITE)
		if f:
			f.store_string(JSON.stringify({"backtraces": result}))
			f.close()
		return true
	return false


func _exit_tree() -> void:
	if _tcp_client:
		_tcp_client.disconnect_from_host()


func _connect_to_editor() -> void:
	# Đọc port từ file mà editor đã ghi
	if _editor_port < 0:
		if not FileAccess.file_exists(PORT_FILE):
			return  # Editor chưa sẵn sàng, thử lại sau
		var f := FileAccess.open(PORT_FILE, FileAccess.READ)
		if f == null:
			return
		_editor_port = int(f.get_as_text().strip_edges())
		f.close()
		if _editor_port <= 0:
			_editor_port = -1
			return

	_tcp_client = StreamPeerTCP.new()
	var err := _tcp_client.connect_to_host("127.0.0.1", _editor_port)
	if err != OK:
		push_warning("[MCP Runtime] Failed to connect to editor IPC port %d: %s" % [_editor_port, error_string(err)])
		return
	_packet_peer = PacketPeerStream.new()
	_packet_peer.output_buffer_max_size = 16 * 1024 * 1024  # 16MB cho screenshot
	_packet_peer.input_buffer_max_size = 1024 * 1024  # 1MB input
	_packet_peer.stream_peer = _tcp_client
	_tcp_connected = false


func _process(delta: float) -> void:
	# TCP connection management
	if _tcp_client == null:
		_reconnect_timer += delta
		if _reconnect_timer >= RECONNECT_INTERVAL:
			_reconnect_timer = 0.0
			_connect_to_editor()
		return

	_tcp_client.poll()
	var status := _tcp_client.get_status()

	if status == StreamPeerTCP.STATUS_CONNECTED:
		if not _tcp_connected:
			_tcp_connected = true
			print("[MCP Runtime] Connected to editor IPC on port %d" % _editor_port)
		# Read incoming packets
		while _packet_peer.get_available_packet_count() > 0:
			var raw := _packet_peer.get_packet()
			if raw.is_empty():
				continue
			var json: Variant = JSON.parse_string(raw.get_string_from_utf8())
			if json is Dictionary:
				_handle_tcp_message(json as Dictionary)
	elif status == StreamPeerTCP.STATUS_NONE or status == StreamPeerTCP.STATUS_ERROR:
		if _tcp_connected:
			push_warning("[MCP Runtime] Disconnected from editor IPC")
			_tcp_connected = false
			_pending_command = false
		_tcp_client = null
		_packet_peer = null
		_reconnect_timer = 0.0

	# Input sequence (không phụ thuộc IPC)
	if not _sequence_queue.is_empty():
		_process_sequence_tick()

	# State machine
	match _state:
		_State.CAPTURING_FRAMES:
			_process_capture()
		_State.MONITORING:
			_process_monitor()
		_State.MOVING_TO:
			_process_move_to(delta)


# ═══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

func _take_screenshot(request_id: String) -> void:
	await get_tree().process_frame
	var viewport := get_viewport()
	if viewport == null:
		_send_tcp_response(request_id, {"error": "No viewport"})
		return
	var image := viewport.get_texture().get_image()
	if image == null:
		_send_tcp_response(request_id, {"error": "Failed to capture image"})
		return
	var base64 := Marshalls.raw_to_base64(image.save_png_to_buffer())
	_send_tcp_response(request_id, {"image_base64": base64, "width": image.get_width(), "height": image.get_height(), "format": "png"})


# ═══════════════════════════════════════════════════════════════════════════════
# INPUT SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

func _process_input_commands(json_text: String) -> void:
	var parsed: Variant = JSON.parse_string(json_text)
	if parsed == null:
		push_warning("[MCP Runtime] Failed to parse input commands JSON")
		return

	if parsed is Dictionary and (parsed as Dictionary).has("sequence_events"):
		_start_sequence(parsed)
		return

	var events: Array = parsed if parsed is Array else [parsed]
	for event_data: Dictionary in events:
		var event := _create_input_event(event_data)
		if event != null:
			Input.parse_input_event(event)


func _start_sequence(data: Dictionary) -> void:
	_sequence_queue = data.get("sequence_events", []).duplicate()
	_sequence_frame_delay = data.get("frame_delay", 1)
	_sequence_frames_waited = 0
	if not _sequence_queue.is_empty():
		_dispatch_next_sequence_event()


func _process_sequence_tick() -> void:
	_sequence_frames_waited += 1
	if _sequence_frames_waited >= _sequence_frame_delay:
		_sequence_frames_waited = 0
		_dispatch_next_sequence_event()


func _dispatch_next_sequence_event() -> void:
	if _sequence_queue.is_empty():
		return
	var event_data: Dictionary = _sequence_queue.pop_front()
	var event := _create_input_event(event_data)
	if event != null:
		Input.parse_input_event(event)


func _create_input_event(data: Dictionary) -> InputEvent:
	match data.get("type", ""):
		"key":           return _create_key_event(data)
		"mouse_button":  return _create_mouse_button_event(data)
		"mouse_motion":  return _create_mouse_motion_event(data)
		"action":        return _create_action_event(data)
		"text":
			# Inject text trực tiếp vào focused Control (LineEdit, TextEdit).
			# Đây là cách đáng tin cậy nhất — không phụ thuộc keycode mapping.
			var text: String = str(data.get("text", ""))
			_inject_text_to_focused(text)
			return null
	push_warning("[MCP Runtime] Unknown input event type: %s" % data.get("type", ""))
	return null


func _inject_text_to_focused(text: String) -> void:
	## Tìm focused Control và inject text trực tiếp, hoặc gửi unicode key events.
	var vp := get_viewport()
	if vp == null: return
	var focused := vp.gui_get_focus_owner()

	# Nếu là LineEdit hoặc TextEdit — set text trực tiếp hoặc dùng insert
	if focused is LineEdit:
		var le: LineEdit = focused
		le.insert_text_at_caret(text)
		return
	if focused is TextEdit:
		var te: TextEdit = focused
		te.insert_text_at_caret(text)
		return

	# Fallback: gửi unicode InputEventKey cho từng ký tự
	for i in text.length():
		var ch := text.unicode_at(i)
		var press := InputEventKey.new()
		press.unicode = ch
		press.pressed = true
		Input.parse_input_event(press)
		var release := InputEventKey.new()
		release.unicode = ch
		release.pressed = false
		Input.parse_input_event(release)


func _viewport_to_window(viewport_pos: Vector2) -> Vector2:
	var vp := get_viewport()
	if vp == null:
		return viewport_pos
	return vp.get_final_transform() * viewport_pos


func _create_key_event(data: Dictionary) -> InputEventKey:
	var event := InputEventKey.new()
	var keycode_str: String = data.get("keycode", "")
	if keycode_str.begins_with("KEY_"):
		var val: int = ClassDB.class_get_integer_constant("@GlobalScope", keycode_str)
		event.keycode = val if val != 0 else OS.find_keycode_from_string(keycode_str.substr(4))
	else:
		event.keycode = OS.find_keycode_from_string(keycode_str)
	event.pressed = data.get("pressed", true)
	event.shift_pressed = data.get("shift", false)
	event.ctrl_pressed = data.get("ctrl", false)
	event.alt_pressed = data.get("alt", false)
	# Set unicode để LineEdit/TextEdit nhận được character input.
	# Chỉ set khi pressed và không có modifier (Ctrl/Alt) để tránh kích hoạt shortcut.
	if data.has("unicode"):
		event.unicode = int(data["unicode"])
	elif event.pressed and not event.ctrl_pressed and not event.alt_pressed:
		var kc: int = event.keycode
		# Printable ASCII: Space (32) đến ~ (126)
		if kc >= KEY_SPACE and kc <= 126:
			event.unicode = (kc - KEY_A + ord("a")) if (kc >= KEY_A and kc <= KEY_Z and not event.shift_pressed) else kc
	return event


func _create_mouse_button_event(data: Dictionary) -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = data.get("button", MOUSE_BUTTON_LEFT)
	event.pressed = data.get("pressed", true)
	event.double_click = data.get("double_click", false)
	var pos: Dictionary = data.get("position", {})
	var wp := _viewport_to_window(Vector2(pos.get("x", 0.0), pos.get("y", 0.0)))
	event.position = wp
	event.global_position = wp
	return event


func _create_mouse_motion_event(data: Dictionary) -> InputEventMouseMotion:
	var event := InputEventMouseMotion.new()
	var pos: Dictionary = data.get("position", {})
	var wp := _viewport_to_window(Vector2(pos.get("x", 0.0), pos.get("y", 0.0)))
	event.position = wp
	event.global_position = wp
	var rel: Dictionary = data.get("relative", {})
	var vp := get_viewport()
	if vp:
		var scale := vp.get_final_transform().get_scale()
		event.relative = Vector2(rel.get("x", 0.0), rel.get("y", 0.0)) * scale
	else:
		event.relative = Vector2(rel.get("x", 0.0), rel.get("y", 0.0))
	return event


func _create_action_event(data: Dictionary) -> InputEventAction:
	var event := InputEventAction.new()
	event.action = data.get("action", "")
	event.pressed = data.get("pressed", true)
	event.strength = data.get("strength", 1.0)
	return event


# ═══════════════════════════════════════════════════════════════════════════════
# TCP MESSAGE HANDLING
# ═══════════════════════════════════════════════════════════════════════════════

func _handle_tcp_message(msg: Dictionary) -> void:
	var channel: String = msg.get("channel", "command")
	var req_id: String = msg.get("id", "")

	match channel:
		"command":
			if _state != _State.IDLE:
				_abort_async = true
			_current_request_id = req_id
			var command: String = msg.get("command", "")
			var params: Dictionary = msg.get("params", {})
			await _handle_command(command, params)
		"screenshot":
			_take_screenshot(req_id)
		"input":
			var data: String = msg.get("data", "")
			_process_input_commands(data)


func _send_tcp_response(request_id: String, data: Dictionary) -> void:
	if _packet_peer == null:
		return
	var msg := {"id": request_id, "type": "response", "data": data}
	var err := _packet_peer.put_packet(JSON.stringify(msg).to_utf8_buffer())
	if err != OK:
		push_error("[MCP Runtime] put_packet failed: %s" % error_string(err))


func _handle_command(command: String, params: Dictionary) -> void:
	_pending_command = true

	match command:
		# Inspector (sync)
		"get_scene_tree":           _cmd_get_scene_tree(params)
		"get_node_properties":      _cmd_get_node_properties(params)
		"set_node_property":        _cmd_set_node_property(params)
		"execute_script":           await _cmd_execute_script(params)
		"find_nodes_by_script":     _cmd_find_nodes_by_script(params)
		"get_autoload":             _cmd_get_autoload(params)
		"batch_get_properties":     _cmd_batch_get_properties(params)
		"get_properties_batch":     _cmd_get_properties_batch(params)
		"get_stack_trace":          _cmd_get_stack_trace(params)
		# Recorder (async — state machine)
		"capture_frames":
			_pending_command = false
			_start_capture_frames(params)
		"monitor_properties":
			_pending_command = false
			_start_monitor_properties(params)
		"start_recording":
			_pending_command = false
			_start_recording(params)
		"stop_recording":
			_pending_command = false
			_stop_recording(params)
		"replay_recording":
			_pending_command = false
			_replay_recording(params)
		# Navigation (async — state machine / await)
		"find_ui_elements":
			_pending_command = false
			_cmd_find_ui_elements(params)
		"click_button_by_text":
			_pending_command = false
			_cmd_click_button_by_text(params)
		"input_text_to_element":
			_pending_command = false
			_cmd_input_text_to_element(params)
		"wait_for_node":
			_pending_command = false
			_cmd_wait_for_node(params)
		"find_nearby_nodes":
			_pending_command = false
			_cmd_find_nearby_nodes(params)
		"navigate_to":
			_pending_command = false
			_cmd_navigate_to(params)
		"move_to":
			_pending_command = false
			_cmd_move_to(params)
		"assert_node_state":
			_cmd_assert_node_state(params)
		"assert_screen_text":
			_pending_command = false
			_cmd_assert_screen_text(params)
		"bulk_action":
			_pending_command = false
			_cmd_bulk_action(params)
		_:
			_write_response({"error": "Unknown command: %s" % command})


# ═══════════════════════════════════════════════════════════════════════════════
# INSPECTOR COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

func _cmd_get_scene_tree(params: Dictionary) -> void:
	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return

	var max_depth: int = params.get("max_depth", -1)
	var script_filter: String = params.get("script_filter", "")
	var type_filter: String = params.get("type_filter", "")
	var named_only: bool = params.get("named_only", false)
	var has_filter := not script_filter.is_empty() or not type_filter.is_empty() or named_only

	if has_filter:
		var tree: Variant = _build_filtered_node_tree(root, max_depth, script_filter, type_filter, named_only)
		if tree == null:
			_write_response({"tree": null, "message": "No nodes matched the filter"})
		else:
			_write_response({"tree": tree})
	else:
		_write_response({"tree": _build_node_tree(root, max_depth)})


func _build_node_tree(node: Node, max_depth: int, depth: int = 0) -> Dictionary:
	var r := {"name": node.name, "type": node.get_class(), "path": str(node.get_path())}
	var script: Script = node.get_script()
	if script:
		r["script"] = script.resource_path
	if max_depth == -1 or depth < max_depth:
		var ch: Array = []
		for child in node.get_children():
			ch.append(_build_node_tree(child, max_depth, depth + 1))
		if not ch.is_empty():
			r["children"] = ch
	return r


func _build_filtered_node_tree(node: Node, max_depth: int, sf: String, tf: String, named_only: bool, depth: int = 0) -> Variant:
	var node_ok := _node_matches_filter(node, sf, tf, named_only)
	var children: Array = []
	if max_depth == -1 or depth < max_depth:
		for child in node.get_children():
			var ct: Variant = _build_filtered_node_tree(child, max_depth, sf, tf, named_only, depth + 1)
			if ct != null:
				children.append(ct)
	if not node_ok and children.is_empty():
		return null
	var r := {"name": node.name, "type": node.get_class(), "path": str(node.get_path())}
	var script: Script = node.get_script()
	if script:
		r["script"] = script.resource_path
	if not children.is_empty():
		r["children"] = children
	return r


func _node_matches_filter(node: Node, sf: String, tf: String, named_only: bool) -> bool:
	if named_only and (node.name as String).begins_with("@"):
		return false
	if not tf.is_empty() and not node.is_class(tf):
		return false
	if not sf.is_empty():
		var s: Script = node.get_script()
		if s == null or not s.resource_path.to_lower().contains(sf.to_lower()):
			return false
	return true


func _cmd_get_node_properties(params: Dictionary) -> void:
	var node_path: String = params.get("path", "")
	if node_path.is_empty():
		_write_response({"error": "path is required"})
		return
	var node := _resolve_node(node_path)
	if node == null:
		_write_response({"error": "Node not found: %s" % node_path})
		return
	var filter: Array = params.get("properties", [])
	var props: Dictionary = {}
	if filter.is_empty():
		for pi in node.get_property_list():
			var pn: String = pi["name"]
			if not (pi["usage"] & PROPERTY_USAGE_EDITOR) or pn.begins_with("_") or pn == "script":
				continue
			props[pn] = _serialize(node.get(pn))
	else:
		for pn: String in filter:
			props[pn] = _serialize(node.get(pn))
	_write_response({"path": str(node.get_path()), "type": node.get_class(), "properties": props})


func _cmd_set_node_property(params: Dictionary) -> void:
	var node_path: String = params.get("path", "")
	var property: String = params.get("property", "")
	if node_path.is_empty() or property.is_empty() or not params.has("value"):
		_write_response({"error": "path, property and value are required"})
		return
	var node := _resolve_node(node_path)
	if node == null:
		_write_response({"error": "Node not found: %s" % node_path})
		return
	var old_val: Variant = node.get(property)
	var new_val: Variant = _parse_typed(params.get("value"), typeof(old_val))
	node.set(property, new_val)
	_write_response({"path": str(node.get_path()), "property": property,
		"old_value": _serialize(old_val), "new_value": _serialize(node.get(property))})


func _parse_typed(raw: Variant, target_type: int) -> Variant:
	if typeof(raw) == target_type:
		return raw
	if raw is Dictionary:
		var d: Dictionary = raw
		match target_type:
			TYPE_VECTOR3:  return Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
			TYPE_VECTOR3I: return Vector3i(int(d.get("x", 0)), int(d.get("y", 0)), int(d.get("z", 0)))
			TYPE_VECTOR2:  return Vector2(float(d.get("x", 0)), float(d.get("y", 0)))
			TYPE_VECTOR2I: return Vector2i(int(d.get("x", 0)), int(d.get("y", 0)))
			TYPE_COLOR:    return Color(float(d.get("r", 0)), float(d.get("g", 0)), float(d.get("b", 0)), float(d.get("a", 1)))
		return raw
	if raw is String:
		var s: String = raw
		if s.begins_with("#"): return Color.html(s)
		var expr := Expression.new()
		if expr.parse(s) == OK:
			var res: Variant = expr.execute()
			if not expr.has_execute_failed(): return res
		return s
	if raw is float and target_type == TYPE_INT:  return int(raw)
	if raw is int and target_type == TYPE_FLOAT:  return float(raw)
	return raw


func _cmd_execute_script(params: Dictionary) -> void:
	var code: String = params.get("code", "")
	if code.is_empty():
		_write_response({"error": "code is required"})
		return
	# Normalize indentation: convert spaces to tabs to avoid "Mixed tabs and spaces" error
	var normalized_lines: PackedStringArray = []
	for line in code.split("\n"):
		var stripped := line.lstrip(" \t")
		var indent_part := line.substr(0, line.length() - stripped.length())
		# Convert any leading spaces (2 or 4 per level) to tabs
		var tab_indent := indent_part.replace("    ", "\t").replace("  ", "\t")
		# Remove any remaining spaces mixed with tabs
		tab_indent = tab_indent.replace(" ", "")
		normalized_lines.append(tab_indent + stripped)
	var normalized_code := "\n".join(normalized_lines)
	var wrapped := "extends Node\n\nvar _mcp_output: Array = []\n\nfunc _mcp_print(value: Variant) -> void:\n\t_mcp_output.append(str(value))\n\nfunc _safe_get(node: Node, prop: String, default: Variant = null) -> Variant:\n\tif node == null: return default\n\treturn node.get(prop) if prop in node else default\n\nfunc run() -> Variant:\n"
	for line in normalized_code.split("\n"):
		wrapped += "\t" + line + "\n"
	wrapped += "\treturn _mcp_output\n"
	var script := GDScript.new()
	script.source_code = wrapped
	var err := script.reload()
	if err != OK:
		_write_response({"error": "GDScript parse error (code %d): %s — check the Godot Output panel for details." % [err, error_string(err)]})
		return
	# Test instantiation outside scene tree to catch semantic errors (e.g. standalone lambdas)
	# that only surface at instantiate time, not during reload()
	var probe := Node.new()
	probe.set_script(script)
	if not probe.has_method("run"):
		probe.free()
		_write_response({"error": "GDScript instantiation failed — check the Godot Output panel for errors (e.g. standalone lambda, invalid syntax)."})
		return
	probe.free()
	var current_scene := get_tree().current_scene
	if current_scene == null:
		_write_response({"error": "No current scene — cannot execute script"})
		return
	var temp := Node.new()
	temp.set_script(script)
	current_scene.add_child(temp)
	var output: Variant = null
	if temp.has_method("run"):
		output = await temp.run()
	var mcp_out: Array = temp.get("_mcp_output") if temp.get("_mcp_output") is Array else []
	temp.queue_free()
	_write_response({"output": mcp_out, "return_value": str(output) if output != null else null})



func _cmd_find_nodes_by_script(params: Dictionary) -> void:
	var script_name: String = params.get("script", "")
	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return
	var prop_filter: Array = params.get("properties", [])
	var matches: Array = []
	_find_by_script_recursive(root, script_name.to_lower(), prop_filter, matches)
	_write_response({"nodes": matches, "count": matches.size()})


func _find_by_script_recursive(node: Node, sf: String, prop_filter: Array, results: Array) -> void:
	var script: Script = node.get_script()
	if script and script.resource_path.to_lower().contains(sf):
		var entry := {"name": node.name, "path": str(node.get_path()), "type": node.get_class(), "script": script.resource_path}
		var props: Dictionary = {}
		if prop_filter.is_empty():
			for pi in node.get_property_list():
				var pn: String = pi["name"]
				if not (pi["usage"] & PROPERTY_USAGE_EDITOR) or pn.begins_with("_") or pn == "script":
					continue
				props[pn] = _serialize(node.get(pn))
		else:
			for pn: String in prop_filter:
				props[pn] = _serialize(node.get(pn))
		entry["properties"] = props
		results.append(entry)
	for child in node.get_children():
		_find_by_script_recursive(child, sf, prop_filter, results)


func _cmd_get_autoload(params: Dictionary) -> void:
	var name: String = params.get("name", "")
	if name.is_empty():
		_write_response({"error": "'name' is required"})
		return
	var node := get_node_or_null(NodePath("/root/" + name))
	if node == null:
		_write_response({"error": "Autoload not found: %s" % name})
		return
	var prop_filter: Array = params.get("properties", [])
	var props: Dictionary = {}
	if prop_filter.is_empty():
		for pi in node.get_property_list():
			var pn: String = pi["name"]
			if not (pi["usage"] & PROPERTY_USAGE_EDITOR) or pn.begins_with("_") or pn == "script":
				continue
			props[pn] = _serialize(node.get(pn))
	else:
		for pn: String in prop_filter:
			props[pn] = _serialize(node.get(pn))
	var r := {"name": name, "path": str(node.get_path()), "type": node.get_class(), "properties": props}
	var script: Script = node.get_script()
	if script: r["script"] = script.resource_path
	_write_response(r)


func _cmd_batch_get_properties(params: Dictionary) -> void:
	var nodes: Array = params.get("nodes", [])
	if nodes.is_empty():
		_write_response({"error": "'nodes' array is required"})
		return
	var results: Array = []
	for entry: Dictionary in nodes:
		var node_path: String = entry.get("path", "")
		if node_path.is_empty():
			results.append({"path": "", "properties": {}, "error": "Empty path"})
			continue
		var node := _resolve_node(node_path)
		if node == null:
			results.append({"path": node_path, "properties": {}, "error": "Node not found"})
			continue
		var prop_filter: Array = entry.get("properties", [])
		var props: Dictionary = {}
		if prop_filter.is_empty():
			for pi in node.get_property_list():
				var pn: String = pi["name"]
				if not (pi["usage"] & PROPERTY_USAGE_EDITOR) or pn.begins_with("_") or pn == "script":
					continue
				props[pn] = _serialize(node.get(pn))
		else:
			for pn: String in prop_filter:
				props[pn] = _serialize(node.get(pn))
		results.append({"path": node_path, "properties": props})
	_write_response({"nodes": results, "count": results.size()})


# ═══════════════════════════════════════════════════════════════════════════════
# RECORDER — FRAME CAPTURE
# ═══════════════════════════════════════════════════════════════════════════════

func _start_capture_frames(params: Dictionary) -> void:
	var count: int = clampi(params.get("count", 5), 1, 30)
	_capture_frame_interval = maxi(params.get("frame_interval", 10), 1)
	_capture_half_res = params.get("half_resolution", true)
	_capture_node_path = ""
	_capture_node_props = []
	_capture_frame_data.clear()
	var node_data: Dictionary = params.get("node_data", {})
	if not node_data.is_empty():
		_capture_node_path = node_data.get("path", "")
		_capture_node_props = node_data.get("properties", [])
	_capture_request_id = _current_request_id
	_captured_images.clear()
	_capture_frames_remaining = count
	_capture_frame_counter = 0
	_state = _State.CAPTURING_FRAMES
	_capture_one_frame()


func _process_capture() -> void:
	if _abort_async:
		_abort_async = false
		_state = _State.IDLE
		return
	_capture_frame_counter += 1
	if _capture_frame_counter >= _capture_frame_interval:
		_capture_frame_counter = 0
		_capture_one_frame()


func _capture_one_frame() -> void:
	var viewport := get_viewport()
	if viewport == null:
		_finish_capture()
		return
	var image := viewport.get_texture().get_image()
	if image == null:
		_finish_capture()
		return
	if _capture_half_res:
		var sz := image.get_size() / 2
		image.resize(sz.x, sz.y, Image.INTERPOLATE_BILINEAR)
	_captured_images.append(Marshalls.raw_to_base64(image.save_png_to_buffer()))
	if not _capture_node_path.is_empty() and not _capture_node_props.is_empty():
		var snap: Dictionary = {}
		var node := get_tree().root.get_node_or_null(_capture_node_path)
		if node:
			for pn in _capture_node_props:
				snap[pn] = _serialize(node.get(pn))
		_capture_frame_data.append(snap)
	_capture_frames_remaining -= 1
	if _capture_frames_remaining <= 0:
		_finish_capture()


func _finish_capture() -> void:
	_state = _State.IDLE
	var w := 0
	var h := 0
	var viewport := get_viewport()
	if viewport:
		var sz := viewport.get_visible_rect().size
		if _capture_half_res: sz /= 2
		w = int(sz.x)
		h = int(sz.y)
	var response := {"frames": _captured_images, "count": _captured_images.size(), "width": w, "height": h, "half_resolution": _capture_half_res}
	if not _capture_frame_data.is_empty():
		response["frame_data"] = _capture_frame_data
	_send_tcp_response(_capture_request_id, response)
	_captured_images.clear()
	_capture_frame_data.clear()


# ═══════════════════════════════════════════════════════════════════════════════
# RECORDER — PROPERTY MONITOR
# ═══════════════════════════════════════════════════════════════════════════════

func _start_monitor_properties(params: Dictionary) -> void:
	_monitor_node_path = params.get("path", "")
	_monitor_properties = params.get("properties", [])
	if _monitor_node_path.is_empty() or _monitor_properties.is_empty():
		_write_response({"error": "path and properties are required"})
		return
	_monitor_request_id = _current_request_id
	_monitor_frames_remaining = clampi(params.get("frame_count", 60), 1, 600)
	_monitor_frame_interval = maxi(params.get("frame_interval", 1), 1)
	_monitor_timeline.clear()
	_monitor_frame_counter = 0
	_state = _State.MONITORING
	_sample_one_frame()


func _process_monitor() -> void:
	if _abort_async:
		_abort_async = false
		_state = _State.IDLE
		return
	_monitor_frame_counter += 1
	if _monitor_frame_counter >= _monitor_frame_interval:
		_monitor_frame_counter = 0
		_sample_one_frame()


func _sample_one_frame() -> void:
	var node := get_node_or_null(NodePath(_monitor_node_path))
	var sample: Dictionary = {}
	for pn: String in _monitor_properties:
		sample[pn] = _serialize(node.get(pn)) if node != null else null
	_monitor_timeline.append(sample)
	_monitor_frames_remaining -= 1
	if _monitor_frames_remaining <= 0:
		_finish_monitor()


func _finish_monitor() -> void:
	_state = _State.IDLE
	_send_tcp_response(_monitor_request_id, {"path": _monitor_node_path, "properties": _monitor_properties,
		"samples": _monitor_timeline, "sample_count": _monitor_timeline.size(),
		"frame_interval": _monitor_frame_interval})
	_monitor_timeline.clear()


# ═══════════════════════════════════════════════════════════════════════════════
# RECORDER — INPUT RECORDING / REPLAY
# ═══════════════════════════════════════════════════════════════════════════════

func _start_recording(_params: Dictionary) -> void:
	_recording_events.clear()
	_recording_start_msec = Time.get_ticks_msec()
	_state = _State.RECORDING
	set_process_input(true)
	_write_response({"recording": true, "message": "Recording started"})


func _stop_recording(_params: Dictionary) -> void:
	set_process_input(false)
	_state = _State.IDLE
	var events := _recording_events.duplicate()
	var duration_ms := Time.get_ticks_msec() - _recording_start_msec
	_write_response({"recording": false, "events": events, "event_count": events.size(), "duration_ms": duration_ms})


func _replay_recording(params: Dictionary) -> void:
	var events: Array = params.get("events", [])
	if events.is_empty():
		_write_response({"error": "No events to replay"})
		return
	var speed: float = params.get("speed", 1.0)
	var start_msec := Time.get_ticks_msec()
	for event_data: Dictionary in events:
		var adjusted_delay := int(int(event_data.get("time_ms", 0)) / speed)
		while Time.get_ticks_msec() - start_msec < adjusted_delay:
			await get_tree().process_frame
		var event := _reconstruct_event(event_data)
		if event != null:
			Input.parse_input_event(event)
	_write_response({"replayed": true, "event_count": events.size(), "speed": speed})



func _input(event: InputEvent) -> void:
	if _state != _State.RECORDING:
		return
	var time_ms := Time.get_ticks_msec() - _recording_start_msec
	var data: Dictionary = {"time_ms": time_ms}
	if event is InputEventKey:
		var key: InputEventKey = event
		data["type"] = "key"
		data["keycode"] = OS.get_keycode_string(key.keycode) if key.keycode != 0 else ""
		data["physical_keycode"] = OS.get_keycode_string(key.physical_keycode) if key.physical_keycode != 0 else ""
		data["pressed"] = key.pressed
		data["shift"] = key.shift_pressed
		data["ctrl"] = key.ctrl_pressed
		data["alt"] = key.alt_pressed
	elif event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		data["type"] = "mouse_button"
		data["button"] = mb.button_index
		data["pressed"] = mb.pressed
		data["position"] = {"x": mb.position.x, "y": mb.position.y}
		data["double_click"] = mb.double_click
	elif event is InputEventMouseMotion:
		var mm: InputEventMouseMotion = event
		data["type"] = "mouse_motion"
		data["position"] = {"x": mm.position.x, "y": mm.position.y}
		data["relative"] = {"x": mm.relative.x, "y": mm.relative.y}
	elif event is InputEventAction:
		var act: InputEventAction = event
		data["type"] = "action"
		data["action"] = act.action
		data["pressed"] = act.pressed
		data["strength"] = act.strength
	else:
		return
	_recording_events.append(data)


func _reconstruct_event(data: Dictionary) -> InputEvent:
	match data.get("type", ""):
		"key":
			var event := InputEventKey.new()
			var ks: String = data.get("keycode", "")
			if not ks.is_empty(): event.keycode = OS.find_keycode_from_string(ks)
			event.pressed = data.get("pressed", true)
			event.shift_pressed = data.get("shift", false)
			event.ctrl_pressed = data.get("ctrl", false)
			event.alt_pressed = data.get("alt", false)
			return event
		"mouse_button":
			var event := InputEventMouseButton.new()
			event.button_index = data.get("button", MOUSE_BUTTON_LEFT)
			event.pressed = data.get("pressed", true)
			event.double_click = data.get("double_click", false)
			var pos: Dictionary = data.get("position", {})
			event.position = Vector2(pos.get("x", 0.0), pos.get("y", 0.0))
			event.global_position = event.position
			return event
		"mouse_motion":
			var event := InputEventMouseMotion.new()
			var pos: Dictionary = data.get("position", {})
			event.position = Vector2(pos.get("x", 0.0), pos.get("y", 0.0))
			event.global_position = event.position
			var rel: Dictionary = data.get("relative", {})
			event.relative = Vector2(rel.get("x", 0.0), rel.get("y", 0.0))
			return event
		"action":
			var event := InputEventAction.new()
			event.action = data.get("action", "")
			event.pressed = data.get("pressed", true)
			event.strength = data.get("strength", 1.0)
			return event
	return null


# ═══════════════════════════════════════════════════════════════════════════════
# NAVIGATION — find_ui_elements
# ═══════════════════════════════════════════════════════════════════════════════

func _cmd_find_ui_elements(params: Dictionary) -> void:
	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return
	var type_filter: String = params.get("type_filter", "")
	var elements: Array = []
	_find_ui_recursive(root, type_filter, elements)
	_write_response({"elements": elements, "count": elements.size()})


func _find_ui_recursive(node: Node, type_filter: String, results: Array) -> void:
	if node is Control and node.visible:
		var ctrl: Control = node
		var entry: Dictionary = {}
		var include := false

		if ctrl is Button:
			entry["type"] = "Button"; entry["text"] = (ctrl as Button).text; entry["disabled"] = (ctrl as Button).disabled; include = true
		elif ctrl is Label:
			entry["type"] = "Label"; entry["text"] = (ctrl as Label).text; include = true
		elif ctrl is LineEdit:
			entry["type"] = "LineEdit"; entry["text"] = (ctrl as LineEdit).text; entry["placeholder"] = (ctrl as LineEdit).placeholder_text; include = true
		elif ctrl is TextEdit:
			entry["type"] = "TextEdit"; entry["text"] = (ctrl as TextEdit).text.left(200); include = true
		elif ctrl is OptionButton:
			entry["type"] = "OptionButton"; entry["text"] = (ctrl as OptionButton).text; entry["selected"] = (ctrl as OptionButton).selected; include = true
		elif ctrl is CheckBox:
			entry["type"] = "CheckBox"; entry["text"] = (ctrl as CheckBox).text; entry["checked"] = (ctrl as CheckBox).button_pressed; include = true
		elif ctrl is HSlider or ctrl is VSlider:
			var sl: Range = ctrl
			entry["type"] = "HSlider" if ctrl is HSlider else "VSlider"
			entry["value"] = sl.value; entry["min"] = sl.min_value; entry["max"] = sl.max_value; include = true

		if include and (type_filter.is_empty() or entry.get("type", "") == type_filter):
			var rect := ctrl.get_global_rect()
			entry["name"] = str(ctrl.name)
			entry["path"] = str(ctrl.get_path())
			entry["rect"] = {"x": rect.position.x, "y": rect.position.y, "width": rect.size.x, "height": rect.size.y}
			entry["center"] = {"x": rect.position.x + rect.size.x / 2.0, "y": rect.position.y + rect.size.y / 2.0}
			results.append(entry)

	for child in node.get_children():
		_find_ui_recursive(child, type_filter, results)


# ── Node resolution helper ────────────────────────────────────────────────────
# Tìm node theo path với fallback thông minh:
#   1. Absolute path (/root/...)
#   2. Relative từ /root (tự thêm /root/ prefix)
#   3. Tìm bằng suffix match trong toàn scene tree (FormContainer/UsernameInput)

func _resolve_node(node_path: String) -> Node:
	# 1. Absolute path — thử trực tiếp
	var n := get_node_or_null(NodePath(node_path))
	if n != null:
		return n
	# 2. Thêm /root/ prefix nếu chưa có
	if not node_path.begins_with("/"):
		n = get_node_or_null(NodePath("/root/" + node_path))
		if n != null:
			return n
	# 3. Suffix match trong toàn scene tree
	return _find_by_suffix(get_tree().root, node_path)

func _find_by_suffix(root: Node, suffix: String) -> Node:
	# Chuẩn hóa suffix: bỏ leading slash
	var target := suffix.trim_prefix("/")
	return _walk_suffix(root, target)

func _walk_suffix(node: Node, suffix: String) -> Node:
	var path_from_root := str(get_tree().root.get_path_to(node))
	if path_from_root.ends_with(suffix) or path_from_root == suffix:
		return node
	for child in node.get_children():
		var found := _walk_suffix(child, suffix)
		if found != null:
			return found
	return null


# ── assert_node_state ─────────────────────────────────────────────────────────

func _cmd_assert_node_state(params: Dictionary) -> void:
	var node_path: String = params.get("path", "")
	if node_path.is_empty():
		_write_response({"error": "path is required"})
		return
	var property: String = params.get("property", "")
	if property.is_empty():
		_write_response({"error": "property is required"})
		return
	if not params.has("expected"):
		_write_response({"error": "expected is required"})
		return

	var node := _resolve_node(node_path)
	if node == null:
		_write_response({"passed": false, "error": "Node not found: %s" % node_path})
		return

	# Hỗ trợ nested property: "position:x"
	var actual: Variant
	if property.contains(":"):
		var parts := property.split(":", false, 1)
		var base: Variant = node.get(parts[0])
		if base == null:
			_write_response({"passed": false, "error": "Property not found: %s" % parts[0]})
			return
		actual = base[parts[1]] if parts[1] in base else null
	else:
		actual = node.get(property)

	var expected: Variant = params.get("expected")
	var operator: String = params.get("operator", "eq")
	var passed: bool = false

	match operator:
		"eq":   passed = actual == expected
		"neq":  passed = actual != expected
		"gt":   passed = float(str(actual)) > float(str(expected))
		"lt":   passed = float(str(actual)) < float(str(expected))
		"gte":  passed = float(str(actual)) >= float(str(expected))
		"lte":  passed = float(str(actual)) <= float(str(expected))
		"contains": passed = str(actual).contains(str(expected))
		"type_is":
			if actual is Object:
				passed = (actual as Object).get_class() == str(expected)
			else:
				passed = type_string(typeof(actual)) == str(expected)
		_:
			_write_response({"passed": false, "error": "Unknown operator: %s" % operator})
			return

	var result := {
		"passed": passed,
		"path": node_path,
		"property": property,
		"expected": expected,
		"actual": _serialize(actual),
		"operator": operator,
	}
	if not passed:
		result["detail"] = "Expected %s %s %s but got %s" % [property, operator, str(expected), str(actual)]
	_write_response(result)


# ── assert_screen_text ─────────────────────────────────────────────────────────

func _cmd_assert_screen_text(params: Dictionary) -> void:
	var expected_text: String = params.get("text", "")
	if expected_text.is_empty():
		_write_response({"error": "'text' is required"})
		return

	var partial: bool = params.get("partial", true)
	var case_sensitive: bool = params.get("case_sensitive", true)

	var root := get_tree().current_scene
	if root == null:
		_write_response({"passed": false, "error": "No current scene"})
		return

	var elements: Array = []
	_find_ui_recursive(root, "", elements)

	var found := false
	var matched_element: Dictionary = {}
	var all_texts: Array = []

	for element: Dictionary in elements:
		var element_text: String = str(element.get("text", ""))
		if element_text.is_empty():
			continue
		all_texts.append(element_text)
		var search := expected_text
		var compare := element_text
		if not case_sensitive:
			search = search.to_lower()
			compare = compare.to_lower()
		if (partial and compare.contains(search)) or (not partial and compare == search):
			found = true
			matched_element = element
			break

	var result := {"passed": found, "expected_text": expected_text, "partial": partial, "case_sensitive": case_sensitive}
	if found:
		result["matched_element"] = {"text": matched_element.get("text", ""), "type": matched_element.get("type", ""), "path": matched_element.get("path", "")}
	else:
		result["visible_texts"] = all_texts
	_write_response(result)


# ── input_text_to_element ─────────────────────────────────────────────────────

func _cmd_input_text_to_element(params: Dictionary) -> void:
	## Tìm LineEdit/TextEdit theo label/placeholder/name, focus và inject text.
	## Params:
	##   label      — tên label UI gần field, placeholder text, hoặc node name (tìm partial, case-insensitive)
	##   text       — text cần nhập
	##   clear      — có xóa text cũ trước không (default: true)
	##   node_path  — (optional) truyền thẳng node path nếu đã biết
	var input_text: String = params.get("text", "")
	var label: String = params.get("label", "")
	var node_path: String = params.get("path", "")
	var clear: bool = params.get("clear", true)

	if input_text.is_empty():
		_write_response({"error": "'text' is required"})
		return
	if label.is_empty() and node_path.is_empty():
		_write_response({"error": "Either 'label' or 'path' is required"})
		return

	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return

	# Resolve node
	var target: Control = null
	if not node_path.is_empty():
		var n := _resolve_node(node_path)
		if n is Control:
			target = n as Control
		else:
			_write_response({"error": "Node not found or not a Control: %s" % node_path})
			return
	else:
		target = _find_input_element_by_label(root, label)

	if target == null:
		_write_response({"error": "No LineEdit/TextEdit found matching label: '%s'" % label})
		return

	# Focus
	target.grab_focus()

	# Inject text
	if target is LineEdit:
		var le: LineEdit = target
		if clear:
			le.text = ""
		le.insert_text_at_caret(input_text)
		le.emit_signal("text_changed", le.text)
	elif target is TextEdit:
		var te: TextEdit = target
		if clear:
			te.text = ""
		te.insert_text_at_caret(input_text)
		te.emit_signal("text_changed")
	else:
		_write_response({"error": "Element is not a LineEdit or TextEdit: %s" % target.get_class()})
		return

	_write_response({
		"success": true,
		"path": str(target.get_path()),
		"element_type": target.get_class(),
		"text_set": input_text
	})


func _find_input_element_by_label(node: Node, label: String) -> Control:
	## Tìm LineEdit/TextEdit theo (theo thứ tự ưu tiên):
	## 1. Label anh em trong cùng parent có text chứa label (score 4)
	## 2. node name chứa label (score 3)
	## 3. placeholder_text chứa label — LineEdit (score 2)
	var label_lower := label.to_lower().strip_edges()
	# Dùng Array để pass by reference qua đệ quy
	var state := [null, -1]  # [best_control, best_score]
	_find_input_recursive(node, label_lower, state)
	return state[0] as Control


func _find_input_recursive(node: Node, label_lower: String, state: Array) -> void:
	if (node is LineEdit or node is TextEdit) and node.visible:
		var ctrl: Control = node as Control
		var score := 0

		# Kiểm tra node name
		if ctrl.name.to_lower().contains(label_lower):
			score = max(score, 3)

		# Kiểm tra placeholder (LineEdit)
		if ctrl is LineEdit:
			var le: LineEdit = ctrl
			if le.placeholder_text.to_lower().contains(label_lower):
				score = max(score, 2)

		# Kiểm tra Label/RichTextLabel anh em trong cùng parent
		var parent := ctrl.get_parent()
		if parent != null:
			for sibling in parent.get_children():
				if sibling is Label:
					if (sibling as Label).text.to_lower().contains(label_lower):
						score = max(score, 4)
						break
				elif sibling is RichTextLabel:
					if (sibling as RichTextLabel).text.to_lower().contains(label_lower):
						score = max(score, 3)
						break

		if score > int(state[1]):
			state[0] = ctrl
			state[1] = score

	for child in node.get_children():
		_find_input_recursive(child, label_lower, state)


# ── click_button_by_text ───────────────────────────────────────────────────────

func _cmd_click_button_by_text(params: Dictionary) -> void:
	var text: String = params.get("text", "")
	var partial: bool = params.get("partial", true)
	if text.is_empty():
		_write_response({"error": "'text' is required"})
		return
	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return
	var btn: BaseButton = _find_button_by_text(root, text, partial)
	if btn == null:
		_write_response({"error": "No visible button found with text: '%s'" % text})
		return
	var center := btn.get_global_rect().get_center()
	var btn_text := (btn as Button).text if btn is Button else text
	# Gửi response TRƯỚC khi emit để tránh freeze nếu handler có breakpoint
	_write_response({"clicked": true, "button_text": btn_text, "button_path": str(btn.get_path()),
		"position": {"x": center.x, "y": center.y}})
	btn.emit_signal("pressed")


func _find_button_by_text(node: Node, text: String, partial: bool) -> BaseButton:
	if node is BaseButton and (node as BaseButton).visible:
		var base_btn: BaseButton = node
		var st := text.to_lower().strip_edges()
		# Button/CheckBox/etc có text trực tiếp
		if node is Button:
			var bt := (node as Button).text.to_lower().strip_edges()
			if (partial and bt.contains(st)) or (not partial and bt == st):
				return base_btn
		# TextureButton hoặc BaseButton khác: tìm Label/RichTextLabel con
		for child in base_btn.get_children():
			var label_text := ""
			if child is Label: label_text = (child as Label).text
			elif child is RichTextLabel: label_text = (child as RichTextLabel).text
			if not label_text.is_empty():
				var bt := label_text.to_lower().strip_edges()
				if (partial and bt.contains(st)) or (not partial and bt == st):
					return base_btn
	for child in node.get_children():
		var found := _find_button_by_text(child, text, partial)
		if found != null: return found
	return null


# ── wait_for_node ─────────────────────────────────────────────────────────────

func _cmd_wait_for_node(params: Dictionary) -> void:
	var node_path: String = params.get("path", "")
	if node_path.is_empty():
		_write_response({"error": "'path' is required"})
		return
	var timeout_sec: float = params.get("timeout", 5.0)
	var poll_interval: int = maxi(int(params.get("poll_frames", 5)), 1)
	var attempts := int(timeout_sec / (poll_interval / 60.0))
	for _i in attempts:
		var node := _resolve_node(node_path)
		if node != null:
			var r := {"found": true, "path": str(node.get_path()), "type": node.get_class(), "name": str(node.name)}
			var script: Script = node.get_script()
			if script: r["script"] = script.resource_path
			_write_response(r)
			return
		for _f in poll_interval:
			await get_tree().process_frame
	_write_response({"found": false, "path": node_path, "error": "Node not found after %.1fs" % timeout_sec})


# ── find_nearby_nodes ─────────────────────────────────────────────────────────

func _cmd_find_nearby_nodes(params: Dictionary) -> void:
	var radius: float = float(params.get("radius", 20.0))
	var max_results: int = int(params.get("max_results", 10))
	var type_filter: String = params.get("type_filter", "")
	var group_filter: String = params.get("group_filter", "")
	var origin := Vector3.ZERO
	var position_param: Variant = params.get("position", null)

	if position_param is String:
		var s: String = position_param as String
		# Try parse as JSON object first (e.g. '{"x":1,"y":2}')
		var maybe_dict: Variant = JSON.parse_string(s)
		if maybe_dict is Dictionary:
			var d: Dictionary = maybe_dict
			origin = Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
		else:
			var origin_node := get_node_or_null(NodePath(s))
			if origin_node == null:
				_write_response({"error": "Origin node not found: %s" % s})
				return
			if origin_node is Node3D:
				origin = (origin_node as Node3D).global_position
			elif origin_node is Node2D:
				var p2: Vector2 = (origin_node as Node2D).global_position
				origin = Vector3(p2.x, p2.y, 0)
			else:
				_write_response({"error": "Origin node is not Node2D or Node3D"})
				return
	elif position_param is Dictionary:
		var d: Dictionary = position_param
		origin = Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
	else:
		_write_response({"error": "'position' is required (node_path string or {x,y,z} object)"})
		return

	var root := get_tree().current_scene
	if root == null:
		_write_response({"error": "No current scene"})
		return
	var candidates: Array = []
	_find_nearby_recursive(root, origin, radius, type_filter, group_filter, candidates)
	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["distance"] < b["distance"])
	if candidates.size() > max_results: candidates.resize(max_results)
	_write_response({"origin": {"x": origin.x, "y": origin.y, "z": origin.z},
		"radius": radius, "nodes": candidates, "count": candidates.size()})


func _find_nearby_recursive(node: Node, origin: Vector3, radius: float, tf: String, gf: String, results: Array) -> void:
	var pos := Vector3.ZERO
	var is_spatial := false
	if node is Node3D:
		pos = (node as Node3D).global_position; is_spatial = true
	elif node is Node2D:
		var p2: Vector2 = (node as Node2D).global_position
		pos = Vector3(p2.x, p2.y, 0); is_spatial = true
	elif node is Control and (node as Control).visible:
		var center: Vector2 = (node as Control).get_global_rect().get_center()
		pos = Vector3(center.x, center.y, 0); is_spatial = true
	if is_spatial:
		var diff := pos - origin
		var dist := diff.length()
		if dist <= radius:
			var passes := (tf.is_empty() or node.is_class(tf)) and (gf.is_empty() or node.is_in_group(gf))
			if passes:
				var entry: Dictionary = {"path": str(node.get_path()), "name": str(node.name), "type": node.get_class(),
					"distance": snappedf(dist, 0.01),
					"global_position": {"x": snappedf(pos.x, 0.01), "y": snappedf(pos.y, 0.01), "z": snappedf(pos.z, 0.01)},
					"direction": {"x": snappedf(diff.x, 0.01), "y": snappedf(diff.y, 0.01), "z": snappedf(diff.z, 0.01)}}
				var script: Script = node.get_script()
				if script: entry["script"] = script.resource_path
				results.append(entry)
	for child in node.get_children():
		_find_nearby_recursive(child, origin, radius, tf, gf, results)


# ── navigate_to ───────────────────────────────────────────────────────────────

func _cmd_navigate_to(params: Dictionary) -> void:
	var player_path: String = params.get("player_path", "/root/Main/Player")
	var player := get_node_or_null(NodePath(player_path))
	if player == null or not player is Node3D:
		_write_response({"error": "Player not found or not Node3D: %s" % player_path})
		return
	var player_pos: Vector3 = (player as Node3D).global_position
	var target_pos := Vector3.ZERO
	var target_param: Variant = params.get("target", null)
	if target_param is String:
		var tn := get_node_or_null(NodePath(target_param as String))
		if tn == null or not tn is Node3D:
			_write_response({"error": "Target not found or not Node3D: %s" % target_param})
			return
		target_pos = (tn as Node3D).global_position
	elif target_param is Dictionary:
		var d: Dictionary = target_param
		target_pos = Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
	else:
		_write_response({"error": "'target' is required"})
		return

	var world_dir := target_pos - player_pos
	var distance := world_dir.length()
	var flat_dir := Vector3(world_dir.x, 0, world_dir.z).normalized()
	var camera_path: String = params.get("camera_path", "")
	var camera: Camera3D = null
	if not camera_path.is_empty():
		var cn := get_node_or_null(NodePath(camera_path))
		if cn is Camera3D: camera = cn
	else:
		camera = get_viewport().get_camera_3d()

	var suggested_keys: Array = []
	var camera_yaw_delta: float = 0.0
	if camera != null and flat_dir.length() > 0.01:
		var cf := -camera.global_basis.z
		var cam_flat := Vector3(cf.x, 0, cf.z).normalized()
		var cam_right := Vector3(cf.z, 0, -cf.x).normalized()
		var fd := flat_dir.dot(cam_flat)
		var rd := flat_dir.dot(cam_right)
		if fd > 0.3: suggested_keys.append("KEY_W")
		elif fd < -0.3: suggested_keys.append("KEY_S")
		if rd > 0.3: suggested_keys.append("KEY_D")
		elif rd < -0.3: suggested_keys.append("KEY_A")
		var angle_to_target := atan2(flat_dir.x, flat_dir.z)
		var cam_yaw := atan2(cam_flat.x, cam_flat.z)
		camera_yaw_delta = angle_to_target - cam_yaw
		while camera_yaw_delta > PI: camera_yaw_delta -= TAU
		while camera_yaw_delta < -PI: camera_yaw_delta += TAU

	var move_speed: float = float(params.get("move_speed", 5.0))
	_write_response({
		"distance": snappedf(distance, 0.01),
		"world_direction": {"x": snappedf(world_dir.x, 0.01), "y": snappedf(world_dir.y, 0.01), "z": snappedf(world_dir.z, 0.01)},
		"flat_direction": {"x": snappedf(flat_dir.x, 0.01), "z": snappedf(flat_dir.z, 0.01)},
		"suggested_keys": suggested_keys,
		"camera_rotation_delta": {"yaw_radians": snappedf(camera_yaw_delta, 0.001),
			"suggested_mouse_relative_x": snappedf(-camera_yaw_delta * 400.0 / PI, 1.0)},
		"estimated_duration": snappedf(distance / move_speed if move_speed > 0 else 0.0, 0.1),
		"player_position": {"x": snappedf(player_pos.x, 0.01), "y": snappedf(player_pos.y, 0.01), "z": snappedf(player_pos.z, 0.01)},
		"target_position": {"x": snappedf(target_pos.x, 0.01), "y": snappedf(target_pos.y, 0.01), "z": snappedf(target_pos.z, 0.01)},
	})


# ── move_to ───────────────────────────────────────────────────────────────────

func _cmd_move_to(params: Dictionary) -> void:
	var player_path: String = params.get("player_path", "/root/Main/Player")
	var player := get_node_or_null(NodePath(player_path))
	if player == null or not player is Node3D:
		_write_response({"error": "Player not found or not Node3D: %s" % player_path})
		return
	_moveto_player = player as Node3D

	var target_param: Variant = params.get("target", null)
	if target_param is String:
		var tn := get_node_or_null(NodePath(target_param as String))
		if tn == null or not tn is Node3D:
			_write_response({"error": "Target not found or not Node3D: %s" % target_param})
			return
		_moveto_target = (tn as Node3D).global_position
	elif target_param is Dictionary:
		var d: Dictionary = target_param
		_moveto_target = Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
	else:
		_write_response({"error": "'target' is required"})
		return

	_moveto_camera_pivot = null
	var camera_path: String = params.get("camera_path", "")
	if not camera_path.is_empty():
		var cn := get_node_or_null(NodePath(camera_path))
		if cn is Node3D: _moveto_camera_pivot = cn
	else:
		for child in _moveto_player.get_children():
			if child is SpringArm3D:
				_moveto_camera_pivot = child as Node3D
				break
		if _moveto_camera_pivot == null:
			var cam := get_viewport().get_camera_3d()
			if cam != null and cam.get_parent() is Node3D and cam.get_parent() != get_tree().root:
				_moveto_camera_pivot = cam.get_parent() as Node3D

	_moveto_arrival_radius = float(params.get("arrival_radius", 1.5))
	_moveto_timeout = float(params.get("timeout", 15.0))
	_moveto_run = bool(params.get("run", false))
	_moveto_look_at = bool(params.get("look_at_target", true))
	_moveto_elapsed = 0.0
	_moveto_keys_held.clear()

	var dist := _moveto_player.global_position.distance_to(_moveto_target)
	if dist <= _moveto_arrival_radius:
		_write_response({"success": true, "arrived": true, "final_distance": snappedf(dist, 0.01),
			"final_position": _serialize(_moveto_player.global_position),
			"target_position": _serialize(_moveto_target), "elapsed_time": 0.0})
		return
	_state = _State.MOVING_TO
	_inject_key(KEY_W, true)
	if _moveto_run: _inject_key(KEY_SHIFT, true)


func _process_move_to(delta: float) -> void:
	if _abort_async:
		_abort_async = false
		_finish_move_to(false, "Aborted by new command")
		_state = _State.IDLE
		return
	_moveto_elapsed += delta
	if _moveto_elapsed >= _moveto_timeout:
		_finish_move_to(false, "Timeout after %.1fs" % _moveto_timeout)
		return
	if not is_instance_valid(_moveto_player):
		_finish_move_to(false, "Player node was freed")
		return
	var pp := _moveto_player.global_position
	var flat_target := Vector3(_moveto_target.x, pp.y, _moveto_target.z)
	var dist := pp.distance_to(flat_target)
	if dist <= _moveto_arrival_radius:
		_finish_move_to(true, "Arrived")
		return
	if _moveto_look_at and _moveto_camera_pivot != null and is_instance_valid(_moveto_camera_pivot):
		var dir := flat_target - pp
		if dir.length_squared() > 0.01:
			var target_yaw := atan2(-dir.x, -dir.z)
			var yaw_diff := target_yaw - _moveto_camera_pivot.rotation.y
			while yaw_diff > PI: yaw_diff -= TAU
			while yaw_diff < -PI: yaw_diff += TAU
			_moveto_camera_pivot.rotation.y += clampf(yaw_diff, -10.0 * delta, 10.0 * delta)


func _finish_move_to(success: bool, message: String) -> void:
	_release_all_keys()
	_state = _State.IDLE
	var final_pos := Vector3.ZERO
	var final_dist := 0.0
	if is_instance_valid(_moveto_player):
		final_pos = _moveto_player.global_position
		final_dist = final_pos.distance_to(_moveto_target)
	_write_response({"success": success, "arrived": success, "message": message,
		"final_distance": snappedf(final_dist, 0.01),
		"final_position": _serialize(final_pos),
		"target_position": _serialize(_moveto_target),
		"elapsed_time": snappedf(_moveto_elapsed, 0.01)})


func _inject_key(keycode: int, pressed: bool) -> void:
	var event := InputEventKey.new()
	event.keycode = keycode
	event.pressed = pressed
	Input.parse_input_event(event)
	if pressed: _moveto_keys_held.append(keycode)
	else: _moveto_keys_held.erase(keycode)


func _release_all_keys() -> void:
	for keycode: int in _moveto_keys_held.duplicate():
		var event := InputEventKey.new()
		event.keycode = keycode
		event.pressed = false
		Input.parse_input_event(event)
	_moveto_keys_held.clear()


# ═══════════════════════════════════════════════════════════════════════════════
# SHARED HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

## get_properties_batch — lấy một property cụ thể cho từng node trong danh sách
## params: { requests: [{node_path, property}] }
## Dùng bởi debug_commands._debug_get_watched()
func _cmd_get_properties_batch(params: Dictionary) -> void:
	var requests: Array = params.get("requests", [])
	if requests.is_empty():
		_write_response({"error": "'requests' array is required"})
		return
	var values: Array = []
	for req: Dictionary in requests:
		var node_path: String = req.get("node_path", "")
		var property: String = req.get("property", "")
		if node_path.is_empty() or property.is_empty():
			values.append({"value": null, "error": "node_path and property are required"})
			continue
		var node := _resolve_node(node_path)
		if node == null:
			values.append({"value": null, "error": "Node not found: %s" % node_path})
			continue
		if not property in node:
			values.append({"value": null, "error": "Property not found: %s" % property})
			continue
		values.append({"value": _serialize(node.get(property)), "error": ""})
	_write_response({"values": values, "count": values.size()})


## get_stack_trace — lấy call stack hiện tại của game runtime
func _cmd_get_stack_trace(_params: Dictionary) -> void:
	var stack := get_stack()
	var result: Array = []
	for frame: Dictionary in stack:
		result.append({
			"function": frame.get("function", ""),
			"source":   frame.get("source", ""),
			"line":     frame.get("line", 0),
		})
	_write_response({"stack": result, "frame_count": result.size()})


## bulk_action — chạy nhiều steps tuần tự với delay tuỳ chọn giữa các step.
## Mỗi step: { "type": "click_button"|"run_gdscript"|"input_action"|"capture_frames"|"wait", ...params }
func _cmd_bulk_action(params: Dictionary) -> void:
	var steps: Array = params.get("steps", [])
	if steps.is_empty():
		_send_tcp_response(_current_request_id, {"error": "'steps' array is required"})
		return
	var request_id := _current_request_id
	_run_bulk_steps(steps, request_id)


func _run_bulk_steps(steps: Array, request_id: String) -> void:
	var results: Array = []
	for i in range(steps.size()):
		var step: Dictionary = steps[i]
		var step_type: String = step.get("type", "")
		var step_result: Dictionary = {}

		match step_type:
			"wait":
				var seconds: float = float(step.get("seconds", 0.5))
				await get_tree().create_timer(seconds).timeout
				step_result = {"type": "wait", "seconds": seconds}

			"click_button":
				var text: String = step.get("text", "")
				var partial: bool = step.get("partial", true)
				if text.is_empty():
					step_result = {"type": "click_button", "error": "'text' is required"}
				else:
					var root := get_tree().current_scene
					if root == null:
						step_result = {"type": "click_button", "error": "No current scene"}
					else:
						var btn: BaseButton = _find_button_by_text(root, text, partial)
						if btn == null:
							step_result = {"type": "click_button", "error": "No visible button found with text: '%s'" % text}
						else:
							var center := btn.get_global_rect().get_center()
							var btn_text := (btn as Button).text if btn is Button else text
							step_result = {"type": "click_button", "clicked": true, "button_text": btn_text,
								"button_path": str(btn.get_path()), "position": {"x": center.x, "y": center.y}}
							btn.emit_signal("pressed")
							# Wait 1 frame so UI can react before next step
							await get_tree().process_frame

			"input_action":
				var action: String = step.get("action", "")
				var pressed: bool = step.get("pressed", true)
				var strength: float = float(step.get("strength", 1.0))
				if action.is_empty():
					step_result = {"type": "input_action", "error": "'action' is required"}
				elif not InputMap.has_action(action):
					step_result = {"type": "input_action", "error": "Action not found: '%s'" % action}
				else:
					var ev := InputEventAction.new()
					ev.action = action
					ev.pressed = pressed
					ev.strength = strength
					Input.parse_input_event(ev)
					# Wait 1 frame so input is processed
					await get_tree().process_frame
					step_result = {"type": "input_action", "action": action, "pressed": pressed, "strength": strength}

			"run_gdscript":
				var code: String = step.get("code", "")
				if code.is_empty():
					step_result = {"type": "run_gdscript", "error": "'code' is required"}
				else:
					# Reuse normalize logic inline
					var normalized_lines: PackedStringArray = []
					for line in code.split("\n"):
						var stripped := line.lstrip(" \t")
						var indent_part := line.substr(0, line.length() - stripped.length())
						var tab_indent := indent_part.replace("    ", "\t").replace("  ", "\t")
						tab_indent = tab_indent.replace(" ", "")
						normalized_lines.append(tab_indent + stripped)
					var normalized_code := "\n".join(normalized_lines)
					var wrapped := "extends Node\n\nvar _mcp_output: Array = []\n\nfunc _mcp_print(value: Variant) -> void:\n\t_mcp_output.append(str(value))\n\nfunc run() -> Variant:\n"
					for line in normalized_code.split("\n"):
						wrapped += "\t" + line + "\n"
					wrapped += "\treturn _mcp_output\n"
					var script := GDScript.new()
					script.source_code = wrapped
					if script.reload() != OK:
						step_result = {"type": "run_gdscript", "error": "GDScript parse error — check Output panel"}
					else:
						var probe := Node.new()
						probe.set_script(script)
						if not probe.has_method("run"):
							probe.free()
							step_result = {"type": "run_gdscript", "error": "GDScript instantiation failed — check Output panel"}
						else:
							probe.free()
							var current_scene := get_tree().current_scene
							if current_scene == null:
								step_result = {"type": "run_gdscript", "error": "No current scene"}
							else:
								var temp := Node.new()
								temp.set_script(script)
								current_scene.add_child(temp)
								var output: Variant = temp.run()
								var mcp_out: Array = temp.get("_mcp_output") if temp.get("_mcp_output") is Array else []
								temp.queue_free()
								step_result = {"type": "run_gdscript", "output": mcp_out, "return_value": str(output) if output != null else null}

			"capture_frames":
				var count: int = clampi(step.get("count", 5), 1, 30)
				var frame_interval: int = maxi(step.get("frame_interval", 10), 1)
				var half_res: bool = step.get("half_resolution", true)
				var captured: Array = []
				for _f in range(count):
					var viewport := get_viewport()
					if viewport:
						var image := viewport.get_texture().get_image()
						if image:
							if half_res:
								var sz := image.get_size() / 2
								image.resize(sz.x, sz.y, Image.INTERPOLATE_BILINEAR)
							captured.append(Marshalls.raw_to_base64(image.save_png_to_buffer()))
					for _fi in range(frame_interval):
						await get_tree().process_frame
				var w := 0; var h := 0
				var vp := get_viewport()
				if vp:
					var sz := vp.get_visible_rect().size
					if half_res: sz /= 2
					w = int(sz.x); h = int(sz.y)
				step_result = {"type": "capture_frames", "frames": captured, "count": captured.size(), "width": w, "height": h, "half_resolution": half_res}

			_:
				step_result = {"type": step_type, "error": "Unknown step type: '%s'" % step_type}

		results.append(step_result)

		# Optional per-step delay (except for wait steps which already await)
		if step_type != "wait" and step_type != "capture_frames":
			var delay: float = float(step.get("delay_after", 0.0))
			if delay > 0.0:
				await get_tree().create_timer(delay).timeout

	_send_tcp_response(request_id, {"results": results, "step_count": results.size()})


func _write_response(data: Dictionary) -> void:
	_pending_command = false
	_send_tcp_response(_current_request_id, data)


## Serialize Variant → JSON-safe. Inline để tránh phụ thuộc vào MCPUtils (chạy runtime).
static func _serialize(value: Variant) -> Variant:
	if value == null: return null
	match typeof(value):
		TYPE_VECTOR2:
			var v: Vector2 = value; return {"x": v.x, "y": v.y}
		TYPE_VECTOR2I:
			var v: Vector2i = value; return {"x": v.x, "y": v.y}
		TYPE_VECTOR3:
			var v: Vector3 = value; return {"x": v.x, "y": v.y, "z": v.z}
		TYPE_VECTOR3I:
			var v: Vector3i = value; return {"x": v.x, "y": v.y, "z": v.z}
		TYPE_RECT2:
			var r: Rect2 = value; return {"x": r.position.x, "y": r.position.y, "width": r.size.x, "height": r.size.y}
		TYPE_COLOR:
			var c: Color = value; return {"r": c.r, "g": c.g, "b": c.b, "a": c.a, "html": "#" + c.to_html()}
		TYPE_NODE_PATH:
			return str(value)
		TYPE_OBJECT:
			if value is Resource:
				var res: Resource = value; return {"type": res.get_class(), "path": res.resource_path}
			return str(value)
		TYPE_ARRAY:
			var arr: Array = value
			var result: Array = []
			for item in arr: result.append(_serialize(item))
			return result
		TYPE_DICTIONARY:
			var dict: Dictionary = value
			var result: Dictionary = {}
			for key in dict: result[str(key)] = _serialize(dict[key])
			return result
		_:
			return value
