import { ShaderRenderer } from './shader-renderer.js';
//import {vision} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest';

import {
  FilesetResolver,
  ImageSegmenter
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";


var imageSegmenter;
var runningMode = "VIDEO";

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


class FilterStream {
  constructor(stream, shader) {
    console.log("New Filter for stream", stream);
    this.stream = stream;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    this.video = video;
    this.renderer = new ShaderRenderer(this.canvas, video, shader);

    video.addEventListener("playing", () => {
      // Use a 2D Canvas.
      // this.canvas.width = this.video.videoWidth;
      // this.canvas.height = this.video.videoHeight;

      // Use a WebGL Renderer.
      this.renderer.setSize(this.video.videoWidth, this.video.videoHeight);
      this.update();
    });
    video.srcObject = stream;
    video.autoplay = true;
    this.video = video;
    //this.ctx = this.canvas.getContext('2d');
    this.outputStream = this.canvas.captureStream();
  }

  update() {
    // Use a 2D Canvas
    // this.ctx.filter = 'invert(1)';
    // this.ctx.drawImage(this.video, 0, 0);
    // this.ctx.fillStyle = '#ff00ff';
    // this.ctx.textBaseline = 'top';
    // this.ctx.fillText('Virtual', 10, 10)

    

    
     this.renderer.render();
     if(imageSegmenter){
      let startTimeMs = performance.now();
      imageSegmenter.segmentForVideo(this.video, startTimeMs, function(mask) {
        console.log("mask", mask);
        // Use a WebGL renderer to render the mask.
        

        //this.renderer.renderWithMask(mask);
      });
    }
    requestAnimationFrame(() => this.update());
  }
}

export { FilterStream }