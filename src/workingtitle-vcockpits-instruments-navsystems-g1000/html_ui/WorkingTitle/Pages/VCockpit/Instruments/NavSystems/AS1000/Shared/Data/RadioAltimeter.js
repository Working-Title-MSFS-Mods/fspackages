class WT_Radio_Altimeter {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config) {
        this.isAvailable = true;
        config.watchNode("RadarAltitude").subscribe(node => this.isAvailable = node && node.textContent == "True");
    }
    isHeightAcceptable() {
        const radarAltitude = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        return radarAltitude > 0 && radarAltitude < 2500;
    }
    getAltitude() {
        const radarAltitude = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        const xyz = Simplane.getOrientationAxis();
        const bankAcceptable = Math.abs(xyz.bank) < Math.PI * 0.35;
        const altitudeAcceptable = radarAltitude > 0 && radarAltitude < 2500;
        return (bankAcceptable && altitudeAcceptable) ? radarAltitude : 1000;
    }
}