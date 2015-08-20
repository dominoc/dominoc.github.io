"use strict";
var DEBUG = true;
var gCamera;
var Mount = {
	height : 1.2,	//m
	angleToCamera : 45,	//deg
	radiusToCamera : 50	//mm
};
var $ = function(id){
	return document.getElementById(id);
};

window.onload = init;

function init() {
		
	$('camFocalLengthPicker').addEventListener('change', onCamFocalLengthPickerChange);	
	$('camFocalLengthPicker').addEventListener('keydown', onCamFocalLengthPickerChange);
	$('camSensorWidthPicker').addEventListener('change', onCamSensorWidthPickerChange);	
	$('camSensorWidthPicker').addEventListener('keydown', onCamSensorWidthPickerChange);
	$('camSensorHeightPicker').addEventListener('change', onCamSensorHeightPickerChange);	
	$('camSensorHeightPicker').addEventListener('keydown', onCamSensorHeightPickerChange);
	$('mountHeightPicker').addEventListener('change', onMountHeightPickerChange);
	$('mountHeightPicker').addEventListener('keydown', onMountHeightPickerChange);
	$('mountRadiusPicker').addEventListener('change', onMountRadiusPickerChange);
	$('mountRadiusPicker').addEventListener('keydown', onMountRadiusPickerChange);
	$('mountAnglePicker').addEventListener('change', onMountAnglePickerChange);
	$('mountAnglePicker').addEventListener('keydown', onMountAnglePickerChange);
	$('captureButton').addEventListener('click', onCaptureButtonClick);
	
	gCamera = new VeloCamera();

	onCamFocalLengthPickerChange();
	onCamSensorHeightPickerChange();
	onCamSensorWidthPickerChange(); 
	onMountAnglePickerChange();
	onMountHeightPickerChange();
	onMountRadiusPickerChange();
}
function onCaptureButtonClick(evt){
	var targetDistance = Number($('targetDistancePicker').value);
	gCamera.captureN(Mount, targetDistance, 1);
}
function onCamSensorHeightPickerChange(evt){
	var sensorHeight = Number($('camSensorHeightPicker').value);
	if (sensorHeight > 0 && gCamera){
		gCamera.setSensorHeight(sensorHeight);
		var fov = gCamera.calcFieldOfView();
		$('camFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}		
}
function onCamSensorWidthPickerChange(evt){
	var sensorWidth = Number($('camSensorWidthPicker').value);
	if (sensorWidth > 0 && gCamera){
		gCamera.setSensorWidth(sensorWidth);
		var fov = gCamera.calcFieldOfView();
		$('camFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}	
}
function onCamFocalLengthPickerChange(evt){
	var focalLength = Number($('camFocalLengthPicker').value);
	if (focalLength > 0 && gCamera){
		gCamera.setFocalLength(focalLength);
		var fov = gCamera.calcFieldOfView();
		$('camFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}
}
function onMountHeightPickerChange(evt){
	Mount.height = Number($('mountHeightPicker').value);
}
function onMountRadiusPickerChange(evt){
	Mount.radiusToCamera = Number($('mountRadiusPicker').value) / 100;
}
function onMountAnglePickerChange(evt){
	Mount.angleToCamera = Number($('mountAnglePicker').value);
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
	this.calcSineAngleOpposite = function (angleDeg, hypotenuse) {
		var angle = angleDeg * Math.PI/180;
		return hypotenuse * Math.sin(angle);
	};
	this.calcCosineAngleAdjacent = function(angleDeg, hypotenuse){
		var angle = angleDeg * Math.PI/180;
		return hypotenuse * Math.cos(angle);
	};
	this.calcTangentAngleOpposite = function (angleDeg, adjacent){
		var angle = angleDeg * Math.PI/180;
		return adjacent * Math.tan(angle);
	};
	this.calcFieldOfView = function(){
		var fov = {};		
		fov.horizontal = ((180/Math.PI) * 2.0*Math.atan((this.sensorWidth)/(2.0*this.focalLength)));
		fov.vertical = ((180/Math.PI) * 2.0*Math.atan((this.sensorHeight)/(2.0*this.focalLength)));
		return fov;	
	};
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
VeloCamera.prototype.captureN = function (mount, targetDistance, maxFrames){
	var frame = [];
	var fov = this.calcFieldOfView();
	var camOrigin = {
		x : this.calcCosineAngleAdjacent(mount.angleToCamera, mount.radiusToCamera),
		y : this.calcSineAngleOpposite(mount.angleToCamera, mount.radiusToCamera),
		z : 0 
	};
// console.log(camOrigin, fov);	
	var camToTargetHorizontalDistance = targetDistance - camOrigin.x;
	var camToTargetVerticalDistance = camOrigin.y + mount.height;
	
	var frameTopHeight = mount.height + camOrigin.y +
		this.calcTangentAngleOpposite((mount.angleToCamera+fov.vertical/2),
			camToTargetHorizontalDistance); 
	
	var frameBotHeight = mount.height + camOrigin.y +
		this.calcTangentAngleOpposite((mount.angleToCamera-fov.vertical/2),
			camToTargetHorizontalDistance);
	
	var frameLeftZ = camOrigin.z -  
		this.calcTangentAngleOpposite(fov.vertical/2, 
			camToTargetHorizontalDistance);
	
	var frameRightZ = camOrigin.z +
		this.calcTangentAngleOpposite(fov.vertical/2, 
			camToTargetHorizontalDistance);

	if (frameBotHeight < 0){
		frameBotHeight = (frameBotHeight < 0) ? 0 : frameBotHeight;
		var frameBotX = camOrigin.x +
			this.calcTangentAngleOpposite((90 - Math.abs(mount.angleToCamera)-fov.vertical/2),
				camToTargetVerticalDistance);	
	}
	if (frameTopHeight < 0){
		frameTopHeight = (frameTopHeight < 0) ? 0 : frameTopHeight;
		var frameTopX = camOrigin.x +
			this.calcTangentAngleOpposite((90 - Math.abs(mount.angleToCamera)+fov.vertical/2),
				camToTargetVerticalDistance);					
	}

	console.log(frameTopHeight, frameBotHeight, frameLeftZ, frameRightZ);
	
}
