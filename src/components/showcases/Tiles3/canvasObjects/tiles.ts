import { returnOrThrow } from "@/utils/guards";
import type { CanvasObject } from "../webComponent";
import { Vector2 } from "@math.gl/core";

type rgbColor = [number, number, number];

const colorPalettes = {
  warm: [
    [255, 204, 13],
    [255, 115, 38],
    [255, 25, 77],
    [191, 38, 105],
    [112, 42, 140],
  ],
  flat: [
    [44, 62, 80],
    [231, 76, 60],
    [236, 240, 241],
    [52, 152, 219],
    [41, 128, 185],
  ],
  vintage: [
    [176, 30, 30],
    [52, 48, 143],
    [235, 198, 42],
    [224, 165, 47],
    [197, 63, 45],
  ],
  pink: [
    [177, 7, 110],
    [113, 5, 70],
    [240, 10, 149],
    [252, 10, 157],
    [214, 9, 133],
  ],
  green: [
    [13, 28, 51],
    [23, 55, 60],
    [43, 104, 50],
    [79, 147, 0],
    [161, 215, 0],
  ],
  cold: [
    [0, 254, 255],
    [0, 200, 255],
    [0, 155, 223],
    [0, 91, 255],
    [0, 36, 255],
  ],
} satisfies Record<string, rgbColor[]>;

function getRandomColor(paletteName: keyof typeof colorPalettes) {
  const palette = colorPalettes[paletteName];
  if (!palette) throw new Error("Wrong color palette name");
  return palette[Math.floor(Math.random() * palette.length)];
}

type TilesConstructorParams = {
  initialValues: {
    width: number;
    height: number;
    tileSize: number;
  };
  rootElem: HTMLElement;
};

type Tile = {
  position: Vector2;
  size: number;
  opacity: number;
  padding: number;
  color: rgbColor;
  hoveredColor: rgbColor;
};

export default class Tiles implements CanvasObject {
  width: number;
  height: number;
  rowsNumber: number;
  columnsNumber: number;
  tileNormalColor: rgbColor = [0, 0, 0];
  tileNormalPadding = 0.2;
  tileNormalOpacity = 0.1;
  tileSize: number;
  tiles: Tile[][] = [];
  mouseEffectSize = 5;
  vectorDistanceToTileCenter: Vector2;
  colorPaletteOptions: (keyof typeof colorPalettes)[] = [
    "warm",
    "flat",
    "vintage",
    "pink",
    "green",
    "cold",
  ];
  selectedColorPaletteIndex = 0;
  pathLength: number;
  pathPoints: Float32Array;
  pathCurrentPosition = 0;
  pathCurrentPositionVector: Vector2;
  authPathMinSpeed = 1;
  authPathMaxSpeed = 64;
  autoPathSpeed = 1;
  expandedSpeedMap: Float32Array;
  pathRandomness = 0;

  constructor({ initialValues, rootElem }: TilesConstructorParams) {
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
              color: [...this.tileNormalColor],
              hoveredColor: getRandomColor(
                this.colorPaletteOptions[this.selectedColorPaletteIndex]
              ),
            };
          });
      });

    this.vectorDistanceToTileCenter = new Vector2(
      this.tileSize / 2,
      this.tileSize / 2
    );

    const autoPath = findAutoPathElement(rootElem);

    const autoPathSpeedMap = parseSpeedMap(
      returnOrThrow(autoPath.dataset.speedMap)
    );

    const autoPathTotalLength = Math.floor(autoPath.getTotalLength());
    this.pathLength = Math.floor(autoPathTotalLength);
    this.pathPoints = new Float32Array((this.pathLength + 1) * 2);

    this.expandedSpeedMap = expandSpeedMap(autoPathSpeedMap, this.pathLength);
    this.autoPathSpeed = Math.round(
      mapToRange(
        this.authPathMinSpeed,
        this.authPathMaxSpeed,
        this.expandedSpeedMap[0]
      )
    );

    for (let i = 0; i <= this.pathLength; i++) {
      let point = autoPath.getPointAtLength(i);
      this.pathPoints[i * 2] = point.x;
      this.pathPoints[i * 2 + 1] = point.y;
    }

    this.pathCurrentPositionVector = new Vector2(
      this.pathPoints[this.pathCurrentPosition * 2],
      this.pathPoints[this.pathCurrentPosition * 2 + 1]
    );

    document.addEventListener("click", () => {
      this.selectedColorPaletteIndex =
        (this.selectedColorPaletteIndex + 1) % this.colorPaletteOptions.length;
      this.tiles.forEach((row) =>
        row.map(
          (tile) =>
            (tile.hoveredColor = getRandomColor(
              this.colorPaletteOptions[this.selectedColorPaletteIndex]
            ))
        )
      );
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const tileRow of this.tiles) {
      for (const tile of tileRow) {
        ctx.fillStyle = `rgb(${tile.color.join(", ")})`;
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
          .distanceTo(this.pathCurrentPositionVector);

        if (distanceToMouse < this.mouseEffectSize * 20) {
          let distanceEffectOpacity = Math.max(
            (distanceToMouse * -1) / 80,
            -0.87
          );
          let distanceEffectPadding = Math.min(distanceToMouse / 5, 12.2);
          tile.opacity = 1 + distanceEffectOpacity;
          tile.padding = -1 + distanceEffectPadding;
          tile.color = [...tile.hoveredColor];

          return;
        }

        if (tile.opacity > this.tileNormalOpacity) tile.opacity -= 0.05;
        if (tile.padding > this.tileNormalPadding) tile.padding *= 0.98;
        if (tile.color[0] > this.tileNormalColor[0]) tile.color[0] -= 4;
        if (tile.color[1] > this.tileNormalColor[1]) tile.color[1] -= 4;
        if (tile.color[2] > this.tileNormalColor[2]) tile.color[2] -= 4;
      })
    );

    this.pathCurrentPosition =
      (this.pathCurrentPosition + this.autoPathSpeed) % this.pathLength;
    this.autoPathSpeed = Math.floor(
      mapToRange(
        this.authPathMinSpeed,
        this.authPathMaxSpeed,
        this.expandedSpeedMap[this.pathCurrentPosition]
      )
    );

    this.pathCurrentPositionVector.set(
      this.pathPoints[this.pathCurrentPosition * 2] +
        Math.random() * this.pathRandomness -
        this.pathRandomness / 2,
      this.pathPoints[this.pathCurrentPosition * 2 + 1] +
        Math.random() * this.pathRandomness -
        this.pathRandomness / 2
    );
  }

  destroy() {
    // no-op
  }
}

function parseSpeedMap(
  speedMapString: string
): { stopValue: number; speed: number }[] {
  let speedMap = speedMapString
    .split(";")
    .map(
      (speedMapSegment) =>
        speedMapSegment.split(":").map((value) => {
          let parsedValue = parseFloat(value);
          if (Number.isNaN(parsedValue))
            throw new Error("Speed map is invalid");
          return parsedValue;
        }) as [number, number]
    )
    .map(([stop, speed]) => ({ stopValue: stop, speed }));

  let firstStop = speedMap[0];
  if (firstStop.stopValue !== 0) {
    speedMap.unshift({ speed: 0, stopValue: 0 });
  }
  let lastStop = speedMap[speedMap.length - 1];
  if (lastStop.stopValue !== 1) {
    speedMap.push({
      speed: lastStop.speed,
      stopValue: 1,
    });
  }

  return speedMap;
}

function findAutoPathElement(rootElem: HTMLElement) {
  const autoPath = rootElem.querySelector(
    "#auto-path > path"
  ) as SVGPathElement;
  if (!autoPath) throw new Error("auto path svg not found.");
  return autoPath;
}

function expandSpeedMap(
  speedMap: { stopValue: number; speed: number }[],
  totalLength: number
) {
  let array = new Float32Array(totalLength);

  for (let i = 0; i < speedMap.length - 1; i++) {
    const currentSpeedStop = speedMap[i];
    const nextSpeedStop = speedMap[i + 1];
    const segmentStart = Math.floor(array.length * currentSpeedStop.stopValue);
    const segmentLength =
      Math.floor(array.length * nextSpeedStop.stopValue) - segmentStart - 1;

    for (let j = 0; j <= segmentLength; j++) {
      let arrayIndex = segmentStart + j;
      if (array[arrayIndex] === undefined) throw new Error("bad array index");
      let segmentProgress = j / segmentLength;
      let mappedSpeed = mapToRange(
        currentSpeedStop.speed,
        nextSpeedStop.speed,
        segmentProgress
      );
      array[arrayIndex] = mappedSpeed;
    }
  }

  return array;
}

function mapToRange(min: number, max: number, value: number) {
  return min + value * max - value * min;
}
