export class CJ4_MFD_ChartView extends HTMLElement {

  private _image = new Image;
  private _canvas: HTMLCanvasElement;
  private _zoom: number = 1;
  private _yOffset: number = 0;
  private _xOffset: number = 0;

  connectedCallback(): void {
    this._canvas = this.querySelector("#chartcanvas");
    this._image.src = "/Pages/VCockpit/Instruments/Airliners/CJ4/Shared/sample.png?cb=2";
  }

  update(_dTime: number): void {
    const ctx = this._canvas.getContext("2d");
    this.fitToContainer(this._canvas);
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    // ctx.drawImage(this._image, 0, 0, this._image.width, this._image.height, 0, 0, this._canvas.width, this._canvas.height); // Or at whatever offset you like
    this.scaleToFit(this._canvas, ctx, this._image, this._zoom, this._yOffset, this._xOffset);
  }

  onEvent(event: string): void {
    switch (event) {
      case "Lwr_Push_ZOOM_INC":
      case "Lwr_Push_ZOOM_DEC":
        this._zoom = this._zoom === 1 ? 1.5 : 1;
        break;
      case "Lwr_JOYSTICK_UP":
        this._yOffset = Math.min(0, this._yOffset + 40);
        break;
      case "Lwr_JOYSTICK_DOWN":
        this._yOffset = Math.max(-((this._canvas.height / 2) * this._zoom), this._yOffset - 40);
        break;
      case "Lwr_JOYSTICK_LEFT":
        this._xOffset = Math.min(0, this._xOffset + 40);
        break;
      case "Lwr_JOYSTICK_RIGHT":
        this._xOffset = Math.max(-((this._canvas.width / 2) * this._zoom), this._xOffset - 40);
        break;
      default:
        break;
    }
  }

  // clear(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  //   // Clear the entire canvas
  //   const p1 = ctx.transformedPoint(0, 0);
  //   const p2 = ctx.transformedPoint(canvas.width, canvas.height);
  //   ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

  //   ctx.save();
  //   ctx.setTransform(1, 0, 0, 1, 0, 0);
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   ctx.restore();
  // }

  scaleToFit(canvas, ctx, img, zoom = 0, yOffset = 0, xOffset = 0) {
    // get the scale
    const scale = (canvas.width / img.width) * zoom;
    // get the top left position of the image
    const x = 0; //(canvas.width / 2) - (img.width / 2) * scale;
    const y = 0; //(canvas.height / 2) - (img.height / 2) * scale;
    ctx.drawImage(img, x + xOffset, y + yOffset, img.width * scale, img.height * scale);
  }

  fitToContainer(canvas): void {
    // Make it visually fill the positioned parent
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
}

customElements.define("cj4-mfd-chartview", CJ4_MFD_ChartView);