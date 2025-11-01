import { Fx } from "./Fx";

export class TracerFx implements Fx {
  private elapsed = 0;

  constructor(
    private readonly startX: number,
    private readonly startY: number,
    private readonly endX: number,
    private readonly endY: number,
    private readonly lifetime: number,
  ) {}

  renderTick(duration: number, ctx: CanvasRenderingContext2D): boolean {
    this.elapsed += duration;
    const progress = Math.min(this.elapsed / this.lifetime, 1);
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();
    ctx.restore();

    return this.elapsed < this.lifetime;
  }
}
