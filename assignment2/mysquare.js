"use strict";

var canvas;
var gl;
var $ = function (id) {
	return document.getElementById(id);
};
var index = 0;
var maxNumTriangles = 200;
var maxNumVertices = 3 * maxNumTriangles;
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

window.onload = init;
function init(){
	console.log('hello');
	canvas = $('gl-canvas');

	gl = WebGLUtils.setupWebGL (canvas);
	if (!gl) {
		alert('WebGL is not available');
		return;
	}

	canvas.addEventListener('mousedown', onCanvasMouseDown);
	
	gl.viewport (0,0, canvas.width, canvas.height);
	gl.clearColor (0.8, 0.8, 0.8, 1.0);
	
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram (program);
	
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);
	
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	
	render();
}
function onCanvasMouseDown(evt){
	var point = transMouse2Window(evt);
	var cpoint = transWindow2Clip(point);
	var v = vec2(cpoint.x, cpoint.y);
	console.log(index,point,cpoint);
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(v));
	
	var c = vec4(colors[(index)%7]);
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(c));
	index++;
}
function onCanvasMouseMove(evt){
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
	gl.drawArrays(gl.POINTS,0,index);
	window.requestAnimFrame(render);
}