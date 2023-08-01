import { ShaderRenderer } from './shader-renderer.js';

import {
  FilesetResolver,
  ImageSegmenter
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

var runningMode = "IMAGE";
var imageSegmenter;

async function createImageSegmenter() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-assets/deeplabv3.tflite?generation=1661875711618421",
    },
    outputCategoryMask: true,//true,
    outputConfidenceMasks: true,//false,
    runningMode: runningMode
  });


}
//createImageSegmenter();




var maskCanvas = document.createElement('canvas');
window.maskCanvas = maskCanvas;
var maskCtx = maskCanvas.getContext('2d');
window.maskCtx = maskCtx;

var theCanvas;

ShaderRenderer.prototype.setUniform = function (name, value) {
  const uniform = this.uniforms[name];
  if (uniform) {
    uniform.value = value;
  }
};

class FilterStream {
  constructor(stream, shader) {
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    theCanvas = canvas;
    this.video = video;
    this.renderer = new ShaderRenderer(this.canvas, video, shader);



    video.addEventListener("playing", () => {
      // Use a 2D Canvas.
      maskCanvas.width = this.video.videoWidth;
      maskCanvas.height = this.video.videoHeight;


      // Use a WebGL Renderer.
      this.renderer.setSize(this.video.videoWidth, this.video.videoHeight);
      this.update();
    });
    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;
    this.outputStream = this.canvas.captureStream();
  }

  update() {

  if(window.doSegmentation) {
    maskCtx.drawImage(this.video, 0, 0);

    imageSegmenter.segment(maskCanvas, function (segmentation) {
      console.log(segmentation);

      let imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
      const mask = segmentation.categoryMask.getAsUint8Array();

      //const mask = segmentation.confidenceMask.getAsUint8Array();
     //console.log(mask);

      for (let i in mask) {

        if (mask[i] != 0) continue;
        imageData[i * 4] = 0//legendColor[0]//(legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = 0//legendColor[1]//(legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = 0//legendColor[2]//(legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = 0//legendColor[3]//(legendColor[3] + imageData[i * 4 + 3]) / 2;
      }
      const uint8Array = new Uint8ClampedArray(imageData.buffer);
      const dataNew = new ImageData(uint8Array, maskCanvas.width, maskCanvas.height);
      maskCtx.putImageData(dataNew, 0, 0);

    });

  }
  




      this.renderer.render()

      if(window.doSegmentation) {
        console.log(window.maskCanvas.toDataURL("image/png"));
        var overlayImage = window.maskCtx.getImageData(0, 0, window.maskCanvas.width, window.maskCanvas.height);
         if (overlayImage) {
        //this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        //window.gl.bindTexture(window.gl.TEXTURE_2D, this.texture);
  
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          window.gl.activeTexture(window.gl.TEXTURE0);
          //this.gl.uniform1i(this.u_image0, 0);
          // add overlayImage to this.selfieTexture
    //        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
          window.gl.texSubImage2D(window.gl.TEXTURE_2D, 0, 0, 0, window.gl.RGBA, window.gl.UNSIGNED_BYTE, overlayImage);
          //this.gl.bindTexture(this.gl.TEXTURE_2D, null);
          /*
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);     
          */
         // window.gl.drawArrays(window.gl.TRIANGLES, 0, 6);
          
         }
        }
    



    requestAnimationFrame(() => this.update());
  }
}

export { FilterStream }