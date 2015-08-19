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
	MOVE : 6,
	DRAW_CIRCLE : 7,
	DRAW_PYRAMID : 8,
	EDIT : 9,
	DRAW_CUBE : 10
};
var MODE = DrawMode.DRAW_TRIANGLE;
var COLORS = {
	CANVAS : [0.8, 0.8, 0.8, 1.0],
	BLACK : [0, 0, 0, 1],
	RED : [1, 0, 0, 1],
	GREEN : [0, 1, 0, 1],
	BLUE : [0, 0, 1, 1],
	WIREFRAME : [0, 0, 0, 1],
	HIGHLIGHT : [0, 1, 0, 1]
}
var MAX_POINTS = Math.pow(2,16);
var VELOCAMS = [];
var GEOMETRIES = [];
var WIDGETS = [];
var gShaders;
var gCamera;
var gVCamSideBot, gVCamSideTop;
var gActiveGeometry = undefined;

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
		
	$('camSideBotFocalLengthPicker').addEventListener('change', onCamSideBotFocalLengthPickerChange);	
	$('camSideBotFocalLengthPicker').addEventListener('keydown', onCamSideBotFocalLengthPickerChange);
	$('camSideBotSensorWidthPicker').addEventListener('change', onCamSideBotSensorWidthPickerChange);	
	$('camSideBotSensorWidthPicker').addEventListener('keydown', onCamSideBotSensorWidthPickerChange);
	$('camSideBotSensorHeightPicker').addEventListener('change', onCamSideBotSensorHeightPickerChange);	
	$('camSideBotSensorHeightPicker').addEventListener('keydown', onCamSideBotSensorHeightPickerChange);
	$('camSideTopFocalLengthPicker').addEventListener('change', onCamSideTopFocalLengthPickerChange);	
	$('camSideTopFocalLengthPicker').addEventListener('keydown', onCamSideTopFocalLengthPickerChange);
	$('camSideTopSensorWidthPicker').addEventListener('change', onCamSideTopSensorWidthPickerChange);	
	$('camSideTopSensorWidthPicker').addEventListener('keydown', onCamSideTopSensorWidthPickerChange);
	$('camSideTopSensorHeightPicker').addEventListener('change', onCamSideTopSensorHeightPickerChange);	
	$('camSideTopSensorHeightPicker').addEventListener('keydown', onCamSideTopSensorHeightPickerChange);
	
	gVCamSideBot = new VeloCamera();
	gVCamSideTop = new VeloCamera();
 	showFOV();
	
	gCamera = new Camera();
	
	gShaders = new Shaders(gl, MAX_POINTS);
	gShaders.setCamera(gCamera);

	displayXYZReference();

	render();
}
function showFOV(){
	var topFov = gVCamSideTop.getFieldOfView();
	var botFov = gVCamSideBot.getFieldOfView();
	$('camSideBotFOVText').innerHTML = botFov.horizontal + "\n" +
		botFov.vertical;
	$('camSideTopFOVText').innerHTML = topFov.horizontal + "\n" +
		topFov.vertical;
}
function onCamSideBotSensorHeightPickerChange(evt){
	var sensorHeight = Number(evt.target.value);
	if (sensorHeight > 0 && gVCamSideBot){
		gVCamSideBot.setSensorHeight(sensorHeight);
		var fov = gVCamSideBot.getFieldOfView();
		$('camSideBotFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}		
}
function onCamSideBotSensorWidthPickerChange(evt){
	var sensorWidth = Number(evt.target.value);
	if (sensorWidth > 0 && gVCamSideBot){
		gVCamSideBot.setSensorWidth(sensorWidth);
		var fov = gVCamSideBot.getFieldOfView();
		$('camSideBotFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}	
}
function onCamSideBotFocalLengthPickerChange(evt){
	var focalLength = Number(evt.target.value);
	if (focalLength > 0 && gVCamSideBot){
		gVCamSideBot.setFocalLength(focalLength);
		var fov = gVCamSideBot.getFieldOfView();
		$('camSideBotFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}
}
function onCamSideTopSensorHeightPickerChange(evt){
	var sensorHeight = Number(evt.target.value);
	if (sensorHeight > 0 && gVCamSideTop){
		gVCamSideTop.setSensorHeight(sensorHeight);
		var fov = gVCamSideTop.getFieldOfView();
		$('camSideTopFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}		
}
function onCamSideTopSensorWidthPickerChange(evt){
	var sensorWidth = Number(evt.target.value);
	if (sensorWidth > 0 && gVCamSideTop){
		gVCamSideTop.setSensorWidth(sensorWidth);
		var fov = gVCamSideTop.getFieldOfView();
		$('camSideTopFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}	
}
function onCamSideTopFocalLengthPickerChange(evt){
	var focalLength = Number(evt.target.value);
	if (focalLength > 0 && gVCamSideTop){
		gVCamSideTop.setFocalLength(focalLength);
		var fov = gVCamSideTop.getFieldOfView();
		$('camSideTopFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}
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

	WIDGETS.forEach (function(widget){
		// console.log('widget', widget);
		gShaders.setColor(widget.color);
		gShaders.setRotation(widget.rotation);
		gShaders.setTranslation(widget.translation);
		gShaders.setScale(widget.scale);
		gl.drawArrays(gl.LINE_LOOP, widget.start, widget.length);
	});
	
	GEOMETRIES.forEach(function(geometry){
		if (offline === false){
			gShaders.setColor(geometry.color);
		}
		else {
			var color = [geometry.id/255,0,0,1];
			gShaders.setColor(color);
		}
		//gShaders.setCamera(gCamera);
		gShaders.setRotation(geometry.rotation);
		gShaders.setTranslation(geometry.translation);
		gShaders.setScale(geometry.scale);
		gl.drawArrays(gl.TRIANGLES, geometry.start, geometry.length);

		if (offline === false){
			if (gActiveGeometry === geometry){
				gShaders.setColor(COLORS.HIGHLIGHT);
			}
			else {
				gShaders.setColor(COLORS.WIREFRAME);
			}					
			gl.drawArrays(gl.LINE_LOOP, geometry.start, geometry.length);
		}
	});

	// window.requestAnimationFrame(render);
}
function displayXYZReference(){
	var xRefLine = new Line(gShaders, -1, [0,0,0], COLORS.RED);
	var yRefLine = new Line(gShaders, -2, [0,0,0], COLORS.GREEN);
	var zRefLine = new Line(gShaders, -3, [0,0,0], COLORS.BLUE);
	
	xRefLine.setRotation([0,0,0]);
	yRefLine.setRotation([0,0,90]);
	zRefLine.setRotation([0,90,0]);
	
	WIDGETS.push(xRefLine, yRefLine, zRefLine);
}

var Shaders = Shaders || {};
Shaders = function (gl, maxPoints) {
	var me = this;
	this.uView;
	this.uProjection;
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
		
		me.uView = me.gl.getUniformLocation(program, "uView");
		me.uProjection = me.gl.getUniformLocation(program, "uProjection");
		
	}
}
Shaders.prototype.setCamera = function (camera){
	var vMatrix = camera.vMatrix;
	var pMatrix = camera.pMatrix;
	if (DEBUG){
		console.log(vMatrix, pMatrix);
	}
	gl.uniformMatrix4fv(this.uView, false, flatten(vMatrix));
	gl.uniformMatrix4fv(this.uProjection, false, flatten(pMatrix));
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
function Camera(){
	var me = this;
	//perspective variables
	this.longitude = 45 * Math.PI/180.0;
	this.latitude = 45 * Math.PI/180.0;
	this.fovy = 45.0;
	this.aspect = 1.0;
	this.near = 3;
	this.far = 3.0;
	this.radius = 4.0;
	
	this.vMatrix;
	this.pMatrix;

	this.at = vec3(0,0,0);
	this.up = vec3(0,1,0);
	
	init();
	
	function init(){
		me.vMatrix = me.move(me.radius, 
			me.longitude * 180/Math.PI, me.latitude * 180/Math.PI);
		me.pMatrix = me.lense(me.fovy, me.aspect, me.near, me.far);
	}
}
Camera.prototype.lense = function(fovy, aspect, near, far){
	this.fovy = fovy;
	this.aspect = aspect;
	this.near = near;
	this.far = far;
	this.pMatrix = perspective(fovy, aspect, near, far);
	return this.pMatrix;
}
Camera.prototype.move = function(radius, lonDeg, latDeg){
	this.longitude = lonDeg * Math.PI/180.0;
	this.latitude = latDeg * Math.PI/180.0;
	this.radius = radius;
	var eye = vec3(	this.radius*Math.sin(this.longitude) * Math.cos(this.latitude),
					this.radius*Math.sin(this.longitude) * Math.sin(this.latitude),
					this.radius*Math.cos(this.longitude));
	this.vMatrix = lookAt(eye, this.at, this.up);
	return this.vMatrix;
}
function VeloCamera(){
	this.focalLength = 12;	//mm
	this.sensorWidth = 23.4;	//mm
	this.sensorHeight = 15.6;	//mm
	this.sensorCols = 4592;	//px
	this.sensorRows = 3056;	//px
	this.rotation = [0,0,0];
	this.scale = [1,1,1];
	this.translation = [0,0,0];
}
VeloCamera.prototype.getFieldOfView = function(){
	var fov = {};		
	fov.horizontal = ((180/Math.PI) * 2.0*Math.atan((this.sensorWidth)/(2.0*this.focalLength)));
	fov.vertical = ((180/Math.PI) * 2.0*Math.atan((this.sensorHeight)/(2.0*this.focalLength)));
	return fov;	
}
VeloCamera.prototype.setFocalLength = function(focalLength){
	this.focalLength = Number(focalLength);
}
VeloCamera.prototype.setSensorWidth = function(sensorWidth){
	this.sensorWidth = Number(sensorWidth);
}
VeloCamera.prototype.setSensorHeight = function(sensorHeight){
	this.sensorHeight = Number(sensorHeight);
}
