import { NG_Chart } from "../../types/navigraph";

// TODO: split the actual viewer stuff from this class into a more generic viewer component for later reuse
export class CJ4_MFD_ChartView extends HTMLElement {

  private readonly _renderCd: number = 50;
  private _renderTmr: number = 50;

  private _srcImage = new Image;
  private _planeImage = new Image;
  private _chart: NG_Chart = undefined;
  private _canvas: HTMLCanvasElement;
  private _zoom: number = 1;
  private _yOffset: number = 0;
  private _xOffset: number = 0;
  private _isDirty: boolean = true;

  private readonly STEP_RATE = 40;
  private _chartindexnumber: HTMLElement;
  private _chartprocidentifier: HTMLElement;
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public get isPortrait(): boolean {
    return this._srcImage.height > this._srcImage.width;
  }

  private set xOffset(value: number) {
    this._xOffset = Math.min(0, Math.max(-(this._dimensions.chartW * this._zoom - this._canvas.width), value));
  }

  private get xOffset(): number {
    return this._xOffset;
  }

  private set yOffset(value: number) {
    this._yOffset = Math.min(0, Math.max(-(this._dimensions.chartH * this._zoom - this._canvas.height) - 20, value));
  }

  private get yOffset(): number {
    return this._yOffset;
  }


  private readonly _dimensions = {
    chartid: "",
    bboxBorder: 54,
    bboxW: 0,
    bboxH: 0,
    imgRatio: 0,
    chartW: 0,
    chartH: 0,
    scaleW: 0,
    scaleH: 0,
    planW: 0,
    planH: 0,
    pxPerLong: 0,
    pxPerLat: 0,
    boxW: 0,
    boxH: 0,
    boxPosX: 0,
    boxPosY: 0,
  }

  connectedCallback(): void {
    this._chartindexnumber = this.querySelector("#chartinfo_indexnumber");
    this._chartprocidentifier = this.querySelector("#chartinfo_procidentifier");
    this._canvas = this.querySelector("#chartcanvas");
    this._srcImage.src = "#";
    this._srcImage.onload = this.onSrcImageLoaded.bind(this);
    this._planeImage.src = "coui://html_UI/Pages/VCockpit/Instruments/Airliners/CJ4/WTLibs/Images/icon_plane.png?cb=323334";
  }

  onSrcImageLoaded(): void {
    this._xOffset = 0;
    this._yOffset = 0;
    this._zoom = 1;
    this.scaleImgToFit();
    this._isDirty = true;
  }

  loadChart(url: string = "", chart: NG_Chart = undefined): void {
    if (url !== "") {
      this._srcImage.src = url;
    }
    if (chart !== undefined) {
      this._chart = chart;
      this._chartindexnumber.textContent = `${chart.icao_airport_identifier} ${chart.index_number}`;
      this._chartprocidentifier.textContent = chart.procedure_identifier;
    }
  }

  update(dTime: number): void {
    if (this.isVisible) {
      this._renderTmr -= dTime;
      if (this._renderTmr > 0 && this._isDirty === false) {
        return;
      }
      this._renderTmr = this._renderCd;
      this._isDirty = false;
      const ctx = this._canvas.getContext("2d");
      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
      ctx.setTransform(this._zoom, 0, 0, this._zoom, this._xOffset, this._yOffset);
      if (this._srcImage.src !== "" && this._srcImage.src.indexOf("#") === -1) {
        this.drawImage(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // if (this._zoom === 1) {
        //   this.drawRect(ctx);
        // }
      } else {
        ctx.fillStyle = "#cccac8";
        ctx.textAlign = "center";
        ctx.font = "26px Collins ProLine";
        ctx.fillText("NO CHART AVAILABLE", this._canvas.width / 2, this._canvas.height / 2);
      }
    }
  }

  drawRect(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 4;
    const scrollGapX = this._dimensions.chartW - this._canvas.width;
    const scrollGapY = this._dimensions.chartH - this._canvas.height;
    const scrollPercX = scrollGapX === 0 ? 0 : Math.min(1, Math.abs(((scrollGapX - (scrollGapX - this._xOffset)) / scrollGapX)));
    const scrollPercY = scrollGapY === 0 ? 0 : Math.min(1, Math.abs(((scrollGapY - (scrollGapY - this._yOffset)) / scrollGapY)));
    this._dimensions.boxW = this._canvas.width * 0.6;
    this._dimensions.boxH = this._canvas.height * 0.6;
    const rectScrollGapX = this._canvas.width - this._dimensions.boxW - 4;
    const rectScrollGapY = this._canvas.height - this._dimensions.boxH - 24;
    this._dimensions.boxPosX = rectScrollGapX * (scrollPercX) + 2;
    this._dimensions.boxPosY = rectScrollGapY * (scrollPercY) + 2;
    ctx.strokeRect(this._dimensions.boxPosX, this._dimensions.boxPosY, this._dimensions.boxW, this._dimensions.boxH);
  }

  private scaleImgToFit(): void {
    if (this._srcImage.width > 0) {
      // get bbox measures
      this._dimensions.bboxW = this._srcImage.width - (this._dimensions.bboxBorder * 2);
      this._dimensions.bboxH = this._srcImage.height - (this._dimensions.bboxBorder * 2);

      // img fitting
      const ratio = this._srcImage.width / this._srcImage.height;
      this._dimensions.chartW = this._canvas.width;
      this._dimensions.chartH = this._dimensions.chartW / ratio;
      if (!this.isPortrait) {
        this._dimensions.chartH = this._canvas.height * 1.2;
        this._dimensions.chartW = this._dimensions.chartW * ratio * 1.2;
      }

      this._dimensions.scaleW = this._dimensions.chartW / (this._srcImage.width - (this._dimensions.bboxBorder * 2));
      this._dimensions.scaleH = this._dimensions.chartH / (this._srcImage.height - (this._dimensions.bboxBorder * 2));

      // georef measures
      if (this._chart.georef === true) {
        this._dimensions.planW = this._chart.planview.bbox_local[2] - this._chart.planview.bbox_local[0];
        this._dimensions.planH = this._chart.planview.bbox_local[1] - this._chart.planview.bbox_local[3];
        this._dimensions.pxPerLong = this._dimensions.planW / (this._chart.planview.bbox_geo[2] - this._chart.planview.bbox_geo[0]);
        this._dimensions.pxPerLat = this._dimensions.planH / (this._chart.planview.bbox_geo[3] - this._chart.planview.bbox_geo[1]);
      }
    }
  }

  private drawImage(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this._srcImage, this._dimensions.bboxBorder, this._dimensions.bboxBorder, this._dimensions.bboxW, this._dimensions.bboxH, 0, 0, this._dimensions.chartW, this._dimensions.chartH);

    if (this._chart.georef === true) {
      // planepos
      const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
      const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
      let planeX = (long - this._chart.planview.bbox_geo[0]) * this._dimensions.pxPerLong;
      let planeY = Math.abs(lat - this._chart.planview.bbox_geo[3]) * this._dimensions.pxPerLat;

      // no idea why we need to offset more
      planeX += (this._chart.planview.bbox_local[0]) - this._dimensions.bboxBorder;
      planeY += (this._chart.planview.bbox_local[3]) - this._dimensions.bboxBorder;

      const transX = Math.abs(planeX) * this._dimensions.scaleW;
      const transY = Math.abs(planeY) * this._dimensions.scaleH;
      const simTrack = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
      const rot = Math.round(simTrack) * (Math.PI / 180);
      ctx.translate(transX, transY);
      ctx.rotate(rot);
      const planeScale = this._zoom === 1 ? 1 : 1.5;
      ctx.drawImage(this._planeImage, -20 / planeScale, -23.5 / planeScale, 40 / planeScale, 47 / planeScale);
      ctx.translate(-transX, -transY);
      ctx.rotate(-rot);
    }
  }

  onEvent(event: string): boolean {
    if (!this.isVisible) {
      return false;
    }
    this._isDirty = true;
    let handled = true;
    switch (event) {
      case "Lwr_Push_ZOOM_INC":
      case "Lwr_Push_ZOOM_DEC":
        this._zoom = this._zoom === 1 ? (this.isPortrait ? 2.0 : 1.6) : 1;
        if (this._zoom === 1) {
          this.xOffset /= (this.isPortrait ? 2.0 : 1.6);
          this.yOffset /= (this.isPortrait ? 2.0 : 1.6);
        } else {
          this.xOffset -= (this._canvas.width / 2) / this._zoom;
          this.yOffset -= (this._canvas.height / 2) / this._zoom;
          this.xOffset *= this._zoom;
          this.yOffset *= this._zoom;
        }
        break;
      case "Lwr_JOYSTICK_UP":
        this.yOffset += this.STEP_RATE;
        break;
      case "Lwr_JOYSTICK_DOWN":
        this.yOffset -= this.STEP_RATE;
        break;
      case "Lwr_JOYSTICK_LEFT":
        this.xOffset += this.STEP_RATE;
        break;
      case "Lwr_JOYSTICK_RIGHT":
        this.xOffset -= this.STEP_RATE;
        break;
      default:
        this._isDirty = false;
        handled = false;
        break;
    }
    return handled;
  }

  show(): void {
    this.fitCanvasToContainer(this._canvas);
    this._isDirty = true;
    this.style.visibility = "visible";
  }

  hide(): void {
    this.style.visibility = "hidden";
  }

  private fitCanvasToContainer(canvas: HTMLCanvasElement): void {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
}

customElements.define("cj4-mfd-chartview", CJ4_MFD_ChartView);