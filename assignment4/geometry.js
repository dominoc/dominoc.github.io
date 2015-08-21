function Geometry(shader, id){
	var me = this;
	this.shader = shader;
	this.id = Number(id);
	this.desc = "Geometry";
	this.start = 0;
	this.length = 0;
	this.color = [1,1,1];
	this.points = [];
	this.normals = [];
	this.translation = [0,0,0];
	this.rotation = [0,0,0];
	this.scale = [1,1,1];
	this.material = {
		ambient : [1,0,1,1],
		diffuse : [1,0.8,0,1],
		specular : [1,0.8,0.1,1],
		shininess : 100
	};
	
}
Geometry.prototype.setColor = function(color){
	this.color = color;
	this.material.diffuse = color;
}
Geometry.prototype.setAmbient = function(ambient){
	this.material.ambient = ambient;
}
Geometry.prototype.setDiffuse = function(diffuse){
	this.material.diffuse = diffuse;
	this.color = diffuse;
}
Geometry.prototype.setSpecular = function(specular){
	this.material.specular = specular;
}
Geometry.prototype.setShininess = function(shininess){
	this.material.shininess = Number(shininess);
}
Geometry.prototype.setScale = function(scale){
	this.scale = scale;
}
Geometry.prototype.setTranslation = function(translation){
	this.translation = translation;
}
Geometry.prototype.setRotation = function(rotation){
	this.rotation = rotation;
}
function GCreateNgon (n, startAngle, r1) {
	var vertices = [];
	var dA = Math.PI * 2 / n;
	var angle;
	var r = 0.9;
	if (arguments.length === 3) {
		r = r1;
	}
	for (var i=0; i<n; i++){
		angle = startAngle + dA*i;
		vertices.push(
			{ x : r*Math.cos(angle), 
				y : r*Math.sin(angle)
			});
	}
	return vertices;
}

function Sphere(shader, id, origin, material){
	Geometry.call(this, shader, id);
	this.desc = "Sphere";
	var mMaxLatBands = 20;
	var mMaxLngBands = 20;
	var mRadius = 0.3;
	this.radius = mRadius;
	var points = [];
	var normals = [];
	this.translation = origin;
	this.color = material.diffuse;
	this.material = material;
	for (var latBand = 0; latBand <= mMaxLatBands; latBand++){
		var theta = latBand * Math.PI / mMaxLatBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		for (var lngBand = 0; lngBand <= mMaxLngBands; lngBand++){
			var phi = lngBand * 2 * Math.PI/ mMaxLngBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);
			
			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			
			normals.push(x,y,z);
				
			var point = vec3(
				mRadius * x, 
				mRadius * y, 
				mRadius * z);
			points.push(point);
		}
	}

	var pointIndexes = [];
	for (var latBand = 0; latBand < mMaxLatBands; latBand++)
		for (var lngBand = 0; lngBand < mMaxLngBands; lngBand++){
			var first = (latBand * (mMaxLngBands + 1)) + lngBand;
			var second = first + mMaxLngBands + 1;
			pointIndexes.push(first);
			pointIndexes.push(second);
			pointIndexes.push(first+1);
			pointIndexes.push(second);
			pointIndexes.push(second+1);
			pointIndexes.push(first+1);
		}
	for (var i=0; i< pointIndexes.length; i++){
		this.points.push(points[pointIndexes[i]]);
		this.normals.push(normals[pointIndexes[i]]);
	}
	this.start = shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	this.shader.fillNormalData(flatten(this.normals), shader.getNormalDataLength(),
		this.normals.length);
			
	if (DEBUG)
		console.log(this);
}
Sphere.prototype = Object.create(Geometry.prototype);
Sphere.prototype.constructor = Sphere;

function ShadedSphere (shader, id, origin, material){
	Geometry.call(this, shader, id);
	var me = this;
	this.desc = "ShadedSphere";
	this.translation = origin;
	this.color = material.diffuse;
	this.material = material;
	var va = vec3(0,0,-1);
	var vb = vec3(0,0.942809, 0.333333);
	var vc = vec3(-0.816497, -0.471405, 0.333333);
	var vd = vec3(0.816497, -0.471405, 0.333333);
	var index = 0;
	var numTimesToSubdivide = 3;
	
	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
 
	function triangle(a,b,c){
		me.points.push(a,b,c);
	    me.normals.push(a[0],a[1], a[2]);
    	me.normals.push(b[0],b[1], b[2]);
     	me.normals.push(c[0],c[1], c[2]);
		index += 3;
	}
	function divideTriangle(a,b,c,count){
		if ( count > 0 ) {
	
			var ab = mix( a, b, 0.5);
			var ac = mix( a, c, 0.5);
			var bc = mix( b, c, 0.5);
	
			ab = normalize(ab, true);
			ac = normalize(ac, true);
			bc = normalize(bc, true);
	
			divideTriangle( a, ab, ac, count - 1 );
			divideTriangle( ab, b, bc, count - 1 );
			divideTriangle( bc, c, ac, count - 1 );
			divideTriangle( ab, bc, ac, count - 1 );
		}
		else {
			triangle( a, b, c );
		}			
	}
	function tetrahedron(a, b, c, d, n) {
		divideTriangle(a, b, c, n);
		divideTriangle(d, c, b, n);
		divideTriangle(a, d, b, n);
		divideTriangle(a, c, d, n);
	}
	this.start = shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	this.shader.fillNormalData(flatten(this.normals), shader.getNormalDataLength(),
		this.normals.length);
			
	if (DEBUG)
		console.log(this);
	
}
ShadedSphere.prototype = Object.create(Geometry.prototype);
ShadedSphere.prototype.constructor = ShadedSphere;

function Cone(shader, id, origin, material, sides, desc){
	Geometry.call(this, shader, id);
	this.desc = (desc) ? desc : "Cone";
	this.translation = origin;
	this.color = material.diffuse;
	this.material = material;
	var mRadius = 0.3;
	var mSides = sides;
	var mStartAngle = 0;
	var mHeight = mRadius * 2;
	var vertices = GCreateNgon(mSides, mStartAngle, mRadius);
	//bottom flat face
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(0,0,0);
		var b = vec3(vertices[side].x, 0, vertices[side].y);
		var c = vec3(vertices[side+1].x, 0, vertices[side+1].y);
		this.points.push(a, b, c);
	}
	this.points.push(
		vec3(0, 0, 0),
		vec3(vertices[vertices.length-1].x, 0, vertices[vertices.length-1].y),
		vec3(vertices[0].x, 0, vertices[0].y)
	);

	//sides		
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(0,mHeight,0);
		var b = vec3(vertices[side+1].x, 0, vertices[side+1].y);
		var c = vec3(vertices[side].x, 0, vertices[side].y);
		this.points.push(a, b, c);
	}
	this.points.push(
		vec3(0,mHeight,0),
		vec3(vertices[0].x,0, vertices[0].y),
		vec3(vertices[vertices.length-1].x, 0, vertices[vertices.length-1].y)
	);

	this.start = shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), this.shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	if (DEBUG)
		console.log(this);		
}
Cone.prototype = Object.create(Geometry.prototype);
Cone.prototype.constructor = Cone;

function Cylinder(shader, id, origin, material, sides, desc){
	Geometry.call(this, shader, id);
	this.desc = (desc) ? desc : "Cylinder";
	this.translation = origin;
	this.color = material.diffuse;
	this.material = material;
	var mRadius = 0.3;
	var mSides = sides;
	var mStartAngle = 0;
	var mHeight = mRadius * 2;
	var vertices = GCreateNgon(mSides, mStartAngle, mRadius);
	//bottom flat face
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(0,0,0);
		var b = vec3(vertices[side].x, 0, vertices[side].y);
		var c = vec3(vertices[side+1].x, 0, vertices[side+1].y);
		this.points.push(a, b, c);
	}
	this.points.push(
		vec3(0, 0, 0),
		vec3(vertices[vertices.length-1].x, 0, vertices[vertices.length-1].y),
		vec3(vertices[0].x, 0, vertices[0].y)
	);
	//top face
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(0,mHeight,0);
		var b = vec3(vertices[side+1].x, mHeight, vertices[side+1].y);
		var c = vec3(vertices[side].x, mHeight, vertices[side].y);
		this.points.push(a, b, c);
	}
	this.points.push(
		vec3(0, mHeight, 0),
		vec3(vertices[0].x, mHeight, vertices[0].y),
		vec3(vertices[vertices.length-1].x, mHeight, vertices[vertices.length-1].y)
	);

	//sides		
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(vertices[side].x,0,vertices[side].y);
		var b = vec3(vertices[side].x, mHeight, vertices[side].y);
		var c = vec3(vertices[side+1].x, mHeight, vertices[side+1].y);
		var d = vec3(vertices[side+1].x, 0, vertices[side+1].y);
		this.points.push(a, b, c);
		this.points.push(a, c, d);
	}
	this.points.push(
		vec3(vertices[vertices.length-1].x, 0, vertices[vertices.length-1].y),
		vec3(vertices[vertices.length-1].x, mHeight, vertices[vertices.length-1].y),
		vec3(vertices[0].x, 0, vertices[0].y)
	);
	this.points.push(
		vec3(vertices[vertices.length-1].x, mHeight, vertices[vertices.length-1].y),
		vec3(vertices[0].x,mHeight, vertices[0].y),
		vec3(vertices[0].x, 0, vertices[0].y)
	);

	this.start = this.shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), this.shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	if (DEBUG)
		console.log(this);
}
Cylinder.prototype = Object.create(Geometry.prototype);
Cylinder.prototype.constructor = Cylinder;

function Line (shader, id, origin, color){
	Geometry.call(this, shader, id);
	this.desc = "Line";
	this.translation = origin;
	this.color = color;	
	this.points = [
		vec3(-10,0,0),
		vec3(0,0,0),
		vec3(10,0,0)
	];
	this.start = this.shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), this.shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	if (DEBUG)
		console.log(this);
}
Line.prototype = Object.create(Geometry.prototype);
Line.prototype.constructor = Line;