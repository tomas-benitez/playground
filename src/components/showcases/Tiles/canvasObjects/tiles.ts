import type { CanvasObject } from "../webComponent";
import { Vector2 } from "@math.gl/core";

type TilesConstructorParams = {
  initialValues: {
    width: number;
    height: number;
    tileSize: number;
  };
};

type Tile = {
  position: Vector2;
  size: number;
  opacity: number;
  padding: number;
  color: string;
};

export default class Tiles implements CanvasObject {
  width: number;
  height: number;
  rowsNumber: number;
  columnsNumber: number;
  tileNormalColor = "black";
  tileNormalPadding = 0.2;
  tileNormalOpacity = 0.7;
  tileSize: number;
  tiles: Tile[][] = [];
  mouseEffectSize = 5;
  vectorDistanceToTileCenter: Vector2;

  constructor({ initialValues }: TilesConstructorParams) {
    this.width = initialValues.width;
    this.height = initialValues.height;
    this.tileSize = initialValues.tileSize;
    this.rowsNumber = this.height / this.tileSize;
    this.columnsNumber = this.width / this.tileSize;

    this.tiles = Array(this.rowsNumber)
      .fill(0)
      .map((_, i) => {
        return Array(this.columnsNumber)
          .fill(0)
          .map((_, j) => {
            return {
              position: new Vector2(j * this.tileSize, i * this.tileSize),
              size: this.tileSize,
              opacity: this.tileNormalOpacity,
              padding: this.tileNormalPadding,
              color: this.tileNormalColor,
            };
          });
      });

    this.vectorDistanceToTileCenter = new Vector2(
      this.tileSize / 2,
      this.tileSize / 2
    );

    console.log(this.tiles);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const tileRow of this.tiles) {
      for (const tile of tileRow) {
        ctx.fillStyle = tile.color;
        ctx.globalAlpha = tile.opacity;
        ctx.beginPath();
        ctx.rect(
          tile.position.x + tile.padding,
          tile.position.y + tile.padding,
          tile.size - tile.padding * 2,
          tile.size - tile.padding * 2
        );
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  update(params: Parameters<CanvasObject["update"]>[0]) {
    this.tiles.forEach((row) =>
      row.forEach((tile) => {
        let distanceToMouse = tile.position
          .clone()
          .add(this.vectorDistanceToTileCenter)
          .distanceTo(params.mouse.position);

        if (distanceToMouse < this.mouseEffectSize * 20) {
          let distanceEffectOpacity = Math.max(
            (distanceToMouse * -1) / 100,
            -0.25
          );
          let distanceEffectPadding = Math.max(
            (distanceToMouse * -1) / 20,
            -4.2
          );
          tile.opacity = 1 + distanceEffectOpacity;
          tile.padding = 5 + distanceEffectPadding;

          return;
        }

        if (tile.opacity > this.tileNormalOpacity) tile.opacity -= 0.005;
        if (tile.padding > this.tileNormalPadding) tile.padding *= 0.99;
      })
    );
  }

  destroy() {
    // no-op
  }
}
