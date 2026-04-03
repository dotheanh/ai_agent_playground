@tool
class_name GPDebugCommands
extends Node

## GPDebugCommands — Realtime debug tools
## Các lệnh debug khi game đang chạy trong editor:
##   - Breakpoint management (set/clear qua EditorDebuggerSession)
##   - Debugger control (continue, step over, step into, break)
##   - Debugger status (is_breaked, is_active, is_debuggable)
##   - Performance snapshot (tất cả Performance monitors, bao gồm Navigation)
##   - Watch properties (theo dõi giá trị node property qua IPC)
##   - Stack trace (lấy call stack khi đang break)

var editor_plugin: EditorPlugin

# Danh sách property đang được watch: [{node_path, property, label}]
var _watched: Array[Dictionary] = []

# Danh sách breakpoints đã set: [{script_path, line, enabled}]
var _breakpoints: Array[Dictionary] = []

# Trạng thái skip breakpoints (tương đương nút "Skip Breakpoints" trên Debugger panel)
var _skip_breakpoints: bool = false

# EditorDebuggerPlugin nội bộ để truy cập EditorDebuggerSession
var _dbg_plugin: _MCPDebuggerPlugin = null

# Cache trạng thái debug từ signals — tránh phải poll session mỗi lần
# Được cập nhật reactive qua signals: started/stopped/breaked/continued
var _session_active: bool = false    # started → true, stopped → false
var _session_breaked: bool = false   # breaked → true, continued → false
var _session_can_debug: bool = false # từ breaked(can_debug) signal
var _stack_dump_cache: Array = []    # cache stack trace nhận từ debugger
var _stack_dump_received: bool = false


func _ready() -> void:
	_dbg_plugin = _MCPDebuggerPlugin.new()
	_dbg_plugin.on_session_started        = _on_session_started
	_dbg_plugin.on_session_stopped        = _on_session_stopped
	_dbg_plugin.on_session_breaked        = _on_session_breaked
	_dbg_plugin.on_session_continued      = _on_session_continued
	_dbg_plugin.on_stack_dump             = _on_stack_dump
	_dbg_plugin.on_breakpoint_set_in_tree = _on_breakpoint_set_in_tree
	editor_plugin.add_debugger_plugin(_dbg_plugin)
	# print("[GodotPilot] GPDebugCommands ready — EditorDebuggerPlugin registered")

	# Sau khi add_debugger_plugin, Godot không gọi lại _setup_session cho các session
	# đã tồn tại trước đó (ví dụ: khi reload plugin lúc game đang chạy).
	# Chủ động setup + kiểm tra trạng thái active cho tất cả sessions hiện có.
	await get_tree().process_frame  # đợi 1 frame để plugin được registered hoàn toàn
	var existing := _dbg_plugin.get_sessions()
	# print("[GodotPilot] Post-register: found %d existing session(s)" % existing.size())
	for i in existing.size():
		var s := existing[i] as EditorDebuggerSession
		if s == null:
			continue
		_dbg_plugin._setup_session(i)
		# print("[GodotPilot]   session[%d] is_active=%s" % [i, s.is_active()])
		if s.is_active() and not _session_active:
			_on_session_started()
			# print("[GodotPilot]   → manually triggered _on_session_started for pre-existing active session")


func _exit_tree() -> void:
	if _dbg_plugin:
		editor_plugin.remove_debugger_plugin(_dbg_plugin)
		_dbg_plugin = null


## Inner EditorDebuggerPlugin để lấy session, set breakpoints, và sync từ editor UI
class _MCPDebuggerPlugin extends EditorDebuggerPlugin:
	## Callback được gọi khi session bắt đầu active (game vừa attach debugger)
	var on_session_started: Callable
	## Callback được gọi khi session ngừng active (game stop/crash)
	var on_session_stopped: Callable
	## Callback được gọi khi game hit breakpoint hoặc nhấn Break
	## Tham số: can_debug (bool) — true nếu game đang trong debug loop
	var on_session_breaked: Callable
	## Callback được gọi khi game tiếp tục chạy sau break
	var on_session_continued: Callable
	## Callback được gọi khi editor UI set/clear một breakpoint (F9, click gutter...)
	var on_breakpoint_set_in_tree: Callable
	var on_stack_dump: Callable

	func _has_capture(_prefix: String) -> bool:
		return false  # Stack dump không expose qua plugin capture API

	func _setup_session(session_id: int) -> void:
		var session := get_session(session_id)
		print("[MCP Debug] _setup_session: session_id=%d, session=%s" % [session_id, str(session)])
		if session == null:
			print("[MCP Debug] _setup_session: session is null, aborting")
			return

		# started: game instance attach vào session → session trở thành active
		# Đây là thời điểm an toàn để re-apply breakpoints và gửi messages
		session.started.connect(func() -> void:
			print("[MCP Debug] session.started fired (session_id=%d)" % session_id)
			if on_session_started.is_valid():
				on_session_started.call()
		)

		# stopped: game stop, crash, hoặc exit → session không còn active
		session.stopped.connect(func() -> void:
			if on_session_stopped.is_valid():
				on_session_stopped.call()
		)

		# breaked(can_debug): game dừng tại breakpoint hoặc nhấn nút Break
		# can_debug=true  → game đang trong debug loop, có thể step/continue
		# can_debug=false → game pause nhưng không trong debug loop (ít gặp)
		session.breaked.connect(func(can_debug: bool) -> void:
			if on_session_breaked.is_valid():
				on_session_breaked.call(can_debug)
		)

		# continued: game tiếp tục sau khi nhấn Continue hoặc sau step
		session.continued.connect(func() -> void:
			if on_session_continued.is_valid():
				on_session_continued.call()
		)

	## Được gọi khi user set/clear breakpoint trực tiếp trong editor (F9, click gutter).
	## Dùng để giữ _breakpoints array đồng bộ với editor UI.
	func _breakpoint_set_in_tree(script: Script, line: int, enabled: bool) -> void:
		if on_breakpoint_set_in_tree.is_valid():
			on_breakpoint_set_in_tree.call(script, line, enabled)

	## Được gọi khi user clear toàn bộ breakpoints từ Breakpoints panel.
	func _breakpoints_cleared_in_tree() -> void:
		if on_breakpoint_set_in_tree.is_valid():
			on_breakpoint_set_in_tree.call(null, -1, false)  # sentinel: null script = clear all


func get_commands() -> Dictionary:
	return {
		# Breakpoints
		"debug_set_breakpoint":     _debug_set_breakpoint,
		"debug_clear_breakpoints":  _debug_clear_breakpoints,
		"debug_list_breakpoints":   _debug_list_breakpoints,
		# Debugger control
		"debug_get_status":         _debug_get_status,
		"debug_continue":           _debug_continue,
		"debug_step_over":          _debug_step_over,
		"debug_step_into":          _debug_step_into,
		"debug_break":              _debug_break,
		"debug_skip_breakpoints":   _debug_skip_breakpoints,
		# Performance
		"debug_get_performance":    _debug_get_performance,
		# Watch properties (editor-side IPC)
		"debug_watch_property":     _debug_watch_property,
		"debug_unwatch_property":   _debug_unwatch_property,
		"debug_get_watched":        _debug_get_watched,
		"debug_clear_watched":      _debug_clear_watched,
		# Stack trace
		"debug_get_stack_trace":    _debug_get_stack_trace,
	}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

func _ei() -> EditorInterface: return editor_plugin.get_editor_interface()
func _ok(data: Dictionary = {}) -> Dictionary: return GPUtils.mcp_ok_json(data)
func _err(code: int, msg: String) -> Dictionary: return GPUtils.mcp_err(msg, code)
func _err_params(msg: String) -> Dictionary: return _err(-32602, msg)
func _err_internal(msg: String) -> Dictionary: return _err(-32603, "Internal error: %s" % msg)
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


## Sync breakpoint từ editor UI vào _breakpoints array.
## Được gọi khi user nhấn F9, click gutter, hoặc dùng Breakpoints panel trong editor.
## Đảm bảo debug_list_breakpoints luôn phản ánh đúng trạng thái thực tế trong editor.
func _on_breakpoint_set_in_tree(script: Script, line: int, enabled: bool) -> void:
	# Sentinel từ _breakpoints_cleared_in_tree: script=null, line=-1 → clear all
	if script == null and line == -1:
		var count := _breakpoints.size()
		_breakpoints.clear()
		# print("[GodotPilot] All breakpoints cleared from editor UI (was %d)" % count)
		return

	var script_path := script.resource_path if script != null else ""
	if script_path.is_empty():
		return

	var existing := false
	for bp: Dictionary in _breakpoints:
		if bp["script_path"] == script_path and bp["line"] == line:
			if enabled:
				bp["enabled"] = true
			else:
				# clear: xóa khỏi list
				_breakpoints = _breakpoints.filter(
					func(b: Dictionary) -> bool:
						return not (b["script_path"] == script_path and b["line"] == line)
				)
			existing = true
			break

	if not existing and enabled:
		_breakpoints.append({"script_path": script_path, "line": line, "enabled": true})

	# print("[GodotPilot] Breakpoint synced from editor: %s:%d enabled=%s (total: %d)" % [script_path, line, enabled, _breakpoints.size()])


## Khi game bắt đầu chạy, re-apply tất cả breakpoints đã set trước đó
func _on_session_started() -> void:
	_session_active   = true
	_session_breaked  = false
	_session_can_debug = false
	print("[MCP Debug] *** _on_session_started CALLED — re-applying %d breakpoint(s) ***" % _breakpoints.size())
	if _dbg_plugin == null or _breakpoints.is_empty():
		return
	for bp: Dictionary in _breakpoints:
		if bp["enabled"]:
			_apply_breakpoint_to_all_sessions(bp["script_path"], bp["line"], true)
			# print("[GodotPilot]   applied: %s:%d" % [bp["script_path"], bp["line"]])
	# print("[GodotPilot] Re-applied %d breakpoint(s) to new debug session" % _breakpoints.size())


## Khi game dừng (Stop, crash, exit) — session không còn active
func _on_session_stopped() -> void:
	_session_active    = false
	_session_breaked   = false
	_session_can_debug = false
	# print("[GodotPilot] Debug session stopped (active=false)")


## Khi game hit breakpoint hoặc nhấn nút Break
## can_debug=true → game đang trong debug loop, AI có thể gọi step/continue
func _on_session_breaked(can_debug: bool) -> void:
	_session_breaked   = true
	_session_can_debug = can_debug
	# print("[GodotPilot] Debug session breaked (can_debug=%s)" % can_debug)


## Khi game tiếp tục sau break (Continue, Step Over, Step Into)
func _on_session_continued() -> void:
	_session_breaked   = false
	_session_can_debug = false
	# print("[GodotPilot] Debug session continued (resumed from break)")


## Nhận stack_dump message từ debugger (qua EditorDebuggerPlugin._capture)
func _on_stack_dump(data: Array) -> void:
	_stack_dump_cache = data
	_stack_dump_received = true


## Apply breakpoint lên tất cả sessions hiện có (active hoặc không).
## set_breakpoint() thuộc EditorDebuggerSession, KHÔNG phải EditorDebuggerPlugin.
## Gọi trên tất cả sessions để đảm bảo breakpoint được đăng ký vào Breakpoint Panel.
func _apply_breakpoint_to_all_sessions(script_path: String, line: int, enabled: bool) -> int:
	if _dbg_plugin == null:
		return 0
	var all_sessions := _dbg_plugin.get_sessions()
	print("[MCP Debug] _apply_breakpoint_to_all_sessions: total sessions=%d script=%s line=%d enabled=%s" % [all_sessions.size(), script_path, line, enabled])
	var count := 0
	for session in all_sessions:
		var s := session as EditorDebuggerSession
		if s != null:
			print("[MCP Debug]   session: is_active=%s is_breaked=%s" % [s.is_active(), s.is_breaked()])
			s.set_breakpoint(script_path, line, enabled)
			count += 1
	return count


## Lấy active EditorDebuggerSession đầu tiên (nếu có)
func _get_active_session() -> EditorDebuggerSession:
	if _dbg_plugin == null:
		return null
	for session in _dbg_plugin.get_sessions():
		var s := session as EditorDebuggerSession
		if s and s.is_active():
			return s
	return null


## Tìm debugger button trong editor UI bằng tooltip hoặc text.
func _find_debugger_btn(node: Node, tooltip_fragment: String) -> Button:
	if node is Button:
		var b: Button = node
		if b.tooltip_text.contains(tooltip_fragment) or b.text == tooltip_fragment:
			return b
	for child in node.get_children():
		var found := _find_debugger_btn(child, tooltip_fragment)
		if found:
			return found
	return null


## Gửi lệnh control debugger bằng cách simulate press button trong debugger panel.
## Fallback khi không có active session.
func _press_debugger_btn(tooltip_fragment: String) -> bool:
	var base := _ei().get_base_control()
	var btn := _find_debugger_btn(base, tooltip_fragment)
	if btn == null or not btn.visible or btn.disabled:
		return false
	btn.pressed.emit()
	return true


func _game_ipc() -> Node:
	return editor_plugin.game_ipc

## Gửi lệnh IPC đến runtime game và đợi response
func _send_game_command(command: String, cmd_params: Dictionary, timeout_sec: float = 10.0) -> Dictionary:
	var ipc := _game_ipc()
	if not ipc.has_game_connection():
		var wait_start := Time.get_ticks_msec()
		while not ipc.has_game_connection() and (Time.get_ticks_msec() - wait_start) < 10000:
			await get_tree().process_frame
		if not ipc.has_game_connection():
			return _err_internal("Game runtime not connected — is GPRuntime autoload enabled and game running?")
	var result: Dictionary = await ipc.send_game_command(command, cmd_params, timeout_sec)
	if result.has("error"):
		return _err(-32000, str(result["error"]))
	return {"result": result}


# ══════════════════════════════════════════════════════════════════════════════
# BREAKPOINT COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

## Set hoặc clear một breakpoint tại script + dòng chỉ định.
## Nếu có EditorDebuggerSession active, apply breakpoint trực tiếp vào debugger.
## params: { script_path: "res://scripts/player.gd", line: 42, enabled: true }
func _debug_set_breakpoint(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "script"); if r1[1]: return r1[1]
	var script_path: String = r1[0]
	if not params.has("line"):
		return _err_params("Missing required parameter: line (int)")
	var line: int = int(params["line"])
	if line < 1:
		return _err_params("line must be >= 1")
	var enabled: bool = _optional_bool(params, "enabled", true)

	# Tự động tắt Skip Breakpoints khi đặt breakpoint mới
	if enabled and _skip_breakpoints:
		_debug_skip_breakpoints({"skip": false})

	# print("[GodotPilot] debug_set_breakpoint: script=%s line=%d enabled=%s" % [script_path, line, enabled])

	# Dùng ResourceLoader.exists() thay vì FileAccess.file_exists() vì res:// là virtual path
	if not ResourceLoader.exists(script_path):
		# print("[GodotPilot] debug_set_breakpoint: script not found: %s" % script_path)
		return _err(-32001, "Script not found: %s" % script_path)

	# Kiểm tra _dbg_plugin sẵn sàng
	if _dbg_plugin == null:
		# print("[GodotPilot] debug_set_breakpoint: _dbg_plugin is null — plugin chưa khởi tạo?")
		return _err_internal("EditorDebuggerPlugin chưa khởi tạo")

	# Cập nhật danh sách local
	var existing := false
	for bp: Dictionary in _breakpoints:
		if bp["script_path"] == script_path and bp["line"] == line:
			bp["enabled"] = enabled
			existing = true
			break
	if not existing:
		if enabled:
			_breakpoints.append({"script_path": script_path, "line": line, "enabled": true})
	elif not enabled:
		_breakpoints = _breakpoints.filter(
			func(bp: Dictionary) -> bool:
				return not (bp["script_path"] == script_path and bp["line"] == line)
		)

	# Apply qua tất cả EditorDebuggerSession hiện có.
	# set_breakpoint() thuộc EditorDebuggerSession, KHÔNG phải EditorDebuggerPlugin.
	# Khi game chạy, _on_session_started sẽ re-apply toàn bộ breakpoints lên session mới.
	var applied := _apply_breakpoint_to_all_sessions(script_path, line, enabled)
	# print("[GodotPilot] debug_set_breakpoint: applied to %d session(s) (breakpoints tracked: %d)" % [applied, _breakpoints.size()])

	return _ok({
		"script_path":          script_path,
		"line":                 line,
		"enabled":              enabled,
		"sessions_applied":     applied,
		"note":                 "breakpoint tracked locally; will re-apply on next debug session start" if applied == 0 else "",
	})


## Xóa tất cả breakpoints đã set.
## params: {} hoặc { script_path: "res://..." } để xóa chỉ script đó
func _debug_clear_breakpoints(params: Dictionary) -> Dictionary:
	# print("[GodotPilot] debug_clear_breakpoints: params=%s" % JSON.stringify(params))
	var filter_script := _optional_string(params, "script_path")
	var to_clear: Array[Dictionary] = []

	if filter_script.is_empty():
		to_clear.assign(_breakpoints.duplicate())
		_breakpoints.clear()
	else:
		var remaining: Array[Dictionary] = []
		for bp: Dictionary in _breakpoints:
			if bp["script_path"] == filter_script:
				to_clear.append(bp)
			else:
				remaining.append(bp)
		_breakpoints = remaining

	# Disable từng breakpoint qua tất cả sessions hiện có
	for bp: Dictionary in to_clear:
		_apply_breakpoint_to_all_sessions(bp["script_path"], bp["line"], false)

	return _ok({
		"cleared":              to_clear.size(),
		"applied_to_debugger": true,
	})


## Liệt kê tất cả breakpoints hiện tại
func _debug_list_breakpoints(_params: Dictionary) -> Dictionary:
	return _ok({"breakpoints": _breakpoints, "count": _breakpoints.size()})


# ══════════════════════════════════════════════════════════════════════════════
# DEBUGGER CONTROL COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

## Lấy trạng thái debugger hiện tại.
## Ưu tiên dùng cache từ signals (reactive), sau đó cross-check với session API,
## fallback sang button-scan nếu không có session nào.
func _debug_get_status(_params: Dictionary) -> Dictionary:
	var ei := _ei()
	var is_playing := ei.is_playing_scene()
	var playing_scene := ei.get_playing_scene() if is_playing else ""

	var is_breaked := false
	var is_debuggable := false
	var has_active_session := false
	var method := "none"

	var session := _get_active_session()
	if session:
		# Dùng session API để lấy giá trị chính xác nhất
		# Cache (_session_breaked, _session_can_debug) được cập nhật reactive qua signals
		# Session API là nguồn sự thật — cross-check với cache
		is_breaked    = session.is_breaked()
		is_debuggable = session.is_debuggable()
		has_active_session = true
		method = "session_api"
		# Đồng bộ cache nếu lệch (ví dụ: user nhấn Continue thủ công)
		if _session_breaked != is_breaked:
			_session_breaked   = is_breaked
			_session_can_debug = is_debuggable
	elif _session_active:
		# Cache báo active nhưng không tìm được session active → dùng cache
		is_breaked    = _session_breaked
		is_debuggable = _session_can_debug
		has_active_session = false
		method = "signal_cache"
	else:
		# Fallback: scan debugger buttons
		var base := ei.get_base_control()
		var continue_btn := _find_debugger_btn(base, "Continue")
		var step_over_btn := _find_debugger_btn(base, "Step Over")
		if continue_btn:
			is_debuggable = continue_btn.visible
			is_breaked = continue_btn.visible and not continue_btn.disabled
		if step_over_btn and step_over_btn.visible and not step_over_btn.disabled:
			is_breaked = true
		method = "button_scan"

	return _ok({
		"is_playing":          is_playing,
		"playing_scene":       playing_scene,
		"is_breaked":          is_breaked,
		"is_debuggable":       is_debuggable,
		"has_active_session":  has_active_session,
		"session_cache": {
			"active":    _session_active,
			"breaked":   _session_breaked,
			"can_debug": _session_can_debug,
		},
		"breakpoints_count":   _breakpoints.size(),
		"skip_breakpoints":    _skip_breakpoints,
		"status_method":       method,
	})


## Tiếp tục chạy sau khi dừng tại breakpoint (Continue)
func _debug_continue(_params: Dictionary) -> Dictionary:
	# Thử button press trước (session không expose continue() trực tiếp)
	var pressed := _press_debugger_btn("Continue")
	if not pressed:
		return _err(-32000, "Debugger không đang break hoặc không tìm được nút Continue")
	return _ok({"action": "continue"})


## Step Over — bước qua dòng tiếp theo (không đi vào function)
func _debug_step_over(_params: Dictionary) -> Dictionary:
	var pressed := _press_debugger_btn("Step Over")
	if not pressed:
		return _err(-32000, "Debugger không đang break hoặc không tìm được nút Step Over")
	return _ok({"action": "step_over"})


## Step Into — bước vào function ở dòng tiếp theo
func _debug_step_into(_params: Dictionary) -> Dictionary:
	var pressed := _press_debugger_btn("Step Into")
	if not pressed:
		return _err(-32000, "Debugger không đang break hoặc không tìm được nút Step Into")
	return _ok({"action": "step_into"})


## Skip Breakpoints — bật/tắt chế độ bỏ qua toàn bộ breakpoints
## Tương đương nút "Skip Breakpoints" trên Debugger panel (top-right).
## params: { skip: true } để skip, { skip: false } để re-enable, omit để toggle.
## Trạng thái được lưu local trong _skip_breakpoints để có thể query qua debug_get_status.
func _debug_skip_breakpoints(params: Dictionary) -> Dictionary:
	# Xác định trạng thái mới
	var new_skip: bool
	if params.has("skip"):
		new_skip = bool(params["skip"])
	else:
		new_skip = not _skip_breakpoints  # toggle

	_skip_breakpoints = new_skip

	# Tìm và click nút "Skip Breakpoints" trên Debugger panel
	var base := _ei().get_base_control()
	var btn := _find_debugger_btn(base, "Skip Breakpoints")
	if btn == null:
		btn = _find_debugger_btn(base, "Ignore Breakpoints")
	var applied_via_ui := false
	if btn != null and btn.visible:
		# Nút này là toggle button (button_pressed) — set trực tiếp thay vì emit pressed
		if btn is Button:
			(btn as Button).button_pressed = new_skip
			applied_via_ui = true

	# print("[GodotPilot] debug_skip_breakpoints: skip=%s applied_via_ui=%s" % [new_skip, applied_via_ui])
	return _ok({
		"skip":           new_skip,
		"applied_via_ui": applied_via_ui,
		"note":           "Breakpoints vẫn được track local; chỉ tắt việc dừng tại breakpoint khi game chạy." if new_skip else "",
	})


## Break — tạm dừng game ngay lập tức
func _debug_break(_params: Dictionary) -> Dictionary:
	if not _ei().is_playing_scene():
		return _err(-32000, "Game không đang chạy")
	# Tự động tắt Skip Breakpoints nếu đang bật
	var skip_disabled := false
	if _skip_breakpoints:
		_debug_skip_breakpoints({"skip": false})
		skip_disabled = true
	var pressed := _press_debugger_btn("Break")
	if not pressed:
		pressed = _press_debugger_btn("Pause")
	if not pressed:
		return _err(-32000, "Không tìm được nút Break trong debugger panel")
	return _ok({"action": "break", "skip_breakpoints_disabled": skip_disabled})


# ══════════════════════════════════════════════════════════════════════════════
# PERFORMANCE SNAPSHOT
# ══════════════════════════════════════════════════════════════════════════════

## Snapshot đầy đủ tất cả Performance monitors.
## params: { format: "flat" | "grouped" } — mặc định "grouped"
## Lưu ý:
##   - MEMORY_STATIC / MEMORY_STATIC_MAX trả về 0 trong release builds
##   - OBJECT_ORPHAN_NODE_COUNT chỉ có trong debug builds
##   - NAVIGATION_* monitors chỉ cập nhật khi NavigationServer đang active
func _debug_get_performance(params: Dictionary) -> Dictionary:
	var fmt := _optional_string(params, "format", "grouped")

	var raw := {
		# Time
		"fps":                           Performance.get_monitor(Performance.TIME_FPS),
		"frame_time_ms":                 Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0,
		"physics_time_ms":               Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0,
		"navigation_time_ms":            Performance.get_monitor(Performance.TIME_NAVIGATION_PROCESS) * 1000.0,
		# Memory
		"memory_static_bytes":           Performance.get_monitor(Performance.MEMORY_STATIC),
		"memory_static_max_bytes":       Performance.get_monitor(Performance.MEMORY_STATIC_MAX),
		"memory_msg_buf_max_bytes":      Performance.get_monitor(Performance.MEMORY_MESSAGE_BUFFER_MAX),
		# Objects (OBJECT_ORPHAN_NODE_COUNT = 0 trong release builds)
		"object_count":                  Performance.get_monitor(Performance.OBJECT_COUNT),
		"resource_count":                Performance.get_monitor(Performance.OBJECT_RESOURCE_COUNT),
		"node_count":                    Performance.get_monitor(Performance.OBJECT_NODE_COUNT),
		"orphan_node_count":             Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT),
		# Render
		"render_objects_in_frame":       Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
		"render_primitives_in_frame":    Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		"render_draw_calls":             Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"render_video_mem_bytes":        Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED),
		"render_texture_mem_bytes":      Performance.get_monitor(Performance.RENDER_TEXTURE_MEM_USED),
		"render_buffer_mem_bytes":       Performance.get_monitor(Performance.RENDER_BUFFER_MEM_USED),
		# Physics 2D
		"physics2d_active_objects":      Performance.get_monitor(Performance.PHYSICS_2D_ACTIVE_OBJECTS),
		"physics2d_collision_pairs":     Performance.get_monitor(Performance.PHYSICS_2D_COLLISION_PAIRS),
		"physics2d_island_count":        Performance.get_monitor(Performance.PHYSICS_2D_ISLAND_COUNT),
		# Physics 3D
		"physics3d_active_objects":      Performance.get_monitor(Performance.PHYSICS_3D_ACTIVE_OBJECTS),
		"physics3d_collision_pairs":     Performance.get_monitor(Performance.PHYSICS_3D_COLLISION_PAIRS),
		"physics3d_island_count":        Performance.get_monitor(Performance.PHYSICS_3D_ISLAND_COUNT),
		# Audio
		"audio_output_latency_sec":      Performance.get_monitor(Performance.AUDIO_OUTPUT_LATENCY),
		# Navigation 2D
		"nav2d_active_maps":             Performance.get_monitor(Performance.NAVIGATION_ACTIVE_MAPS),
		"nav2d_region_count":            Performance.get_monitor(Performance.NAVIGATION_REGION_COUNT),
		"nav2d_agent_count":             Performance.get_monitor(Performance.NAVIGATION_AGENT_COUNT),
		"nav2d_link_count":              Performance.get_monitor(Performance.NAVIGATION_LINK_COUNT),
		"nav2d_polygon_count":           Performance.get_monitor(Performance.NAVIGATION_POLYGON_COUNT),
		"nav2d_edge_count":              Performance.get_monitor(Performance.NAVIGATION_EDGE_COUNT),
		"nav2d_edge_merge_count":        Performance.get_monitor(Performance.NAVIGATION_EDGE_MERGE_COUNT),
		"nav2d_edge_connection_count":   Performance.get_monitor(Performance.NAVIGATION_EDGE_CONNECTION_COUNT),
		"nav2d_edge_free_count":         Performance.get_monitor(Performance.NAVIGATION_EDGE_FREE_COUNT),
		"nav2d_obstacle_count":          Performance.get_monitor(Performance.NAVIGATION_OBSTACLE_COUNT),
	}

	if fmt == "flat":
		return _ok({"monitors": raw, "timestamp_msec": Time.get_ticks_msec()})

	# Grouped format — human-readable
	return _ok({
		"timestamp_msec": Time.get_ticks_msec(),
		"time": {
			"fps":            raw["fps"],
			"frame_ms":       snappedf(raw["frame_time_ms"], 0.01),
			"physics_ms":     snappedf(raw["physics_time_ms"], 0.01),
			"navigation_ms":  snappedf(raw["navigation_time_ms"], 0.01),
		},
		"memory": {
			"static_mb":       snappedf(raw["memory_static_bytes"] / 1048576.0, 0.01),
			"static_max_mb":   snappedf(raw["memory_static_max_bytes"] / 1048576.0, 0.01),
			"msg_buf_max_kb":  snappedf(raw["memory_msg_buf_max_bytes"] / 1024.0, 0.01),
			"note":            "static_* returns 0 in release builds",
		},
		"objects": {
			"total":      int(raw["object_count"]),
			"resources":  int(raw["resource_count"]),
			"nodes":      int(raw["node_count"]),
			"orphans":    int(raw["orphan_node_count"]),
			"note":       "orphans returns 0 in release builds",
		},
		"render": {
			"objects_in_frame":     int(raw["render_objects_in_frame"]),
			"primitives_in_frame":  int(raw["render_primitives_in_frame"]),
			"draw_calls":           int(raw["render_draw_calls"]),
			"video_mem_mb":         snappedf(raw["render_video_mem_bytes"] / 1048576.0, 0.01),
			"texture_mem_mb":       snappedf(raw["render_texture_mem_bytes"] / 1048576.0, 0.01),
			"buffer_mem_mb":        snappedf(raw["render_buffer_mem_bytes"] / 1048576.0, 0.01),
		},
		"physics_2d": {
			"active_objects":   int(raw["physics2d_active_objects"]),
			"collision_pairs":  int(raw["physics2d_collision_pairs"]),
			"islands":          int(raw["physics2d_island_count"]),
		},
		"physics_3d": {
			"active_objects":   int(raw["physics3d_active_objects"]),
			"collision_pairs":  int(raw["physics3d_collision_pairs"]),
			"islands":          int(raw["physics3d_island_count"]),
		},
		"audio": {
			"output_latency_ms": snappedf(raw["audio_output_latency_sec"] * 1000.0, 0.01),
		},
		"navigation": {
			"active_maps":          int(raw["nav2d_active_maps"]),
			"regions":              int(raw["nav2d_region_count"]),
			"agents":               int(raw["nav2d_agent_count"]),
			"links":                int(raw["nav2d_link_count"]),
			"polygons":             int(raw["nav2d_polygon_count"]),
			"edges":                int(raw["nav2d_edge_count"]),
			"edges_merged":         int(raw["nav2d_edge_merge_count"]),
			"edges_connected":      int(raw["nav2d_edge_connection_count"]),
			"edges_free":           int(raw["nav2d_edge_free_count"]),
			"obstacles":            int(raw["nav2d_obstacle_count"]),
		},
	})


# ══════════════════════════════════════════════════════════════════════════════
# WATCH PROPERTY COMMANDS (editor-side IPC)
# ══════════════════════════════════════════════════════════════════════════════

## Thêm một property vào danh sách watch.
## Mỗi lần gọi debug_get_watched sẽ fetch giá trị hiện tại từ game runtime.
## params: { node_path: "/root/Main/Player", property: "health", label: "player_hp" }
func _debug_watch_property(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "property");  if r2[1]: return r2[1]
	var node_path: String = r1[0]
	var property: String = r2[0]
	var label: String = _optional_string(params, "label", "%s.%s" % [node_path.get_file(), property])

	# Kiểm tra trùng
	for w: Dictionary in _watched:
		if w["node_path"] == node_path and w["property"] == property:
			return _ok({"label": label, "status": "already_watching"})

	_watched.append({"node_path": node_path, "property": property, "label": label})
	return _ok({"label": label, "status": "added", "watch_count": _watched.size()})


## Xóa một property khỏi danh sách watch.
## params: { node_path: "...", property: "..." } hoặc { label: "..." }
func _debug_unwatch_property(params: Dictionary) -> Dictionary:
	var label_filter := _optional_string(params, "label")
	var node_path_filter := _optional_string(params, "node_path")
	var prop_filter := _optional_string(params, "property")
	var before := _watched.size()
	if not label_filter.is_empty():
		_watched = _watched.filter(func(w: Dictionary) -> bool: return w["label"] != label_filter)
	elif not node_path_filter.is_empty() and not prop_filter.is_empty():
		_watched = _watched.filter(
			func(w: Dictionary) -> bool:
				return not (w["node_path"] == node_path_filter and w["property"] == prop_filter)
		)
	else:
		return _err_params("Cần label hoặc cặp node_path + property")
	return _ok({"removed": before - _watched.size(), "watch_count": _watched.size()})


## Fetch giá trị hiện tại của tất cả watched properties từ game runtime.
## params: {} hoặc { timeout: 5.0 }
func _debug_get_watched(params: Dictionary) -> Dictionary:
	if _watched.is_empty():
		return _ok({"values": [], "note": "Chưa có property nào được watch. Dùng debug_watch_property trước."})

	if not _ei().is_playing_scene():
		return _err(-32000, "Game không đang chạy — không thể fetch watched properties")

	var timeout := float(_optional_int(params, "timeout", 5))
	var requests: Array = []
	for w: Dictionary in _watched:
		requests.append({"node_path": w["node_path"], "property": w["property"]})

	var response := await _send_game_command("get_properties_batch", {"requests": requests}, timeout)
	if response.has("error"):
		return response

	var values_raw: Array = response.get("result", {}).get("values", [])
	var result: Array = []
	for i in mini(values_raw.size(), _watched.size()):
		var w: Dictionary = _watched[i]
		var v: Dictionary = values_raw[i] if i < values_raw.size() else {}
		result.append({
			"label":     w["label"],
			"node_path": w["node_path"],
			"property":  w["property"],
			"value":     v.get("value"),
			"error":     v.get("error", ""),
		})

	return _ok({"values": result, "timestamp_msec": Time.get_ticks_msec()})


## Xóa toàn bộ watched properties
func _debug_clear_watched(_params: Dictionary) -> Dictionary:
	var count := _watched.size()
	_watched.clear()
	return _ok({"cleared": count})


# ══════════════════════════════════════════════════════════════════════════════
# STACK TRACE
# ══════════════════════════════════════════════════════════════════════════════

## Lấy call stack từ game runtime khi đang break hoặc đang chạy.
## get_stack() trả về empty array trong release builds trừ khi
## ProjectSettings "debug/settings/gdscript/always_track_call_stacks" = true.
## params: { timeout: 5.0 }
func _debug_get_stack_trace(params: Dictionary) -> Dictionary:
	if not _ei().is_playing_scene():
		return _err(-32000, "Game không đang chạy")

	# Khi game đang break tại breakpoint — dùng file IPC
	# Editor gửi "mcp:get_stack" → runtime nhận trong debug loop → ghi user://mcp_stack_dump.json
	if _session_breaked:
		var session := _get_active_session()
		if session == null:
			return _err(-32000, "Không có active debug session")
		# Xóa file cũ trước
		if FileAccess.file_exists(OS.get_user_data_dir() + "/mcp_stack_dump.json"):
			DirAccess.remove_absolute(OS.get_user_data_dir() + "/mcp_stack_dump.json")
		# Gửi message tới runtime qua debugger session (true = include variables)
		var include_vars: bool = params.get("include_variables", false)
		session.send_message("mcp:get_stack", [include_vars])
		# Đợi file xuất hiện (tối đa 3 giây)
		var stack_path := OS.get_user_data_dir() + "/mcp_stack_dump.json"
		var timeout := float(_optional_int(params, "timeout", 3))
		var elapsed := 0.0
		while not FileAccess.file_exists(stack_path) and elapsed < timeout:
			await get_tree().process_frame
			elapsed += get_process_delta_time()
		if not FileAccess.file_exists(stack_path):
			return _err(-32000, "Timeout: runtime không ghi stack dump (EngineDebugger capture không chạy khi break)")
		var f := FileAccess.open(stack_path, FileAccess.READ)
		if f == null:
			return _err(-32000, "Không đọc được file stack dump")
		var data := JSON.parse_string(f.get_as_text())
		f.close()
		if not data is Dictionary:
			return _err(-32000, "Stack dump file bị lỗi format")
		return _ok(data)

	# Game đang chạy bình thường — dùng runtime IPC port
	var timeout2 := float(_optional_int(params, "timeout", 5))
	var response := await _send_game_command("get_stack_trace", {}, timeout2)
	if response.has("error"):
		return _err(-32000, "Runtime không hỗ trợ get_stack_trace. Đảm bảo GPRuntime đã được enable và game đang chạy.")
	var stack: Array = response.get("result", {}).get("stack", [])
	return _ok({"stack": stack, "frame_count": stack.size()})
