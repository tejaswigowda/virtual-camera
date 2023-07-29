function loadTexture(gl, base64) {
  var image = document.createElement("img");
  image.crossOrigin = "";
  image.addEventListener("load", function() {
    var texture = gl.createTexture(),
        sampler = gl.getUniformLocation(shaderProgram, "sampler");
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(sampler, 0);
  });
  image.src=base64;
}

let MatType = Float32Array;

function orthographic(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);

  dst[ 0] = 2 / (right - left);
  dst[ 1] = 0;
  dst[ 2] = 0;
  dst[ 3] = 0;
  dst[ 4] = 0;
  dst[ 5] = 2 / (top - bottom);
  dst[ 6] = 0;
  dst[ 7] = 0;
  dst[ 8] = 0;
  dst[ 9] = 0;
  dst[10] = 2 / (near - far);
  dst[11] = 0;
  dst[12] = (left + right) / (left - right);
  dst[13] = (bottom + top) / (bottom - top);
  dst[14] = (near + far) / (near - far);
  dst[15] = 1;

  return dst;
}

function translate(m, tx, ty, tz, dst) {
  // This is the optimized version of
  // return multiply(m, translation(tx, ty, tz), dst);
  dst = dst || new MatType(16);

  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m03 = m[3];
  var m10 = m[1 * 4 + 0];
  var m11 = m[1 * 4 + 1];
  var m12 = m[1 * 4 + 2];
  var m13 = m[1 * 4 + 3];
  var m20 = m[2 * 4 + 0];
  var m21 = m[2 * 4 + 1];
  var m22 = m[2 * 4 + 2];
  var m23 = m[2 * 4 + 3];
  var m30 = m[3 * 4 + 0];
  var m31 = m[3 * 4 + 1];
  var m32 = m[3 * 4 + 2];
  var m33 = m[3 * 4 + 3];

  if (m !== dst) {
    dst[ 0] = m00;
    dst[ 1] = m01;
    dst[ 2] = m02;
    dst[ 3] = m03;
    dst[ 4] = m10;
    dst[ 5] = m11;
    dst[ 6] = m12;
    dst[ 7] = m13;
    dst[ 8] = m20;
    dst[ 9] = m21;
    dst[10] = m22;
    dst[11] = m23;
  }

  dst[12] = m00 * tx + m10 * ty + m20 * tz + m30;
  dst[13] = m01 * tx + m11 * ty + m21 * tz + m31;
  dst[14] = m02 * tx + m12 * ty + m22 * tz + m32;
  dst[15] = m03 * tx + m13 * ty + m23 * tz + m33;

  return dst;
}


function scale(m, sx, sy, sz, dst) {
  // This is the optimized version of
  // return multiply(m, scaling(sx, sy, sz), dst);
  dst = dst || new MatType(16);

  dst[ 0] = sx * m[0 * 4 + 0];
  dst[ 1] = sx * m[0 * 4 + 1];
  dst[ 2] = sx * m[0 * 4 + 2];
  dst[ 3] = sx * m[0 * 4 + 3];
  dst[ 4] = sy * m[1 * 4 + 0];
  dst[ 5] = sy * m[1 * 4 + 1];
  dst[ 6] = sy * m[1 * 4 + 2];
  dst[ 7] = sy * m[1 * 4 + 3];
  dst[ 8] = sz * m[2 * 4 + 0];
  dst[ 9] = sz * m[2 * 4 + 1];
  dst[10] = sz * m[2 * 4 + 2];
  dst[11] = sz * m[2 * 4 + 3];

  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }

  return dst;
}



function createProgramX(
  gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
const errFn = opt_errorCallback || error;
const program = gl.createProgram();
shaders.forEach(function(shader) {
  gl.attachShader(program, shader);
});
if (opt_attribs) {
  opt_attribs.forEach(function(attrib, ndx) {
    gl.bindAttribLocation(
        program,
        opt_locations ? opt_locations[ndx] : ndx,
        attrib);
  });
}
gl.linkProgram(program);

// Check the link status
const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program);
    errFn('Error in program linking:' + lastError);

    gl.deleteProgram(program);
    return null;
}
return program;
}

function createProgramFromScripts(
  gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
const shaders = [];
for (let ii = 0; ii < shaderScriptIds.length; ++ii) {
  shaders.push(createShaderFromScript(
      gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback));
}
return createProgramX(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}




const vs = `
  attribute vec4 a_position;

  void main() {
    gl_Position = a_position;
  }
`;

const fs = `
precision highp float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float iTime;

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    vec4 cam = texture2D(iChannel0, uv)+texture2D(iChannel1, uv);
    gl_FragColor = vec4(cam.r, uv, 1.);
  }
`;



const vs2 = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = a_texcoord;
}
`;

const fs2 = `
precision mediump float;
  
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;



function wrapShaderToy(source) {
  return `

precision highp float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float iTime;

${source}

void main() {
  vec4 col;
  mainImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
`;
}
var programX;

class ShaderRenderer {
  constructor(canvas, video, shader) {
    this.canvas = canvas;
    this.video = video;

    this.gl = this.canvas.getContext("webgl");
    //this.gl.getExtension('EXT_shader_texture_lod');

    // programX = createProgramFromScripts(this.gl, ["drawImage-vertex-shader", "drawImage-fragment-shader"]);
    programX = this.createProgram(vs2, fs2);

    this.program = this.createProgram(vs, wrapShaderToy(shader));

    this.texture = this.gl.createTexture();

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), this.gl.STATIC_DRAW);
    this.resolutionLocation = this.gl.getUniformLocation(this.program, "iResolution");
    this.cameraLocation = this.gl.getUniformLocation(this.program, 'iChannel0');
    this.cameraLocation1 = this.gl.getUniformLocation(this.program, 'iChannel1');
    this.timeLocation = this.gl.getUniformLocation(this.program, "iTime");
  }

  createShader(sourceCode, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, sourceCode);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      var info = this.gl.getShaderInfoLog(shader);
      console.log(info);
      debugger;
      throw 'Could not compile WebGL program. \n\n' + info;
    }
    return shader;
  }

  createProgram(vertexShaderSource, fragmentShaderSource) {
    const vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    var program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    var success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    }
    console.log(this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
  }

  setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }


  loadImageAndCreateTextureInfo(url) {
    if (!this.gl) {
      return;
    }
    var gl = this.gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo = {
      width: 1,   // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    var img = new Image();
    img.addEventListener('load', function() {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      console.log(img);
      /*
      drawImage(
        textureInfo.texture,
        textureInfo.width,
        textureInfo.height,
        0,
        0);
        */

        var tex = textureInfo.texture;
        var texWidth = textureInfo.width;
        var texHeight = textureInfo.height;
        var dstX = 0;
        var dstY = 0;
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Tell WebGL to use our shader program pair
        gl.useProgram(programX);
    
        var matrixLocation = gl.getUniformLocation(programX, "u_matrix");
        var textureMatrixLocation = gl.getUniformLocation(programX, "u_textureMatrix");
        var textureLocation = gl.getUniformLocation(programX, "u_texture");

        // Setup the attributes to pull data from our buffers
        var positionBuffer = gl.createBuffer();
        var positionLocation = gl.getAttribLocation(programX, "a_position");
        var texcoordLocation = gl.getAttribLocation(programX, "a_texcoord");
        var texcoordBuffer = gl.createBuffer();

      
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.enableVertexAttribArray(texcoordLocation);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    
        // this matrix will convert from pixels to clip space
        var matrix = orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    
        // this matrix will translate our quad to dstX, dstY
        matrix = translate(matrix, dstX, dstY, 0);
    
        // this matrix will scale our 1 unit quad
        // from 1 unit to texWidth, texHeight units
        matrix = scale(matrix, texWidth, texHeight, 1);
    
        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);
    
        // Tell the shader to get the texture from texture unit 0
        gl.uniform1i(textureLocation, 0);
    
        // draw the quad (2 triangles, 6 vertices)
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    });
    img.src = url;
  }





  
  render(image) {
    //this.gl.clearColor(255, 0, 255, 1);
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT);


    


    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);



    var overlayImage = localStorage.getItem('mask');
    console.log(overlayImage);
    if (overlayImage) {
          var t = this;
          var image = new Image();
          image.onload = function () {
            // Now that the image has loaded make copy it to the texture.
            t.gl.bindTexture(t.gl.TEXTURE_2D, t.texture);
            t.gl.texImage2D(t.gl.TEXTURE_2D, 0, t.gl.RGBA, t.gl.RGBA, t.gl.UNSIGNED_BYTE, image);
            t.gl.texParameteri(t.gl.TEXTURE_2D, t.gl.TEXTURE_WRAP_S, t.gl.CLAMP_TO_EDGE);
            t.gl.texParameteri(t.gl.TEXTURE_2D, t.gl.TEXTURE_WRAP_T, t.gl.CLAMP_TO_EDGE);
            t.gl.texParameteri(t.gl.TEXTURE_2D, t.gl.TEXTURE_MIN_FILTER, t.gl.LINEAR);

            t.gl.bindTexture(t.gl.TEXTURE_2D, null);


          };
          image.src = overlayImage;
        
    }
    

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
    if (this.timeLocation) {
      this.gl.uniform1f(this.timeLocation, .001 * performance.now());
    }

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.cameraLocation, 0);
    this.gl.uniform1i(this.cameraLocation1, 0);





    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);




    
  }
}

export { ShaderRenderer }