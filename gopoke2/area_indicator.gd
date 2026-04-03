# area_indicator.gd
# Visual indicator for skill area of effect
extends MeshInstance3D
class_name AreaIndicator

func setup(shape: String, size: Vector3) -> void:
	var m: Mesh
	
	match shape:
		"circle":
			var cyl = CylinderMesh.new()
			cyl.height = size.y if size.y > 0 else 0.1
			cyl.top_radius = size.x
			cyl.bottom_radius = size.x
			m = cyl
		"line":
			var box = BoxMesh.new()
			box.size = size
			m = box
		"cone":
			var cone = CylinderMesh.new()
			cone.height = size.y if size.y > 0 else 0.1
			cone.top_radius = size.x
			cone.bottom_radius = 0.0
			m = cone
		"box":
			var box = BoxMesh.new()
			box.size = size
			m = box
		_:
			var def = BoxMesh.new()
			def.size = size
			m = def

	self.mesh = m
	
	# Transparent red material
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(1, 0, 0, 0.4)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	self.material_override = mat