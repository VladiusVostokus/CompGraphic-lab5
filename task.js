'use strict';

const vsSource = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform vec3 uLightDirection;
uniform mat4 uProjectionMatrix_Y;
uniform mat4 uProjectionMatrix_Z;
uniform mat4 uPerspectiveMatrix;
uniform mat4 uModelViewMatrix;
out float vBrightness;

void main() {
    vec3 lightDirectionNormalazed = normalize(uLightDirection);
    vec3 modeledNormal = mat3(uModelViewMatrix) * aNormal;
    vBrightness = max(dot(lightDirectionNormalazed, modeledNormal), 0.0);
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * uProjectionMatrix_Y * uProjectionMatrix_Z * vec4(aPosition, 1.0);
}`;

const fsSource = `#version 300 es
precision mediump float;

in float vBrightness;
out vec4 fragColor;
uniform vec3 uAmbientColor;
uniform vec3 uLightColor;

void main() {
    fragColor = vec4(uAmbientColor + uLightColor * vBrightness, 1.0);
}`;

function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log("Failde to get context for WebGL");
        return;
    }

    const program = gl.createProgram();
    const vsShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsShader, vsSource);
    gl.compileShader(vsShader);
    gl.attachShader(program, vsShader);

    const fsShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsShader, fsSource);
    gl.compileShader(fsShader);
    gl.attachShader(program, fsShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vsShader));
        console.log(gl.getShaderInfoLog(fsShader));
    }

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const uProjectionMatrix_Y = gl.getUniformLocation(program,'uProjectionMatrix_Y');
    const uProjectionMatrix_Z = gl.getUniformLocation(program,'uProjectionMatrix_Z');
    const uPerspectiveMatrix = gl.getUniformLocation(program,"uPerspectiveMatrix");
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uAmbientColor = gl.getUniformLocation(program,'uAmbientColor');
    const uLightColor = gl.getUniformLocation(program,'uLightColor');
    const uLightDirection = gl.getUniformLocation(program,'uLightDirection');

    const ambientColor = [0, 0.3, 0];
    const lightColor = [0.8, 0.8, 0.8];
    const lightDirection = [1 ,1, -1];
    gl.uniform3f(uAmbientColor, ...ambientColor);
    gl.uniform3f(uLightColor, ...lightColor);
    gl.uniform3f(uLightDirection, ...lightDirection);

    const bufferData = new Float32Array([
        -.5,-.5,-.5,    -1, 0, 0,
        -.5, .5, .5,    -1, 0, 0,
        -.5, .5,-.5,    -1, 0, 0,
        -.5,-.5, .5,    -1, 0, 0,
        -.5, .5, .5,    -1, 0, 0,
        -.5,-.5,-.5,    -1, 0, 0,
    
        .5 ,-.5,-.5,    1, 0, 0,
        .5 , .5,-.5,    1, 0, 0,
        .5 , .5, .5,    1, 0, 0,
        .5 , .5, .5,    1, 0, 0,
        .5 ,-.5, .5,    1, 0, 0,
        .5 ,-.5,-.5,    1, 0, 0,
    
        -.5,-.5,-.5,    0, -1, 0,
         .5,-.5,-.5,    0, -1, 0,
         .5,-.5, .5,    0, -1, 0,
         .5,-.5, .5,    0, -1, 0,
        -.5,-.5, .5,    0, -1, 0,
        -.5,-.5,-.5,    0, -1, 0,
    
        -.5, .5,-.5,    0, 1, 0,
         .5, .5, .5,    0, 1, 0,
         .5, .5,-.5,    0, 1, 0,
        -.5, .5, .5,    0, 1, 0,
         .5, .5, .5,    0, 1, 0,
        -.5, .5,-.5,    0, 1, 0,
    
         .5,-.5,-.5,    0, 0, -1,
        -.5,-.5,-.5,    0, 0, -1,
         .5, .5,-.5,    0, 0, -1,
        -.5, .5,-.5,    0, 0, -1,
         .5, .5,-.5,    0, 0, -1,
        -.5,-.5,-.5,    0, 0, -1,
    
        -.5,-.5, .5,    0, 0, 1,
         .5,-.5, .5,    0, 0, 1,
         .5, .5, .5,    0, 0, 1,
         .5, .5, .5,    0, 0, 1,
        -.5, .5, .5,    0, 0, 1,
        -.5,-.5, .5,    0, 0, 1,
    ]);
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

    gl.vertexAttribPointer(aPosition, 3 , gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(aNormal, 3 , gl.FLOAT, false, 6 * 4, 3 * 4);

    gl.enableVertexAttribArray(aPosition);
    gl.enableVertexAttribArray(aNormal);
    
    const fovY = Math.PI / 4;
    const aspectRatio = canvas.width / canvas.height;

    const perspective = (fovy, aspect, near, far) => {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fovy);
        var rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    };

    const translate = (translationVec) => {
        let x = translationVec[0], y = translationVec[1], z = translationVec[2];
        const matrix = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1,
        ]
        matrix[12] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
        matrix[13] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
        matrix[14] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
        matrix[15] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
        return matrix;
    }

    const draw = () => {
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const angle = -20;
        const radian = Math.PI * angle / 180;
        const cos = Math.cos(radian);
        const sin = Math.sin(radian);

        const modelViewMatrix = translate([0, -0.3, -3.5]);
        const perspectiveMatrix = perspective(fovY, aspectRatio, 0.1, 10);

        const projectionMatrix_Y = [
            cos,0,-sin,0,
            0,1,0,0,
            sin,0,cos,0,
            0,0,0,1,
        ];

        const projectionMatrix_Z = new Float32Array([
            1,0,0,0,
            0,cos,sin,0,
            0,-sin,cos,0,
            0,0,0,1,
        ]);
        
        gl.uniformMatrix4fv(uProjectionMatrix_Y, false, projectionMatrix_Y);
        gl.uniformMatrix4fv(uProjectionMatrix_Z, false, projectionMatrix_Z);
        gl.uniformMatrix4fv(uPerspectiveMatrix, false, perspectiveMatrix);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    };
    draw();
}