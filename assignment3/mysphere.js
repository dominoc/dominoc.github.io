"use strict";
var DEBUG = true;
var canvas, gl;
var DrawMode = { 
	NONE : 0,
	INFO : 1,
	DRAW_TRIANGLE : 2,
	DRAW_SPHERE : 3,
	DRAW_CONE : 4,
	DRAW_CYLINDER : 5,
	MOVE : 6
};
var MODE = DrawMode.DRAW_TRIANGLE;
var COLORS = {
	CANVAS : [0.8, 0.8, 0.8, 1.0],
	BLACK : [0, 0, 0, 1],
	WIREFRAME : [0, 0, 0, 1],
	HIGHLIGHT : [0, 1, 0, 1]
}
var MAX_POINTS = Math.pow(2,16);
var GEOMETRIES = [];
var gShaders;
var gActiveGeometry = undefined;

var vertexPositionData = [];

var $ = function(id){
	return document.getElementById(id);
};

window.onload = init;

function init() {
	
	canvas = $('gl-canvas');
	var options = {alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true};
	gl = WebGLUtils.setupWebGL(canvas, options);
	if (!gl) { 
		alert("WebGL is not available");
		return;
	}
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(COLORS.CANVAS[0], 
		COLORS.CANVAS[1], COLORS.CANVAS[2], COLORS.CANVAS[3]);
	
	gShaders = new Shaders(gl, MAX_POINTS);

	$('scalePicker').onchange = onScalePickerChange;
	$('xRotPicker').onchange = onXRotPickerChange;
	$('yRotPicker').onchange = onYRotPickerChange;
	$('zRotPicker').onchange = onZRotPickerChange;
	$('modeCombo').onchange = onModeComboChange;
	$('modeCombo').onkeydown = onModeComboChange;
	canvas.addEventListener('mousedown', onCanvasMouseDown);
	canvas.addEventListener('mousemove', onCanvasMouseMove);
	canvas.addEventListener('mouseup', onCanvasMouseUp);
	canvas.addEventListener('mouseout', onCanvasMouseOut);
	canvas.addEventListener('mousewheel', onCanvasMouseWheel);

	
		
	render();
	// var sphere = new Sphere();
	// sphere.move();
}
function onXRotPickerChange(evt){
	var label = $('labelXRot');
	label.innerHTML = String($('xRotPicker').value);
}
function onYRotPickerChange(evt){
	var label = $('labelYRot');
	label.innerHTML = String($('yRotPicker').value);
}
function onZRotPickerChange(evt){
	var label = $('labelZRot');
	label.innerHTML = String($('zRotPicker').value);
}
function onScalePickerChange(evt){
	var label = $('labelScale');
	label.innerHTML = String($('scalePicker').value);
}
function onModeComboChange(evt){
	var choice = $('modeCombo').value;
	var status = $('statusLabel');
	MODE = Number(choice);
	if (MODE === DrawMode.NONE){
		status.innerHTML = 'Ready';
	}
	else if (MODE === DrawMode.INFO){
		status.innerHTML = "Click a geometry to show details";
	}
	else if (MODE === DrawMode.DRAW_TRIANGLE){
		status.innerHTML = 'Click on the canvas to place a triangle';
	}
	else if (MODE === DrawMode.DRAW_SPHERE){
		status.innerHTML = 'Click on the canvas to place a sphere';
	}
	else if (MODE === DrawMode.DRAW_CONE) {
		status.innerHTML = 'Click on the canvas to place a cone';
	}
	else if (MODE === DrawMode.DRAW_CYLINDER){
		status.innerHTML = 'Click on the canvas to place a cylinder';
	}
	else if (MODE === DrawMode.MOVE){
		status.innerHTML = 'Drag on a geometry to move';
	}
}
function selectGeometry(point){
	var foundGeometry = undefined;
	var dx = 4;
	var dy = 4;
	var candidates = [];
	var buffer = new Uint8Array(4*16);
		
	gl.clearColor(COLORS.BLACK[0], COLORS.BLACK[1], COLORS.BLACK[2],
		COLORS.BLACK[3]);
	render(true);
	
	gl.readPixels(point.x - dx/2, point.y + dy/2, dx, dy, gl.RGBA, 
		gl.UNSIGNED_BYTE, buffer);
		
	for (var i=0; i < 64; i+=4){
		if (buffer[i] > 0) {
			var id = String(buffer[i]);
			if (candidates.indexOf(id)==-1)
				candidates.push(id);
		}
	}
	gl.clearColor(COLORS.CANVAS[0],COLORS.CANVAS[1],COLORS.CANVAS[2],
		COLORS.CANVAS[3]);
	render();
	if (candidates.length == 0) {
		//Nothing found
	}
	else {
		var candidateId = Number(candidates[0]);
		GEOMETRIES.forEach(function(geometry){
			if (geometry.geometryId === candidateId){
				foundGeometry = geometry;
				return;
			}
		})		
	}
	return foundGeometry;
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function setPickerValue(id, labelId, value){
	var picker = $(id);
	var label = $(labelId);
	if (picker)
		picker.value = Number(value);
	if (label)
		label.innerHTML = String(value);
}
function getPickerValue(id, defaultValue){
	var picker = $(id);
	if (picker)
		return picker.value;
	else
		return defaultValue;
}
function setPickerColor(rgba){
	var picker = $('colorPicker');
	var r = Math.ceil(rgba[0]*255);
	var g = Math.ceil(rgba[1]*255);
	var b = Math.ceil(rgba[2]*255);
	var color = String(rgbToHex(r,g,b)).toUpperCase();
	picker.value = color;
	picker.color.fromString(color);
}
function getPickerColor(){
	var rgb = $('colorPicker').color.rgb;
	var color = [];
	var opacity = 1.0;
	color.push(rgb[0], rgb[1], rgb[2], opacity);
	return color;
}
function showGeometryInfo(geometry){
	var infoBox = $('infoTextArea');

	infoBox.value = "";
	var msg = '';
	if (geometry instanceof Sphere){
		msg += "Sphere" + '\n';
		msg += "Id: " + geometry.geometryId + '\n';
	}
	else if (geometry instanceof Cone){
		msg += "Cone" + '\n';
		msg += "Id: " + geometry.geometryId + '\n';
	}
	else if (geometry instanceof Cylinder){
		msg += "Cylinder" + '\n';
		msg += "Id: " + geometry.geometryId + '\n';		
	}
	else if (geometry instanceof Triangle){
		msg += "Triangle" + '\n'; 
		msg += "Id: " + geometry.geometryId + '\n';		
	}
	infoBox.value = msg;
}
function onCanvasMouseDown(evt){
	var point = transMouse2Window(evt);
	var clipPoint = transWindow2Clip(point);
	var cartPoint = transMouse2Cartesian(evt);
	
	var color = getPickerColor();
	var scale = getPickerValue('scalePicker', 1);
	var xRot = getPickerValue('xRotPicker', 0);
	var yRot = getPickerValue('yRotPicker', 0);
	var zRot = getPickerValue('zRotPicker',0);

	var geometryId = GEOMETRIES.length+1;
	if (geometryId>255){
		alert('Max id 255 reached');
		return;
	}
	
	if (MODE === DrawMode.DRAW_TRIANGLE){
		var triangle = new Triangle(geometryId, 
			[clipPoint.x, clipPoint.y, 0], color);
		triangle.setScale([scale,scale,scale]);
		triangle.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(triangle);
	}
	else if (MODE === DrawMode.DRAW_SPHERE){
		var sphere = new Sphere(geometryId, 
			[clipPoint.x, clipPoint.y, 0], color);
		sphere.setScale([scale,scale,scale]);
		sphere.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(sphere);
	}
	else if (MODE === DrawMode.DRAW_CONE){
		var cone = new Cone(geometryId,
			[clipPoint.x, clipPoint.y, 0], color);
		
	}
	else if (MODE === DrawMode.INFO) {
		var geometry = selectGeometry(cartPoint);
		if (geometry != undefined) {
			showGeometryInfo(geometry);
			setPickerValue('xRotPicker','labelXRot', geometry.rotation[0]);
			setPickerValue('yRotPicker','labelYRot', geometry.rotation[1]);
			setPickerValue('zRotPicker','labelZRot', geometry.rotation[2]);
			setPickerValue('scalePicker','labelScale', geometry.scale[0]);
			setPickerColor(geometry.color);
		}
	}
	else if (MODE === DrawMode.MOVE) {
		gActiveGeometry = undefined;
		var geometryToMove = selectGeometry(cartPoint);
		if (geometryToMove != undefined) {
			gActiveGeometry = geometryToMove;
			showGeometryInfo(gActiveGeometry);
			setPickerValue('xRotPicker','labelXRot', gActiveGeometry.rotation[0]);
			setPickerValue('yRotPicker','labelYRot', gActiveGeometry.rotation[1]);
			setPickerValue('zRotPicker','labelZRot', gActiveGeometry.rotation[2]);
			setPickerValue('scalePicker','labelScale', gActiveGeometry.scale[0]);
			setPickerColor(gActiveGeometry.color);			
		}
	}

	render();
}
function onCanvasMouseMove(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE == DrawMode.MOVE){
		if (gActiveGeometry){
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, 0]);
		}
	}
	render();	
}
function onCanvasMouseUp(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE == DrawMode.MOVE){
		if (gActiveGeometry){
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, 0]);
			gActiveGeometry = undefined;
		}
	}
	render();		
}
function onCanvasMouseWheel(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE == DrawMode.MOVE){
		if (gActiveGeometry){
			var delta = evt.detail ? evt.detail*(-120) : evt.wheelDelta;
			delta = gActiveGeometry.translation[2] + delta / 1200;
			console.log(delta);	
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, delta]);
			evt.preventDefault();
		}
	}
	render();			
}
function onCanvasMouseOut(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE == DrawMode.MOVE){
		if (gActiveGeometry){
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, 0]);
		}
	}
	render();		
}
function transMouse2Window(evt){
	var bndClientRect = evt.target.getBoundingClientRect();
	var point = {};
	point.x = (evt.clientX - bndClientRect.left);
	point.y = (evt.clientY - bndClientRect.top);
	return point;
}
function transWindow2Clip(point){
	var cpoint = {};
	cpoint.x = 2 * point.x / canvas.width - 1;
	cpoint.y = -1 + 2 * (canvas.height - point.y)/canvas.height;
	return cpoint;
}
function transMouse2Cartesian(evt){
	var bndClientRect = evt.target.getBoundingClientRect();
	var point = {};
	point.x = (evt.clientX - bndClientRect.left);
	point.y = (bndClientRect.bottom - evt.clientY);
	return point;
}
function render(offline){
	
	offline = (offline) ? offline : false;
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	GEOMETRIES.forEach(function(geometry){
		if (offline === false){
			gShaders.setColor(geometry.color);
			if (geometry instanceof Triangle){
				gShaders.setRotation(geometry.rotation);
				gShaders.setTranslation(geometry.translation);
				gShaders.setScale(geometry.scale);
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);			
			}
			else if (geometry instanceof Sphere){
				gShaders.setRotation(geometry.rotation);
				gShaders.setTranslation(geometry.translation);
				gShaders.setScale(geometry.scale);
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);
				gShaders.setColor(COLORS.WIREFRAME);
				gl.drawArrays(gl.LINE_LOOP, geometry.start, geometry.length);
			}		
		}
		else {
			var color = [geometry.geometryId/255,0,0,1];
			gShaders.setColor(color);
			if (geometry instanceof Triangle){
				gShaders.setRotation(geometry.rotation);
				gShaders.setTranslation(geometry.translation);
				gShaders.setScale(geometry.scale);
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);
			}
			else if (geometry instanceof Sphere){
				gShaders.setRotation(geometry.rotation);
				gShaders.setTranslation(geometry.translation);				
				gShaders.setScale(geometry.scale);
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);
			}
		}

	});
	// window.requestAnimationFrame(render);
}
var Shaders = Shaders || {};
Shaders = function (gl, maxPoints) {
	var me = this;
	this.uTranslation;
	this.uRotation;
	this.uColor;
	this.uScale;
	this.bufferId;
	this.vPosition;
	this.dataLength = 0;
	this.gl = gl;
	this.maxPoints = maxPoints;
	init();
	function init() {
		var program = initShaders(me.gl, "vertex-shader", "fragment-shader");	
		me.gl.useProgram(program);

		me.uColor = me.gl.getUniformLocation(program, "uColor");
		me.uTranslation = me.gl.getUniformLocation(program, "uTranslation");
		me.uScale = me.gl.getUniformLocation(program, "uScale");
		me.uRotation = me.gl.getUniformLocation(program, "uRotation");
		
		me.bufferId = me.gl.createBuffer();
		me.gl.bindBuffer (me.gl.ARRAY_BUFFER, me.bufferId);
		me.gl.bufferData ( me.gl.ARRAY_BUFFER, 3*4*me.maxPoints, 
			me.gl.STATIC_DRAW);
		
		me.vPosition = me.gl.getAttribLocation(program, "vPosition");
		var numComponents = 3;
		me.gl.vertexAttribPointer(me.vPosition, numComponents, 
			me.gl.FLOAT, false, 0, 0);
		me.gl.enableVertexAttribArray(me.vPosition);
	}
}
Shaders.prototype.setRotation = function(rotation){
	this.gl.uniform3f(this.uRotation, rotation[0], rotation[1], rotation[2]);
}
Shaders.prototype.setScale = function(scale) {
	this.gl.uniform3f(this.uScale, scale[0], scale[1], scale[2]);
}
Shaders.prototype.setColor = function(color){
	this.gl.uniform4f(this.uColor, color[0],color[1],color[2],color[3]);
}
Shaders.prototype.setTranslation = function(dxdydz){
	this.gl.uniform3f(this.uTranslation, dxdydz[0], dxdydz[1], dxdydz[2] );
}
Shaders.prototype.fillVertexData = function (data, offset, length){
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferId);
	var offsetBytes = offset * 3 * 4;
	this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offsetBytes, data);
	this.dataLength += length;
}
Shaders.prototype.getDataLength = function() {
	return this.dataLength;
}
function createNgon (n, startAngle, r1) {
	var vertices = [];
	var dA = Math.PI * 2 / n;
	var angle;
	var r = 0.9;
	if (arguments.length === 3) {
		r = r1;
	}
	for (var i=0; i<n; i++){
		angle = startAngle + dA*i;
		vertices.push([r*Math.cos(angle), r*Math.sin(angle)]);
	}
	return vertices;
}
function Triangle(id, origin, color){
	var me = this;
	this.geometryId = Number(id);
	this.start = 0;
	this.length;
	this.color = color;
	this.points = [];
	this.translation = [0,0,0];
	this.rotation = [0,0,0];
	// this.origin = origin;
	this.scale = [1,1,1];
	init();
	function init(){
		me.points = [
			vec3(-0.1, -0.1, 0),
			vec3(0, 0.1, 0),
			vec3(0.1, -0.1, 0)
		];

		me.translation = origin;
		me.start = gShaders.getDataLength();
		gShaders.fillVertexData(flatten(me.points), gShaders.getDataLength(), 
			me.points.length);
		me.length = me.points.length;
		if (DEBUG)
			console.log(me);
	}
}
Triangle.prototype.setScale = function(scale){
	this.scale = scale;
}
Triangle.prototype.setTranslation = function(translation){
	this.translation = translation;
}
Triangle.prototype.setRotation = function(rotation){
	this.rotation = rotation;
}
function Sphere(id, origin, color){
	var me = this;
	this.geometryId = Number(id);
	this.start = 0;
	this.length;
	this.scale = [1,1,1];
	this.rotation = [0,0,0];
	this.color = color;
	this.points = [];
	this.translation = [0,0,0];
	// this.origin = origin;
	var mMaxLatBands = 10;
	var mMaxLngBands = 10;
	var mRadius = 0.3;
	this.radius = mRadius;
	init();
	function init() {
		var points = [];
		me.translation = origin;
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
			me.points.push(points[pointIndexes[i]]);
		}
		me.start = gShaders.getDataLength();
		gShaders.fillVertexData(flatten(me.points), gShaders.getDataLength(),
			me.points.length);
		me.length = me.points.length;
				
		if (DEBUG)
			console.log(me);
	}
}
Sphere.prototype.setScale = function(scale){
	this.scale = scale;
}
Sphere.prototype.setTranslation = function(translation){
	this.translation = translation;
}
Sphere.prototype.setRotation = function(rotation){
	this.rotation = rotation;
}
function Cone (id,origin,color){
	var me = this;
	this.geometryId = Number(id);
	this.start = 0;
	this.length;
	this.color = color;
	this.points = [];
	this.translation = [0,0,0];
	this.rotation = [0,0,0];
	this.scale = [1,1,1];
	var mRadius = 0.3;
	var mHeight = 0.3;
	init();
	function init(){
		me.translation = origin;
		me.start = gShaders.getDataLength();
		var baseVertices = createNgon(5, 0, mRadius);
		console.log(baseVertices);
	}
}
function Cylinder (id, origin, color){
	
}
