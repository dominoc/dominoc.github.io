var Shaders = Shaders || {};
Shaders = function (gl, maxPoints) {
	var me = this;
	this.uView;
	this.uProjection;
	this.uTranslation;
	this.uRotation;
	this.uColor;
	this.uScale;
	this.uLightPosition;
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
		me.uLightPosition = me.gl.getUniformLocation(program, "uLightPosition");		
	}
}
Shaders.prototype.setLightPosition = function(positions){
	gl.uniform4fv(this.uLocationPosition, flatten(positions));
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
