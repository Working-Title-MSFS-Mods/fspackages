import { NG_Chart } from "../../types/navigraph";

// TODO: split the actual viewer stuff from this class into a more generic viewer component for later reuse
export class CJ4_MFD_ChartView extends HTMLElement {

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
  private _chartWidth: number;
  private _chartHeight: number;
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
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
    this._isDirty = true;
  }

  loadChart(url: string = "", chart: NG_Chart = undefined): void {
    if (url !== "") {
      // this._srcImage.setAttribute('crossOrigin','anonymous');
      this._srcImage.src = url; //"/Pages/VCockpit/Instruments/Airliners/CJ4/Shared/sample.png?cb=2";
    }
    if (chart !== undefined) {
      this._chart = chart;
      this._chartindexnumber.textContent = `${chart.icao_airport_identifier} ${chart.index_number}`;
      this._chartprocidentifier.textContent = chart.procedure_identifier;
    }
  }

  update(dTime: number): void {
    if (this.isVisible && this._isDirty) {
      this.fitCanvasToContainer(this._canvas);
      // this._isDirty = false;
      const ctx = this._canvas.getContext("2d");
      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
      ctx.setTransform(this._zoom, 0, 0, this._zoom, this._xOffset, this._yOffset);
      if (this._srcImage.src !== "" && this._srcImage.src.indexOf("#") === -1) {
        this.scaleImgToFit(this._canvas, ctx, this._srcImage);
      } else {
        ctx.fillStyle = "#cccac8";
        ctx.textAlign = "center";
        ctx.font = "26px Collins ProLine";
        ctx.fillText("NO CHART AVAILABLE", this._canvas.width / 2, this._canvas.height / 2);
      }
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
        this._zoom = this._zoom === 1 ? 2.3 : 1;
        if (this._zoom === 1) {
          this._xOffset = 0;
          this._yOffset = 0;
        }
        break;
      case "Lwr_JOYSTICK_UP":
        this._yOffset = Math.min(0, this._yOffset + this.STEP_RATE);
        break;
      case "Lwr_JOYSTICK_DOWN":
        // -27 from height for the chart info container
        this._yOffset = Math.max(-((this._chartHeight * this._zoom) - (this._canvas.height - 27)), this._yOffset - this.STEP_RATE);
        break;
      case "Lwr_JOYSTICK_LEFT":
        this._xOffset = Math.min(0, this._xOffset + this.STEP_RATE);
        break;
      case "Lwr_JOYSTICK_RIGHT":
        this._xOffset = Math.max(-((this._chartWidth * this._zoom) - (this._canvas.width)), this._xOffset - this.STEP_RATE);
        break;
      default:
        this._isDirty = false;
        handled = false;
        break;
    }
    return handled;
  }

  show(): void {
    this._isDirty = true;
    this.style.visibility = "visible";
  }

  hide(): void {
    this.style.visibility = "hidden";
  }

  private scaleImgToFit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
    if (img.width > 0) {
      // get bbox measures
      const bboxX = 54; //;this._chart.planview.bbox_local[0];
      const bboxY = 54; //this._chart.planview.bbox_local[3];
      const bboxWidth = img.width - bboxX * 2; //this._chart.planview.bbox_local[2] - bboxX;
      const bboxHeight = img.height - bboxY * 2; //this._chart.planview.bbox_local[1] - bboxY;

      // img fitting
      const ratio = img.width / img.height;
      this._chartWidth = canvas.width;
      this._chartHeight = this._chartWidth / ratio;
      if (img.width > img.height) {
        this._chartHeight = canvas.height;
        this._chartWidth = this._chartWidth * ratio;
      }

      const scaleW = this._chartWidth / (img.width - bboxX);
      const scaleH = this._chartHeight / (img.height - bboxY);

      ctx.drawImage(img, bboxX, bboxY, bboxWidth, bboxHeight, 0, 0, this._chartWidth, this._chartHeight);

      // georef
      if (this._chart.georef === true) {
        // planepos
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

        // if (long > this._chart.planview.bbox_local[0] && long < this._chart.planview.bbox_local[2] &&
        //   lat > this._chart.planview.bbox_local[1] && lat < this._chart.planview.bbox_local[3]) {
        const planW = this._chart.planview.bbox_local[2] - this._chart.planview.bbox_local[0];
        const planH = this._chart.planview.bbox_local[1] - this._chart.planview.bbox_local[3];
        const pxPerLong = planW / (this._chart.planview.bbox_geo[2] - this._chart.planview.bbox_geo[0]);
        const pxPerLat = planH / (this._chart.planview.bbox_geo[3] - this._chart.planview.bbox_geo[1]);
        let planeX = (long - this._chart.planview.bbox_geo[0]) * pxPerLong;
        let planeY = Math.abs(lat - this._chart.planview.bbox_geo[3]) * pxPerLat;

        // no idea why we need to offset more
        planeX += (this._chart.planview.bbox_local[0]);
        planeY += (this._chart.planview.bbox_local[3]);

        const transX = Math.abs(planeX) * scaleW;
        const transY = Math.abs(planeY) * scaleH;
        const simTrack = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
        const rot = Math.round(simTrack) * (Math.PI / 180);
        ctx.translate(transX, transY);
        ctx.rotate(rot);
        const planeScale = this._zoom === 1 ? 1 : 1.5;
        ctx.drawImage(this._planeImage, -20/planeScale, -23.5/planeScale, 40/planeScale, 47/planeScale);
        ctx.translate(-transX, -transY);
        ctx.rotate(-rot);        
        // }
      }
    }
  }

  private fitCanvasToContainer(canvas: HTMLCanvasElement): void {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
}

customElements.define("cj4-mfd-chartview", CJ4_MFD_ChartView);