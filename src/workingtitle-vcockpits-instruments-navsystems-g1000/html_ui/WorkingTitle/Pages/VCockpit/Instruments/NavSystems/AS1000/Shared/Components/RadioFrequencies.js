class WT_Radio_Frequencies_Model {
    constructor() {
        this.radio1 = {
            active: new Subject(),
            standby: new Subject(),
            volume: new Subject(),
        }
        this.radio2 = {
            active: new Subject(),
            standby: new Subject(),
            volume: new Subject(),
        }
        this.selected = new Subject(1);
    }
}

class WT_Radio_Frequencies_View extends WT_HTML_View {
    constructor() {
        super();
        this.volumeTimeoutDuration = 1000;
    }
    /**
     * @param {WT_Radio_Frequencies_Model} model 
     */
    setModel(model) {
        model.selected.subscribe(selected => this.setAttribute("selected", selected));

        model.radio1.active.subscribe(frequency => this.elements.radio1active.textContent = frequency);
        model.radio1.standby.subscribe(frequency => this.elements.radio1standby.textContent = frequency);
        model.radio1.volume.subscribe(volume => {
            this.elements.radio1volume.textContent = (volume * 100).toFixed(0) + "%";
            this.elements.radio1.setAttribute("mode", "volume");
            if (this.radio1volumeTimeout != null) {
                clearTimeout(this.radio1volumeTimeout);
            }
            this.radio1volumeTimeout = setTimeout(() => {
                this.elements.radio1.setAttribute("mode", "frequency");
            }, this.volumeTimeoutDuration);
        });

        model.radio2.active.subscribe(frequency => this.elements.radio2active.textContent = frequency);
        model.radio2.standby.subscribe(frequency => this.elements.radio2standby.textContent = frequency);
        model.radio2.volume.subscribe(volume => {
            this.elements.radio2volume.textContent = (volume * 100).toFixed(0) + "%";
            this.elements.radio2.setAttribute("mode", "volume");
            if (this.radio2volumeTimeout != null) {
                clearTimeout(this.radio2volumeTimeout);
            }
            this.radio2volumeTimeout = setTimeout(() => {
                this.elements.radio2.setAttribute("mode", "frequency");
            }, this.volumeTimeoutDuration);
        });
    }
}