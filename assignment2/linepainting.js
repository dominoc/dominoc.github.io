"use strict";

var canvas;
var gl;
var maxNumTriangles = 200;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;
var $ = function(id){
	return document.getElementById(id);
};
var vBuffer, cBuffer;
var colors = [
	vec4(0.0, 0.0, 0.0, 1.0),
	vec4(1.0, 0.0, 0.0, 1.0),
	vec4(1.0, 1.0, 0.0, 1.0),
	vec4(0.0, 1.0, 0.0, 1.0),
	vec4(0.0, 0.0, 1.0, 1.0),
	vec4(1.0, 0.0, 1.0, 1.0),
	vec4(0.0, 1.0, 1.0, 1.0)	
];
var PaintMode = { 
	NONE : 0,
	LINE : 1
};
var mode = PaintMode.NONE;
window.onload = init;
function init(){
	canvas = $('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl){
		alert('WebGL is not available');
		return;
	}
	canvas.addEventListener('mousedown', onCanvasMouseDown);
	canvas.addEventListener('mouseup', onCanvasMouseUp);
	canvas.addEventListener('mousemove', onCanvasMouseMove);
	
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
	
	render();
	
}
function onCanvasMouseDown(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	console.log('mouse down ', cpoint, index);
	mode = PaintMode.LINE;
}
function onCanvasMouseMove(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	if (mode != PaintMode.LINE)
		return;
		
	console.log('mouse move ', cpoint);
	var v = vec2(cpoint.x, cpoint.y);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var dataSizeBytes = 4*2*index;
	gl.bufferSubData(gl.ARRAY_BUFFER, dataSizeBytes, flatten(v));
	
	index++;
}
function onCanvasMouseUp(evt){
	var point = transMouseEvent2Window(evt);
	var cpoint = transWindow2Clip(point);
	console.log('mouse up ', cpoint, index);
	mode = PaintMode.NONE;
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
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, index);
	window.requestAnimationFrame(render);
}
