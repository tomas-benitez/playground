import type { CanvasInfo, CanvasObject } from "../../webComponent";
import { Vector2 } from "@math.gl/core";

type LineConstructorParams = {
  canvasInfo: CanvasInfo;
};

export default class Line implements CanvasObject {
  linePoints: [Vector2, Vector2, Vector2, Vector2] = [
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
  ];
  terminalVelocity = 2;
  lastPointVelocity = new Vector2(0, 0);
  gravity = new Vector2(0, 0.1);

  constructor({ canvasInfo }: LineConstructorParams) {
    this.linePoints[0].set(canvasInfo.width / 2, 0);
    this.linePoints[1].set(canvasInfo.width / 2, 0);
    this.linePoints[2].set(canvasInfo.width / 2, canvasInfo.height / 5);
    this.linePoints[3].set(canvasInfo.width / 2 - 300, 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();

    ctx.moveTo(this.linePoints[0].x, this.linePoints[0].y);
    ctx.bezierCurveTo(
      this.linePoints[1].x,
      this.linePoints[1].y,
      this.linePoints[2].x,
      this.linePoints[2].y,
      this.linePoints[3].x,
      this.linePoints[3].y
    );

    ctx.lineWidth = 3;
    ctx.stroke();
  }

  update(canvasInfo: CanvasInfo): void {
    let lineForce = this.linePoints[0]
      .clone()
      .subtract(this.linePoints[3])
      .normalize();

    let lineForceVerticalness = normalizeHorizontalAngle(
      lineForce.horizontalAngle()
    );

    if (this.lastPointVelocity.magnitude() < this.terminalVelocity) {
      this.lastPointVelocity.add(this.gravity);
    }
    lineForce.multiplyByScalar(
      debugAndReturn(this.lastPointVelocity.magnitude())
    );
    console.log("lineForce magnitude", lineForce.magnitude());
    console.log("lastPointVelocity before line force", this.lastPointVelocity);

    this.lastPointVelocity.add(lineForce);

    console.log("lastPointVelocity after line force", this.lastPointVelocity);

    this.linePoints[3].add(this.lastPointVelocity);
  }

  destroy(): void {}
}

function normalizeHorizontalAngle(angle: number) {
  return Math.abs(Math.abs(0.5 - Math.abs(angle / Math.PI)) * 2 - 1);
}

function debugAndReturn<T>(value: T) {
  console.log(value);
  return value;
}
