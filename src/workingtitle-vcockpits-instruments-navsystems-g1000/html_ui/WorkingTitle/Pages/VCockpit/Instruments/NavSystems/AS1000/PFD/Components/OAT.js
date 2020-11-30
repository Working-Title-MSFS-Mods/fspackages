class WT_OAT_Model {
    /**
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {WT_Thermometer} thermometer
     */
    constructor(unitChooser, thermometer) {
        this.unitChooser = unitChooser;

        this.oat = this.unitChooser.observeTemperature(
            thermometer.outsideAirTemperature.celsius.pipe(
                rxjs.operators.map(degrees => `${degrees.toFixed(0)}°<span class='units'>C</span>`)
            ),
            thermometer.outsideAirTemperature.farenheit.pipe(
                rxjs.operators.map(degrees => `${degrees.toFixed(0)}°<span class='units'>F</span>`)
            )
        ).pipe(
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1),
        );
    }
}

class WT_OAT_View extends WT_HTML_View {
    /**
     * @param {WT_OAT_Model} model 
     */
    setModel(model) {
        model.oat.subscribe(oat => this.elements.oat.innerHTML = oat);
    }
}
customElements.define("g1000-oat", WT_OAT_View);