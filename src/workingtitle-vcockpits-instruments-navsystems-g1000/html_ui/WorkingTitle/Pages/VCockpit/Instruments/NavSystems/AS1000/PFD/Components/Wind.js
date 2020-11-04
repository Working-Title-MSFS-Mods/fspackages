class WT_PFD_Wind_Model {
    constructor() {
        this.mode = new Subject(WTDataStore.get(`PFD.WindMode`, 1));
        this.activeMode = new Subject(0);
        this.direction = new Subject(0);
        this.trueDirection = new Subject(0);
        this.speed = new Subject(0);
        this.xSpeed = new Subject(0);
        this.ySpeed = new Subject(0);
    }
    update(dt) {
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "boolean");
        if (onGround) {
            this.activeMode.value = this.mode.value ? 4 : 0;
        } else {
            const speed = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots");
            const direction = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree");
            const planeHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
            this.activeMode.value = this.mode.value;
            switch (this.mode.value) {
                case 3:
                    this.trueDirection.value = speed >= 1 ? direction : 0;
                case 2:
                case 1:
                    this.direction.value = speed >= 1 ? ((direction + 180) % 360 - planeHeading) : 0;
                    this.speed.value = speed;

                    this.xSpeed.value = speed * Math.sin(this.direction.value / 180 * Math.PI);
                    this.ySpeed.value = speed * Math.cos(this.direction.value / 180 * Math.PI);
                    break;
            }
        }
    }
    cycleMode() {
        this.setMode((this.mode.value + 1) % 4);
    }
    setMode(mode) {
        this.mode.value = mode;
        WTDataStore.set(`PFD.WindMode`, this.mode.value);
    }
}

class WT_PFD_Wind_View extends WT_HTML_View {
    connectedCallback() {
        super.connectedCallback();
    }
    /**
     * @param {WT_PFD_Wind_Model} model 
     */
    setModel(model) {
        this.model = model;

        model.activeMode.subscribe(mode => this.setAttribute("mode", mode));
        model.xSpeed.subscribe(speed => {
            this.elements.mode1xSpeed.textContent = speed.toFixed(0);
            this.elements.mode1xArrow.setAttribute("transform", `rotate(${speed > 0 ? 90 : -90})`)
        });
        model.ySpeed.subscribe(speed => {
            this.elements.mode1ySpeed.textContent = speed.toFixed(0);
            this.elements.mode1yArrow.setAttribute("transform", `rotate(${speed > 0 ? 0 : 180})`);
        });
        model.speed.subscribe(speed => {
            this.elements.mode2speed.textContent = `${speed.toFixed(0)}`;
            this.elements.mode3speed.textContent = `${speed.toFixed(0)}KT`;
        });
        model.direction.subscribe(direction => {
            this.elements.mode3arrow.setAttribute("transform", `rotate(${direction}, 22.5, 30)`);
            this.elements.mode2arrow.setAttribute("transform", `rotate(${direction}, 22.5, 30)`);
        });
        model.trueDirection.subscribe(direction => this.elements.mode3direction.textContent = `${direction.toFixed(0)}°`);
    }
}
customElements.define("g1000-pfd-wind", WT_PFD_Wind_View);