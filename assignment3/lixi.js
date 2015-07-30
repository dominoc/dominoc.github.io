
var canvas,gl;
var maxPts = Math.pow(2,17);

//user context
var uiCtx = {

    cindex: 0,
    width: 3,
    drawmode: true,
    indrawing: false,
    pickmode: false,
    picked: false,

    init: function() {

        var m = document.getElementById("mymenu");

        m.addEventListener("click", function() {
            uiCtx.cindex = m.selectedIndex;
        });


        document.getElementById("widthSlider").onchange= function(ev){
            uiCtx.width = Number(ev.target.value);
            //shaderInputs.setPtSize(uiCtx)
            document.getElementById("width").innerText = uiCtx.width.toString();
        };


    }

};

//shader variables including vbo
var shaderInputs = {

    u_ptSize: null,
    u_translate: null,
    u_color: null,
    bufferId: null,
    v_Position: null,
    dataLength:0,

    init: function() {

        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );

        this.u_ptSize = gl.getUniformLocation(program,"u_ptSize");

        this.u_translate = gl.getUniformLocation(program,"u_shift");

        this.u_color = gl.getUniformLocation(program,"u_color");

        this.bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, 8*maxPts, gl.STATIC_DRAW );

        this.v_Position = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer(this.v_Position, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( this.v_Position );


    },


    setPtSize: function(size) {
        gl.uniform1f(this.u_ptSize,size);
    },

    setTranslate: function(tv2) {
        gl.uniform2f(this.u_translate,tv2[0],tv2[1]);
    },

    setColor: function(cv4) {
        gl.uniform4f(this.u_color,cv4[0],cv4[1],cv4[2],cv4[3]);
    },


    fillVertexData: function(data,start,length) {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*start,  data);
        this.dataLength += length;
    },

    getDataLength: function() { return this.dataLength}

};


var allCurves = [];

//use a stack to log undo and redo
var userActionsHandler = {
    actions: [],
    state: -1,
    latestUserDrawing: null,

    handle: function(action) {
        var curve,state,snapshot ,idx;

        switch (action.type) {
            case "translate":
            case "addCurve":
                this.actions.push (action);
                this.state = this.actions.length -1;
                this.latestUserDrawing = this.state;
                break;

            case "undo":
                state = this.state;
                if (state < 0) break;

                curve = this.actions[state].curve;

                for (idx = state-1, snapshot = undefined; idx >=0; idx --){
                    if (this.actions[idx].curve === curve) {
                        snapshot = this.actions[idx].value;
                        break;
                    }
                }
                if(!snapshot) { //must hit the addCurve action
                    curve.display = false;
                }else{
                    curve.recover(snapshot);
                }
                this.actions.push(new UserAction("",curve));
                this.state --;
                render();
                break;

            case "redo":  //the most tricky part

                state = this.state + 1;
                if (state > this.latestUserDrawing) break;

                curve = this.actions[state].curve;
                snapshot = this.actions[state].value;

                if(!snapshot) { //must hit the addCurve action
                    console.log("what hell ?");
                }else{
                    curve.recover(snapshot);
                }
                this.actions.pop();
                this.state = state;
                render();
                break;
        }
    }

}; // logs for undo an redo

var UserAction = function (type,curve) {
    //this.snapshot = curve.getSnapshot();
    this.type = type;
    this.curve = curve;
    this.value = curve ? curve.getSnapshot():null;
};

var Curve = function(start,size,width,colorIdx) {
    this.start = start; // buffer data point
    this.size = size; // number of vertices
    this.width = width;
    this.colorIdx = colorIdx;
    this.display = true;
    this.endPoint = null;
    this.translate = [0.0,0.0]; //translate vector
    this.translateBase = [0.0,0.0];
};

Curve.prototype.appendCurvePoint =

    function (t) {
        var lastPt = this.endPoint;

        //interpolate
        if ( lastPt) {

            var deltaX = t[0]-lastPt[0];
            var deltaY = t[1]-lastPt[1];
            var delta = Math.sqrt(deltaX*deltaX+deltaY*deltaY);

            var count = 0;
            if (delta > this.width) {
                count = Math.ceil(delta/this.width);
                deltaX = deltaX/count;
                deltaY = deltaY/count;
            }

            while (count > 0) {
                lastPt[0] += deltaX;
                lastPt[1] += deltaY;

                shaderInputs.fillVertexData(  flatten(toGlPos(lastPt)),
                    shaderInputs.getDataLength(),1);
                this.size++;
                count--;
            }
        }

        this.endPoint = t;
        shaderInputs.fillVertexData(  flatten(toGlPos(t)),
            shaderInputs.getDataLength(),1);
        this.size ++;

};

//for drag
Curve.prototype.setTranslate= function(target) {
    var basePt = this.translateBase;
    var delta = [ target[0]-basePt[0],  target[1] - basePt[1]];
    this.translate[0] += delta[0];
    this.translate[1] += delta[1];
    this.translateBase = target;
    return delta;
};

Curve.prototype.getSnapshot = function () {
    return [
        this.start, // buffer data point
        this.size, // number of vertices
        this.width,
        this.colorIdx,
        this.display,
        this.endPoint.slice(0),
        this.translate.slice(0), //translate vector
        this.translateBase.slice(0)
    ]
};

Curve.prototype.recover = function(snap) {
    this.start = snap[0]; // buffer data point
    this.size = snap[1]; // number of vertices
    this.width = snap[2];
    this.colorIdx = snap[3];
    this.display = snap[4];
    this.endPoint = snap[5].slice(0);
    this.translate = snap[6].slice(0); //translate vector
    this.translateBase =  snap[7].slice(0);
};

var colors = [

    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0),   // cyan

    //low alpha for picking focus
    vec4( 0.0, 0.0, 0.0, 0.4 ),  // black
    vec4( 1.0, 0.0, 0.0, 0.4 ),  // red
    vec4( 1.0, 1.0, 0.0, 0.4 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 0.4 ),  // green
    vec4( 0.0, 0.0, 1.0, 0.4 ),  // blue
    vec4( 1.0, 0.0, 1.0, 0.4 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 0.4)   // cyan
];


//translate canvas coordinates to webgl coordinates
function toGlPos(v) {
    var rect = canvas.getBoundingClientRect();
    return [2*(v[0] - rect.left)/canvas.width-1,
        2*(rect.bottom-(v[1]-canvas.offsetTop))/canvas.height-1];
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    shaderInputs.init();
    uiCtx.init();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    document.getElementById("pick").onchange = function(ev) {
        if (ev.target.checked) {
            uiCtx.pickmode = true;

        }else{
            uiCtx.pickmode = false;
        }
    };

    canvas.addEventListener("mousedown", function(event){

        if(uiCtx.pickmode && !uiCtx.picked)  {
            if (pick(event)) uiCtx.picked = true;

        }

        else if (uiCtx.pickmode && uiCtx.picked){
            uiCtx.picked = false;
            pick.curve.colorIdx -= 7;
            userActionsHandler.handle(new UserAction('translate',pick.curve));
            render();

        }

        else {
            uiCtx.indrawing = true;
            var start = shaderInputs.dataLength,
                size = 0,
                width = uiCtx.width,
                colorIdx = uiCtx.cindex;
            var  curve = new Curve(start,size,width,colorIdx);

            curve.appendCurvePoint([event.clientX,event.clientY]);
            allCurves.push(curve);


            render();
        }


    } );

    canvas.addEventListener("mousemove",function(event) {


        var curve;
        if (uiCtx.pickmode && uiCtx.picked) {

            curve = pick.curve;
            curve.setTranslate(toGlPos([event.clientX,event.clientY]));

            render();
            return;
        }

        if (!uiCtx.indrawing) { return; }

        if (shaderInputs.dataLength >= maxPts) {
            console.log("reach limit!");
            uiCtx.drawmode =false;
            return;
        }


        curve = allCurves[allCurves.length-1];
        curve.appendCurvePoint([event.clientX, event.clientY]);
        render();
    });


    //to stop  tracking when cursor  out side canvas
    //use window to listen
    window.addEventListener("mouseup",function(event) {
        if (uiCtx.indrawing) {
            uiCtx.indrawing  = false;
            userActionsHandler.handle(new UserAction('addCurve',
                allCurves[allCurves.length-1])) ;
        }
    });


    document.getElementById("undo").onclick = function () {
        userActionsHandler.handle(new UserAction('undo'));
    };


    document.getElementById("redo").onclick = function() {
        userActionsHandler.handle(new UserAction('redo'));
    };

}

function render(offline) {

    offline = arguments[0]?arguments[0]:false;

    gl.clear( gl.COLOR_BUFFER_BIT );

    if (!offline){
        allCurves.forEach(function (curve) {
            if(curve.display) {
                shaderInputs.setColor(colors[curve.colorIdx]);
                shaderInputs.setPtSize(curve.width);
                shaderInputs.setTranslate(curve.translate);
                gl.drawArrays(gl.POINTS,curve.start,curve.size);
            }

        })
    }

    else {
        allCurves.forEach(function (curve) {
            if(curve.display) {
                // map  curve's index of all Curves to offline buffer color value
                shaderInputs.setColor([(allCurves.indexOf(curve)+1)/255, 0.0,0.0,1.0]);
                shaderInputs.setPtSize(6);
                shaderInputs.setTranslate(curve.translate);
                gl.drawArrays(gl.POINTS,curve.start,curve.size);
            }


        })
    }
}

function  pick(event) {

    // picking window
    var curve = undefined;
    var a = new Uint8Array(4*16);
    var rect = canvas.getBoundingClientRect();
    var candidates = [];

    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    render(true); //render as in back buffer

    gl.readPixels(event.clientX-rect.left,
        rect.bottom-event.clientY  , 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, a);

    for (var i = 0; i < 64; i += 4) {
        if (a[i] > 0 ) {
            //map color value back to curve's index of all Curves
            candidates.push(a[i]-1);
        }
    }

    if (candidates.length > 0) {

        var tmp = candidates[0];
        for (i = 1; i < candidates.length; i++) {
            if (candidates[i] > tmp)
                tmp = candidates[i];
        }


        curve = allCurves[tmp];
        curve.translateBase = toGlPos([event.clientX,event.clientY]);
        pick.curve = curve;
    }

    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    if (curve) {
        curve.colorIdx += 7;
    }
    render();

    return curve;
}

pick.curve = undefined;
