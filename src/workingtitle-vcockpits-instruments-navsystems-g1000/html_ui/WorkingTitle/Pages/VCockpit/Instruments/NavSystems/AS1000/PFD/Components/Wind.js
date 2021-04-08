class WT_PFD_Wind_Model {
    /**
     * @param {WT_Anemometer} anemometer 
     * @param {WT_Plane_State} planeState 
     */
    constructor(update$, anemometer, planeState) {
        this.mode = new Subject(WTDataStore.get(`PFD.WindMode`, 1));

        this.activeMode = rxjs.combineLatest(planeState.onGround, this.mode.observable).pipe(
            rxjs.operators.map(([onGround, mode]) => {
                if (onGround) {
                    return mode ? 4 : 0;
                }
                return mode;
            }),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay()
        )

        const directionSpeed$ = rxjs.combineLatest(anemometer.relativeDirection, anemometer.speed).pipe(
            rxjs.operators.sample(update$),
            WT_RX.shareReplay()
        );

        this.xSpeed = directionSpeed$.pipe(
            rxjs.operators.map(([relativeDirection, speed]) => speed * Math.sin(relativeDirection / 180 * Math.PI)),
            WT_RX.shareReplay()
        )

        this.ySpeed = directionSpeed$.pipe(
            rxjs.operators.map(([relativeDirection, speed]) => speed * Math.cos(relativeDirection / 180 * Math.PI)),
            WT_RX.shareReplay()
        )

        this.direction = anemometer.relativeDirection;
        this.trueDirection = anemometer.direction;
        this.speed = anemometer.speed;
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

        const mode1$ = rxjs.merge(
            model.xSpeed.pipe(
                rxjs.operators.map(x => x > 0 ? 90 : -90),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.tap(rotation => this.elements.mode1xArrow.setAttribute("transform", `rotate(${rotation})`)),
            ),
            model.xSpeed.pipe(
                rxjs.operators.map(x => Math.abs(x.toFixed(0))),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.tap(text => this.elements.mode1xSpeed.textContent = text)
            ),
            model.ySpeed.pipe(
                rxjs.operators.map(y => y > 0 ? 0 : 180),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.tap(rotation => this.elements.mode1yArrow.setAttribute("transform", `rotate(${rotation})`)),
            ),
            model.ySpeed.pipe(
                rxjs.operators.map(y => Math.abs(y.toFixed(0))),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.tap(text => this.elements.mode1ySpeed.textContent = text)
            ),
        );

        const mode2$ = rxjs.merge(
            model.speed.pipe(
                rxjs.operators.tap(speed => {
                    this.elements.mode2speed.textContent = `${speed.toFixed(0)}`;
                })
            ),
            model.direction.pipe(
                rxjs.operators.tap(direction => {
                    this.elements.mode2arrow.setAttribute("transform", `rotate(${direction}, 22.5, 30)`);
                })
            )
        );

        const mode3$ = rxjs.merge(
            model.speed.pipe(
                rxjs.operators.tap(speed => {
                    this.elements.mode3speed.textContent = `${speed.toFixed(0)}`;
                })
            ),
            model.direction.pipe(
                rxjs.operators.tap(direction => {
                    this.elements.mode3arrow.setAttribute("transform", `rotate(${direction}, 22.5, 30)`);
                })
            ),
            model.trueDirection.pipe(
                rxjs.operators.tap(direction => this.elements.mode3direction.textContent = `${direction.toFixed(0)}°`)
            )
        );

        const modeEmpty$ = rxjs.empty();

        model.activeMode.pipe(
            rxjs.operators.tap(mode => this.setAttribute("mode", mode)),
            rxjs.operators.switchMap(mode => {
                switch (mode) {
                    case 1:
                        return mode1$;
                    case 2:
                        return mode2$;
                    case 3:
                        return mode3$;
                    default:
                        return modeEmpty$;
                }
            })
        ).subscribe();
    }
}
customElements.define("g1000-pfd-wind", WT_PFD_Wind_View);