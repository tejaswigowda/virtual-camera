import { ShaderRenderer } from './shader-renderer.js';





const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 104, 0, 255], // Vivid Orange
  [166, 189, 215, 255] // Very Light Blue
];



var mask = null;




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
    outputCategoryMask: true,
    outputConfidenceMasks: false,
    runningMode: runningMode
  });


}
createImageSegmenter();




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

  if(localStorage.getItem("doSegmentation")=== "true") {
    maskCtx.drawImage(this.video, 0, 0);

    imageSegmenter.segment(maskCanvas, function (segmentation) {
      //console.log(segmentation);

      let imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
      const mask = segmentation.categoryMask.getAsUint8Array();
      //console.log(mask);

      for (let i in mask) {
        // transparent pixel
        //imageData[i * 4 + 3] = 0;

        //continue;

        const legendColor = legendColors[mask[i] % legendColors.length];
        if (mask[i] != 0) continue;
        imageData[i * 4] = 0//legendColor[0]//(legendColor[0] + imageData[i * 4]) / 2;
        imageData[i * 4 + 1] = 0//legendColor[1]//(legendColor[1] + imageData[i * 4 + 1]) / 2;
        imageData[i * 4 + 2] = 0//legendColor[2]//(legendColor[2] + imageData[i * 4 + 2]) / 2;
        imageData[i * 4 + 3] = 0//legendColor[3]//(legendColor[3] + imageData[i * 4 + 3]) / 2;
      }
      const uint8Array = new Uint8ClampedArray(imageData.buffer);
      const dataNew = new ImageData(uint8Array, maskCanvas.width, maskCanvas.height);
      maskCtx.putImageData(dataNew, 0, 0);

      //var maskCanvas.toDataURL("image/png"));
      //localStorage.setItem("mask", maskCanvas.toDataURL("image/png"));
    });

  }
  




      this.renderer.render()
    



    requestAnimationFrame(() => this.update());
  }
}

export { FilterStream }