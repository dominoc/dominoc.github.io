"use strict";
var canvas, gl;
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
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { 
		alert("WebGL is not available");
		return;
	}
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	
	gShaders = new Shaders(gl, MAX_POINTS);

	canvas.addEventListener('mousedown', onCanvasMouseDown);


	
		
	render();
	// var sphere = new Sphere();
	// sphere.move();
}
function onCanvasMouseDown(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);
	var v = vec2(cpoint.x, cpoint.y);
	
	var rgb = $('colorPicker').color.rgb;
	var color = [];
	var opacity = 1.0;
	color.push(rgb[0], rgb[1], rgb[2], opacity);
	
	var triangle = new Triangle(0, v, color);
	
	GEOMETRIES.push(triangle);
	
	// console.log(GEOMETRIES);
	
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
function render(){
	gl.clear(gl.COLOR_BUFFER_BIT);
	GEOMETRIES.forEach(function(geometry){
		gShaders.setColor(geometry.color);
		console.log(geometry.start, geometry);
		gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);
	});
	window.requestAnimationFrame(render);
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
		
		me.bufferId = me.gl.createBuffer();
		me.gl.bindBuffer (me.gl.ARRAY_BUFFER, me.bufferId);
		me.gl.bufferData ( me.gl.ARRAY_BUFFER, 2*4*me.maxPoints, 
			me.gl.STATIC_DRAW);
		
		me.vPosition = me.gl.getAttribLocation(program, "vPosition");
		var numComponents = 2;
		me.gl.vertexAttribPointer(me.vPosition, numComponents, 
			me.gl.FLOAT, false, 0, 0);
		me.gl.enableVertexAttribArray(me.vPosition);
	}
}
Shaders.prototype.setColor = function(color){
	this.gl.uniform4f(this.uColor, color[0],color[1],color[2],color[3]);
}
Shaders.prototype.fillVertexData = function (offset, data, length){
	// this.gl.bindBuffer(this.ARRAY_BUFFER, this.bufferId);
	var offsetBytes = offset * 2 * 4;
	this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offsetBytes, data);
	this.dataLength += length;
}
Shaders.prototype.getDataLength = function() {
	return this.dataLength;
}
function Triangle(start, origin, color){
	var me = this;
	this.start = start;
	this.length = length;
	this.color = flatten(color);
	this.points = [];
	this.origin = origin;
	init();
	function init(){
		me.points = [
			vec2(-0.5 + origin.x, -0.5 + origin.y),
			vec2(0 + origin.x, 0.5 + origin.y),
			vec2(0.5 + origin.x, -0.5 + origin.y)
		];
		me.start = gShaders.getDataLength();
		gShaders.fillVertexData(gShaders.getDataLength, flatten(me.points),
			me.points.length);
		me.length = me.points.length;
	}
}
function Sphere(){
	var mMaxLatBands = 10;
	var mMaxLngBands = 10;
	var mRadius = 1;
	this.radius = mRadius;
	function init() {
		console.log('sphere init');
		for (var latBand = 0; latBand <= mMaxLatBands; latBand++){
			var theta = latBand * Math.PI / mMaxLatBands;
			var sinTheta = Math.sin(theta);
			var cosTheta = Math.cos(theta);
			for (var lngBand = 0; lngBand <= mMaxLngBands; lngBand++){
				var phi = lngBand * 2 * Math.PI/lngBand;
				var sinPhi = Math.sin(phi);
				var cosPhi = Math.cos(phi);
				
				var x = cosPhi * sinTheta;
				var y = cosTheta;
				var z = sinPhi * sinTheta;
				
				
			}
		}
	}
}
Sphere.prototype.move = function(){
	console.log('move', this);
};
