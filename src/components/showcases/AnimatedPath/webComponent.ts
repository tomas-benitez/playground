import { returnOrThrow } from "@/utils/guards";
import { Vector2 } from "@math.gl/core";
import Background from "./canvasObjects/Background";
import Line from "./canvasObjects/Line";

export type CanvasInfo = {
  width: number;
  height: number;
  mouse: {
    position: Vector2;
  };
  ticks: number;
  canvasBoundingClientRect: {
    left: number;
    top: number;
  };
};

export interface CanvasObject {
  draw(ctx: CanvasRenderingContext2D): void;
  update(canvasInfo: CanvasInfo): void;
  destroy(): void;
  controls?: HTMLElement;
}

export default class AnimatedPathShowcase extends HTMLElement {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  canvasInfo: CanvasInfo;
  controlsContainer: HTMLElement;
  objects: CanvasObject[];

  constructor() {
    super();

    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("pointer-events-none");
    this.appendChild(this.canvas);
    this.appendChild(createShadowElement());
    this.ctx = returnOrThrow(this.canvas.getContext("2d"));
    this.canvasInfo = {
      width: (this.canvas.width = this.clientWidth),
      height: (this.canvas.height = this.clientHeight),
      mouse: {
        position: new Vector2(-100, -100),
      },
      ticks: 0,
      canvasBoundingClientRect: this.canvas.getBoundingClientRect(),
    };

    document.addEventListener("mousemove", this.onMouseMove.bind(this));

    document.addEventListener("scroll", this.onScroll.bind(this));

    this.objects = [
      new Background(),
      new Line({ canvasInfo: this.canvasInfo }),
    ];

    this.controlsContainer = returnOrThrow(
      document.getElementById("animated-path-showcase-controls")
    );

    this.objects.forEach((canvasObject) => {
      if (canvasObject.controls) {
        this.controlsContainer.appendChild(canvasObject.controls);
      }
    });

    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvasInfo.width, this.canvasInfo.height);
    this.objects.forEach((object) => object.update(this.canvasInfo));
    this.objects.forEach((object) => object.draw(this.ctx));

    this.canvasInfo.ticks++;
    requestAnimationFrame(this.draw.bind(this));
  }

  onMouseMove(e: MouseEvent) {
    this.canvasInfo.mouse.position.set(
      e.clientX - this.canvasInfo.canvasBoundingClientRect.left,
      e.clientY - this.canvasInfo.canvasBoundingClientRect.top
    );
  }

  onScroll() {
    this.canvasInfo.canvasBoundingClientRect =
      this.canvas.getBoundingClientRect();
  }
}

function createShadowElement() {
  let shadow = document.createElement("div");
  shadow.classList.add("shadow-[inset_0_0_10px_10px_rgba(0,0,0,0.2)]");
  shadow.classList.add("absolute");
  shadow.classList.add("inset-0");
  shadow.classList.add("pointer-events-none");
  return shadow;
}
