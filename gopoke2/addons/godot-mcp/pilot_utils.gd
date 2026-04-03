@tool
class_name GPUtils
extends RefCounted

## GPUtils — Gộp NodeUtils + PropertyParser + FSUtils thành một file duy nhất
## Tất cả methods đều là static — dùng: GPUtils.method_name(...)

# ═══════════════════════════════════════════════════════════════════════════════
# MCP RESPONSE HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

## Tạo text content item
static func mcp_text(text: String) -> Dictionary:
	return {"type": "text", "text": text}

## Tạo image content item (base64)
static func mcp_image(base64: String, mime: String = "image/png") -> Dictionary:
	return {"type": "image", "data": base64, "mimeType": mime}

## Trả về success response với content array (MCP format)
## Usage: return GPUtils.mcp_ok([GPUtils.mcp_text("done"), GPUtils.mcp_image(b64)])
static func mcp_ok(content: Array) -> Dictionary:
	return {"result": {"_mcp_content": true, "content": content}}

## Shortcut: trả về 1 text content
static func mcp_ok_text(text: String) -> Dictionary:
	return {"result": {"_mcp_content": true, "content": [{"type": "text", "text": text}]}}

## Shortcut: trả về data dưới dạng JSON text (tương thích format cũ nhưng qua MCP content)
static func mcp_ok_json(data: Dictionary) -> Dictionary:
	return {"result": {"_mcp_content": true, "content": [{"type": "text", "text": JSON.stringify(data, "  ")}]}}

## Error response
static func mcp_err(msg: String, code: int = -1) -> Dictionary:
	return {"error": {"code": code, "message": msg}}


# ═══════════════════════════════════════════════════════════════════════════════
# NODE UTILS
# ═══════════════════════════════════════════════════════════════════════════════

## Set owner đệ quy cho tất cả children (cần thiết khi add node bằng code)
static func set_owner_recursive(node: Node, owner: Node) -> void:
	for child in node.get_children():
		child.owner = owner
		set_owner_recursive(child, owner)


## Serialize scene tree thành Dictionary
static func get_node_tree(node: Node, max_depth: int = -1, current_depth: int = 0, root: Node = null) -> Dictionary:
	if root == null:
		root = node
	var result := {
		"name": node.name,
		"type": node.get_class(),
		"path": "." if node == root else str(root.get_path_to(node)),
	}
	var script: Script = node.get_script()
	if script:
		result["script"] = script.resource_path

	if max_depth == -1 or current_depth < max_depth:
		var children: Array = []
		for child in node.get_children():
			children.append(get_node_tree(child, max_depth, current_depth + 1, root))
		if not children.is_empty():
			result["children"] = children

	return result


## Lấy tất cả properties của node dưới dạng Dictionary JSON-safe
static func get_node_properties_dict(node: Node) -> Dictionary:
	var result: Dictionary = {}
	for prop_info in node.get_property_list():
		var prop_name: String = prop_info["name"]
		var usage: int = prop_info["usage"]
		if not (usage & PROPERTY_USAGE_EDITOR):
			continue
		if prop_name.begins_with("_") or prop_name == "script":
			continue
		result[prop_name] = serialize_value(node.get(prop_name))
	return result


## Tìm tất cả nodes khớp predicate
static func find_nodes(root: Node, predicate_fn: Callable, recursive: bool = true) -> Array[Node]:
	var results: Array[Node] = []
	_collect_nodes(root, predicate_fn, recursive, results)
	return results


static func _collect_nodes(node: Node, fn: Callable, recursive: bool, out: Array[Node]) -> void:
	if fn.call(node):
		out.append(node)
	if recursive:
		for child in node.get_children():
			_collect_nodes(child, fn, recursive, out)


# ═══════════════════════════════════════════════════════════════════════════════
# PROPERTY PARSER
# ═══════════════════════════════════════════════════════════════════════════════

## Parse một value thành Godot type phù hợp
## Ưu tiên str_to_var() cho tất cả Variant types, fallback manual parse cho dict/hex formats
static func parse_value(value: Variant, target_type: int = TYPE_NIL) -> Variant:
	if value == null:
		return null

	# Non-string values: chỉ cần convert type nếu cần
	if not value is String:
		if target_type == TYPE_NIL:
			return value
		match target_type:
			TYPE_BOOL: return bool(value)
			TYPE_INT: return int(value)
			TYPE_FLOAT: return float(value)
			TYPE_STRING: return str(value)
			TYPE_VECTOR2:
				if value is Dictionary:
					var d: Dictionary = value
					return Vector2(float(d.get("x", 0)), float(d.get("y", 0)))
			TYPE_VECTOR2I:
				if value is Dictionary:
					var d: Dictionary = value
					return Vector2i(int(d.get("x", 0)), int(d.get("y", 0)))
			TYPE_VECTOR3:
				if value is Dictionary:
					var d: Dictionary = value
					return Vector3(float(d.get("x", 0)), float(d.get("y", 0)), float(d.get("z", 0)))
			TYPE_VECTOR3I:
				if value is Dictionary:
					var d: Dictionary = value
					return Vector3i(int(d.get("x", 0)), int(d.get("y", 0)), int(d.get("z", 0)))
			TYPE_RECT2:
				if value is Dictionary:
					var d: Dictionary = value
					return Rect2(float(d.get("x", 0)), float(d.get("y", 0)),
						float(d.get("w", d.get("width", 0))), float(d.get("h", d.get("height", 0))))
			TYPE_COLOR:
				if value is Dictionary:
					var d: Dictionary = value
					return Color(float(d.get("r", 1)), float(d.get("g", 1)), float(d.get("b", 1)), float(d.get("a", 1)))
			TYPE_ARRAY:
				if value is Array: return value
				return [value]
			TYPE_DICTIONARY:
				if value is Dictionary: return value
				return {}
			TYPE_NODE_PATH: return NodePath(str(value))
		return value

	# String values: try str_to_var() first, then fallback
	var s: String = value

	# Handle hex colors — str_to_var() doesn't support these
	if s.begins_with("#"):
		if Color.html_is_valid(s):
			return Color.html(s)
		return s

	# Handle bool strings — str_to_var() doesn't parse "yes"/"no"
	if target_type == TYPE_BOOL:
		return s.to_lower() in ["true", "1", "yes"]
	if target_type == TYPE_STRING:
		return s
	if target_type == TYPE_NODE_PATH:
		return NodePath(s)

	# Try str_to_var() — handles Vector2, Vector3, Color, Transform2D, Transform3D,
	# Quaternion, Basis, AABB, Plane, Rect2, and all other Variant types
	var parsed = str_to_var(s)
	if parsed != null:
		# Validate type match if target specified
		if target_type != TYPE_NIL and typeof(parsed) != target_type:
			# Type mismatch — try basic conversions
			match target_type:
				TYPE_INT: return int(parsed) if parsed is float else int(s) if s.is_valid_int() else 0
				TYPE_FLOAT: return float(parsed)
			# If str_to_var parsed it but wrong type, still return it
			# (e.g. target expects Vector2 but got Vector2i — close enough)
		return parsed

	# Fallback for simple types str_to_var() returns null for
	if s == "true": return true
	if s == "false": return false
	if s.is_valid_int(): return s.to_int()
	if s.is_valid_float(): return s.to_float()
	return s




## Serialize Variant → JSON-safe value
static func serialize_value(value: Variant) -> Variant:
	if value == null: return null
	match typeof(value):
		TYPE_VECTOR2:
			var v: Vector2 = value
			return {"x": v.x, "y": v.y}
		TYPE_VECTOR2I:
			var v: Vector2i = value
			return {"x": v.x, "y": v.y}
		TYPE_VECTOR3:
			var v: Vector3 = value
			return {"x": v.x, "y": v.y, "z": v.z}
		TYPE_VECTOR3I:
			var v: Vector3i = value
			return {"x": v.x, "y": v.y, "z": v.z}
		TYPE_RECT2:
			var r: Rect2 = value
			return {"x": r.position.x, "y": r.position.y, "width": r.size.x, "height": r.size.y}
		TYPE_COLOR:
			var c: Color = value
			return {"r": c.r, "g": c.g, "b": c.b, "a": c.a, "html": "#" + c.to_html()}
		TYPE_NODE_PATH:
			return str(value)
		TYPE_OBJECT:
			if value is Resource:
				var res: Resource = value
				return {"type": res.get_class(), "path": res.resource_path}
			return str(value)
		TYPE_ARRAY:
			var arr: Array = value
			var result: Array = []
			for item in arr:
				result.append(serialize_value(item))
			return result
		TYPE_DICTIONARY:
			var dict: Dictionary = value
			var result: Dictionary = {}
			for key in dict:
				result[str(key)] = serialize_value(dict[key])
			return result
		_:
			return value


# ═══════════════════════════════════════════════════════════════════════════════
# FS UTILS
# ═══════════════════════════════════════════════════════════════════════════════

## Tìm đệ quy files khớp filter_fn
## filter_fn: Callable(full_path: String) -> bool
## max_results: -1 = không giới hạn
static func find_files(
	path: String,
	filter_fn: Callable,
	max_results: int = -1,
	exclude_dirs: PackedStringArray = []
) -> Array[String]:
	var results: Array[String] = []
	_walk_files(path, filter_fn, max_results, exclude_dirs, results)
	return results


static func _walk_files(
	path: String,
	filter_fn: Callable,
	max: int,
	excludes: PackedStringArray,
	out: Array[String]
) -> void:
	if max >= 0 and out.size() >= max:
		return
	var dir := DirAccess.open(path)
	if dir == null:
		return
	dir.list_dir_begin()
	var name := dir.get_next()
	while not name.is_empty():
		if not name.begins_with("."):
			var full := path.path_join(name)
			if dir.current_is_dir():
				if name not in excludes:
					_walk_files(full, filter_fn, max, excludes, out)
			elif filter_fn.call(full):
				out.append(full)
				if max >= 0 and out.size() >= max:
					dir.list_dir_end()
					return
		name = dir.get_next()
	dir.list_dir_end()


## Tìm pattern trong các text file
## Trả về Array of {file, lines: [line_numbers]}
static func search_in_files(
	path: String,
	pattern: String,
	file_extensions: PackedStringArray,
	max_results: int = 100,
	exclude_dirs: PackedStringArray = [],
	max_lines_per_file: int = 5
) -> Array:
	var ext_set: Array = Array(file_extensions)
	var files := find_files(path,
		func(p: String) -> bool: return p.get_extension() in ext_set,
		-1, exclude_dirs)
	var matches: Array = []
	for full_path: String in files:
		if matches.size() >= max_results:
			break
		var file := FileAccess.open(full_path, FileAccess.READ)
		if file == null:
			continue
		var content := file.get_as_text()
		file.close()
		if not content.contains(pattern):
			continue
		var lines := content.split("\n")
		var line_nums: Array = []
		for i in lines.size():
			if lines[i].contains(pattern):
				line_nums.append(i + 1)
				if line_nums.size() >= max_lines_per_file:
					break
		matches.append({"file": full_path, "lines": line_nums})
	return matches
