class WT1000 extends BaseInstrument {
  constructor() {
    super();
    console.log("We got constructed.");
  }
  get templateID() { return "wt1000"; }
  connectedCallback() {
    console.log("We got built.");
    super.connectedCallback();
    this.initialize();
  }
  Update() {
    super.Update();
    
    if (this._bingMap) {
      let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
      let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");

      if (lat && long && isFinite(lat) && isFinite(long)) {
        let planeLla = new LatLongAlt(lat, long);      
        this._bingMap.setParams({lla: planeLla, radius: 8000});
      }
    }
  }
  initialize() {
    const bingMap = document.getElementsByTagName('bing-map')[0];
    bingMap.addConfig({resolution: 1024, aspectRatio: 1, heightColors: this.buildMapColors()});
    bingMap.setConfig(0);
    bingMap.setMode(EBingMode.PLANE);
    bingMap.setReference(EBingReference.PLANE);
    bingMap.setBingId('wt1000_mfd' + '_GPS' + this.urlConfig.index);
    bingMap.setVisible(true);

    this._bingMap = bingMap;
  }
  buildMapColors() {
    let curve = new Avionics.Curve();
    curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;

    let svgConfig = new SvgMapConfig();
    curve.add(0, svgConfig.convertColor("#77dd77"));
    curve.add(16000, svgConfig.convertColor("#ff0000"));

    let colors = [SvgMapConfig.hexaToRGB(svgConfig.convertColor("#0000ff"))];

    for (let i = 0; i < 60; i++) {
        let color = curve.evaluate(i * 30000 / 60);
        colors[i + 1] = SvgMapConfig.hexaToRGB(color);
    }

    console.log(JSON.stringify(colors));
    return colors;
  }
}
if (g_modDebugMgr) {
  g_modDebugMgr.AddConsole(null);
}
//window.customElements.define("wt1000", WT1000);
registerInstrument("wt1000-template-element", WT1000);
