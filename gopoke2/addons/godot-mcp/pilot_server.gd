@tool
class_name GPServer
extends Node

## GPServer — WebSocket client + JSON-RPC dispatcher + Command router
## Kết nối tới MCP server Node.js trên ws://127.0.0.1:6506

signal connected()
signal disconnected()
signal command_executed(method: String, success: bool)
signal token_info_received(info: Dictionary)

var editor_plugin: EditorPlugin
var ws_url: String = "ws://127.0.0.1:6509"
var api_key: String = ""
var editor_id: String = ""

const RECONNECT_INTERVAL := 3.0
const CONNECTING_TIMEOUT := 5.0
const PING_INTERVAL := 10.0
const BUFFER_SIZE := 16 * 1024 * 1024  # 16MB

var _peer: WebSocketPeer = null
var _connected: bool = false
var _running: bool = false
var _reconnect_timer: float = 0.0
var _connecting_timer: float = 0.0
var _ping_timer: float = 0.0

# Command handlers: method_name -> Callable
var _handlers: Dictionary = {}

# MCP command recording
var _mcp_recording: bool = false
var _mcp_record_events: Array = []
var _mcp_record_start_msec: int = 0
# Commands không record (meta commands)
const _SKIP_RECORD := ["game_start_mcp_recording", "game_stop_mcp_recording", "game_replay_mcp_recording"]


func _ready() -> void:
	_register_commands()


# ── Public API ─────────────────────────────────────────────────────────────────

func start() -> void:
	_running = true
	_try_connect()


func stop() -> void:
	_running = false
	if _peer:
		_peer.close(1000, "Plugin shutting down")
		_peer = null
	_connected = false


func is_connected_to_server() -> bool:
	return _connected


# ── Command registration ───────────────────────────────────────────────────────

func _register_commands() -> void:
	var instances: Array[Node] = [
		GPCoreCommands.new(),
		GPEditorCommands.new(),
		GPMediaCommands.new(),
		GPWorldCommands.new(),
		GPAssetCommands.new(),
		GPDebugCommands.new(),
	]

	for cmd: Node in instances:
		cmd.editor_plugin = editor_plugin
		add_child(cmd)
		var methods: Dictionary = cmd.get_commands()
		for method_name: String in methods:
			_handlers[method_name] = methods[method_name]

	# print("[GodotPilot] Registered %d commands" % _handlers.size())


# ── WebSocket loop ─────────────────────────────────────────────────────────────

func _try_connect() -> void:
	var ws := WebSocketPeer.new()
	ws.outbound_buffer_size = BUFFER_SIZE
	ws.inbound_buffer_size = BUFFER_SIZE
	var url := ws_url if not ws_url.is_empty() else "ws://127.0.0.1:6509"
	var err := ws.connect_to_url(url)
	print("[MCP DBG] _try_connect url=%s err=%s" % [url, error_string(err)])
	if err == OK:
		_peer = ws
		_connecting_timer = 0.0
	else:
		_peer = null


func _process(delta: float) -> void:
	if not _running:
		return

	if _peer == null:
		_reconnect_timer += delta
		if _reconnect_timer >= RECONNECT_INTERVAL:
			_reconnect_timer = 0.0
			_try_connect()
		return

	_peer.poll()
	var state := _peer.get_ready_state()

	match state:
		WebSocketPeer.STATE_OPEN:
			if not _connected:
				_connected = true
				_reconnect_timer = 0.0
				_connecting_timer = 0.0
				_send_register()
				# print("[GodotPilot] Connected to %s" % ws_url)
				connected.emit()

			_ping_timer += delta
			if _ping_timer >= PING_INTERVAL:
				_ping_timer = 0.0
				_peer.send_text(JSON.stringify({"jsonrpc": "2.0", "method": "ping", "params": {}}))

			while _peer.get_available_packet_count() > 0:
				var text := _peer.get_packet().get_string_from_utf8()
				_dispatch(text)

		WebSocketPeer.STATE_CLOSING:
			pass

		WebSocketPeer.STATE_CLOSED:
			print("[MCP DBG] STATE_CLOSED connected=%s" % _connected)
			if _connected:
				_connected = false
				# print("[GodotPilot] Disconnected from %s" % ws_url)
				disconnected.emit()
			_peer = null
			_reconnect_timer = 0.0

		WebSocketPeer.STATE_CONNECTING:
			_connecting_timer += delta
			if _connecting_timer >= CONNECTING_TIMEOUT:
				print("[MCP DBG] STATE_CONNECTING timeout after %.1fs" % CONNECTING_TIMEOUT)
				_peer.close(1000, "Connection timeout")
				_peer = null
				_reconnect_timer = 0.0
				_connecting_timer = 0.0


# ── Registration ───────────────────────────────────────────────────────────────

func _send_register() -> void:
	var project_name: String = ProjectSettings.get_setting("application/config/name", "unknown")
	var _editor_id := editor_id if not editor_id.is_empty() else project_name.to_lower().replace(" ", "-")
	var params := {"editor_id": _editor_id, "project_name": project_name}
	if not api_key.is_empty():
		params["api_key"] = api_key
	_send_raw(JSON.stringify({"jsonrpc": "2.0", "method": "register", "params": params}))
	# print("[GodotPilot] Registering as '%s'" % _editor_id)


# ── Message dispatch ───────────────────────────────────────────────────────────

func _dispatch(text: String) -> void:
	var json := JSON.new()
	if json.parse(text) != OK:
		_respond(null, null, {"code": -32700, "message": "Parse error"})
		return

	var msg: Variant = json.data
	if not msg is Dictionary:
		_respond(null, null, {"code": -32600, "message": "Invalid request"})
		return

	var d: Dictionary = msg
	var method: String = d.get("method", "")

	match method:
		"ping":
			_send_raw(JSON.stringify({"jsonrpc": "2.0", "method": "pong", "params": {}}))
			return
		"pong":
			return
		"register_ack":
			# print("[GodotPilot] Registration confirmed")
			return
		"token_info":
			token_info_received.emit(d.get("params", {}))
			return

	var id: Variant = d.get("id")
	if method.is_empty():
		_respond(id, null, {"code": -32600, "message": "Missing method"})
		return

	_execute_command.call_deferred(id, method, d.get("params", {}))


func _execute_command(id: Variant, method: String, params: Dictionary) -> void:
	# Meta: MCP-level recording
	if method == "game_start_mcp_recording":
		_mcp_recording = true
		_mcp_record_events.clear()
		_mcp_record_start_msec = Time.get_ticks_msec()
		_respond(id, {"recording": true, "message": "MCP command recording started"}, null)
		return
	if method == "game_stop_mcp_recording":
		_mcp_recording = false
		var dur := Time.get_ticks_msec() - _mcp_record_start_msec
		_respond(id, {"recording": false, "events": _mcp_record_events.duplicate(), "event_count": _mcp_record_events.size(), "duration_ms": dur}, null)
		return
	if method == "game_replay_mcp_recording":
		var events: Array = params.get("events", [])
		var speed: float = params.get("speed", 1.0)
		var start := Time.get_ticks_msec()
		for ev: Dictionary in events:
			var delay := int(ev.get("time_ms", 0) / speed)
			while Time.get_ticks_msec() - start < delay:
				await get_tree().process_frame
			if _handlers.has(ev.get("command", "")):
				await _handlers[ev["command"]].call(ev.get("params", {}))
		_respond(id, {"replayed": true, "event_count": events.size(), "speed": speed}, null)
		return

	if not _handlers.has(method):
		_respond(id, null, {
			"code": -32601,
			"message": "Method not found: %s" % method,
			"data": {"available_methods": _handlers.keys()},
		})
		return

	# Record command nếu đang recording
	if _mcp_recording and method not in _SKIP_RECORD:
		_mcp_record_events.append({
			"time_ms": Time.get_ticks_msec() - _mcp_record_start_msec,
			"command": method,
			"params":  params,
		})

	var result: Dictionary = await _handlers[method].call(params)
	if result.has("error"):
		_respond(id, null, result["error"])
		command_executed.emit(method, false)
	else:
		_respond(id, result.get("result", {}), null)
		command_executed.emit(method, true)


func _respond(id: Variant, result: Variant, err: Variant) -> void:
	var response: Dictionary = {"jsonrpc": "2.0", "id": id}
	if err != null:
		response["error"] = err
	else:
		response["result"] = result if result != null else {}
	_send_raw(JSON.stringify(response))


func _send_raw(text: String) -> void:
	if _peer and _connected:
		_peer.send_text(text)


func send_validate_token() -> void:
	_send_raw(JSON.stringify({"jsonrpc": "2.0", "method": "validate_token", "params": {}}))
