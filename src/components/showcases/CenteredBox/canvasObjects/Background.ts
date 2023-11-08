import type { Vector2 } from "@math.gl/core";
import type { CanvasObject } from "../webComponent";
import type CenteredBoxShowcase from "../webComponent";
import { returnOrThrow } from "@/utils/guards";

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

type BackgroundContructorParams = {
  rootElem: CenteredBoxShowcase;
};

type Rect = {
  lineWidth: number;
  opacity: number;
  maximunOpacity: number;
  lineWidthChangeRate: number;
  color: rgbColor;
};

export default class Background implements CanvasObject {
  width: number;
  height: number;
  rects: Rect[];
  defaultRectsCount = 20;
  minimunLineWidth = 3;
  maximunLineWidth = 10;
  transmitionThreshold = 1.3;
  colorPaletteOptions: (keyof typeof colorPalettes)[] = [
    "warm",
    "flat",
    "vintage",
    "pink",
    "green",
    "cold",
  ];
  selectedColorPaletteIndex = 0;
  controls: HTMLElement;

  constructor({ rootElem }: BackgroundContructorParams) {
    this.width = rootElem.width;
    this.height = rootElem.height;

    this.rects = createRects(this.defaultRectsCount, {
      lineWidth: this.minimunLineWidth,
      opacity: 0,
    });

    let controlsContainer = document.createElement("div");
    controlsContainer.className = "flex items-start space-x-4 flex-wrap";
    controlsContainer.appendChild(
      createRangeControl({
        default: this.defaultRectsCount,
        min: 3,
        max: 30,
        step: 1,
        label: "Rects count",
        onChange: (value) => {
          this.rects = createRects(value, {
            lineWidth: this.minimunLineWidth,
            opacity: 0,
          });
        },
      })
    );
    controlsContainer.appendChild(
      createRangeControl({
        default: this.maximunLineWidth,
        min: 8,
        max: 50,
        step: 1,
        label: "Maximun line width",
        onChange: (value) => {
          this.maximunLineWidth = value;
        },
      })
    );
    controlsContainer.appendChild(
      createRangeControl({
        default: this.minimunLineWidth,
        min: 1,
        max: 20,
        step: 1,
        label: "Minimun line width",
        onChange: (value) => {
          this.minimunLineWidth = value;
          this.rects[this.rects.length - 1].lineWidthChangeRate = 1.5;
          this.rects[this.rects.length - 1].opacity = 1;
        },
      })
    );

    controlsContainer.appendChild(
      createRangeControl({
        default: this.transmitionThreshold,
        min: 1,
        max: 3,
        step: 0.1,
        label: "Transmition threshold",
        onChange: (value) => {
          this.transmitionThreshold = value;
        },
      })
    );

    this.controls = controlsContainer;

    returnOrThrow(rootElem.querySelector("button")).addEventListener(
      "click",
      () => {
        this.rects[this.rects.length - 1].lineWidthChangeRate = 1.5;
        this.rects[this.rects.length - 1].opacity = 1;

        this.selectedColorPaletteIndex =
          (this.selectedColorPaletteIndex + 1) %
          this.colorPaletteOptions.length;
        this.rects.forEach((rect) => {
          rect.color = getRandomColor(
            this.colorPaletteOptions[this.selectedColorPaletteIndex]
          );
        });
      }
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const initialX = this.width * (20 / this.width);
    const initialY = this.height * (20 / this.height);
    const finalX = this.width / 2 - 1;
    const finalY = this.height / 2 - 1;
    const progressIncrement = 1 / (this.rects.length - 1);

    for (let i = 0; i < this.rects.length; i++) {
      let rect = this.rects[i];
      let x = mapToRange(initialX, finalX, i * progressIncrement * 0.83);
      let y = mapToRange(initialY, finalY, i * progressIncrement);
      ctx.beginPath();
      ctx.rect(x, y, this.width - x * 2, this.height - y * 2);
      ctx.strokeStyle = `rgb(${rect.color.join(", ")})`;
      ctx.lineWidth = rect.lineWidth;
      ctx.globalAlpha = rect.opacity;
      ctx.stroke();
      ctx.closePath();
    }
    ctx.globalAlpha = 1;
  }

  update(): void {
    let loopIndex = 0;
    for (let i = this.rects.length - 1; i >= 0; i--) {
      let rect = this.rects[i];
      let nextRect = this.rects[i - 1];
      if (rect.lineWidth > this.maximunLineWidth)
        rect.lineWidthChangeRate = 0.9;
      if (rect.lineWidth < this.minimunLineWidth) {
        rect.lineWidthChangeRate = 1;
        rect.lineWidth = this.minimunLineWidth;
        rect.opacity = 0;
      }
      rect.lineWidth *= rect.lineWidthChangeRate;

      if (
        nextRect &&
        nextRect.lineWidthChangeRate === 1 &&
        rect.lineWidth > this.minimunLineWidth * this.transmitionThreshold
      ) {
        nextRect.lineWidthChangeRate = 1.2;
        nextRect.opacity = nextRect.maximunOpacity;
      }
      loopIndex++;
    }
  }

  destroy(): void {
    // no-op
  }
}

function createRects(number: number, params?: Partial<Rect>): Rect[] {
  return Array(number)
    .fill(undefined)
    .map((_, i) =>
      createRect({
        ...params,
        opacity: params?.opacity ?? mapToRange(0.4, 1, (i + 1) / number),
        maximunOpacity: mapToRange(1, 0, (i + 1) / number),
      })
    );
}

function createRect(params?: Partial<Rect>): Rect {
  return {
    lineWidth: params?.lineWidth ?? 10,
    opacity: params?.opacity ?? 1,
    lineWidthChangeRate: params?.lineWidthChangeRate ?? 1,
    color: getRandomColor("flat"),
    maximunOpacity: params?.maximunOpacity ?? 1,
  };
}

function mapToRange(min: number, max: number, value: number) {
  return min + value * max - value * min;
}

function createRangeControl(params: {
  default: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step: number;
  label: string;
}) {
  let label = document.createElement("label");
  label.className = "flex flex-col items-start";
  let input = document.createElement("input");
  input.type = "range";
  input.min = params.min.toString();
  input.max = params.max.toString();
  input.step = params.step.toString();
  input.value = params.default.toString();

  label.innerHTML = `
    <span>${params.label}: <span data-js="value-counter">${input.value}</span></span>
  `;
  label.appendChild(input);

  let valueCounter = returnOrThrow(
    label.querySelector("[data-js='value-counter']")
  );

  input.addEventListener("input", () => {
    valueCounter.textContent = input.value;
    params.onChange(parseFloat(input.value));
  });

  return label;
}
