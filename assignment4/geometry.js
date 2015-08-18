function Geometry(shader, id){
	var me = this;
	this.shader = shader;
	this.id = Number(id);
	this.desc = "Geometry";
	this.start = 0;
	this.length = 0;
	this.color = [1,1,1];
	this.points = [];
	this.translation = [0,0,0];
	this.rotation = [0,0,0];
	this.scale = [1,1,1];
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
function Triangle(shader, id, origin, color){
	Geometry.call(this, shader, id);
	this.desc = "Triangle";
	this.points = [
		vec3(-0.1, -0.1, 0),
		vec3(0, 0.1, 0),
		vec3(0.1, -0.1, 0)		
	];
	this.color = color;
	this.translation = origin;
	this.start = this.shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	if (DEBUG)
		console.log(this);
}
Triangle.prototype = Object.create(Geometry.prototype);
Triangle.prototype.constructor = Triangle;

function Sphere(shader, id, origin, color){
	Geometry.call(this, shader, id);
	this.desc = "Sphere";
	var mMaxLatBands = 20;
	var mMaxLngBands = 20;
	var mRadius = 0.3;
	this.radius = mRadius;
	var points = [];
	this.translation = origin;
	this.color = color;
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
	}
	this.start = shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
			
	if (DEBUG)
		console.log(this);
}
Sphere.prototype = Object.create(Geometry.prototype);
Sphere.prototype.constructor = Sphere;

function Circle (shader, id, origin, color){
	Geometry.call(this, shader, id);
	this.desc = "Circle";
	this.translation = origin;
	this.color = color;	
	var mRadius = 0.3;
	var mSides = 20;
	var mStartAngle = 0;
	var vertices = GCreateNgon(mSides, mStartAngle, mRadius);
	for (var side = 0; side < (mSides - 1); side++){
		var a = vec3(0,0,0);
		var b = vec3(vertices[side+1].x, vertices[side+1].y);
		var c = vec3(vertices[side].x, vertices[side].y);
		this.points.push(a, b, c);
	}
	this.points.push(
		vec3(0,0,0),
		vec3(vertices[0].x, vertices[0].y, 0),
		vec3(vertices[vertices.length-1].x, vertices[vertices.length-1].y, 0)
	);
	this.translation = origin;
	this.start = this.shader.getDataLength();
	this.shader.fillVertexData(flatten(this.points), this.shader.getDataLength(),
		this.points.length);
	this.length = this.points.length;
	if (DEBUG)
		console.log(this);		
	
}
Circle.prototype = Object.create(Geometry.prototype);
Circle.prototype.constructor = Circle;

function Cone(shader, id, origin, color, sides, desc){
	Geometry.call(this, shader, id);
	this.desc = (desc) ? desc : "Cone";
	this.translation = origin;
	this.color = color;	
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

function Cylinder(shader, id, origin, color, sides, desc){
	Geometry.call(this, shader, id);
	this.desc = (desc) ? desc : "Cylinder";
	this.translation = origin;
	this.color = color;	
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