## GameIpcServer — TCP server trong editor plugin để giao tiếp với game runtime.
## Game runtime (pilot_runtime.gd) connect tới đây khi khởi động.
## Editor gửi command qua TCP, runtime trả response qua TCP.
extends Node

const PORT_RANGE_START := 6507
const PORT_RANGE_COUNT := 10
const PORT_FILE := "user://mcp_ipc_port"

signal game_connected
signal game_disconnected
signal _response_received(req_id: String, data: Dictionary)

var _tcp_server: TCPServer
var _peers: Dictionary = {}  # peer_id -> {tcp: StreamPeerTCP, packet: PacketPeerStream}
var _pending_requests: Dictionary = {}  # request_id -> peer_id
var _last_response: Dictionary = {}  # request_id -> response data (for blocking poll)
var _next_peer_id: int = 0
var _listen_port: int = -1


func _ready() -> void:
	_tcp_server = TCPServer.new()
	for i in PORT_RANGE_COUNT:
		var port := PORT_RANGE_START + i
		if _tcp_server.listen(port, "127.0.0.1") == OK:
			_listen_port = port
			break
	if _listen_port < 0:
		push_error("[MCP IPC] Failed to listen on ports %d–%d" % [PORT_RANGE_START, PORT_RANGE_START + PORT_RANGE_COUNT - 1])
		return
	var f := FileAccess.open(PORT_FILE, FileAccess.WRITE)
	if f:
		f.store_string(str(_listen_port))
		f.close()
	print("[MCP IPC] Game IPC server listening on 127.0.0.1:%d" % _listen_port)


func _exit_tree() -> void:
	stop()


func stop() -> void:
	for peer_id: int in _peers.keys():
		_remove_peer(peer_id)
	if _tcp_server:
		_tcp_server.stop()
	if FileAccess.file_exists(PORT_FILE):
		DirAccess.remove_absolute(PORT_FILE)


func _process(_delta: float) -> void:
	_poll_peers()


func _poll_peers() -> void:
	if _tcp_server == null or not _tcp_server.is_listening():
		return

	# Accept new connections
	while _tcp_server.is_connection_available():
		var tcp := _tcp_server.take_connection()
		if tcp == null:
			continue
		var peer_id := _next_peer_id
		_next_peer_id += 1
		var packet := PacketPeerStream.new()
		packet.input_buffer_max_size = 16 * 1024 * 1024  # 16MB cho screenshot response
		packet.output_buffer_max_size = 1024 * 1024  # 1MB output
		packet.stream_peer = tcp
		_peers[peer_id] = {"tcp": tcp, "packet": packet}
		print("[MCP IPC] Game runtime connected (peer %d)" % peer_id)
		game_connected.emit()

	# Poll existing connections
	var dead_peers: Array[int] = []
	for peer_id: int in _peers:
		var peer: Dictionary = _peers[peer_id]
		var tcp: StreamPeerTCP = peer["tcp"]
		var packet: PacketPeerStream = peer["packet"]

		tcp.poll()
		var status := tcp.get_status()
		if status == StreamPeerTCP.STATUS_NONE or status == StreamPeerTCP.STATUS_ERROR:
			dead_peers.append(peer_id)
			continue

		if status != StreamPeerTCP.STATUS_CONNECTED:
			continue

		while packet.get_available_packet_count() > 0:
			var raw := packet.get_packet()
			if raw.is_empty():
				continue
			var json: Variant = JSON.parse_string(raw.get_string_from_utf8())
			if json is Dictionary:
				_handle_response(peer_id, json as Dictionary)

	for peer_id: int in dead_peers:
		_remove_peer(peer_id)


func _remove_peer(peer_id: int) -> void:
	if not _peers.has(peer_id):
		return
	_peers.erase(peer_id)
	var to_remove: Array[String] = []
	for req_id: String in _pending_requests:
		if _pending_requests[req_id] == peer_id:
			to_remove.append(req_id)
	for req_id: String in to_remove:
		_pending_requests.erase(req_id)
		_response_received.emit(req_id, {"error": "Game runtime disconnected"})
	print("[MCP IPC] Game runtime disconnected (peer %d)" % peer_id)
	game_disconnected.emit()


func _handle_response(_peer_id: int, msg: Dictionary) -> void:
	var req_id: String = msg.get("id", "")
	print("[MCP IPC] <<< response req=%s known=%s" % [req_id, str(_pending_requests.has(req_id))])
	if req_id.is_empty() or not _pending_requests.has(req_id):
		return
	var data := msg.get("data", {})
	print("[MCP IPC] <<< storing + emitting response for req=%s" % req_id)
	_last_response[req_id] = data
	_pending_requests.erase(req_id)
	_response_received.emit(req_id, data)


func has_game_connection() -> bool:
	for peer_id: int in _peers:
		var tcp: StreamPeerTCP = _peers[peer_id]["tcp"]
		if tcp.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			return true
	return false


func _get_first_peer() -> Dictionary:
	for peer_id: int in _peers:
		var tcp: StreamPeerTCP = _peers[peer_id]["tcp"]
		if tcp.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			return {"peer_id": peer_id, "packet": _peers[peer_id]["packet"]}
	return {}


func _generate_id() -> String:
	return "%08x%08x" % [randi(), Time.get_ticks_msec()]


## Gửi command tới game runtime, await response. Nếu cancel_flag[0] = true thì thoát sớm.
func send_game_command_cancellable(command: String, params: Dictionary, cancel_flag: Array, timeout_sec: float = 10.0) -> Dictionary:
	var peer := _get_first_peer()
	if peer.is_empty():
		return {"error": "No game runtime connected"}

	var req_id := _generate_id()
	var msg := {"id": req_id, "type": "request", "channel": "command", "command": command, "params": params}
	var packet: PacketPeerStream = peer["packet"]
	print("[MCP IPC] >>> sending '%s' req=%s" % [command, req_id])
	var send_err := packet.put_packet(JSON.stringify(msg).to_utf8_buffer())
	if send_err != OK:
		print("[MCP IPC] >>> put_packet FAILED: %s" % error_string(send_err))
		return {"error": "Failed to send command: %s" % error_string(send_err)}
	print("[MCP IPC] >>> put_packet OK")

	_pending_requests[req_id] = peer["peer_id"]
	if _last_response == null:
		_last_response = {}

	# Blocking poll — await không work trong @tool editor script
	# Dùng OS.delay_msec + manual TCP poll để chờ response
	var deadline := Time.get_ticks_msec() + int(timeout_sec * 1000)
	while _pending_requests.has(req_id) and not cancel_flag[0]:
		if Time.get_ticks_msec() > deadline:
			_pending_requests.erase(req_id)
			return {"error": "Game command timeout after %.1fs" % timeout_sec}
		_poll_peers()
		OS.delay_msec(10)

	if cancel_flag[0]:
		_pending_requests.erase(req_id)
		return {"error": "cancelled"}
	var result := _last_response.get(req_id, {})
	var result_size: int = JSON.stringify(result).length()
	print("[MCP IPC] blocking poll done, result keys=%s size=%d bytes" % [str(result.keys()), result_size])
	_last_response.erase(req_id)
	return result


## Gửi command tới game runtime, await response.
func send_game_command(command: String, params: Dictionary, timeout_sec: float = 10.0) -> Dictionary:
	var peer := _get_first_peer()
	if peer.is_empty():
		return {"error": "No game runtime connected"}

	var req_id := _generate_id()
	var msg := {"id": req_id, "type": "request", "channel": "command", "command": command, "params": params}
	var packet: PacketPeerStream = peer["packet"]
	var send_err := packet.put_packet(JSON.stringify(msg).to_utf8_buffer())
	if send_err != OK:
		return {"error": "Failed to send command: %s" % error_string(send_err)}

	_pending_requests[req_id] = peer["peer_id"]

	var timed_out := false
	var response_data: Dictionary = {}
	var timer := get_tree().create_timer(timeout_sec)
	timer.timeout.connect(func() -> void: timed_out = true)

	while _pending_requests.has(req_id) and not timed_out:
		var sig_result: Array = await _response_received
		var got_id: String = sig_result[0]
		var got_data: Dictionary = sig_result[1]
		if got_id == req_id:
			response_data = got_data
			break

	if timed_out or _pending_requests.has(req_id):
		_pending_requests.erase(req_id)
		return {"error": "Game command timeout after %.1fs" % timeout_sec}
	return response_data


## Gửi screenshot request, await base64 image response.
func send_screenshot(timeout_sec: float = 5.0) -> Dictionary:
	var peer := _get_first_peer()
	if peer.is_empty():
		return {"error": "No game runtime connected"}

	var req_id := _generate_id()
	var msg := {"id": req_id, "type": "request", "channel": "screenshot"}
	var packet: PacketPeerStream = peer["packet"]
	var send_err := packet.put_packet(JSON.stringify(msg).to_utf8_buffer())
	if send_err != OK:
		return {"error": "Failed to send screenshot request: %s" % error_string(send_err)}

	_pending_requests[req_id] = peer["peer_id"]

	var timed_out := false
	var response_data: Dictionary = {}
	var timer := get_tree().create_timer(timeout_sec)
	timer.timeout.connect(func() -> void: timed_out = true)

	while _pending_requests.has(req_id) and not timed_out:
		var sig_result: Array = await _response_received
		var got_id: String = sig_result[0]
		var got_data: Dictionary = sig_result[1]
		if got_id == req_id:
			response_data = got_data
			break

	if timed_out or _pending_requests.has(req_id):
		_pending_requests.erase(req_id)
		return {"error": "Screenshot timed out"}
	return response_data


## Gửi input events tới game runtime (fire-and-forget, không cần response).
func send_input(json: String) -> void:
	var peer := _get_first_peer()
	if peer.is_empty():
		return
	var req_id := _generate_id()
	var msg := {"id": req_id, "type": "request", "channel": "input", "data": json}
	var packet: PacketPeerStream = peer["packet"]
	packet.put_packet(JSON.stringify(msg).to_utf8_buffer())
