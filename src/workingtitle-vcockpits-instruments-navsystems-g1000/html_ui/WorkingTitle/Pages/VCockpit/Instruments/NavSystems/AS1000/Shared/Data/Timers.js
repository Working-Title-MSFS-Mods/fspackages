class WT_Timer {
    /**
     * @param {WT_Clock} clock 
     */
    constructor(clock) {
        this.direction = new rxjs.BehaviorSubject(WT_Timer.DIRECTION_UP);
        this.timerRunning = new rxjs.BehaviorSubject(false);
        this.startTime = new rxjs.BehaviorSubject(0);

        const deltaTime$ = clock.absoluteTime.pipe(
            rxjs.operators.throttleTime(100),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => b - a),
            rxjs.operators.filter(delta => delta < 1),
        );

        this.time = this.startTime.pipe(
            rxjs.operators.switchMap(startTime => deltaTime$.pipe(
                rxjs.operators.withLatestFrom(this.direction, this.timerRunning),
                rxjs.operators.map(([dt, direction, running]) =>
                    dt * (direction == WT_Timer.DIRECTION_UP ? 1 : -1) * (running ? 1 : 0)
                ),
                rxjs.operators.scan((time, delta) => Math.max(0, time + delta), startTime)
            )),
            rxjs.operators.distinctUntilChanged()
        );
    }
    setTime(time) {
        this.startTime.next(time);
    }
    setDirection(direction) {
        this.direction.next(direction);
    }
    stop() {
        this.timerRunning.next(false);
    }
    start() {
        this.timerRunning.next(true);
    }
}
WT_Timer.DIRECTION_UP = "UP";
WT_Timer.DIRECTION_DOWN = "UP";