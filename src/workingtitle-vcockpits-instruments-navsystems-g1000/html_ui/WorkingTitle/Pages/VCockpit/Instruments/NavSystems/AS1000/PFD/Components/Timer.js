class WT_PFD_Timer_Model {
    /**
     * @param {WT_Clock} clock 
     */
    constructor(clock) {
        const timer = new WT_Timer(clock);
        this.timer = timer;
        this.time = timer.time;
        this.storedTime = 0;

        this.clickButton$ = new rxjs.Subject();
        this.state = this.clickButton$.pipe(
            rxjs.operators.scan(previous => (previous + 1) % 3, 0),
            rxjs.operators.tap(state => {
                switch (state) {
                    case 1:
                        this.startTimer();
                        return;
                    case 2:
                        this.stopTimer();
                        return;
                    case 0:
                        this.timer.setTime(this.storedTime)
                        return;
                }
            }),
        );
        this.actionText = this.state.pipe(
            rxjs.operators.map(state => {
                switch (state) {
                    case 0:
                        return "Start?"
                    case 1:
                        return "Stop?"
                    case 2:
                        return "Reset?"
                }
            })
        );
    }
    setTime(time) {
        this.storedTime = time;
        this.timer.setTime(time);
    }
    setDirection(direction) {
        this.timer.setDirection(direction);
    }
    stopTimer() {
        this.timer.stop();
    }
    startTimer() {
        this.timer.start();
    }
    clickButton() {
        this.clickButton$.next();
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
        this.model.timer.timerRunning.subscribe(running => this.wasRunning = running);

        const focus$ = new rxjs.BehaviorSubject(false);
        this.elements.time.addEventListener("focus", () => focus$.next(true));
        this.elements.time.addEventListener("blur", () => focus$.next(false));

        const wasRunning$ = focus$.pipe(
            rxjs.operators.filter(focused => focused),
            rxjs.operators.switchMap(focused => this.model.timer.timerRunning.pipe(rxjs.operators.first())),
        );

        focus$.pipe(rxjs.operators.withLatestFrom(wasRunning$)).subscribe(([focused, wasRunning]) => {
            if (focused) {
                this.model.stopTimer();
            } else {
                if (wasRunning) {
                    this.model.startTimer();
                }
            }
        })

        this.model.timer.direction.subscribe(direction => this.elements.direction.value = direction);
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
customElements.define("g1000-pfd-timer", WT_PFD_Timer_View);