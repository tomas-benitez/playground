import type { Vector2 } from "@math.gl/core";
import type { CanvasObject } from "../webComponent";

type BackgroundConstructorParams = {
  initialValues: {
    width: number;
    height: number;
  };
};

export default class Background implements CanvasObject {
  width: number;
  height: number;
  colorStops: [number, number, number][] = [
    [0, 255, 255],
    [255, 0, 255],
    [255, 255, 0],
  ];
  color: [number, number, number] = [...this.colorStops[0]];
  targetStopIndex = 1;

  constructor({ initialValues }: BackgroundConstructorParams) {
    this.width = initialValues.width;
    this.height = initialValues.height;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
    ctx.rect(0, 0, this.width, this.height);
    ctx.fill();
  }

  update() {
    const targetStop = this.colorStops[this.targetStopIndex];
    if (this.color[0] !== targetStop[0]) {
      let diff = targetStop[0] - this.color[0];
      this.color[0] += diff / Math.abs(diff);
    }
    if (this.color[1] !== targetStop[1]) {
      let diff = targetStop[1] - this.color[1];
      this.color[1] += diff / Math.abs(diff);
    }
    if (this.color[2] !== targetStop[2]) {
      let diff = targetStop[2] - this.color[2];
      this.color[2] += diff / Math.abs(diff);
    }

    if (
      this.color[0] === targetStop[0] &&
      this.color[1] === targetStop[1] &&
      this.color[2] === targetStop[2]
    ) {
      this.targetStopIndex =
        (this.targetStopIndex + 1) % this.colorStops.length;
    }
  }

  destroy() {
    // no-op
  }
}
