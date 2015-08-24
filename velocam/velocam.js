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
	var speed = 1000*Number($('speedPicker').value)/(60*60);
	var maxFrames = Number($('maxFramesPicker').value);
	var framesInterval = Number($('framesInterval').value);
	gCamera.captureN(Mount, targetDistance, maxFrames, speed, framesInterval);
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
	this.swapYZ = function(point){
		return new Point(point[0], point[2], point[1]);
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
VeloCamera.prototype.captureN = function (mount, targetDistance, maxFrames, speed, timeInterval){
	var di = timeInterval * speed;
	var fovh = this.fov().horizontal * Math.PI/180;
	var fovv = this.fov().vertical * Math.PI/180;
	var r = mount.radiusToCamera;
	var h = mount.height;
	var phi = mount.angleToCamera * Math.PI/180;
	var d = targetDistance;
	
	var horzAbout = $L([r,1,0],[0,1,0]);
	var targetv = $P([d,0,0], $V([-1,0,0]));
	var targeth = $P([d,0,0], $V([0,1,0]));

	for (var i = 0, camz = 0; i < maxFrames; i++, camz += di){
		console.log(camz);
	}
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


	var vlr = targetv.intersectionWith(rayLR); 	
	var vll = targetv.intersectionWith(rayLL);
	var vur = targetv.intersectionWith(rayUR);
	var vul = targetv.intersectionWith(rayUL);

	var hlr = targeth.intersectionWith(rayLR);
	var hll = targeth.intersectionWith(rayLL);
	var hur = targeth.intersectionWith(rayUR);
	var hul = targeth.intersectionWith(rayUL);
	
	var pvlr = this.swapYZ(vlr.elements);
	var pvll = this.swapYZ(vll.elements);
	var pvur = this.swapYZ(vur.elements);
	var pvul = this.swapYZ(vul.elements);
	
	var phlr = this.swapYZ(hlr.elements);
	var phll = this.swapYZ(hll.elements);
	var phur = this.swapYZ(hur.elements);
	var phul = this.swapYZ(hul.elements);
	// console.log(phlr, phll, phur, phul);
	
	var layer1 = 1;
	var layer2 = 2;
	var color1 = 1;
	var color2 = 2;
	var dxf = new DxfCreator();
	var hdr = dxf.createFileHeader()
		+ dxf.startEntitySection();
	var entities = 
		dxf.createLineEntity(layer1, color1, pvul, pvur) +
		dxf.createLineEntity(layer1, color1, pvur, pvlr) +
		dxf.createLineEntity(layer1, color1, pvlr, pvll) +
		dxf.createLineEntity(layer1, color1, pvll, pvul) +
		
		dxf.createLineEntity(layer2, color2, phul, phur) +
		dxf.createLineEntity(layer2, color2, phur, phlr) +
		dxf.createLineEntity(layer2, color2, phlr, phll) +
		dxf.createLineEntity(layer2, color2, phll, phul);
			
	var eof = dxf.endEntitySection()
		+ dxf.createEOF();
	$('outputText').innerHTML = hdr + entities + eof;
	
}

function Point (x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
}
