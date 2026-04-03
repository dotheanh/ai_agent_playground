@tool
class_name GPMediaCommands
extends Node

## MediaCommands — Animation + Audio + Viewport/Selection + Physics + Scene3D + Theme + Shader + Tilemap + Particle
## Gộp tất cả media/visual commands vào một file

var editor_plugin: EditorPlugin


func get_commands() -> Dictionary:
	return {
		# Animation
		"anim_list": _list_animations,
		"anim_create": _create_animation,
		"anim_add_track": _add_animation_track,
		"anim_set_keyframe": _set_animation_keyframe,
		"anim_get_info": _get_animation_info,
		"anim_remove": _remove_animation,
		# Audio
		"audio_get_bus_layout": _get_audio_bus_layout,
		"audio_add_bus": _add_audio_bus,
		"audio_set_bus": _set_audio_bus,
		"audio_add_bus_effect": _add_audio_bus_effect,
		"audio_add_player": _add_audio_player,
		"audio_get_info": _get_audio_info,
		# Viewport / Selection
		"node_get_selected": _get_selected_nodes,
		"node_select": _select_node,
		"node_select_multiple": _select_nodes,
		"node_clear_selection": _clear_selection,
		"node_focus": _focus_node_in_viewport,
		"editor_list_plugins": _list_plugins,
		"editor_set_plugin_enabled": _set_plugin_enabled,
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
	if params.has(key) and params[key] is String: return params[key] as String
	return default

func _optional_bool(params: Dictionary, key: String, default: bool = false) -> bool:
	if params.has(key) and params[key] is bool: return params[key] as bool
	return default

func _optional_int(params: Dictionary, key: String, default: int = 0) -> int:
	if params.has(key): return int(params[key])
	return default

func _edited_root() -> Node: return _ei().get_edited_scene_root()

func _find_node_by_path(node_path: String) -> Node:
	var root := _edited_root()
	if root == null: return null
	if node_path == "." or node_path == root.name: return root
	if root.has_node(node_path): return root.get_node(node_path)
	if node_path.begins_with(root.name + "/"):
		var rel := node_path.substr(root.name.length() + 1)
		if root.has_node(rel): return root.get_node(rel)
	return null


# ══════════════════════════════════════════════════════════════════════════════
# ANIMATION COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_animation_player(node_path: String) -> AnimationPlayer:
	var node := _find_node_by_path(node_path)
	if node is AnimationPlayer: return node as AnimationPlayer
	return null


func _list_animations(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var player := _get_animation_player(r[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r[0])
	var animations: Array = []
	for anim_name in player.get_animation_list():
		var anim := player.get_animation(anim_name)
		animations.append({"name": anim_name, "length": anim.length, "loop_mode": anim.loop_mode, "track_count": anim.get_track_count()})
	return _ok({"path": r[0], "animations": animations, "count": animations.size()})


func _create_animation(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "name"); if r2[1]: return r2[1]
	var player := _get_animation_player(r1[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r1[0])
	var anim := Animation.new()
	anim.length = float(params.get("length", 1.0))
	anim.loop_mode = int(params.get("loop_mode", 0))
	var lib := player.get_animation_library("")
	if lib == null:
		lib = AnimationLibrary.new()
		player.add_animation_library("", lib)
	lib.add_animation(r2[0], anim)
	return _ok({"name": r2[0], "length": anim.length, "created": true})


func _add_animation_track(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "animation"); if r2[1]: return r2[1]
	var r3 := _require_string(params, "track_path"); if r3[1]: return r3[1]
	var player := _get_animation_player(r1[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r1[0])
	var anim := player.get_animation(r2[0])
	if anim == null: return _err_not_found("Animation '%s'" % r2[0])
	var track_type_str := _optional_string(params, "track_type", "value")
	var track_type: int
	match track_type_str:
		"value": track_type = Animation.TYPE_VALUE
		"position_2d", "position_3d": track_type = Animation.TYPE_POSITION_3D
		"rotation_2d", "rotation_3d": track_type = Animation.TYPE_ROTATION_3D
		"scale_2d", "scale_3d": track_type = Animation.TYPE_SCALE_3D
		"method": track_type = Animation.TYPE_METHOD
		"bezier": track_type = Animation.TYPE_BEZIER
		"blend_shape": track_type = Animation.TYPE_BLEND_SHAPE
		_: track_type = Animation.TYPE_VALUE
	var track_idx := anim.add_track(track_type)
	anim.track_set_path(track_idx, NodePath(r3[0]))
	var update_mode := _optional_string(params, "update_mode")
	if not update_mode.is_empty() and track_type == Animation.TYPE_VALUE:
		match update_mode:
			"continuous": anim.value_track_set_update_mode(track_idx, Animation.UPDATE_CONTINUOUS)
			"discrete": anim.value_track_set_update_mode(track_idx, Animation.UPDATE_DISCRETE)
			"capture": anim.value_track_set_update_mode(track_idx, Animation.UPDATE_CAPTURE)
	return _ok({"track_index": track_idx, "track_path": r3[0], "track_type": track_type_str})


func _set_animation_keyframe(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "animation"); if r2[1]: return r2[1]
	var player := _get_animation_player(r1[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r1[0])
	var anim := player.get_animation(r2[0])
	if anim == null: return _err_not_found("Animation '%s'" % r2[0])
	var track_index := int(params.get("track_index", 0))
	if track_index < 0 or track_index >= anim.get_track_count(): return _err_params("Invalid track_index: %d" % track_index)
	var time := float(params.get("time", 0.0))
	var value = params.get("value")
	if value is String:
		var expr := Expression.new()
		if expr.parse(value as String) == OK:
			var parsed = expr.execute()
			if parsed != null: value = parsed
	var key_idx := anim.track_insert_key(track_index, time, value)
	return _ok({"track_index": track_index, "time": time, "key_index": key_idx})


func _get_animation_info(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "animation"); if r2[1]: return r2[1]
	var player := _get_animation_player(r1[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r1[0])
	var anim := player.get_animation(r2[0])
	if anim == null: return _err_not_found("Animation '%s'" % r2[0])
	var tracks: Array = []
	for i in anim.get_track_count():
		var keys: Array = []
		for k in anim.track_get_key_count(i):
			keys.append({"time": anim.track_get_key_time(i, k), "value": str(anim.track_get_key_value(i, k))})
		tracks.append({"index": i, "path": str(anim.track_get_path(i)), "type": anim.track_get_type(i), "key_count": anim.track_get_key_count(i), "keys": keys})
	return _ok({"name": r2[0], "length": anim.length, "loop_mode": anim.loop_mode, "step": anim.step, "tracks": tracks})


func _remove_animation(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "name"); if r2[1]: return r2[1]
	var player := _get_animation_player(r1[0])
	if player == null: return _err_not_found("AnimationPlayer at '%s'" % r1[0])
	var lib := player.get_animation_library("")
	if lib == null or not lib.has_animation(r2[0]): return _err_not_found("Animation '%s'" % r2[0])
	lib.remove_animation(r2[0])
	return _ok({"name": r2[0], "removed": true})


# ══════════════════════════════════════════════════════════════════════════════
# AUDIO COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_audio_bus_layout(_params: Dictionary) -> Dictionary:
	var buses: Array = []
	for i in range(AudioServer.bus_count):
		var bus_data := {
			"index": i, "name": AudioServer.get_bus_name(i),
			"volume_db": AudioServer.get_bus_volume_db(i),
			"solo": AudioServer.is_bus_solo(i), "mute": AudioServer.is_bus_mute(i),
			"bypass_effects": AudioServer.is_bus_bypassing_effects(i),
			"send": AudioServer.get_bus_send(i), "effects": [],
		}
		var effects: Array = []
		for j in range(AudioServer.get_bus_effect_count(i)):
			var effect := AudioServer.get_bus_effect(i, j)
			effects.append({"index": j, "type": effect.get_class(), "enabled": AudioServer.is_bus_effect_enabled(i, j)})
		bus_data["effects"] = effects
		buses.append(bus_data)
	return _ok({"bus_count": AudioServer.bus_count, "buses": buses})


func _add_audio_bus(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "name"); if r[1]: return r[1]
	var bus_name: String = r[0]
	for i in range(AudioServer.bus_count):
		if AudioServer.get_bus_name(i) == bus_name: return _err_params("Audio bus '%s' already exists" % bus_name)
	var at_position := _optional_int(params, "at_position", -1)
	AudioServer.add_bus(at_position)
	var idx: int = AudioServer.bus_count - 1 if at_position < 0 else at_position
	AudioServer.set_bus_name(idx, bus_name)
	if params.has("volume_db"): AudioServer.set_bus_volume_db(idx, float(params["volume_db"]))
	var send := _optional_string(params, "send")
	if not send.is_empty(): AudioServer.set_bus_send(idx, send)
	if params.has("solo"): AudioServer.set_bus_solo(idx, bool(params["solo"]))
	if params.has("mute"): AudioServer.set_bus_mute(idx, bool(params["mute"]))
	return _ok({"name": bus_name, "index": idx, "bus_count": AudioServer.bus_count})


func _set_audio_bus(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "name"); if r[1]: return r[1]
	var bus_name: String = r[0]
	var idx := AudioServer.get_bus_index(bus_name)
	if idx < 0: return _err_not_found("Audio bus '%s'" % bus_name)
	var changes := 0
	if params.has("volume_db"): AudioServer.set_bus_volume_db(idx, float(params["volume_db"])); changes += 1
	if params.has("solo"): AudioServer.set_bus_solo(idx, bool(params["solo"])); changes += 1
	if params.has("mute"): AudioServer.set_bus_mute(idx, bool(params["mute"])); changes += 1
	if params.has("bypass_effects"): AudioServer.set_bus_bypass_effects(idx, bool(params["bypass_effects"])); changes += 1
	var send := _optional_string(params, "send")
	if not send.is_empty(): AudioServer.set_bus_send(idx, send); changes += 1
	if params.has("rename"):
		var new_name: String = str(params["rename"]); AudioServer.set_bus_name(idx, new_name); bus_name = new_name; changes += 1
	return _ok({"name": bus_name, "index": idx, "changes": changes})


func _add_audio_bus_effect(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "bus"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "effect_type"); if r2[1]: return r2[1]
	var bus_idx := AudioServer.get_bus_index(r1[0])
	if bus_idx < 0: return _err_not_found("Audio bus '%s'" % r1[0])
	var effect_params: Dictionary = params.get("params", {})
	var effect: AudioEffect = null
	match r2[0].to_lower():
		"reverb":
			var e := AudioEffectReverb.new()
			if effect_params.has("room_size"): e.room_size = float(effect_params["room_size"])
			if effect_params.has("damping"): e.damping = float(effect_params["damping"])
			if effect_params.has("wet"): e.wet = float(effect_params["wet"])
			if effect_params.has("dry"): e.dry = float(effect_params["dry"])
			effect = e
		"chorus":
			var e := AudioEffectChorus.new()
			if effect_params.has("voice_count"): e.voice_count = int(effect_params["voice_count"])
			if effect_params.has("wet"): e.wet = float(effect_params["wet"])
			effect = e
		"delay":
			var e := AudioEffectDelay.new()
			if effect_params.has("tap1_active"): e.tap1_active = bool(effect_params["tap1_active"])
			if effect_params.has("tap1_delay_ms"): e.tap1_delay_ms = float(effect_params["tap1_delay_ms"])
			if effect_params.has("tap2_active"): e.tap2_active = bool(effect_params["tap2_active"])
			if effect_params.has("tap2_delay_ms"): e.tap2_delay_ms = float(effect_params["tap2_delay_ms"])
			effect = e
		"compressor":
			var e := AudioEffectCompressor.new()
			if effect_params.has("threshold"): e.threshold = float(effect_params["threshold"])
			if effect_params.has("ratio"): e.ratio = float(effect_params["ratio"])
			effect = e
		"limiter":
			var e := AudioEffectLimiter.new()
			if effect_params.has("ceiling_db"): e.ceiling_db = float(effect_params["ceiling_db"])
			if effect_params.has("threshold_db"): e.threshold_db = float(effect_params["threshold_db"])
			effect = e
		"phaser":
			var e := AudioEffectPhaser.new()
			if effect_params.has("rate_hz"): e.rate_hz = float(effect_params["rate_hz"])
			if effect_params.has("depth"): e.depth = float(effect_params["depth"])
			effect = e
		"distortion":
			var e := AudioEffectDistortion.new()
			if effect_params.has("drive"): e.drive = float(effect_params["drive"])
			effect = e
		"lowpass", "lowpassfilter":
			var e := AudioEffectLowPassFilter.new()
			if effect_params.has("cutoff_hz"): e.cutoff_hz = float(effect_params["cutoff_hz"])
			effect = e
		"highpass", "highpassfilter":
			var e := AudioEffectHighPassFilter.new()
			if effect_params.has("cutoff_hz"): e.cutoff_hz = float(effect_params["cutoff_hz"])
			effect = e
		"amplify":
			var e := AudioEffectAmplify.new()
			if effect_params.has("volume_db"): e.volume_db = float(effect_params["volume_db"])
			effect = e
		_:
			return _err_params("Unknown effect type: '%s'" % r2[0])
	var at_position := _optional_int(params, "at_position", -1)
	AudioServer.add_bus_effect(bus_idx, effect, at_position)
	var effect_idx: int = AudioServer.get_bus_effect_count(bus_idx) - 1 if at_position < 0 else at_position
	return _ok({"bus": r1[0], "bus_index": bus_idx, "effect_type": effect.get_class(), "effect_index": effect_idx})


func _add_audio_player(params: Dictionary) -> Dictionary:
	var r1 := _require_string(params, "path"); if r1[1]: return r1[1]
	var r2 := _require_string(params, "name"); if r2[1]: return r2[1]
	var player_type := _optional_string(params, "type", "AudioStreamPlayer")
	var valid_types := ["AudioStreamPlayer", "AudioStreamPlayer2D", "AudioStreamPlayer3D"]
	if player_type not in valid_types: return _err_params("Invalid player type '%s'. Valid: %s" % [player_type, str(valid_types)])
	var parent := _find_node_by_path(r1[0])
	if parent == null: return _err_not_found("Node at '%s'" % r1[0])
	var player: Node
	match player_type:
		"AudioStreamPlayer": player = AudioStreamPlayer.new()
		"AudioStreamPlayer2D": player = AudioStreamPlayer2D.new()
		"AudioStreamPlayer3D": player = AudioStreamPlayer3D.new()
	player.name = r2[0]
	var stream_path := _optional_string(params, "stream")
	if not stream_path.is_empty():
		if not ResourceLoader.exists(stream_path): player.queue_free(); return _err_not_found("Audio stream at '%s'" % stream_path)
		var stream = ResourceLoader.load(stream_path)
		if not stream is AudioStream: player.queue_free(); return _err_params("Resource is not an AudioStream")
		player.set("stream", stream)
	if params.has("volume_db"): player.set("volume_db", float(params["volume_db"]))
	var bus := _optional_string(params, "bus")
	if not bus.is_empty(): player.set("bus", bus)
	if params.has("autoplay"): player.set("autoplay", bool(params["autoplay"]))
	parent.add_child(player); player.owner = _edited_root()
	return _ok({"name": r2[0], "type": player_type, "parent": r1[0], "bus": player.get("bus"), "volume_db": player.get("volume_db")})


func _get_audio_info(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var node := _find_node_by_path(r[0])
	if node == null: return _err_not_found("Node at '%s'" % r[0])
	var players: Array = []
	_collect_audio_players(node, players)
	return _ok({"path": r[0], "audio_player_count": players.size(), "players": players})

func _collect_audio_players(node: Node, result: Array) -> void:
	if node is AudioStreamPlayer or node is AudioStreamPlayer2D or node is AudioStreamPlayer3D:
		var info := {"name": node.name, "path": str(_edited_root().get_path_to(node)), "type": node.get_class(),
			"volume_db": node.get("volume_db"), "bus": node.get("bus"), "autoplay": node.get("autoplay"), "playing": node.get("playing"), "stream": ""}
		var stream = node.get("stream")
		if stream != null and stream is AudioStream: info["stream"] = stream.resource_path
		result.append(info)
	for child in node.get_children(): _collect_audio_players(child, result)


# ══════════════════════════════════════════════════════════════════════════════
# VIEWPORT / SELECTION COMMANDS
# ══════════════════════════════════════════════════════════════════════════════

func _get_selected_nodes(_params: Dictionary) -> Dictionary:
	var selection: EditorSelection = _ei().get_selection()
	var selected: Array[Node] = selection.get_selected_nodes()
	var root := _edited_root()
	var result: Array = []
	for node in selected:
		if not is_instance_valid(node): continue
		result.append({"name": node.name, "type": node.get_class(), "path": str(root.get_path_to(node)) if root else str(node.get_path())})
	return _ok({"selected_nodes": result, "count": result.size()})


func _select_node(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var node := _find_node_by_path(r[0])
	if node == null: return _err_not_found("Node '%s'" % r[0])
	var selection: EditorSelection = _ei().get_selection()
	if not _optional_bool(params, "add_to_selection"): selection.clear()
	selection.add_node(node)
	return _ok({"selected": r[0], "type": node.get_class()})


func _select_nodes(params: Dictionary) -> Dictionary:
	if not params.has("node_paths") or not params["node_paths"] is Array: return _err_params("Missing required parameter: node_paths (Array)")
	var selection: EditorSelection = _ei().get_selection()
	selection.clear()
	var selected: Array = []; var not_found: Array = []
	for path in params["node_paths"] as Array:
		var node := _find_node_by_path(str(path))
		if node == null: not_found.append(path)
		else: selection.add_node(node); selected.append(path)
	return _ok({"selected": selected, "not_found": not_found, "count": selected.size()})


func _clear_selection(_params: Dictionary) -> Dictionary:
	_ei().get_selection().clear()
	return _ok({"cleared": true})


func _focus_node_in_viewport(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "path"); if r[1]: return r[1]
	var node := _find_node_by_path(r[0])
	if node == null: return _err_not_found("Node '%s'" % r[0])
	var ei := _ei()
	var selection: EditorSelection = ei.get_selection()
	selection.clear(); selection.add_node(node)
	ei.call_deferred("inspect_object", node)
	return _ok({"focused": r[0], "type": node.get_class()})


func _list_plugins(_params: Dictionary) -> Dictionary:
	var ei := _ei()
	var plugins: Array = []
	var addons_dir := "res://addons/"
	var dir := DirAccess.open(addons_dir)
	if dir == null: return _ok({"plugins": [], "count": 0})
	dir.list_dir_begin()
	var folder_name := dir.get_next()
	while not folder_name.is_empty():
		if dir.current_is_dir() and not folder_name.begins_with("."):
			var plugin_cfg := addons_dir + folder_name + "/plugin.cfg"
			if FileAccess.file_exists(plugin_cfg):
				var cfg := ConfigFile.new(); var err := cfg.load(plugin_cfg)
				var info: Dictionary = {"folder": folder_name, "enabled": ei.is_plugin_enabled(folder_name)}
				if err == OK:
					info["name"] = cfg.get_value("plugin", "name", folder_name)
					info["version"] = cfg.get_value("plugin", "version", "")
					info["author"] = cfg.get_value("plugin", "author", "")
				plugins.append(info)
		folder_name = dir.get_next()
	dir.list_dir_end()
	return _ok({"plugins": plugins, "count": plugins.size()})


func _set_plugin_enabled(params: Dictionary) -> Dictionary:
	var r := _require_string(params, "plugin_folder"); if r[1]: return r[1]
	if not params.has("enabled") or not params["enabled"] is bool: return _err_params("Missing required parameter: enabled (bool)")
	var plugin_cfg := "res://addons/%s/plugin.cfg" % r[0]
	if not FileAccess.file_exists(plugin_cfg): return _err_not_found("Plugin '%s'" % r[0])
	var ei := _ei()
	var was_enabled := ei.is_plugin_enabled(r[0])
	var enabled: bool = params["enabled"]
	if was_enabled == enabled: return _ok({"plugin": r[0], "enabled": enabled, "changed": false})
	ei.set_plugin_enabled(r[0], enabled)
	return _ok({"plugin": r[0], "enabled": enabled, "changed": true})
