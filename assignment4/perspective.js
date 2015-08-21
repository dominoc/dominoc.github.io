"use strict";


var uView;
var uProjection;
var uTranslation;
var uRotation;
var uScale;



var canvas;
var gl;


var NumVertices  = 36;   // 36;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

var vertices = [
    vec3(-0.5, -0.5,  1.5),
    vec3(-0.5,  0.5,  1.5),
    vec3(0.5,  0.5,  1.5),
    vec3(0.5, -0.5,  1.5),
    vec3(-0.5, -0.5, 0.5),
    vec3(-0.5,  0.5, 0.5),
    vec3(0.5,  0.5, 0.5),
    vec3( 0.5, -0.5, 0.5)
];
// var vertices = [
//     vec4(-0.5, -0.5,  1.5, 1.0),
//     vec4(-0.5,  0.5,  1.5, 1.0),
//     vec4(0.5,  0.5,  1.5, 1.0),
//     vec4(0.5, -0.5,  1.5, 1.0),
//     vec4(-0.5, -0.5, 0.5, 1.0),
//     vec4(-0.5,  0.5, 0.5, 1.0),
//     vec4(0.5,  0.5, 0.5, 1.0),
//     vec4( 0.5, -0.5, 0.5, 1.0)
// ];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
];

var lightPosition = vec4(0,5,5,0);
var lightAmbient = vec4(0.2,0.2,0.2,1);
var lightDiffuse = vec4(1,1,1,1);
var lightSpecular = vec4(1,1,1,1);

var materialAmbient = vec4(1,0,1,1);
var materialDiffuse = vec4(1,0.8,0,1);
var materialSpecular = vec4(1,0.8,0,1);
var materialShininess = 200;

var ambientColor, diffuseColor, specularColor;

var near = 0.3;
var far = 5;
var radius = 4.2;
var theta  = 45 * Math.PI/180.0;
var phi    = 45 * Math.PI/180.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
        
     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
     pointsArray.push(vertices[b]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
     pointsArray.push(vertices[c]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
     pointsArray.push(vertices[c]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
     pointsArray.push(vertices[d]);
     normalsArray.push(normal);
    //  colorsArray.push(vertexColors[a]);
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}
/////////////////////////////
var gridVertices = [  
    vec4(-10,0,0,1), // x
    vec4(10,0,0,1),
    vec4(0,-10,0,1), // y
    vec4(0,10,0,1),
    vec4(0,0,-10,1), // z
    vec4(0,0,10,1)
];
function grid() {
    gridLine( 0, 1);
    gridLine( 2, 3);
    gridLine( 4, 5);
}
function gridLine(a, b) {
    pointsArray.push(gridVertices[a]);
    colorsArray.push(vertexColors[a]);
    pointsArray.push(gridVertices[b]);
    colorsArray.push(vertexColors[b]);
}
/////////////////////////////
window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    aspect =  canvas.width/canvas.height;

    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    gl.enable(gl.DEPTH_TEST);


    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();
    //grid();
    
    // console.log(pointsArray);

/////////////
    uTranslation = gl.getUniformLocation(program, "uTranslation");
    uScale = gl.getUniformLocation(program, "uScale");
    uRotation = gl.getUniformLocation(program, "uRotation");
    uView = gl.getUniformLocation(program, "uView");
    uProjection = gl.getUniformLocation(program, "uProjection");
    gl.uniform3f(uScale, 0.5, 0.5, 0.5);
    gl.uniform3f(uTranslation, 0, 0, 0);
    gl.uniform3f(uRotation, 0, 30, 0);
    
/////////////

    
    // var cBuffer = gl.createBuffer();
    // gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    // gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    // var vColor = gl.getAttribLocation( program, "vColor" );
    // gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    // gl.enableVertexAttribArray( vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    
    var vNormal = gl.getAttribLocation (program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
        flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
        flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
        flatten(lightPosition));
        
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), 
        materialShininess);
    
    modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );

// buttons for viewing parameters

    document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
    document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
    document.getElementById("Button3").onclick = function(){radius *= 2.0;};
    document.getElementById("Button4").onclick = function(){radius *= 0.5;};
    document.getElementById("Button5").onclick = function(){theta += dr;};
    document.getElementById("Button6").onclick = function(){theta -= dr;};
    document.getElementById("Button7").onclick = function(){phi += dr;};
    document.getElementById("Button8").onclick = function(){phi -= dr;};

    render();
}


var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, aspect, near, far);


/////////////////////////

/////////////////////////


    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    requestAnimFrame(render);
}
