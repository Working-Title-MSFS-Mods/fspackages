/**
 * A class that manages localizer lateral guidance for APPR mode.
 */
class LocDirector {
  /**
   * Creates an instance of a LocDirector.
   * @param {CJ4NavModeSelector} navModeSelector The current nav mode selector.
   */
  constructor(navModeSelector) {
    /** The current director state. */
    this.state = LocDirectorState.NONE;

    /** The current radio index. */
    this.radioIndex = 1;

    /** The current nav mode selector. */
    this.navModeSelector = navModeSelector;

    /** The previous lateral deviation. */
    this.previousDeviation = 0;

    /** The previous captured time. */
    this.previousTime = Date.now();
  }

  /**
   * Updates the localizer director.
   */
  update() {
    const navSource = SimVar.GetSimVarValue('L:WT_CJ4_LNAV_MODE', 'number');
    this.radioIndex = navSource === 2 ? 2 : 1;

    const radioState = this.getRadioState();
    switch (this.state) {
      case LocDirectorState.NONE:
        this.handleNone();
        break;
      case LocDirectorState.ARMED:
        this.handleArmed(radioState);
        break;
      case LocDirectorState.ACTIVE:
        this.handleActive(radioState);
        break;
    }
  }

  /**
   * Handles the inactive localizer director state.
   */
  handleNone() {
    if (this.navModeSelector.currentLateralArmedState === LateralNavModeState.APPR) {
      this.state = LocDirectorState.ARMED;
    }
  }

  /**
   * Handles the armed state.
   * @param {LocRadioState} radioState The current localizer radio state.
   */
  handleArmed(radioState) {
    if (radioState.hasLocSignal && radioState.hasGlideslopeSignal) {
      if (Math.abs(radioState.lateralDevation) < 120) {
        this.state = LocDirectorState.ACTIVE;
        this.navModeSelector.queueEvent(NavModeEvent.LOC_ACTIVE);

        SimVar.SetSimVarValue('L:WT_CJ4_NAV_TRANSFER', 'number', 1);
      }
    }
    else {
      this.state = LocDirectorState.NONE;
    }
  }

  /**
   * Handles the armed state.
   * @param {LocRadioState} radioState The current localizer radio state.
   */
  handleActive(radioState) {
    if (radioState.hasLocSignal && radioState.hasGlideslopeSignal && this.navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
      const interceptAngle = AutopilotMath.interceptAngle((-1 * radioState.lateralDevation) / 127, NavSensitivity.NORMAL, 12.5);

      const now = Date.now();
      const elapsedTime = (now - this.previousTime) / 1000;
      const interceptRate = Math.sign(this.previousDeviation) === 1
        ? Math.max(this.previousDeviation - radioState.lateralDevation, 0)
        : -1 * Math.min(this.previousDeviation - radioState.lateralDevation, 0);

      const interceptRateScalar = radioState.lateralDevation < 40
        ? 1 - Math.min(interceptRate / 5, 1.15)
        : 1;

      const magVar = SimVar.GetSimVarValue('MAGVAR', 'Degrees');

      const trueCourse = GeoMath.removeMagvar(radioState.course, magVar);
      const setCorse = AutopilotMath.normalizeHeading(trueCourse + (interceptAngle * interceptRateScalar));

      this.previousDeviation = radioState.lateralDevation;
      this.previousTime = now;

      LNavDirector.setCourse(setCorse, LNavDirector.getAircraftState());
    }
    else {
      this.state = LocDirectorState.NONE;
    }
  }

  /**
   * Gets the current localizer radio state.
   * @returns {LocRadioState} The current localizer radio state.
   */
  getRadioState() {
    const radioState = new LocRadioState();

    radioState.frequency = SimVar.GetSimVarValue(`NAV ACTIVE FREQUENCY:${this.radioIndex}`, 'MHz');
    radioState.hasNavSignal = SimVar.GetSimVarValue(`NAV HAS NAV:${this.radioIndex}`, 'Bool') !== 0;
    radioState.hasLocSignal = SimVar.GetSimVarValue(`NAV HAS LOCALIZER:${this.radioIndex}`, 'Bool') !== 0;
    radioState.hasGlideslopeSignal = SimVar.GetSimVarValue(`NAV HAS GLIDE SLOPE:${this.radioIndex}`, 'Bool') !== 0;
    radioState.course = SimVar.GetSimVarValue(`NAV LOCALIZER:${this.radioIndex}`, 'Degrees');
    radioState.lateralDevation = SimVar.GetSimVarValue(`NAV CDI:${this.radioIndex}`, 'Number');

    return radioState;
  }
}

class LocDirectorState { }
LocDirectorState.NONE = 'NONE';
LocDirectorState.ARMED = 'ARMED';
LocDirectorState.ACTIVE = 'ACTIVE';

class LocRadioState {
  constructor() {
    this.frequency = NaN;

    this.hasNavSignal = false;

    this.hasLocSignal = false;

    this.hasGlideslopeSignal = false;

    this.course = NaN;

    this.lateralDevation = NaN;
  }
}