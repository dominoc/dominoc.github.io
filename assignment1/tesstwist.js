"use strict";

var canvas;
var gl;

var points = [];

var tesselationNumber = 0;
var twistAngleRad = 0; // 90 * Math.PI/180.0;

var $ = function (id) {
	return document.getElementById(id);
};
window.onload = init;
function init () {

	$('tessSlider').onchange = onTessSliderChange;
	$('twistSlider').onchange = onTwistSliderChange;
	
	canvas = $('gl-canvas');
	
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	else {
		console.log("WebGL is available");
	}

	refresh();
};
function onTessSliderChange(evt){
	tesselationNumber = Number(evt.target.value);
	refresh();
}
function onTwistSliderChange(evt){
	twistAngleRad = Number(evt.target.value) * Math.PI / 180.0;
	refresh();
}
function refresh(){
	
	var vertices = [
		vec2(-0.5, -0.5),
		vec2( 0,  0.5),
		vec2( 0.5, -0.5)	
	];
	points = [];
	divideTriangle(vertices[0], vertices[1], vertices[2], 
		tesselationNumber);
			
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor( 1.0, 1.0, 1.0, 1.0);
	
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram( program);
	
	var bufferId = gl.createBuffer();
	gl.bindBuffer (gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer (vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	render();

}
function triangle(a, b, c) {
	a = twistVertex(a);
	b = twistVertex(b);
	c = twistVertex(c);
	points.push(a, b, c);
}
function divideTriangle(a, b, c, count){
	if (count === 0) {
		triangle(a, b, c);
	}
	else {
		var ab = mix(a, b, 0.5);
		var ac = mix(a, c, 0.5);
		var bc = mix(b, c, 0.5);
		
		--count;
		
		divideTriangle(a, ab, ac, count);
		divideTriangle(c, ac, bc, count);
		divideTriangle(b, bc, ab, count);
	}
}
function twistVertex(v){
	var x = v[0];
	var y = v[1];
	var d = Math.sqrt(x * x + y * y);
	x = x * Math.cos(d * twistAngleRad) - y * Math.sin(d * twistAngleRad);
	y = x * Math.sin(d * twistAngleRad) + y * Math.cos(d * twistAngleRad);
	return [x, y];
}
function render() {
	gl.clear( gl.COLOR_BUFFER_BIT);
	gl.drawArrays( gl.TRIANGLES, 0, points.length);
}