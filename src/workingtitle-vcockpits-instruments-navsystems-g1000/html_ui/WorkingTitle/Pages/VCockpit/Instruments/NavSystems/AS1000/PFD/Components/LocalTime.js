class WT_Local_Time_Model {
    /**
     * @param {WT_Settings} settings 
     * @param {WT_Clock} clock 
     */
    constructor(settings, clock) {
        this.mode = settings.observe("time_mode");

        const local12Hr$ = clock.localTime.pipe(
            rxjs.operators.map(value => {
                let seconds = (value + 86400) % 86400;
                let meridiem = "<span class='meridiem'>am</span>";
                if (seconds > 86400 / 2) {
                    meridiem = "<span class='meridiem'>pm</span>";
                    seconds -= 86400 / 2;
                }
                return `${this.secondsToZulu(seconds)}${meridiem}`;
            })
        );

        const local24Hr$ = clock.localTime.pipe(
            rxjs.operators.map(value => {
                const seconds = (value + 86400) % 86400;
                return this.secondsToZulu(seconds);
            })
        );

        const zulu$ = clock.zuluTime.pipe(
            rxjs.operators.map(value => {
                const seconds = (value + 86400) % 86400;
                return this.secondsToZulu(seconds);
            })
        );

        const time$ = this.mode.pipe(
            rxjs.operators.switchMap(mode => {
                switch (mode) {
                    case "0":
                        return local12Hr$;
                    case "1":
                        return local24Hr$;
                    case "2":
                        return zulu$;
                }
            })
        )

        this.time = time$;
    }
    secondsToZulu(v) {
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
        let seconds = Math.floor(v % 60);
        return `${hours.toFixed(0)}:${minutes.toFixed(0).padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")}`;
    }
}

class WT_Local_Time_View extends WT_HTML_View {
    /**
     * @param {WT_Local_Time_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.time.subscribe(time => this.elements.time.innerHTML = time);
        model.mode.subscribe(mode => this.elements.mode.textContent = this.modeToText(mode));
    }
    modeToText(mode) {
        switch (mode) {
            case "0":
            case "1":
                return "LCL";
            case "2":
                return "UTC";
        }
    }
}
customElements.define("g1000-local-time", WT_Local_Time_View);