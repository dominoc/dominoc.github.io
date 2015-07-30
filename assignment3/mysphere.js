"use strict";
var canvas, gl;
var radius = 1;
var latitudeBands = 30;
var longitudeBands = 30;
var vertexPositionData = [];
var normalData = [];
var $ = function(id){
	return document.getElementById(id);
};

window.onload = init;

function init() {
	
	var shader = new Shader();
	var sphere = new Sphere();
	sphere.move();
	
	console.log(vertexPositionData);
}
function GL(){
	this.gl;
	init();
	function init(){
		
	}
}
function Shader (gl) {
	this.uPointSize;
	this.uTranslation;
	this.uColor;
	this.uScale;
	this.bufferId;
	this.vPosition;
	this.dataLength = 0;
	init();
	function init() {
		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);
		
		this.uPointSize = gl.getUniformLocation(program, "uPointSize");
		this.uTranslation = gl.getUniformLocation(program, "uTranslation");
		this.uColor = gl.getUniformLocation(program, "uColor");
		this.uScale = gl.getUniformLocation(program, "uScale");
		
		this.bufferId = gl.createBuffer();
		gl.bindBuffer (gl.ARRAY_BUFFER, this.bufferId);
		
		this.vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vPosition);
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
function sphere(){
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++){
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		for (var lngNumber = 0; lngNumber <= longitudeBands; lngNumber++){
			var phi = lngNumber * 2 * Math.PI/longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);
			
			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
						
			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			
			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}
}
