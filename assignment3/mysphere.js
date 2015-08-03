"use strict";
var DEBUG = true;
var canvas, gl;
var DrawMode = { 
	NONE : 0,
	SELECT : 1,
	DRAW_TRIANGLE : 2,
	DRAW_SPHERE : 3,
	DRAW_CONE : 4,
	DRAW_CYLINDER : 5
};
var MODE = DrawMode.DRAW_TRIANGLE;
var MAX_POINTS = Math.pow(2,16);
var GEOMETRIES = [];
var gShaders;

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
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	
	gShaders = new Shaders(gl, MAX_POINTS);

	$('modeCombo').onchange = onModeComboChange;
	$('modeCombo').onkeydown = onModeComboChange;
	canvas.addEventListener('mousedown', onCanvasMouseDown);
	canvas.addEventListener('mousemove', onCanvasMouseMove);

	
		
	render();
	// var sphere = new Sphere();
	// sphere.move();
}
function onModeComboChange(evt){
	var choice = $('modeCombo').value;
	MODE = Number(choice);
}
function selectGeometry(point){
	var foundGeometry = undefined;
	var dx = 4;
	var dy = 4;
	var candidates = [];
	var buffer = new Uint8Array(4*16);
		
	gl.clearColor(0,0,0,1);
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
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
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
function onCanvasMouseDown(evt){
	var point = transMouse2Window(evt);
	var clipPoint = transWindow2Clip(point);
	var cartPoint = transMouse2Cartesian(evt);
	
	var color = getPickerColor();

	var geometryId = GEOMETRIES.length+1;
	if (geometryId>255){
		alert('Max id 255 reached');
		return;
	}
	
	if (MODE === DrawMode.DRAW_TRIANGLE){
		var triangle = new Triangle(geometryId, clipPoint, color);
		GEOMETRIES.push(triangle);
	}
	else if (MODE === DrawMode.DRAW_SPHERE){
		var sphere = new Sphere(geometryId, clipPoint, color);
		GEOMETRIES.push(sphere);
	}
	else if (MODE === DrawMode.SELECT) {
		var geometry = selectGeometry(cartPoint);
		if (geometry != undefined) {
			setPickerColor(geometry.color);
		}
	}

	render();
}
function onCanvasMouseMove(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

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
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);			
			}
			else if (geometry instanceof Sphere){
				// gShaders.setColor(geometry.color);
				gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);
				gShaders.setColor([0,0,0,1]);
				gl.drawArrays(gl.LINE_LOOP, geometry.start, geometry.length);
			}		
		}
		else {
			var color = [geometry.geometryId/255,0,0,1];
			gShaders.setColor(color);
			if (geometry instanceof Triangle){
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
function Triangle(id, origin, color){
	var me = this;
	this.geometryId = Number(id);
	this.start = 0;
	this.length;
	this.color = color;
	this.points = [];
	this.translation = [0,0,0];
	this.origin = origin;
	init();
	function init(){
		me.points = [
			vec3(-0.1 + origin.x, -0.1 + origin.y, 0),
			vec3(0 + origin.x, 0.1 + origin.y, 0),
			vec3(0.1 + origin.x, -0.1 + origin.y, 0)
		];

		me.start = gShaders.getDataLength();
		gShaders.fillVertexData(flatten(me.points), gShaders.getDataLength(), 
			me.points.length);
		me.length = me.points.length;
		if (DEBUG)
			console.log(me);
	}
}
Triangle.prototype.move = function(translation){
	console.log(this.points);
}
function Sphere(id, origin, color){
	var me = this;
	this.geometryId = Number(id);
	this.start = 0;
	this.length;
	this.color = color;
	this.points = [];
	this.translation = [0,0,0];
	this.origin = origin;
	var mMaxLatBands = 10;
	var mMaxLngBands = 10;
	var mRadius = 0.3;
	this.radius = mRadius;
	init();
	function init() {
		var points = [];
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
					mRadius * x + me.origin.x, 
					mRadius * y + me.origin.y, 
					mRadius * z);
				console.log(x,y,z,mRadius,me.origin,point);
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
Sphere.prototype.move = function(){
	console.log('move', this);
}
function Cone (id,origin,color){
	
}
function Cylinder (id, origin, color){
	
}
