@tool
class_name GPWorldCommands
extends Node

## GPWorldCommands — 3D scene, Physics, Navigation, Particles, Tilemap, Shader

var editor_plugin: EditorPlugin

func get_commands() -> Dictionary:
	return {
		# 3D Scene
		"visual_add_mesh":       _add_mesh_instance,
		"visual_add_light":          _setup_lighting,
		"visual_set_material":         _set_material_3d,
		"visual_add_environment":       _setup_environment,
		"visual_add_camera":         _setup_camera_3d,
		"visual_add_gridmap":             _add_gridmap,
		# Physics
		"physics_add_collision_shape":         _setup_collision,
		"physics_set_layers":      _set_physics_layers,
		"physics_get_layers":      _get_physics_layers,
		"physics_add_raycast":             _add_raycast,
		"physics_setup_body":      _setup_physics_body,
		"physics_get_collision_info":      _get_collision_info,
		# Navigation
		"nav_add_region": _setup_navigation_region,
		"nav_bake_mesh":    _bake_navigation_mesh,
		"nav_add_agent":  _setup_navigation_agent,
		"nav_set_layers":   _set_navigation_layers,
		"nav_get_info":     _get_navigation_info,
		# Particles
		"particle_create":              _create_particles,
		"particle_set_material":         _set_particle_material,
		"particle_set_color_gradient":   _set_particle_color_gradient,
		"particle_set_preset":         _apply_particle_preset,
		"particle_get_info":             _get_particle_info,
		# Tilemap
		"tilemap_set_cell":       _tilemap_set_cell,
		"tilemap_fill_rect":      _tilemap_fill_rect,
		"tilemap_get_cell":       _tilemap_get_cell,
		"tilemap_clear":          _tilemap_clear,
		"tilemap_get_info":       _tilemap_get_info,
		"tilemap_get_used_cells": _tilemap_get_used_cells,
		# Shader
		"shader_create":          _create_shader,
		"shader_read":            _read_shader,
		"shader_edit":            _edit_shader,
		"shader_set_material": _assign_shader_material,
		"shader_set_param":       _set_shader_param,
		"shader_get_params":      _get_shader_params,
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

func _parse_vec3(v: Variant, default: Vector3 = Vector3.ZERO) -> Vector3:
	if v is Dictionary:
		return Vector3(float(v.get("x", 0)), float(v.get("y", 0)), float(v.get("z", 0)))
	if v is Array and (v as Array).size() >= 3:
		return Vector3(float(v[0]), float(v[1]), float(v[2]))
	if v is String:
		var s: String = v
		var cleaned := s.replace("Vector3(", "").replace(")", "")
		var parts := cleaned.split(",")
		if parts.size() >= 3:
			return Vector3(parts[0].strip_edges().to_float(), parts[1].strip_edges().to_float(), parts[2].strip_edges().to_float())
	return default

func _parse_color(v: Variant, default: Color = Color.WHITE) -> Color:
	if v is String:
		var s: String = v
		if s.begins_with("#"): return Color.html(s)
		if Color.html_is_valid(s): return Color.html(s)
		if s.begins_with("Color("):
			var cleaned := s.replace("Color(", "").replace(")", "")
			var p := cleaned.split(",")
			if p.size() >= 3: return Color(p[0].strip_edges().to_float(), p[1].strip_edges().to_float(), p[2].strip_edges().to_float(), p[3].strip_edges().to_float() if p.size() > 3 else 1.0)
	if v is Dictionary:
		var d: Dictionary = v
		return Color(float(d.get("r", 1)), float(d.get("g", 1)), float(d.get("b", 1)), float(d.get("a", 1)))
	return default


# ═══════════════════════════════════════════════════════════════════════════════
# 3D SCENE
# ═══════════════════════════════════════════════════════════════════════════════

func _add_mesh_instance(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")

	var parent_path: String = params.get("parent_path", ".")
	var parent := _find_node(parent_path)
	if parent == null: return _err("Parent not found: %s" % parent_path)

	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = params.get("name", "MeshInstance3D")

	var mesh_file: String = params.get("mesh_file", "")
	if not mesh_file.is_empty():
		var res := load(mesh_file)
		if res == null: return _err("Cannot load mesh file: %s" % mesh_file)
		if res is Mesh:
			mesh_instance.mesh = res
		elif res is PackedScene:
			var inst: Node = (res as PackedScene).instantiate()
			inst.name = mesh_instance.name
			_ur().create_action("Add Mesh Instance")
			_ur().add_do_method(parent, "add_child", inst)
			_ur().add_do_method(inst, "set_owner", root)
			_ur().add_undo_method(parent, "remove_child", inst)
			_ur().commit_action()
			GPUtils.set_owner_recursive(inst, root)
			return _ok({"node": str(root.get_path_to(inst))})
	else:
		var mesh_type: String = params.get("mesh_type", "BoxMesh")
		var mesh: Mesh = ClassDB.instantiate(mesh_type) if ClassDB.class_exists(mesh_type) else BoxMesh.new()
		var mesh_props: Dictionary = params.get("mesh_properties", {})
		for k: String in mesh_props:
			mesh.set(k, GPUtils.parse_value(mesh_props[k]))
		mesh_instance.mesh = mesh

	var pos: Variant = params.get("position", null)
	if pos != null: mesh_instance.position = _parse_vec3(pos)
	var rot: Variant = params.get("rotation", null)
	if rot != null: mesh_instance.rotation_degrees = _parse_vec3(rot)
	var scl: Variant = params.get("scale", null)
	if scl != null: mesh_instance.scale = _parse_vec3(scl, Vector3.ONE)

	_ur().create_action("Add MeshInstance3D")
	_ur().add_do_method(parent, "add_child", mesh_instance)
	_ur().add_do_method(mesh_instance, "set_owner", root)
	_ur().add_undo_method(parent, "remove_child", mesh_instance)
	_ur().commit_action()
	GPUtils.set_owner_recursive(mesh_instance, root)
	return _ok({"node": str(root.get_path_to(mesh_instance)), "mesh_type": mesh_instance.mesh.get_class() if mesh_instance.mesh else ""})


func _setup_lighting(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")

	var parent_path: String = params.get("parent_path", ".")
	var parent := _find_node(parent_path)
	if parent == null: return _err("Parent not found: %s" % parent_path)

	var preset: String = params.get("preset", "")
	var light_type: String = params.get("light_type", "")

	var light: Light3D
	if preset == "sun" or light_type == "DirectionalLight3D":
		light = DirectionalLight3D.new()
		if preset == "sun":
			light.shadow_enabled = true
			light.rotation_degrees = Vector3(-45, 0, 0)
	elif preset == "indoor" or light_type == "OmniLight3D":
		light = OmniLight3D.new()
		if preset == "indoor":
			light.light_color = Color(1.0, 0.9, 0.7)
			(light as OmniLight3D).omni_range = 8.0
	elif preset == "dramatic" or light_type == "SpotLight3D":
		light = SpotLight3D.new()
		if preset == "dramatic":
			light.light_energy = 3.0
			light.shadow_enabled = true
	else:
		light = OmniLight3D.new()

	light.name = params.get("name", light.get_class())
	if params.has("color"): light.light_color = _parse_color(params["color"])
	if params.has("energy"): light.light_energy = float(params["energy"])
	if params.has("shadows"): light.shadow_enabled = bool(params["shadows"])
	if light is OmniLight3D and params.has("range"): (light as OmniLight3D).omni_range = float(params["range"])
	if light is SpotLight3D and params.has("spot_angle"): (light as SpotLight3D).spot_angle = float(params["spot_angle"])
	var pos: Variant = params.get("position", null)
	if pos != null: light.position = _parse_vec3(pos)
	var rot: Variant = params.get("rotation", null)
	if rot != null: light.rotation_degrees = _parse_vec3(rot)

	_ur().create_action("Add Light")
	_ur().add_do_method(parent, "add_child", light)
	_ur().add_do_method(light, "set_owner", root)
	_ur().add_undo_method(parent, "remove_child", light)
	_ur().commit_action()
	GPUtils.set_owner_recursive(light, root)
	return _ok({"node": str(root.get_path_to(light)), "type": light.get_class()})


func _set_material_3d(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	if not node is MeshInstance3D: return _err("Node is not MeshInstance3D")

	var mi: MeshInstance3D = node
	var mat := StandardMaterial3D.new()
	var surface_idx: int = params.get("surface_index", 0)

	if params.has("albedo_color"): mat.albedo_color = _parse_color(params["albedo_color"])
	if params.has("albedo_texture"):
		var tex := load(params["albedo_texture"]) as Texture2D
		if tex: mat.albedo_texture = tex
	mat.metallic = float(params.get("metallic", 0.0))
	mat.roughness = float(params.get("roughness", 1.0))
	if params.has("normal_texture"):
		var tex := load(params["normal_texture"]) as Texture2D
		if tex: mat.normal_texture = tex; mat.normal_enabled = true
	if params.has("emission") or params.has("emission_color"):
		var ec: Variant = params.get("emission", params.get("emission_color", null))
		if ec != null: mat.emission = _parse_color(ec); mat.emission_enabled = true
	if params.has("emission_energy"): mat.emission_energy_multiplier = float(params["emission_energy"])
	if params.has("transparency"):
		var tm: String = params["transparency"]
		match tm:
			"ALPHA": mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			"ALPHA_SCISSOR": mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
			"ALPHA_HASH": mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_HASH

	_ur().create_action("Set Material 3D")
	_ur().add_do_method(mi, "set_surface_override_material", surface_idx, mat)
	_ur().add_undo_method(mi, "set_surface_override_material", surface_idx, null)
	_ur().commit_action()
	return _ok({"node": node_path, "surface": surface_idx, "material": "StandardMaterial3D"})


func _setup_environment(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")

	var node_path: String = params.get("path", "")
	var we: WorldEnvironment
	if not node_path.is_empty():
		var existing := _find_node(node_path)
		if existing is WorldEnvironment: we = existing
	if we == null:
		we = WorldEnvironment.new()
		we.name = params.get("name", "WorldEnvironment")
		var parent_path: String = params.get("parent_path", ".")
		var parent := _find_node(parent_path)
		if parent == null: return _err("Parent not found")
		_ur().create_action("Add WorldEnvironment")
		_ur().add_do_method(parent, "add_child", we)
		_ur().add_do_method(we, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", we)
		_ur().commit_action()
		GPUtils.set_owner_recursive(we, root)

	var env := Environment.new() if we.environment == null else we.environment
	we.environment = env

	var bg_mode: String = params.get("background_mode", "sky")
	match bg_mode:
		"sky": env.background_mode = Environment.BG_SKY
		"color": env.background_mode = Environment.BG_COLOR
		"canvas": env.background_mode = Environment.BG_CANVAS
		"clear_color": env.background_mode = Environment.BG_CLEAR_COLOR

	if params.has("background_color"): env.background_color = _parse_color(params["background_color"])
	if params.has("sky"):
		var sky_res := Sky.new()
		var proc := ProceduralSkyMaterial.new()
		var sd: Dictionary = params["sky"]
		if sd.has("sky_top_color"): proc.sky_top_color = _parse_color(sd["sky_top_color"])
		if sd.has("sky_horizon_color"): proc.sky_horizon_color = _parse_color(sd["sky_horizon_color"])
		if sd.has("ground_bottom_color"): proc.ground_bottom_color = _parse_color(sd["ground_bottom_color"])
		if sd.has("ground_horizon_color"): proc.ground_horizon_color = _parse_color(sd["ground_horizon_color"])
		sky_res.sky_material = proc
		env.sky = sky_res
		env.background_mode = Environment.BG_SKY

	if params.has("ambient_light_color"): env.ambient_light_color = _parse_color(params["ambient_light_color"])
	if params.has("ambient_light_energy"): env.ambient_light_energy = float(params["ambient_light_energy"])
	if params.has("fog_enabled"): env.volumetric_fog_enabled = bool(params["fog_enabled"])
	if params.has("fog_density"): env.volumetric_fog_density = float(params["fog_density"])
	if params.has("glow_enabled"): env.glow_enabled = bool(params["glow_enabled"])
	if params.has("glow_intensity"): env.glow_intensity = float(params["glow_intensity"])
	if params.has("ssao_enabled"): env.ssao_enabled = bool(params["ssao_enabled"])
	if params.has("ssr_enabled"): env.ssr_enabled = bool(params["ssr_enabled"])
	if params.has("sdfgi_enabled"): env.sdfgi_enabled = bool(params["sdfgi_enabled"])
	if params.has("tonemap_mode"):
		match params["tonemap_mode"]:
			"REINHARDT": env.tonemap_mode = Environment.TONE_MAPPER_REINHARDT
			"FILMIC": env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
			"ACES": env.tonemap_mode = Environment.TONE_MAPPER_ACES

	return _ok({"node": str(root.get_path_to(we))})


func _setup_camera_3d(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")

	var node_path: String = params.get("path", "")
	var cam: Camera3D
	if not node_path.is_empty():
		var existing := _find_node(node_path)
		if existing is Camera3D: cam = existing
	if cam == null:
		cam = Camera3D.new()
		cam.name = params.get("name", "Camera3D")
		var parent_path: String = params.get("parent_path", ".")
		var parent := _find_node(parent_path)
		if parent == null: return _err("Parent not found")
		cam.position = Vector3(0, 1, 3)
		_ur().create_action("Add Camera3D")
		_ur().add_do_method(parent, "add_child", cam)
		_ur().add_do_method(cam, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", cam)
		_ur().commit_action()
		GPUtils.set_owner_recursive(cam, root)

	var proj: String = params.get("projection", "")
	match proj:
		"orthogonal", "orthographic": cam.projection = Camera3D.PROJECTION_ORTHOGONAL
		"frustum": cam.projection = Camera3D.PROJECTION_FRUSTUM
		"perspective": cam.projection = Camera3D.PROJECTION_PERSPECTIVE
	if params.has("fov"): cam.fov = float(params["fov"])
	if params.has("near"): cam.near = float(params["near"])
	if params.has("far"): cam.far = float(params["far"])
	if params.has("current"): cam.current = bool(params["current"])
	var pos: Variant = params.get("position", null)
	if pos != null: cam.position = _parse_vec3(pos)
	var look_at: Variant = params.get("look_at", null)
	if look_at != null:
		var target := _parse_vec3(look_at)
		if cam.position != target: cam.look_at(target)
	elif params.has("rotation"):
		cam.rotation_degrees = _parse_vec3(params["rotation"])

	return _ok({"node": str(root.get_path_to(cam))})


func _add_gridmap(params: Dictionary) -> Dictionary:
	var root := _require_scene()
	if root == null: return _err("No scene open")

	var node_path: String = params.get("path", "")
	var gm: GridMap
	if not node_path.is_empty():
		var existing := _find_node(node_path)
		if existing is GridMap: gm = existing
	if gm == null:
		gm = GridMap.new()
		gm.name = params.get("name", "GridMap")
		var parent_path: String = params.get("parent_path", ".")
		var parent := _find_node(parent_path)
		if parent == null: return _err("Parent not found")
		_ur().create_action("Add GridMap")
		_ur().add_do_method(parent, "add_child", gm)
		_ur().add_do_method(gm, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", gm)
		_ur().commit_action()
		GPUtils.set_owner_recursive(gm, root)

	var ml_path: String = params.get("mesh_library_path", "")
	if not ml_path.is_empty():
		var ml := load(ml_path) as MeshLibrary
		if ml: gm.mesh_library = ml
	var cs: Variant = params.get("cell_size", null)
	if cs != null: gm.cell_size = _parse_vec3(cs, Vector3(2, 2, 2))
	var pos: Variant = params.get("position", null)
	if pos != null: gm.position = _parse_vec3(pos)

	var cells: Array = params.get("cells", [])
	for cell: Dictionary in cells:
		gm.set_cell_item(Vector3i(int(cell.get("x", 0)), int(cell.get("y", 0)), int(cell.get("z", 0))),
			int(cell.get("item", 0)), int(cell.get("orientation", 0)))

	return _ok({"node": str(root.get_path_to(gm)), "cells_set": cells.size()})


# ═══════════════════════════════════════════════════════════════════════════════
# PHYSICS
# ═══════════════════════════════════════════════════════════════════════════════

func _setup_collision(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(node_path)
	if parent == null: return _err("Node not found: %s" % node_path)

	# Detect 2D/3D
	var forced: String = params.get("dimension", "")
	var is_3d: bool = forced == "3d" or (forced.is_empty() and (parent is Node3D))

	var shape_type: String = params.get("shape", "rectangle").to_lower()

	if is_3d:
		var shape3d: Shape3D
		match shape_type:
			"box", "rectangle", "rect":
				var s := BoxShape3D.new()
				s.size = Vector3(float(params.get("width", 1.0)), float(params.get("height", 1.0)), float(params.get("depth", 1.0)))
				shape3d = s
			"sphere", "circle":
				var s := SphereShape3D.new()
				s.radius = float(params.get("radius", 0.5))
				shape3d = s
			"capsule":
				var s := CapsuleShape3D.new()
				s.radius = float(params.get("radius", 0.5))
				s.height = float(params.get("height", 1.0))
				shape3d = s
			"cylinder":
				var s := CylinderShape3D.new()
				s.radius = float(params.get("radius", 0.5))
				s.height = float(params.get("height", 1.0))
				shape3d = s
			_:
				shape3d = BoxShape3D.new()
		var cs := CollisionShape3D.new()
		cs.shape = shape3d
		cs.disabled = bool(params.get("disabled", false))
		_ur().create_action("Add CollisionShape3D")
		_ur().add_do_method(parent, "add_child", cs)
		_ur().add_do_method(cs, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", cs)
		_ur().commit_action()
		cs.owner = root
		return _ok({"node": str(root.get_path_to(cs)), "shape": shape3d.get_class(), "dimension": "3d"})
	else:
		var shape2d: Shape2D
		match shape_type:
			"rectangle", "rect", "box":
				var s := RectangleShape2D.new()
				s.size = Vector2(float(params.get("width", 32.0)), float(params.get("height", 32.0)))
				shape2d = s
			"circle", "sphere":
				var s := CircleShape2D.new()
				s.radius = float(params.get("radius", 16.0))
				shape2d = s
			"capsule":
				var s := CapsuleShape2D.new()
				s.radius = float(params.get("radius", 8.0))
				s.height = float(params.get("height", 32.0))
				shape2d = s
			"segment":
				var s := SegmentShape2D.new()
				s.a = Vector2(float(params.get("ax", 0)), float(params.get("ay", 0)))
				s.b = Vector2(float(params.get("bx", 0)), float(params.get("by", 50)))
				shape2d = s
			_:
				var s := RectangleShape2D.new()
				shape2d = s
		var cs2 := CollisionShape2D.new()
		cs2.shape = shape2d
		cs2.disabled = bool(params.get("disabled", false))
		cs2.one_way_collision = bool(params.get("one_way_collision", false))
		_ur().create_action("Add CollisionShape2D")
		_ur().add_do_method(parent, "add_child", cs2)
		_ur().add_do_method(cs2, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", cs2)
		_ur().commit_action()
		cs2.owner = root
		return _ok({"node": str(root.get_path_to(cs2)), "shape": shape2d.get_class(), "dimension": "2d"})


func _layers_to_bitmask(v: Variant) -> int:
	if v is int: return v
	if v is float: return int(v)
	if v is Array:
		var mask := 0
		for bit: Variant in v:
			mask |= (1 << (int(bit) - 1))
		return mask
	return 0


func _set_physics_layers(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	if params.has("collision_layer"): node.set("collision_layer", _layers_to_bitmask(params["collision_layer"]))
	if params.has("collision_mask"): node.set("collision_mask", _layers_to_bitmask(params["collision_mask"]))
	return _ok({"node": node_path, "collision_layer": node.get("collision_layer"), "collision_mask": node.get("collision_mask")})


func _get_physics_layers(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var layer: int = node.get("collision_layer") if node.get("collision_layer") != null else 0
	var mask: int = node.get("collision_mask") if node.get("collision_mask") != null else 0
	return _ok({"node": node_path, "type": node.get_class(), "collision_layer": layer, "collision_mask": mask})


func _add_raycast(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(node_path)
	if parent == null: return _err("Node not found: %s" % node_path)

	var forced: String = params.get("dimension", "")
	var is_3d := forced == "3d" or (forced.is_empty() and parent is Node3D)

	if is_3d:
		var rc := RayCast3D.new()
		rc.name = params.get("name", "RayCast")
		rc.target_position = Vector3(float(params.get("target_x", 0)), float(params.get("target_y", -1)), float(params.get("target_z", 0)))
		rc.collision_mask = int(params.get("collision_mask", 1))
		rc.enabled = bool(params.get("enabled", true))
		rc.collide_with_areas = bool(params.get("collide_with_areas", false))
		rc.collide_with_bodies = bool(params.get("collide_with_bodies", true))
		rc.hit_from_inside = bool(params.get("hit_from_inside", false))
		_ur().create_action("Add RayCast3D")
		_ur().add_do_method(parent, "add_child", rc)
		_ur().add_do_method(rc, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", rc)
		_ur().commit_action()
		rc.owner = root
		return _ok({"node": str(root.get_path_to(rc)), "dimension": "3d"})
	else:
		var rc2 := RayCast2D.new()
		rc2.name = params.get("name", "RayCast")
		rc2.target_position = Vector2(float(params.get("target_x", 0)), float(params.get("target_y", 50)))
		rc2.collision_mask = int(params.get("collision_mask", 1))
		rc2.enabled = bool(params.get("enabled", true))
		rc2.collide_with_areas = bool(params.get("collide_with_areas", false))
		rc2.collide_with_bodies = bool(params.get("collide_with_bodies", true))
		_ur().create_action("Add RayCast2D")
		_ur().add_do_method(parent, "add_child", rc2)
		_ur().add_do_method(rc2, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", rc2)
		_ur().commit_action()
		rc2.owner = root
		return _ok({"node": str(root.get_path_to(rc2)), "dimension": "2d"})


func _setup_physics_body(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)

	if node is CharacterBody2D or node is CharacterBody3D:
		if params.has("floor_stop_on_slope"): node.set("floor_stop_on_slope", bool(params["floor_stop_on_slope"]))
		if params.has("floor_max_angle"): node.set("floor_max_angle", float(params["floor_max_angle"]))
		if params.has("floor_snap_length"): node.set("floor_snap_length", float(params["floor_snap_length"]))
		if params.has("max_slides"): node.set("max_slides", int(params["max_slides"]))
		if params.has("motion_mode"):
			var mm: String = params["motion_mode"]
			if node.has_method("set_motion_mode"):
				node.set("motion_mode", 0 if mm == "grounded" else 1)
	elif node is RigidBody2D or node is RigidBody3D:
		if params.has("mass"): node.set("mass", float(params["mass"]))
		if params.has("gravity_scale"): node.set("gravity_scale", float(params["gravity_scale"]))
		if params.has("linear_damp"): node.set("linear_damp", float(params["linear_damp"]))
		if params.has("angular_damp"): node.set("angular_damp", float(params["angular_damp"]))
		if params.has("freeze"): node.set("freeze", bool(params["freeze"]))
		if params.has("contact_monitor"): node.set("contact_monitor", bool(params["contact_monitor"]))
		if params.has("max_contacts_reported"): node.set("max_contacts_reported", int(params["max_contacts_reported"]))

	return _ok({"node": node_path, "type": node.get_class()})


func _get_collision_info(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)

	var info: Dictionary = {"node": node_path, "type": node.get_class(),
		"collision_layer": node.get("collision_layer"),
		"collision_mask": node.get("collision_mask"),
		"shapes": [], "raycasts": []}

	var include_children: bool = params.get("include_children", true)
	if include_children:
		for child in node.get_children():
			if child is CollisionShape2D or child is CollisionShape3D:
				info["shapes"].append({"name": str(child.name), "shape": child.shape.get_class() if child.shape else null})
			elif child is RayCast2D or child is RayCast3D:
				info["raycasts"].append({"name": str(child.name)})
	return _ok(info)


# ═══════════════════════════════════════════════════════════════════════════════
# NAVIGATION
# ═══════════════════════════════════════════════════════════════════════════════

func _setup_navigation_region(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(node_path)
	if parent == null: return _err("Node not found: %s" % node_path)

	var mode: String = params.get("mode", "auto")
	var is_3d := (mode == "3d") or (mode == "auto" and parent is Node3D)

	if is_3d:
		var region := NavigationRegion3D.new()
		region.name = params.get("name", "NavigationRegion3D")
		if params.has("navigation_layers"): region.navigation_layers = int(params["navigation_layers"])
		var nav_mesh := NavigationMesh.new()
		if params.has("agent_radius"): nav_mesh.agent_radius = float(params["agent_radius"])
		if params.has("agent_height"): nav_mesh.agent_height = float(params["agent_height"])
		if params.has("agent_max_slope"): nav_mesh.agent_max_slope = float(params["agent_max_slope"])
		if params.has("cell_size"): nav_mesh.cell_size = float(params["cell_size"])
		region.navigation_mesh = nav_mesh
		_ur().create_action("Add NavigationRegion3D")
		_ur().add_do_method(parent, "add_child", region)
		_ur().add_do_method(region, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", region)
		_ur().commit_action()
		region.owner = root
		return _ok({"node": str(root.get_path_to(region)), "dimension": "3d"})
	else:
		var region2 := NavigationRegion2D.new()
		region2.name = params.get("name", "NavigationRegion2D")
		if params.has("navigation_layers"): region2.navigation_layers = int(params["navigation_layers"])
		var nav_poly := NavigationPolygon.new()
		region2.navigation_polygon = nav_poly
		_ur().create_action("Add NavigationRegion2D")
		_ur().add_do_method(parent, "add_child", region2)
		_ur().add_do_method(region2, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", region2)
		_ur().commit_action()
		region2.owner = root
		return _ok({"node": str(root.get_path_to(region2)), "dimension": "2d"})


func _bake_navigation_mesh(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	if node is NavigationRegion3D:
		(node as NavigationRegion3D).bake_navigation_mesh()
		return _ok({"node": node_path, "baked": true})
	if node is NavigationRegion2D:
		var outline_raw: Array = params.get("outline", [])
		if outline_raw.is_empty(): return _err("outline is required for NavigationRegion2D")
		var poly := NavigationPolygon.new()
		var verts := PackedVector2Array()
		for pt: Variant in outline_raw:
			if pt is Array and (pt as Array).size() >= 2: verts.append(Vector2(float(pt[0]), float(pt[1])))
			elif pt is Dictionary: verts.append(Vector2(float(pt.get("x", 0)), float(pt.get("y", 0))))
		poly.add_outline(verts)
		poly.make_polygons_from_outlines()
		(node as NavigationRegion2D).navigation_polygon = poly
		return _ok({"node": node_path, "vertices": verts.size()})
	return _err("Node is not a NavigationRegion: %s" % node.get_class())


func _setup_navigation_agent(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(node_path)
	if parent == null: return _err("Node not found: %s" % node_path)

	var mode: String = params.get("mode", "auto")
	var is_3d := (mode == "3d") or (mode == "auto" and parent is Node3D)

	if is_3d:
		var agent := NavigationAgent3D.new()
		agent.name = params.get("name", "NavigationAgent3D")
		if params.has("path_desired_distance"): agent.path_desired_distance = float(params["path_desired_distance"])
		if params.has("target_desired_distance"): agent.target_desired_distance = float(params["target_desired_distance"])
		if params.has("radius"): agent.radius = float(params["radius"])
		if params.has("max_speed"): agent.max_speed = float(params["max_speed"])
		if params.has("avoidance_enabled"): agent.avoidance_enabled = bool(params["avoidance_enabled"])
		if params.has("navigation_layers"): agent.navigation_layers = int(params["navigation_layers"])
		_ur().create_action("Add NavigationAgent3D")
		_ur().add_do_method(parent, "add_child", agent)
		_ur().add_do_method(agent, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", agent)
		_ur().commit_action()
		agent.owner = root
		return _ok({"node": str(root.get_path_to(agent)), "dimension": "3d"})
	else:
		var agent2 := NavigationAgent2D.new()
		agent2.name = params.get("name", "NavigationAgent2D")
		if params.has("path_desired_distance"): agent2.path_desired_distance = float(params["path_desired_distance"])
		if params.has("target_desired_distance"): agent2.target_desired_distance = float(params["target_desired_distance"])
		if params.has("radius"): agent2.radius = float(params["radius"])
		if params.has("max_speed"): agent2.max_speed = float(params["max_speed"])
		if params.has("avoidance_enabled"): agent2.avoidance_enabled = bool(params["avoidance_enabled"])
		_ur().create_action("Add NavigationAgent2D")
		_ur().add_do_method(parent, "add_child", agent2)
		_ur().add_do_method(agent2, "set_owner", root)
		_ur().add_undo_method(parent, "remove_child", agent2)
		_ur().commit_action()
		agent2.owner = root
		return _ok({"node": str(root.get_path_to(agent2)), "dimension": "2d"})


func _set_navigation_layers(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mask := _layers_to_bitmask(params.get("layers", params.get("layer_bits", 1)))
	node.set("navigation_layers", mask)
	return _ok({"node": node_path, "navigation_layers": mask})


func _get_navigation_info(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var regions: Array = []
	var agents: Array = []
	_collect_nav_info(node, regions, agents)
	return _ok({"node": node_path, "regions": regions, "agents": agents})


func _collect_nav_info(node: Node, regions: Array, agents: Array) -> void:
	if node is NavigationRegion2D or node is NavigationRegion3D:
		regions.append({"name": str(node.name), "path": str(node.get_path()), "type": node.get_class(), "navigation_layers": node.get("navigation_layers")})
	elif node is NavigationAgent2D or node is NavigationAgent3D:
		agents.append({"name": str(node.name), "path": str(node.get_path()), "type": node.get_class()})
	for child in node.get_children():
		_collect_nav_info(child, regions, agents)


# ═══════════════════════════════════════════════════════════════════════════════
# PARTICLES
# ═══════════════════════════════════════════════════════════════════════════════

func _create_particles(params: Dictionary) -> Dictionary:
	var parent_path: String = params.get("parent_path", "")
	if parent_path.is_empty(): return _err("parent_path is required")
	var root := _require_scene()
	if root == null: return _err("No scene open")
	var parent := _find_node(parent_path)
	if parent == null: return _err("Parent not found: %s" % parent_path)

	var is_3d: bool = params.get("is_3d", false)
	var particles: Node
	if is_3d:
		var p3 := GPUParticles3D.new()
		p3.name = params.get("name", "Particles")
		p3.amount = int(params.get("amount", 16))
		p3.lifetime = float(params.get("lifetime", 1.0))
		p3.one_shot = bool(params.get("one_shot", false))
		p3.explosiveness = float(params.get("explosiveness", 0.0))
		p3.randomness = float(params.get("randomness", 0.0))
		p3.emitting = bool(params.get("emitting", true))
		p3.process_material = ParticleProcessMaterial.new()
		particles = p3
	else:
		var p2 := GPUParticles2D.new()
		p2.name = params.get("name", "Particles")
		p2.amount = int(params.get("amount", 16))
		p2.lifetime = float(params.get("lifetime", 1.0))
		p2.one_shot = bool(params.get("one_shot", false))
		p2.explosiveness = float(params.get("explosiveness", 0.0))
		p2.randomness = float(params.get("randomness", 0.0))
		p2.emitting = bool(params.get("emitting", true))
		p2.process_material = ParticleProcessMaterial.new()
		particles = p2

	_ur().create_action("Add Particles")
	_ur().add_do_method(parent, "add_child", particles)
	_ur().add_do_method(particles, "set_owner", root)
	_ur().add_undo_method(parent, "remove_child", particles)
	_ur().commit_action()
	particles.owner = root
	return _ok({"node": str(root.get_path_to(particles)), "type": particles.get_class()})


func _get_particle_mat(node: Node) -> ParticleProcessMaterial:
	if node is GPUParticles2D: return (node as GPUParticles2D).process_material as ParticleProcessMaterial
	if node is GPUParticles3D: return (node as GPUParticles3D).process_material as ParticleProcessMaterial
	return null


func _set_particle_material(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat := _get_particle_mat(node)
	if mat == null: return _err("No ParticleProcessMaterial found")

	if params.has("direction"):
		var d: Dictionary = params["direction"]
		mat.direction = Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
	if params.has("spread"): mat.spread = float(params["spread"])
	if params.has("initial_velocity_min"): mat.initial_velocity_min = float(params["initial_velocity_min"])
	if params.has("initial_velocity_max"): mat.initial_velocity_max = float(params["initial_velocity_max"])
	if params.has("gravity"):
		var g: Dictionary = params["gravity"]
		mat.gravity = Vector3(float(g.get("x", 0)), float(g.get("y", 0)), float(g.get("z", 0)))
	if params.has("scale_min"): mat.scale_min = float(params["scale_min"])
	if params.has("scale_max"): mat.scale_max = float(params["scale_max"])
	if params.has("color"): mat.color = _parse_color(params["color"])
	if params.has("emission_shape"):
		match params["emission_shape"]:
			"point":         mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_POINT
			"sphere":        mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
			"sphere_surface": mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE_SURFACE
			"box":           mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
			"ring":          mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_RING
	if params.has("emission_sphere_radius"): mat.emission_sphere_radius = float(params["emission_sphere_radius"])
	if params.has("angular_velocity_min"): mat.angular_velocity_min = float(params["angular_velocity_min"])
	if params.has("angular_velocity_max"): mat.angular_velocity_max = float(params["angular_velocity_max"])
	if params.has("damping_min"): mat.damping_min = float(params["damping_min"])
	if params.has("damping_max"): mat.damping_max = float(params["damping_max"])
	if params.has("attractor_interaction_enabled"): mat.attractor_interaction_enabled = bool(params["attractor_interaction_enabled"])
	return _ok({"node": node_path})


func _set_particle_color_gradient(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var stops: Array = params.get("stops", [])
	if stops.is_empty(): return _err("stops is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat := _get_particle_mat(node)
	if mat == null: return _err("No ParticleProcessMaterial found")
	var grad := Gradient.new()
	grad.remove_point(0)
	for stop: Dictionary in stops:
		grad.add_point(float(stop.get("offset", 0)), _parse_color(stop.get("color", "#ffffff")))
	var grad_tex := GradientTexture1D.new()
	grad_tex.gradient = grad
	mat.color_ramp = grad_tex
	return _ok({"node": node_path, "stops": stops.size()})


func _apply_particle_preset(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var preset: String = params.get("preset", "")
	if preset.is_empty(): return _err("preset is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat := _get_particle_mat(node)
	if mat == null: return _err("No ParticleProcessMaterial found")

	match preset:
		"explosion":
			node.set("amount", 32); node.set("lifetime", 0.8); node.set("one_shot", true); node.set("explosiveness", 0.9)
			mat.direction = Vector3(0, 1, 0); mat.spread = 180; mat.initial_velocity_min = 3.0; mat.initial_velocity_max = 8.0
		"fire":
			node.set("amount", 24); node.set("lifetime", 1.2)
			mat.direction = Vector3(0, 1, 0); mat.spread = 20; mat.initial_velocity_min = 1.0; mat.initial_velocity_max = 2.0
			mat.gravity = Vector3(0, -1, 0); mat.color = Color(1, 0.5, 0)
		"smoke":
			node.set("amount", 16); node.set("lifetime", 2.0)
			mat.direction = Vector3(0, 1, 0); mat.spread = 15; mat.initial_velocity_min = 0.3; mat.initial_velocity_max = 0.8
			mat.color = Color(0.5, 0.5, 0.5, 0.5); mat.scale_min = 0.5; mat.scale_max = 2.0
		"sparks":
			node.set("amount", 48); node.set("lifetime", 0.6); node.set("one_shot", true); node.set("explosiveness", 0.8)
			mat.initial_velocity_min = 5.0; mat.initial_velocity_max = 12.0; mat.spread = 60; mat.color = Color(1, 0.9, 0.2)
		"rain":
			node.set("amount", 64); node.set("lifetime", 1.5)
			mat.direction = Vector3(0, -1, 0); mat.spread = 5; mat.initial_velocity_min = 8; mat.initial_velocity_max = 12; mat.color = Color(0.5, 0.7, 1.0, 0.6)
		"snow":
			node.set("amount", 48); node.set("lifetime", 3.0)
			mat.direction = Vector3(0, -1, 0); mat.spread = 30; mat.initial_velocity_min = 0.5; mat.initial_velocity_max = 1.5; mat.color = Color.WHITE
		"magic":
			node.set("amount", 32); node.set("lifetime", 1.5)
			mat.spread = 180; mat.orbit_velocity_min = 0.5; mat.orbit_velocity_max = 1.5; mat.color = Color(0.8, 0.2, 1.0)
		"dust":
			node.set("amount", 20); node.set("lifetime", 2.5)
			mat.direction = Vector3(0, 1, 0); mat.spread = 40; mat.initial_velocity_min = 0.1; mat.initial_velocity_max = 0.4; mat.color = Color(0.8, 0.7, 0.5, 0.3)
		_:
			return _err("Unknown preset: %s" % preset)
	return _ok({"node": node_path, "preset": preset})


func _get_particle_info(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat := _get_particle_mat(node)
	var info: Dictionary = {
		"node": node_path, "type": node.get_class(),
		"amount": node.get("amount"), "lifetime": node.get("lifetime"),
		"one_shot": node.get("one_shot"), "emitting": node.get("emitting"),
		"explosiveness": node.get("explosiveness"), "randomness": node.get("randomness"),
	}
	if mat:
		info["material"] = {"direction": GPUtils.serialize_value(mat.direction), "spread": mat.spread,
			"initial_velocity_min": mat.initial_velocity_min, "initial_velocity_max": mat.initial_velocity_max,
			"scale_min": mat.scale_min, "scale_max": mat.scale_max, "color": GPUtils.serialize_value(mat.color)}
	return _ok(info)


# ═══════════════════════════════════════════════════════════════════════════════
# TILEMAP
# ═══════════════════════════════════════════════════════════════════════════════

func _get_tilemap(node_path: String) -> TileMapLayer:
	var node := _find_node(node_path)
	if node is TileMapLayer: return node
	return null


func _tilemap_set_cell(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	tm.set_cell(Vector2i(int(params.get("x", 0)), int(params.get("y", 0))),
		int(params.get("source_id", 0)),
		Vector2i(int(params.get("atlas_x", 0)), int(params.get("atlas_y", 0))),
		int(params.get("alternative", 0)))
	return _ok({"x": params.get("x", 0), "y": params.get("y", 0)})


func _tilemap_fill_rect(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	var x1 := int(params.get("x1", 0)); var y1 := int(params.get("y1", 0))
	var x2 := int(params.get("x2", 0)); var y2 := int(params.get("y2", 0))
	var src := int(params.get("source_id", 0))
	var ax := int(params.get("atlas_x", 0)); var ay := int(params.get("atlas_y", 0))
	var alt := int(params.get("alternative", 0))
	var count := 0
	for y in range(mini(y1, y2), maxi(y1, y2) + 1):
		for x in range(mini(x1, x2), maxi(x1, x2) + 1):
			tm.set_cell(Vector2i(x, y), src, Vector2i(ax, ay), alt)
			count += 1
	return _ok({"cells_filled": count})


func _tilemap_get_cell(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	var pos := Vector2i(int(params.get("x", 0)), int(params.get("y", 0)))
	var src := tm.get_cell_source_id(pos)
	var atlas := tm.get_cell_atlas_coords(pos)
	var alt := tm.get_cell_alternative_tile(pos)
	return _ok({"x": pos.x, "y": pos.y, "source_id": src, "atlas_x": atlas.x, "atlas_y": atlas.y, "alternative": alt})


func _tilemap_clear(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	tm.clear()
	return _ok({"cleared": true})


func _tilemap_get_info(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	var used := tm.get_used_cells()
	var ts_info: Dictionary = {}
	if tm.tile_set:
		for i in tm.tile_set.get_source_count():
			var sid := tm.tile_set.get_source_id(i)
			ts_info[sid] = tm.tile_set.get_source(sid).get_class()
	return _ok({"node": node_path, "cell_count": used.size(), "tile_set_sources": ts_info})


func _tilemap_get_used_cells(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var tm := _get_tilemap(node_path)
	if tm == null: return _err("TileMapLayer not found: %s" % node_path)
	var max_count: int = params.get("max_count", 500)
	var cells: Array = []
	for c: Vector2i in tm.get_used_cells():
		cells.append({"x": c.x, "y": c.y})
		if cells.size() >= max_count: break
	return _ok({"cells": cells, "count": cells.size()})


# ═══════════════════════════════════════════════════════════════════════════════
# SHADER
# ═══════════════════════════════════════════════════════════════════════════════

func _shader_template(shader_type: String) -> String:
	return "shader_type %s;\n\nvoid fragment() {\n\tALBEDO = vec3(1.0);\n}\n" % shader_type if shader_type in ["spatial", "canvas_item"] \
		else "shader_type %s;\n\nvoid start() {}\nvoid process() {}\n" % shader_type


func _create_shader(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var shader_type: String = params.get("shader_type", "spatial")
	var content: String = params.get("content", _shader_template(shader_type))
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null: return _err("Cannot write file: %s" % path)
	file.store_string(content)
	file.close()
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path, "shader_type": shader_type})


func _read_shader(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return _err("File not found: %s" % path)
	var content := file.get_as_text()
	file.close()
	return _ok({"path": path, "content": content})


func _edit_shader(params: Dictionary) -> Dictionary:
	var path: String = params.get("path", "")
	if path.is_empty(): return _err("path is required")
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return _err("File not found: %s" % path)
	var content := file.get_as_text()
	file.close()
	if params.has("content"):
		content = params["content"]
	elif params.has("replacements"):
		for rep: Dictionary in params["replacements"]:
			content = content.replace(rep.get("search", ""), rep.get("replace", ""))
	var out := FileAccess.open(path, FileAccess.WRITE)
	if out == null: return _err("Cannot write file: %s" % path)
	out.store_string(content)
	out.close()
	_ei().get_resource_filesystem().scan()
	return _ok({"path": path})


func _assign_shader_material(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	var shader_path: String = params.get("shader_path", "")
	if node_path.is_empty() or shader_path.is_empty(): return _err("node_path and shader_path are required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var shader := load(shader_path) as Shader
	if shader == null: return _err("Cannot load shader: %s" % shader_path)
	var mat := ShaderMaterial.new()
	mat.shader = shader
	if node is MeshInstance3D: (node as MeshInstance3D).set_surface_override_material(0, mat)
	elif node is CanvasItem: (node as CanvasItem).material = mat
	else: return _err("Node must be MeshInstance3D or CanvasItem")
	return _ok({"node": node_path, "shader": shader_path})


func _set_shader_param(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	var param: String = params.get("param", "")
	if node_path.is_empty() or param.is_empty() or not params.has("value"): return _err("node_path, param and value are required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat: ShaderMaterial = null
	if node is MeshInstance3D: mat = (node as MeshInstance3D).get_surface_override_material(0) as ShaderMaterial
	elif node is CanvasItem: mat = (node as CanvasItem).material as ShaderMaterial
	if mat == null: return _err("Node has no ShaderMaterial")
	mat.set_shader_parameter(param, GPUtils.parse_value(params["value"]))
	return _ok({"node": node_path, "param": param})


func _get_shader_params(params: Dictionary) -> Dictionary:
	var node_path: String = params.get("path", "")
	if node_path.is_empty(): return _err("node_path is required")
	var node := _find_node(node_path)
	if node == null: return _err("Node not found: %s" % node_path)
	var mat: ShaderMaterial = null
	if node is MeshInstance3D: mat = (node as MeshInstance3D).get_surface_override_material(0) as ShaderMaterial
	elif node is CanvasItem: mat = (node as CanvasItem).material as ShaderMaterial
	if mat == null: return _err("Node has no ShaderMaterial")
	var result: Dictionary = {}
	if mat.shader:
		for param_info in mat.shader.get_shader_uniform_list():
			var pname: String = param_info["name"]
			result[pname] = GPUtils.serialize_value(mat.get_shader_parameter(pname))
	return _ok({"node": node_path, "params": result})
