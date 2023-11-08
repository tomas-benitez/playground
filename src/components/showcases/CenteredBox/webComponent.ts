import { returnOrThrow } from "@/utils/guards";
import { Vector2 } from "@math.gl/core";
import Background from "./canvasObjects/Background";

export interface CanvasObject {
  draw(ctx: CanvasRenderingContext2D): void;
  update(params: {
    mouse: {
      position: Vector2;
    };
    ticks: number;
    canvasBoundingClientRect: {
      left: number;
      top: number;
    };
  }): void;
  destroy(): void;
  controls?: HTMLElement;
}

export default class CenteredBoxShowcase extends HTMLElement {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  controlsContainer: HTMLElement;
  objects: CanvasObject[];

  mouse = {
    position: new Vector2(-100, -100),
  };
  canvasBoundingClientRect: {
    left: number;
    top: number;
  } = {
    left: 0,
    top: 0,
  };
  ticks = 0;

  constructor() {
    super();

    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("pointer-events-none");
    this.appendChild(this.canvas);
    this.appendChild(createShadowElement());
    this.ctx = returnOrThrow(this.canvas.getContext("2d"));
    this.width = this.canvas.width = this.clientWidth;
    this.height = this.canvas.height = this.clientHeight;

    document.addEventListener("mousemove", this.onMouseMove.bind(this));

    this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();
    document.addEventListener("scroll", this.onScroll.bind(this));

    this.objects = [
      new Background({
        rootElem: this,
      }),
    ];

    this.controlsContainer = returnOrThrow(
      document.getElementById("centered-box-showcase-controls")
    );

    this.objects.forEach((canvasObject) => {
      if (canvasObject.controls) {
        this.controlsContainer.appendChild(canvasObject.controls);
      }
    });

    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.objects.forEach((object) =>
      object.update({
        mouse: this.mouse,
        ticks: this.ticks,
        canvasBoundingClientRect: this.canvasBoundingClientRect,
      })
    );
    this.objects.forEach((object) => object.draw(this.ctx));

    this.ticks++;
    requestAnimationFrame(this.draw.bind(this));
  }

  onMouseMove(e: MouseEvent) {
    this.mouse.position.set(
      e.clientX - this.canvasBoundingClientRect.left,
      e.clientY - this.canvasBoundingClientRect.top
    );
  }

  onScroll() {
    this.canvasBoundingClientRect = this.canvas.getBoundingClientRect();
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
