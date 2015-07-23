"use strict";
var DEBUG = false;
var canvas;
var gl;
var maxNumTriangles = 200000;
var maxNumVertices = 3 * maxNumTriangles;
var points = [];
var pixelResolution = 1.0;
var index = 0;
var $ = function(id){
	return document.getElementById(id);
};
var vBuffer, cBuffer, tBuffer;
var pointSizeLoc;

var PaintMode = { 
	NONE : 0,
	LINE : 1
};
var mode = PaintMode.NONE;
window.onload = init;
function init(){
	canvas = $('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
	if (!gl){
		alert('WebGL is not available');
		return;
	}
	pixelResolution = 2.0/canvas.width;
	
	canvas.addEventListener('mousedown', onCanvasMouseDown);
	canvas.addEventListener('mouseup', onCanvasMouseUp);
	canvas.addEventListener('mousemove', onCanvasMouseMove);
	canvas.addEventListener('mouseout', onCanvasMouseOut);
	$('opacityPicker').onchange = onOpacityPickerChange;
	$('thicknessPicker').onchange = onThicknessPickerChange;
	$('saveButton').onclick = onSaveButtonClick;
	$('clearButton').onclick = onClearButtonClick;
	
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram (program);
	
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	// 1 vertex has x and y components of type float (4 bytes each)
	var bufferSizeBytes = 4*2*maxNumVertices;
	gl.bufferData(gl.ARRAY_BUFFER, bufferSizeBytes, gl.STATIC_DRAW);	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition)
	
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	// RGBA = 4 * 4 bytes
	var cBufferSizeBytes = 4*4*maxNumVertices;
	gl.bufferData(gl.ARRAY_BUFFER, cBufferSizeBytes, gl.STATIC_DRAW);	
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	var tBufferSizeBytes = 4*maxNumVertices;
	gl.bufferData(gl.ARRAY_BUFFER, tBufferSizeBytes, gl.STATIC_DRAW);
	var vPointSize = gl.getAttribLocation(program, "vPointSize");
	gl.vertexAttribPointer(vPointSize, 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPointSize);
	
	render();	
}
function onOpacityPickerChange(evt){
	var opacityText = $('opacityText');
	opacityText.value = String(evt.target.value);
	if (DEBUG){
		console.log(evt.target.value);
	}
}
function onThicknessPickerChange(evt){
	var thicknessText = $('thicknessText');
	thicknessText.value = String(evt.target.value);
	if (DEBUG){
		console.log(evt.target.value);
	}
}
function onClearButtonClick(evt){
	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	index = 0;
	points = [];
	mode = PaintMode.NONE;
	render();
}
function onSaveButtonClick(evt){
	var image = canvas.toDataURL("image/png");	//.replace("image/png","image/octet-stream");
	var imgData = image.replace('data:image/png;base64,','');
	var zipper = new JSZip();
	zipper.file("mypainting.png", imgData, {base64: true});
	var content = zipper.generate({type: 'blob'});
	saveAs(content, "mypainting.zip");
	if (DEBUG){
		console.log(image);
	}
}
function onCanvasMouseDown(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	if (DEBUG)
		console.log('mouse down ', cpoint, index);
	mode = PaintMode.LINE;
	points.push(cpoint);
}
function onCanvasMouseMove(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	if (mode != PaintMode.LINE || index > maxNumVertices)
		return;
	
	if (DEBUG)	
		console.log('mouse move ', cpoint, index);

	var prev = points[points.length-1];
	points.push(cpoint);

	var interpolatedPoints = interpolate(prev, cpoint, pixelResolution);
	var rgb = $('colorPicker').color.rgb;
	var color = [];
	var opacity = Number($('opacityPicker').value);
	color.push(rgb[0], rgb[1], rgb[2], opacity);	

	var thickness = Number($('thicknessPicker').value);
		
	for (var i = 0; i<interpolatedPoints.length; i++){
		var v = vec2(interpolatedPoints[i].x, interpolatedPoints[i].y);
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		var dataSizeBytes = 4*2*index;
		gl.bufferSubData(gl.ARRAY_BUFFER, dataSizeBytes, flatten(v));
		
		var c = vec4(color);
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 4*4*index, flatten(c));
 
		gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
		var t = [];
		t.push(thickness);
		gl.bufferSubData(gl.ARRAY_BUFFER, 4*index, flatten(t));
		
		index++;
	}
}
function onCanvasMouseUp(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	if (DEBUG)
		console.log('mouse up ', cpoint, index);
	mode = PaintMode.NONE;
	points = [];
}
function onCanvasMouseOut(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	if (DEBUG)
		console.log('mouse out', cpoint);
	if (PaintMode.LINE){
		mode = PaintMode.NONE;
		points = [];
	}
}
function transMouseEvent2Window(evt){
	var rect = evt.target.getBoundingClientRect();
	var point = {};
	point.x = (evt.clientX - rect.left);
	point.y = (evt.clientY - rect.top);
	return point;
}
function transWindow2Clip(point){
	var cpoint = {};
	cpoint.x = 2 * point.x / canvas.width - 1;
	cpoint.y = -1 + 2 * (canvas.height - point.y) / canvas.height;
	return cpoint;
}
function render(){
	if (index > maxNumVertices) {
		alert('Painting buffer limit reached');
		return;
	}
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.POINTS, 0, index);
	window.requestAnimationFrame(render);
}
function dist(p1, p2){
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	return (Math.sqrt(dx*dx + dy*dy));
}
function interpolate(p1, p2, distance){
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	
	var length = dist(p1, p2); 
	var steps = length / distance;
	var xstep = dx/steps;
	var ystep = dy/steps;
	
	var newx = 0;
	var newy = 0;
	var result = [];
	
	for (var s=0; s < steps; s++){
		newx = p1.x + (xstep * s);
		newy = p1.y + (ystep * s);
		result.push({
			x: newx,
			y: newy
			});
	}
	return result;
}
