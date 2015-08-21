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
		var fov = gCamera.fov();
		$('camFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}		
}
function onCamSensorWidthPickerChange(evt){
	var sensorWidth = Number($('camSensorWidthPicker').value);
	if (sensorWidth > 0 && gCamera){
		gCamera.setSensorWidth(sensorWidth);
		var fov = gCamera.fov();
		$('camFOVText').innerHTML = fov.horizontal + "\n" +
			fov.vertical;
	}	
}
function onCamFocalLengthPickerChange(evt){
	var focalLength = Number($('camFocalLengthPicker').value);
	if (focalLength > 0 && gCamera){
		gCamera.setFocalLength(focalLength);
		var fov = gCamera.fov();
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
	this.fov = function(){
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
	// var A = Line.create([0,0],[1,0]);
	// var P1 = Plane.create([5,0,0], $V([-1,0,0]));
	
	// var axis = $V([0,0,1]);
	// var B = A.rotate(45*Math.PI/180, axis);
	// // B = A.translate($V([2,0]));
	// // B.rotate(90*Math.PI/180, axis);
	
	// var I = P1.intersectionWith(B);
	// console.log(I);
VeloCamera.prototype.captureN = function (mount, targetDistance, maxFrames){
	var fovh = this.fov().horizontal * Math.PI/180;
	var fovv = this.fov().vertical * Math.PI/180;
	var r = mount.radiusToCamera;
	var h = mount.height;
	var phi = mount.angleToCamera * Math.PI/180;
	var d = targetDistance;
	
	var horzAbout = $L([r,1,0],[0,1,0]);

	//Lower right	
	var rayLR = $L([r,0,0],[1,0,0]);
	rayLR = rayLR.rotate(-fovv/2, $V([r,0,1]));
	rayLR = rayLR.rotate(fovh/2, horzAbout);
	rayLR = rayLR.rotate(phi, $V([0,0,1]));
	rayLR = rayLR.translate($V([h,0,0]));

	//Lower left
	var rayLL = $L([r,0,0],[1,0,0]);
	rayLL = rayLL.rotate(-fovv/2, $V([r,0,1]));
	rayLL = rayLL.rotate(-fovh/2, horzAbout);
	rayLL = rayLL.rotate(phi, $V([0,0,1]));
	rayLL = rayLL.translate($V([h,0,0]));
	
	//Upper right
	var rayUR = $L([r,0,0],[1,0,0]);
	rayUR = rayUR.rotate(fovv/2, $V([r,0,1]));
	rayUR = rayUR.rotate(fovh/2, horzAbout);
	rayUR = rayUR.rotate(phi, $V([0,0,1]));
	rayUR = rayUR.translate($V([h,0,0]));

	//Upper left
	var rayUL = $L([r,0,0],[1,0,0]);
	rayUL = rayUL.rotate(fovv/2, $V([r,0,1]));
	rayUL = rayUL.rotate(-fovh/2, horzAbout);
	rayUL = rayUL.rotate(phi, $V([0,0,1]));
	rayUL = rayUL.translate($V([h,0,0]));

	var targetv = $P([d,0,0], $V([-1,0,0]));
	var vlr = targetv.intersectionWith(rayLR); 	
	var vll = targetv.intersectionWith(rayLL);
	var vur = targetv.intersectionWith(rayUR);
	var vul = targetv.intersectionWith(rayUL);

	var targeth = $P([d,0,0], $V([0,1,0]));
	var hlr = targeth.intersectionWith(rayLR);
	var hll = targeth.intersectionWith(rayLL);
	var hur = targeth.intersectionWith(rayUR);
	var hul = targeth.intersectionWith(rayUL);
	
	console.log(hll, hlr, hul, hur);	
}
VeloCamera.prototype.captureN0 = function (mount, targetDistance, maxFrames){
	var topLeft = new Point();
	var topRight = new Point();
	var botLeft = new Point();
	var botRight = new Point();
	var midLeft = new Point();
	var midRight = new Point();
	
	var frame = [];
	var fov = this.calcFieldOfView();
	var camOrigin = {
		x : this.calcCosineAngleAdjacent(mount.angleToCamera, mount.radiusToCamera),
		y : this.calcSineAngleOpposite(mount.angleToCamera, mount.radiusToCamera),
		z : 0 
	};
	var camToTargetHorizontalDistance = targetDistance - camOrigin.x;
	var camToTargetVerticalDistance = camOrigin.y + mount.height;
	
	var frameTopHeight = mount.height + camOrigin.y +
		this.calcTangentAngleOpposite((mount.angleToCamera+fov.vertical/2),
			camToTargetHorizontalDistance); 
	
	var frameBotHeight = mount.height + camOrigin.y +
		this.calcTangentAngleOpposite((mount.angleToCamera-fov.vertical/2),
			camToTargetHorizontalDistance);
	
	//if camera frame is looking horizontally wholly or partially.....	
	var frameMidTopX;
	if (frameTopHeight < 0){
		frameTopHeight = (frameTopHeight < 0) ? 0 : frameTopHeight;
		frameMidTopX = camOrigin.x +
			this.calcTangentAngleOpposite((Math.abs(mount.angleToCamera)+fov.vertical/2),
				camToTargetVerticalDistance);			
	}
	var frameMidBotX;
	if (frameBotHeight < 0){
		frameBotHeight = (frameBotHeight < 0) ? 0 : frameBotHeight;
		frameMidBotX = camOrigin.x +
			this.calcTangentAngleOpposite((90 - Math.abs(mount.angleToCamera)-fov.vertical/2),
				camToTargetVerticalDistance);	
	}
	
	
	////////
	//var frameLeftZ = camOrigin.z -  
		this.calcTangentAngleOpposite(fov.vertical/2, 
			camToTargetHorizontalDistance);
	
	var frameRightZ = camOrigin.z +
		this.calcTangentAngleOpposite(fov.vertical/2, 
			camToTargetHorizontalDistance);

	if (frameTopHeight <= 0 && frameBotHeight <= 0){
		topLeft.x = frameMidTopX;
		topLeft.z = 0;
		topRight.x = frameRightZ;
		topRight.z = 0;
		// botRight.x = 
	}
	else if (frameTopHeight >= 0 && frameBotHeight <=0){
		topLeft.x = frameLeftZ;
		topLeft.z = frameTopHeight;
		topRight.x = frameRightZ;
		topRight.z = frameTopHeight;
		midRight.x = frameRightZ;
		midRight.z = 0;
		botRight.x = frameMidBotX;
		botRight.z = 0;
		botLeft.x = frameMidBotX;
		botLeft.z = 0;
		midLeft.x = frameLeftZ;
		midLeft.y = 0;		
	}
	else if (frameTopHeight > 0 && frameBotHeight > 0){
		topLeft.x = frameLeftZ;
		topLeft.z = frameTopHeight;
		topRight.x = frameRightZ;
		topRight.z = frameTopHeight;
		botRight.x = frameRightZ;
		botRight.z = frameBotHeight;
		botLeft.x = frameLeftZ;
		botLeft.z = frameBotHeight;		
	}

	frame.push(topLeft, topRight);
	frame.push(botRight, botLeft);
		
	console.log(frame);
	
}
function Point (){
	this.x = 0;
	this.y = 0;
	this.z = 0;
}