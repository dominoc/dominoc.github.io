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
var MODE = DrawMode.DRAW_SPHERE;
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
var GEOMETRIES = [];
var WIDGETS = [];
var LIGHTS = [];
var gShaders;
var gCamera;
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
	gCamera = new Camera();
	
	gShaders = new Shaders(gl, MAX_POINTS);
	gShaders.setCamera(gCamera);


	$('colorPicker').addEventListener('change', onColorPickerChange);
	$('scalePicker').addEventListener('change', onScalePickerChange);
	$('xRotPicker').addEventListener('change', onXRotPickerChange);
	$('yRotPicker').addEventListener('change', onYRotPickerChange);
	$('zRotPicker').addEventListener('change', onZRotPickerChange);
	$('geomAmbientPicker').addEventListener('change', onGeomAmbientPickerChange);
	$('geomDiffusePicker').addEventListener('change', onGeomDiffusePickerChange);
	$('camLatPicker').addEventListener('change', onCamLatPickerChange);
	$('camLngPicker').addEventListener('change', onCamLngPickerChange);
	$('nearClipPicker').addEventListener('change', onNearClipPickerChange);
	$('farClipPicker').addEventListener('change', onFarClipPickerChange);
	$('modeCombo').addEventListener('change', onModeComboChange);
	$('modeCombo').addEventListener('keydown', onModeComboChange);
	canvas.addEventListener('mousedown', onCanvasMouseDown);
	canvas.addEventListener('mousemove', onCanvasMouseMove);
	canvas.addEventListener('mouseup', onCanvasMouseUp);
	canvas.addEventListener('mouseout', onCanvasMouseOut);
	canvas.addEventListener('mousewheel', onCanvasMouseWheel);
	$('light1CheckBox').addEventListener('change', onLight1CheckBoxChange);
	$('light2CheckBox').addEventListener('change', onLight2CheckBoxChange);
	$('saveButton').addEventListener('click', onSaveButtonClick);
	$('clearButton').addEventListener('click', onClearButtonClick);
	
	LIGHTS = createLights();
	console.log(LIGHTS);
	displayXYZReference();

	render();
}
function onLight1CheckBoxChange(evt){
	var enabled = evt.target.checked;
	$('light1X').disabled = !enabled;
	$('light1Y').disabled = !enabled;
	$('light1Z').disabled = !enabled;
	$('light1AmbientPicker').disabled = !enabled;
	$('light1DiffusePicker').disabled = !enabled;
	$('light1SpecularPicker').disabled = !enabled;
}
function onLight2CheckBoxChange(evt){
	var enabled = evt.target.checked;
	$('light2X').disabled = !enabled;
	$('light2Y').disabled = !enabled;
	$('light2Z').disabled = !enabled;
	$('light2AmbientPicker').disabled = !enabled;
	$('light2DiffusePicker').disabled = !enabled;
	$('light2SpecularPicker').disabled = !enabled;
}
function onCamLatPickerChange(evt){
	var label = $('labelCamLatitude');
	var latitude = Number($('camLatPicker').value);
	label.innerHTML = String(latitude);
	gCamera.move(gCamera.radius, 
		gCamera.longitude*180/Math.PI,
		latitude);
	gShaders.setCamera(gCamera);
	render();
}
function onCamLngPickerChange(evt){
	var label = $('labelCamLongitude');
	var longitude = Number($('camLngPicker').value);
	label.innerHTML = String(longitude);
	gCamera.move( gCamera.radius,
		longitude, gCamera.latitude*180/Math.PI);
	gShaders.setCamera(gCamera);
	render();
}
function onNearClipPickerChange(evt){
	var label = $('labelNearClip');
	label.innerHTML = String($('nearClipPicker').value);
	var near = Number(getPickerValue('nearClipPicker', 4));
	var pMatrix = gCamera.lense(gCamera.fovy, gCamera.aspect, near, gCamera.far);
	gShaders.setCamera(gCamera);
	render();
}
function onFarClipPickerChange(evt){
	var label = $('labelFarClip');
	label.innerHTML = String($('farClipPicker').value);
	var far = Number(getPickerValue('farClipPicker', 1.0));
	var pMatrix = gCamera.lense(gCamera.fovy, gCamera.aspect, gCamera.near, far);
	gShaders.setCamera(gCamera);
	render();	
}
function onClearButtonClick(evt){
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	gActiveGeometry = undefined;
	GEOMETRIES = [];
	MODE = DrawMode.DRAW_TRIANGLE;
	gShaders.dataLength = 0;
	render();
}
function onSaveButtonClick(evt){
	var image = canvas.toDataURL("image/png");	//.replace("image/png","image/octet-stream");
	var imgData = image.replace('data:image/png;base64,','');
	var zipper = new JSZip();
	zipper.file("mycad3d.png", imgData, {base64: true});
	var content = zipper.generate({type: 'blob'});
	saveAs(content, "mycad3d.zip");
	if (DEBUG){
		console.log(image);
	}
}
function onColorPickerChange(evt){
	var color = getPickerColor('colorPicker');
	if (gActiveGeometry){
		gActiveGeometry.color = color;
		render();
	}
}
function onGeomAmbientPickerChange(evt){
	var color = getPickerColor('geomAmbientPicker');
	if (gActiveGeometry){
		gActiveGeometry.setAmbient( color);
		render();
	}
}
function onGeomDiffusePickerChange(evt){
	var color = getPickerColor('geomDiffusePicker');
	if (gActiveGeometry){
		gActiveGeometry.setDiffuse( color);
		render();
	}
}
function onGeomSpecularPickerChange(evt){
	var color = getPickerColor('geomSpecularPicker');
	if (gActiveGeometry){
		gActiveGeometry.setSpecular( color);
		render();
	}
}
function onXRotPickerChange(evt){
	var label = $('labelXRot');
	label.innerHTML = String($('xRotPicker').value);
	var xRot = Number(getPickerValue('xRotPicker', 0));
	if (gActiveGeometry){
		var rotation = gActiveGeometry.rotation;
		rotation[0] = xRot;
		gActiveGeometry.rotation = rotation;
		render();
	}
}
function onYRotPickerChange(evt){
	var label = $('labelYRot');
	label.innerHTML = String($('yRotPicker').value);
	var yRot = Number(getPickerValue('yRotPicker', 0));
	if (gActiveGeometry){
		var rotation = gActiveGeometry.rotation;
		rotation[1] = yRot;
		gActiveGeometry.rotation = rotation;
		render();
	}
}
function onZRotPickerChange(evt){
	var label = $('labelZRot');
	label.innerHTML = String($('zRotPicker').value);
	var zRot = Number(getPickerValue('zRotPicker', 0));
	if (gActiveGeometry){
		var rotation = gActiveGeometry.rotation;
		rotation[2] = zRot;
		gActiveGeometry.rotation = rotation;
		render();
	}
}
function onScalePickerChange(evt){
	var label = $('labelScale');
	var scale = Number($('scalePicker').value);
	scale = scale / 10;
	label.innerHTML = String(scale);
	if (gActiveGeometry){
		gActiveGeometry.scale = [scale,scale,scale];
		render();
	}
}
function onModeComboChange(evt){
	var choice = $('modeCombo').value;
	var status = $('statusLabel');
	gActiveGeometry = undefined;
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
	else if (MODE === DrawMode.DRAW_CIRCLE){
		status.innerHTML = 'Click on the canvas to place a circle';
	}
	else if (MODE === DrawMode.DRAW_PYRAMID){
		status.innerHTML = "Click on the canvas to place a pyramid";
	}
	else if (MODE === DrawMode.EDIT){
		status.innerHTML = "Click on a geometry to edit. Then change properties.";
	}
	else if (MODE === DrawMode.DRAW_CUBE){
		status.innerHTML = "Click on the canvas to place a cube";
	}
	else if (MODE === DrawMode.MOVE){
		status.innerHTML = 'Press down/drag/roll wheel on a geometry to move in 3D space';
	}
}
function createLights(){
	var lights = [];
	var light1 = new Light(1);
	var x = Number($('light1X').value);
	var y = Number($('light1Y').value);
	var z = Number($('light1Z').value);
	var w = Number($('light1W').value);
	light1.position = [x, y, z, w];
	// light1.ambient = getPickerColor('xxxPicker');
	// light1.diffuse = getPickerColor('light1DiffusePicker');
	// light1.specular = getPickerColor('light1SpecularPicker');
	lights.push(light1);
	// var light2 = new Light(2);
	// x = Number($('light2X').value);
	// y = Number($('light2Y').value);
	// z = Number($('light2Z').value);
	// w = Number($('light2W').value);
	// light2.position = [x, y, z, w];
	// light2.ambient = getPickerColor('light2AmbientPicker');
	// light2.diffuse = getPickerColor('light2DiffusePicker');
	// light2.specular = getPickerColor('light2SpecularPicker');
	// lights.push(light2);
	return lights;
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
			if (geometry.id === candidateId){
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
function setScalePickerValue(value){
	var picker = $('scalePicker');
	var label = $('labelScale');
	picker.value = Number(value) * 10;
	label.innerHTML = String(value);
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
function setPickerColor(rgba,id){
	var picker = $(id);
	var r = Math.ceil(rgba[0]*255);
	var g = Math.ceil(rgba[1]*255);
	var b = Math.ceil(rgba[2]*255);
	var color = String(rgbToHex(r,g,b)).toUpperCase();
	picker.value = color;
	picker.color.fromString(color);
}
function getPickerColor(id){
	var rgb = $(id).color.rgb;
	var color = [];
	var opacity = 1.0;
	color.push(rgb[0], rgb[1], rgb[2], opacity);
	return color;
}
function showGeometryInfo(geometry){
	var infoBox = $('infoTextArea');

	infoBox.value = "";
	var msg = '';
	msg += geometry.desc + "\n";
	msg += "Id: " + geometry.id + '\n';	
	msg += "Origin: (" + geometry.translation[0] + "," +
						geometry.translation[1] + "," +
						geometry.translation[2] + ")\n";
	msg += "Num of points: " + geometry.length + "\n";
	msg += "Scale: (" + geometry.scale[0] + "," +
						geometry.scale[1] + "," +
						geometry.scale[2] + ")\n";
	msg += "Orientation: (" + geometry.rotation[0] + "," +
								geometry.rotation[1] + "," +
								geometry.rotation[2] + ")\n";	
	infoBox.value = msg;
}
function onCanvasMouseDown(evt){
	var point = transMouse2Window(evt);
	var clipPoint = transWindow2Clip(point);
	var cartPoint = transMouse2Cartesian(evt);
	
	var color = getPickerColor('colorPicker');
	var scale = getPickerValue('scalePicker', 10)/10;
	var xRot = getPickerValue('xRotPicker', 0);
	var yRot = getPickerValue('yRotPicker', 0);
	var zRot = getPickerValue('zRotPicker',0);
	var ambient = getPickerColor('geomAmbientPicker');
	var diffuse = getPickerColor('geomDiffusePicker');
	var specular = getPickerColor('geomSpecularPicker');
	var shininess = getPickerValue('shininessTextBox', 100);
	var material = {
		ambient : ambient,
		diffuse : diffuse,
		specular : specular,
		shininess : shininess
	};

	var geometryId = GEOMETRIES.length+1;
	if (geometryId>255){
		alert('Max id 255 reached');
		return;
	}
	
	if (MODE === DrawMode.DRAW_TRIANGLE){
		// var triangle = new Triangle(gShaders, geometryId,
		// 		[clipPoint.x, clipPoint.y, 0], color);
		var triangle = new Triangle(gShaders, geometryId, 
			[clipPoint.x, clipPoint.y, 0], material);
		triangle.setScale([scale,scale,scale]);
		triangle.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(triangle);
	}
	else if (MODE === DrawMode.DRAW_CIRCLE){
		var circle = new Circle(gShaders, geometryId,
			[clipPoint.x, clipPoint.y, 0], material);
		circle.setScale([scale,scale,scale]);
		circle.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(circle);
	}
	else if (MODE === DrawMode.DRAW_SPHERE){
		var sphere = new Sphere(gShaders, geometryId, 
			[clipPoint.x, clipPoint.y, 0], material);
		sphere.setScale([scale,scale,scale]);
		sphere.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(sphere);
	}
	else if (MODE === DrawMode.DRAW_CONE){
		var cone = new Cone(gShaders, geometryId,
			[clipPoint.x, clipPoint.y, 0], material, 20, "Cone");
		cone.setScale([scale, scale, scale]);
		cone.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(cone);
	}
	else if (MODE === DrawMode.DRAW_PYRAMID){
		var pyramid = new Cone(gShaders, geometryId,
			[clipPoint.x, clipPoint.y, 0], material, 4, "Pyramid");
			pyramid.setScale([scale,scale,scale]);
			pyramid.setRotation([xRot,yRot,zRot]);
			GEOMETRIES.push(pyramid);
	}
	else if (MODE === DrawMode.DRAW_CYLINDER){
		var cylinder = new Cylinder(gShaders, geometryId,
			[clipPoint.x, clipPoint.y, 0], material, 20, "Cylinder");
		cylinder.setScale([scale, scale, scale]);
		cylinder.setRotation([xRot, yRot, zRot]);
		GEOMETRIES.push(cylinder);
	}
	else if (MODE === DrawMode.DRAW_CUBE){
		var cube = new Cylinder(gShaders, geometryId,
			[clipPoint.x, clipPoint.y, 0], material, 4, "Cube");
		cube.setScale([scale,scale,scale]);
		cube.setRotation([xRot,yRot,zRot]);
		GEOMETRIES.push(cube);
	}
	else if (MODE === DrawMode.EDIT) {
		gActiveGeometry = undefined;
		var geometryToEdit = selectGeometry(cartPoint);
		if (geometryToEdit != undefined) {
			gActiveGeometry = geometryToEdit;
			showGeometryInfo(geometryToEdit);
			setPickerValue('xRotPicker','labelXRot', geometryToEdit.rotation[0]);
			setPickerValue('yRotPicker','labelYRot', geometryToEdit.rotation[1]);
			setPickerValue('zRotPicker','labelZRot', geometryToEdit.rotation[2]);
			setScalePickerValue(geometryToEdit.scale[0]);
			setPickerColor(geometryToEdit.color, 'colorPicker');
			setPickerColor(geometryToEdit.material.ambient, 'geomAmbientPicker');
			setPickerColor(geometryToEdit.material.diffuse, 'geomDiffusePicker');
			setPickerColor(geometryToEdit.material.specular, 'geomSpecularPicker');
			$('shininessTextBox').value = geometryToEdit.material.shininess;
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
			setPickerValue(gActiveGeometry.scale[0]);
			setPickerColor(gActiveGeometry.color, 'colorPicker');
			setPickerColor(gActiveGeometry.material.ambient, 'geomAmbientPicker');
			setPickerColor(gActiveGeometry.material.diffuse, 'geomDiffusePicker');
			setPickerColor(gActiveGeometry.material.specular, 'geomSpecularPicker');
			$('shininessTextBox').value = gActiveGeometry.material.shininess;
		}
	}

	render();
}
function onCanvasMouseMove(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE === DrawMode.MOVE){
		if (gActiveGeometry){
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, 0]);
		}
	}
	render();	
}
function onCanvasMouseUp(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE === DrawMode.MOVE){
		if (gActiveGeometry){
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, gActiveGeometry.translation[2]]);
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
			gActiveGeometry.setTranslation([cpoint.x, cpoint.y, delta]);
			evt.preventDefault();
		}
	}
	render();			
}
function onCanvasMouseOut(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);

	if (MODE === DrawMode.MOVE){
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
function Light (id) {
	var me = this;
	this.id = Number(id);
	this.position = [1,1,1,0];
	this.ambient = [0.2,0.2,0.2,1];
	this.diffuse = [1,1,1,1];
	this.specular = [1,1,1,1];
}
