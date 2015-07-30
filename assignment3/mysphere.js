"use strict";
var radius = 1;
var latitudeBands = 30;
var longitudeBands = 30;
var vertexPositionData = [];
var normalData = [];
window.onload = init;

function init() {
	sphere();
	console.log(vertexPositionData);
}
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
			
			var u = 1 - (lngNumber/longitudeBands);
			var v = 1 - (latNumber/latitudeBands);
			
			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			
			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}
}
