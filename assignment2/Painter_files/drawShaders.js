
var paintShaders = {

    vertex1 : `
        precision mediump float;
        attribute vec4 vPosition;
        attribute vec4 vColor;
        uniform mat4 projection;
        varying vec4 fColor;
        varying vec4 fPosition;

        void main() {
            gl_Position = projection*vPosition;
            gl_Position.z = 0.0;
            gl_PointSize = vPosition.z;
            fColor = vColor;
            fPosition = vPosition;
        }
    `,

    fragment1 : `
        precision mediump float;
        varying vec4 fColor;
        varying vec4 fPosition;
        
        void main() {
            vec2 pointCenter = gl_PointCoord - 0.5;
            float dist = 0.5-sqrt(dot(pointCenter,pointCenter)); 
            gl_FragColor = fColor;
            if(fPosition.z > 0.0) {
                gl_FragColor.a = gl_FragColor.a*dist;
            }
        }
    `,

}