class WT_PFD_Timer_Model {
    constructor() {
        this.direction = "UP";
        this.actionText = new Subject("Start?");
        this.state = 0;
        this.timerRunning = false;
        this.time = new Subject(0);
    }
    setTime(time) {
        this.storedTime = time;
        this.time.value = time;
    }
    setDirection(direction) {
        this.direction = direction;
    }
    update(dt) {
        if (!this.lastFrameTime)
            this.lastFrameTime = performance.now();

        let now = performance.now();
        let delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        if (this.timerRunning)
            this.time.value = Math.max(0, Math.min(86400, this.time.value + delta / 1000 * (this.direction == "UP" ? 1 : -1)));
    }
    setTimerRunning(running) {
        this.timerRunning = running;
    }
    stopTimer() {
        let t = this.timerRunning;
        this.timerRunning = false;
        return t;
    }
    startTimer() {
        let t = this.timerRunning;
        this.timerRunning = true;
        return t;
    }
    clickButton() {
        switch (this.state) {
            case 0: {
                this.startTimer();
                this.actionText.value = "Stop?";
                this.storedTime = this.time.value;
                this.state = 1;
                break;
            }
            case 1: {
                this.stopTimer();
                this.actionText.value = "Reset?";
                this.state = 2;
                break;
            }
            case 2: {
                this.actionText.value = "Start?";
                this.state = 0;
                this.time.value = this.storedTime;
                break;
            }
        }
    }
}

class WT_PFD_Timer_View extends WT_HTML_View {
    /**
     * @param {WT_PFD_Timer_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.time.subscribe(time => this.elements.time.value = time);
        this.model.actionText.subscribe(text => this.elements.button.textContent = text);
        this.wasRunning = false;
        this.elements.time.addEventListener("focus", () => this.wasRunning = this.model.stopTimer());
        this.elements.time.addEventListener("blur", () => this.model.setTimerRunning(this.wasRunning));
        this.elements.direction.value = this.model.direction;
    }
    changeTime(time) {
        this.model.setTime(time);
    }
    changeDirection(direction) {
        if (this.model)
            this.model.setDirection(direction);
    }
    clickButton() {
        this.model.clickButton();
    }
}
customElements.define("wt-timer", WT_PFD_Timer_View);