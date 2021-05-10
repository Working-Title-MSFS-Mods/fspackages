class WT_G3x5_DisplayPane {
    getTitle() {
    }

    init(root) {
    }

    wake() {
    }

    sleep() {
    }

    update() {
    }
}

class WT_G3x5_WeatherRadarDisplayPane extends WT_G3x5_DisplayPane {
    constructor(weatherRadar) {
        super();

        this._weatherRadar = weatherRadar;
    }

    /**
     * @readonly
     * @type {WT_G3x5_WeatherRadar}
     */
    get weatherRadar() {
        return this._weatherRadar;
    }

    getTitle() {
        return "Weather Radar";
    }

    init(root) {
        this.weatherRadar.init(root);
    }

    wake() {
        this.weatherRadar.wake();
    }

    sleep() {
        this.weatherRadar.sleep();
    }

    update() {
        this.weatherRadar.update();
    }
}