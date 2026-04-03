@tool
extends EditorPlugin

## Godot Pilot v2.0 — Entry point
## Khởi tạo WebSocket server, command router, và status panel tích hợp (không cần .tscn)

const _AUTOLOAD_RUNTIME := "res://addons/godot-mcp/pilot_runtime.gd"

const _MCP_AUTOLOADS: Array[Array] = [
	["autoload/GPRuntime", _AUTOLOAD_RUNTIME],
]

var _server: Node       # MCPServer (pilot_server.gd)
var _panel: Control     # Status panel (built in code)
var game_ipc: Node      # GameIpcServer (game_ipc_server.gd)

# ── Lifecycle ──────────────────────────────────────────────────────────────────

func _enter_tree() -> void:
	_server = preload("res://addons/godot-mcp/pilot_server.gd").new()
	_server.name = "MCPServer"
	_server.editor_plugin = self
	add_child(_server)

	game_ipc = preload("res://addons/godot-mcp/game_ipc_server.gd").new()
	game_ipc.name = "GameIpcServer"
	add_child(game_ipc)

	_panel = _build_status_panel()
	add_control_to_bottom_panel(_panel, "Godot-MCP")

	_inject_autoloads()
	_apply_saved_config_to_server()
	_connect_panel_signals()
	_server.start()
	print("[MCP DBG] _enter_tree done, ws_url=%s api_key_set=%s" % [_server.ws_url, not _server.api_key.is_empty()])
	print("[GodotMcp] Godot MCP v2.0 started")


func _exit_tree() -> void:
	_remove_autoloads()

	if game_ipc:
		game_ipc.stop()
		game_ipc.queue_free()

	if _server:
		_server.stop()
		_server.queue_free()

	if _panel:
		remove_control_from_bottom_panel(_panel)
		_panel.queue_free()

	print("[GodotMcp] Godot MCP stopped")


# ── Debugger auto-continue ─────────────────────────────────────────────────────

func _try_debugger_continue() -> void:
	var btn := _find_debugger_continue_btn(EditorInterface.get_base_control())
	if btn and btn.visible and not btn.disabled:
		btn.emit_signal("pressed")
		# push_warning("[GodotMcp] Auto-pressed debugger Continue button")


func _find_debugger_continue_btn(node: Node) -> Button:
	if node is Button:
		var b: Button = node
		if b.tooltip_text.contains("Continue") or b.text == "Continue":
			return b
	for child in node.get_children():
		var found := _find_debugger_continue_btn(child)
		if found:
			return found
	return null


# ── Autoloads ──────────────────────────────────────────────────────────────────

func _inject_autoloads() -> void:
	var changed := false
	for entry: Array in _MCP_AUTOLOADS:
		var key: String = entry[0]
		var script: String = entry[1]
		if not ProjectSettings.has_setting(key):
			ProjectSettings.set_setting(key, "*" + script)
			changed = true
	if changed:
		ProjectSettings.save()


func _remove_autoloads() -> void:
	var changed := false
	for entry: Array in _MCP_AUTOLOADS:
		var key: String = entry[0]
		if ProjectSettings.has_setting(key):
			ProjectSettings.set_setting(key, null)
			changed = true
	if changed:
		ProjectSettings.save()


# ── Status panel (built in code — không cần .tscn) ────────────────────────────

var _lbl_status: Label
var _lbl_log: RichTextLabel
var _edit_url: LineEdit
var _edit_key: LineEdit
var _edit_editor_id: LineEdit
var _lbl_ipc_status: Label
var _lbl_ipc_port: Label
var _btn_eye: Button
var _lbl_token_status: Label
var _btn_validate: Button
var _section_account: VBoxContainer
var _lbl_email: Label
var _lbl_tier: Label
var _lbl_expires: Label
var _lbl_quota: Label

func _build_status_panel() -> Control:
	var root := HSplitContainer.new()
	root.name = "Godot-Pilot"
	root.set_custom_minimum_size(Vector2(0, 120))

	# ══════════════════════════════════════════════════════════════════════════
	# LEFT SIDE — Config
	# ══════════════════════════════════════════════════════════════════════════
	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.add_child(left)

	# ── Auth section ──────────────────────────────────────────────────────────
	var token_row := HBoxContainer.new()
	left.add_child(token_row)

	token_row.add_child(_make_label("Access Token:"))
	_edit_key = LineEdit.new()
	_edit_key.secret = true
	_edit_key.placeholder_text = "paste token here"
	_edit_key.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	token_row.add_child(_edit_key)

	_btn_eye = Button.new()
	_btn_eye.text = "●"
	_btn_eye.pressed.connect(_on_toggle_secret)
	token_row.add_child(_btn_eye)

	#_btn_validate = Button.new()
	#_btn_validate.text = "Validate & Save"
	#_btn_validate.pressed.connect(_on_validate_token)
	#token_row.add_child(_btn_validate)

	_lbl_token_status = Label.new()
	_lbl_token_status.text = ""
	token_row.add_child(_lbl_token_status)

	# ── Connection section ────────────────────────────────────────────────────
	var sep := HSeparator.new()
	left.add_child(sep)

	#var url_row := HBoxContainer.new()
	#left.add_child(url_row)

	#url_row.add_child(_make_label("WS URL:"))
	_edit_url = LineEdit.new()
	#_edit_url.placeholder_text = "ws://127.0.0.1:6509"
	#_edit_url.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	#url_row.add_child(_edit_url)

	var editor_row := HBoxContainer.new()
	left.add_child(editor_row)

	editor_row.add_child(_make_label("Editor ID:"))
	_edit_editor_id = LineEdit.new()
	_edit_editor_id.placeholder_text = "(auto)"
	_edit_editor_id.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	editor_row.add_child(_edit_editor_id)

	var btn_row := HBoxContainer.new()
	left.add_child(btn_row)

	var btn_save := Button.new()
	btn_save.text = "Save & Reconnect"
	btn_save.pressed.connect(_on_save_reconnect)
	btn_row.add_child(btn_save)

	_lbl_status = Label.new()
	_lbl_status.text = "  ● Disconnected"
	btn_row.add_child(_lbl_status)

	# ── Account Info section (hidden until validated) ─────────────────────────
	_section_account = VBoxContainer.new()
	_section_account.visible = false
	left.add_child(_section_account)

	_lbl_email   = Label.new(); _section_account.add_child(_lbl_email)
	_lbl_tier    = Label.new(); _section_account.add_child(_lbl_tier)
	_lbl_expires = Label.new(); _section_account.add_child(_lbl_expires)
	_lbl_quota   = Label.new(); _section_account.add_child(_lbl_quota)

	# ══════════════════════════════════════════════════════════════════════════
	# RIGHT SIDE — Game IPC & Log
	# ══════════════════════════════════════════════════════════════════════════
	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.add_child(right)

	# ── Game IPC row ──────────────────────────────────────────────────────────
	var ipc_row := HBoxContainer.new()
	right.add_child(ipc_row)

	ipc_row.add_child(_make_label("Game IPC:"))
	_lbl_ipc_status = Label.new()
	_lbl_ipc_status.text = "  ● No game connected"
	ipc_row.add_child(_lbl_ipc_status)

	_lbl_ipc_port = Label.new()
	_lbl_ipc_port.text = ""
	ipc_row.add_child(_lbl_ipc_port)

	# ── Log ───────────────────────────────────────────────────────────────────
	_lbl_log = RichTextLabel.new()
	_lbl_log.bbcode_enabled = true
	_lbl_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_lbl_log.custom_minimum_size.y = 60
	right.add_child(_lbl_log)

	_load_panel_config()

	return root


func _make_label(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	return lbl


func _on_toggle_secret() -> void:
	_edit_key.secret = !_edit_key.secret
	_btn_eye.text = "○" if not _edit_key.secret else "●"


func _on_validate_token() -> void:
	if not _server.is_connected_to_server():
		if _server._peer != null:
			_lbl_token_status.text = "Connecting, please wait…"
		else:
			_lbl_token_status.text = "Not connected"
		return
	_lbl_token_status.text = "Validating…"
	_server.send_validate_token()


func _on_token_info_received(info: Dictionary) -> void:
	var status: String = info.get("status", "")
	_panel_log("Token: %s" % status)
	_lbl_token_status.remove_theme_color_override("font_color")

	match status:
		"valid":
			_lbl_token_status.text = "✓ Valid"
			_lbl_token_status.add_theme_color_override("font_color", Color.GREEN)
			_lbl_email.text   = "Email: %s" % info.get("email", "—")
			_lbl_tier.text    = "Tier: %s" % info.get("tier", "—")
			var exp_raw: String = str(info.get("expires_at", ""))
			_lbl_expires.text = "Expires: %s" % (exp_raw.left(10) if not exp_raw.is_empty() else "—")
			_lbl_quota.text   = "Quota: %s / %s" % [info.get("quota_remaining", "—"), info.get("quota_total", "—")]
			_section_account.visible = true
		"expired":
			_lbl_token_status.text = "✗ Token expired"
			_lbl_token_status.add_theme_color_override("font_color", Color.ORANGE)
			_section_account.visible = false
		"invalid":
			_lbl_token_status.text = "✗ Token invalid"
			_lbl_token_status.add_theme_color_override("font_color", Color.RED)
			_section_account.visible = false
		"no_token":
			_lbl_token_status.text = "No token saved"
			_section_account.visible = false
		_:
			_lbl_token_status.text = "Service unreachable"
			_section_account.visible = false


func _connect_panel_signals() -> void:
	if not _server:
		return
	_server.connected.connect(_on_ws_connected)
	_server.disconnected.connect(_on_ws_disconnected)
	_server.command_executed.connect(_on_command_executed)
	_server.token_info_received.connect(_on_token_info_received)

	if game_ipc:
		game_ipc.game_connected.connect(_on_game_connected)
		game_ipc.game_disconnected.connect(_on_game_disconnected)
		# Hiển thị port đang listen
		if game_ipc._listen_port > 0:
			_lbl_ipc_port.text = "    tcp://127.0.0.1:%d" % game_ipc._listen_port


func _on_ws_connected() -> void:
	_lbl_status.text = "  ● Connected"
	_lbl_status.add_theme_color_override("font_color", Color.GREEN)
	_panel_log("[color=green]Connected[/color]")


func _on_ws_disconnected() -> void:
	_lbl_status.text = "  ● Disconnected"
	_lbl_status.remove_theme_color_override("font_color")
	_panel_log("[color=red]Disconnected[/color]")


func _on_game_connected() -> void:
	_lbl_ipc_status.text = "  ● Game connected"
	_lbl_ipc_status.add_theme_color_override("font_color", Color.GREEN)
	_panel_log("[color=green]Game runtime connected[/color]")


func _on_game_disconnected() -> void:
	_lbl_ipc_status.text = "  ● No game connected"
	_lbl_ipc_status.remove_theme_color_override("font_color")
	_panel_log("[color=red]Game runtime disconnected[/color]")


func _on_command_executed(method: String, success: bool) -> void:
	if success:
		_panel_log("[color=green]OK[/color] %s" % method)
	else:
		_panel_log("[color=red]ERR[/color] %s" % method)


func _panel_log(msg: String) -> void:
	if not _lbl_log:
		return
	var time := Time.get_time_string_from_system()
	_lbl_log.append_text("[%s] %s\n" % [time, msg])
	# Giữ tối đa 100 dòng
	var text := _lbl_log.get_parsed_text()
	var lines := text.split("\n")
	if lines.size() > 100:
		_lbl_log.clear()
		_lbl_log.append_text("\n".join(lines.slice(lines.size() - 100)))


func _on_save_reconnect() -> void:
	_save_panel_config()
	if _server:
		_server.ws_url = "ws://127.0.0.1:6509"
		_server.api_key = _edit_key.text
		_server.editor_id = _edit_editor_id.text
		_server.stop()
		_server.start()


func _apply_saved_config_to_server() -> void:
	var cfg := ConfigFile.new()
	if cfg.load("user://mcp_connection_config.cfg") != OK:
		return
	var ws_url: String = cfg.get_value("connection", "ws_url", "")
	_server.ws_url = ws_url if not ws_url.is_empty() else "ws://127.0.0.1:6509"
	_server.api_key = cfg.get_value("connection", "api_key", "")
	_server.editor_id = cfg.get_value("connection", "editor_id", "")


func _save_panel_config() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("connection", "ws_url", _edit_url.text)
	cfg.set_value("connection", "api_key", _edit_key.text)
	cfg.set_value("connection", "editor_id", _edit_editor_id.text)
	cfg.save("user://mcp_connection_config.cfg")


func _load_panel_config() -> void:
	var cfg := ConfigFile.new()
	if cfg.load("user://mcp_connection_config.cfg") != OK:
		return
	_edit_url.text = cfg.get_value("connection", "ws_url", "")
	_edit_key.text = cfg.get_value("connection", "api_key", "")
	_edit_editor_id.text = cfg.get_value("connection", "editor_id", "")
