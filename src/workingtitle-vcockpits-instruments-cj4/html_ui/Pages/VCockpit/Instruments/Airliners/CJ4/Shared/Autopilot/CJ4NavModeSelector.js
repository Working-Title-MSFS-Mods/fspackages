//@ts-check

/**
 * A class that handles state transitions to the different autopilot modes of
 * the CJ4.
 */
class CJ4NavModeSelector {
  
  /**
   * Creates a new instance of the CJ4NavModeSelector.
   */
  constructor() {
    /** The current active lateral nav mode. */
    this.currentLateralActiveState = LateralNavModeState.ROLL;

    /** The current armed lateral nav mode. */
    this.currentLateralArmedState = LateralNavModeState.NONE;

    /** The current active vertical nav mode. */
    this.currentVerticalActiveState = VerticalNavModeState.PTCH;

    /** The current armed vertical nav mode. */
    this.currentVerticalArmedStates = [VerticalNavModeState.NONE];

    /** Whether or not VNAV is on. */
    this.isVNAVOn = false;

    /** The current VPath state. */
    this.vPathState = VPathState.NONE;

    /** The current LNav mode state. */
    this.lNavModeState = LNavModeState.FMS;

    /** The current altitude slot index. */
    this.currentAltSlotIndex = 0;

    /** Whether or not altitude lock is currently active. */
    this.isAltitudeLocked = false;

    /** The selected altitude in altitude lock slot 1. */
    this.selectedAlt1 = 0;

    /** The selected altitude in altitude lock slot 2. */
    this.selectedAlt2 = 0;

    /**
     * The queue of state change events to process.
     * @type {string[]}
     */
    this._eventQueue = [];

    /** The current states of the input data. */
    this._inputDataStates = {
      vs: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_VS_ON", "number"), () => NavModeEvent.VS_PRESSED),
      flc: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_FLC_ON", "number"), () => NavModeEvent.FLC_PRESSED),
      nav: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_NAV_ON", "number"), () => NavModeEvent.NAV_PRESSED),
      hdg: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_HDG_ON", "number"), () => NavModeEvent.HDG_PRESSED),
      app: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_APPR_ON", "number"), () => NavModeEvent.APPR_PRESSED),
      bc: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_BC_ON", "number"), () => NavModeEvent.BC_PRESSED),
      vnav: new ValueStateTracker(() => SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "number"), () => NavModeEvent.VNAV_PRESSED),
      altLocked: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean"), () => NavModeEvent.ALT_LOCK_CHANGED),
      altSlot: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number"), () => NavModeEvent.ALT_SLOT_CHANGED),
      selectedAlt1: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet"), () => NavModeEvent.SELECTED_ALT1_CHANGED),
      selectedAlt2: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"), () => NavModeEvent.SELECTED_ALT2_CHANGED),
      navmode: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number"), value => value === 0 ? NavModeEvent.NAV_MODE_CHANGED_TO_FMS : NavModeEvent.NAV_MODE_CHANGED_TO_NAV),
      vpath: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number"), () => NavModeEvent.VPATH_CHANGED)
    };
    
    /** The event handlers for each event type. */
    this._handlers = {
      [`${NavModeEvent.VS_PRESSED}`]: this.handleVSPressed.bind(this),
      [`${NavModeEvent.NAV_PRESSED}`]: this.handleNAVPressed.bind(this),
      [`${NavModeEvent.NAV_MODE_CHANGED_TO_NAV}`]: this.handleNAVChangedToNAV.bind(this),
      [`${NavModeEvent.NAV_MODE_CHANGED_TO_FMS}`]: this.handleNAVChangedToFMS.bind(this),
      [`${NavModeEvent.HDG_PRESSED}`]: this.handleHDGPressed.bind(this),
      [`${NavModeEvent.APPR_PRESSED}`]: this.handleAPPRPressed.bind(this),
      [`${NavModeEvent.FLC_PRESSED}`]: this.handleFLCPressed.bind(this),
      [`${NavModeEvent.VNAV_PRESSED}`]: this.handleVNAVPressed.bind(this),
      [`${NavModeEvent.ALT_LOCK_CHANGED}`]: this.handleAltLockChanged.bind(this),
      [`${NavModeEvent.ALT_CAPTURED}`]: this.handleAltCaptured.bind(this),
      [`${NavModeEvent.VPATH_CHANGED}`]: this.handleVPathChanged.bind(this),
      [`${NavModeEvent.ALT_SLOT_CHANGED}`]: this.handleAltSlotChanged.bind(this),
      [`${NavModeEvent.SELECTED_ALT1_CHANGED}`]: this.handleAlt1Changed.bind(this),
      [`${NavModeEvent.SELECTED_ALT2_CHANGED}`]: this.handleAlt2Changed.bind(this)
    };

    this.initialize();
  }

  /**
   * Initializes the nav mode selector and resets all autopilot modes to default.
   */
  initialize() {
      if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
      }


      if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
      }

      if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
      }

      if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "number") == 1) {
        SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 0);
      }

      if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "number") == 1 || SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 0);
      }

      if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_BC_HOLD", "number", 0);
      }
  }

  /**
   * Geneates events from the changing of input data from various sources.
   */
  generateInputDataEvents() {
    for (var key in this._inputDataStates) {
      const event = this._inputDataStates[key].updateState();

      if (event !== undefined) {
        this.queueEvent(event);
      }
    }

    if (this.currentVerticalActiveState === VerticalNavModeState.ALTC) {
      const currentAltitude = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
      const targetAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", "feet");

      if (Math.abs(currentAltitude - targetAltitude) < 50) {
        this.queueEvent(NavModeEvent.ALT_CAPTURED);
      }
    }
  }

  /** 
   * Processes queued state changes. 
   */
  processEvents() {
    while (this._eventQueue.length > 0) {
      const event = this._eventQueue.shift();
      this._handlers[event]();
    }

    const fmaValues = {
      lateralMode: this.currentLateralActiveState,
      lateralArmed: "",
      verticalMode: `${this.isVNAVOn ? "V" : ""}${this.currentVerticalActiveState}`,
      verticalArmed1: this.currentVerticalArmedStates[0],
      verticalArmed2: this.currentVerticalArmedStates[1]
    };

    WTDataStore.set('CJ4_fmaValues', JSON.stringify(fmaValues));
  }

  /**
   * Queues an event with the mode selector state machine.
   * @param {string} event The event type to queue. 
   */
  queueEvent(event) {
    this._eventQueue.push(event);
  }

  pushVerticalArmedMode(mode) {
    if (this.currentVerticalArmedStates.indexOf(mode) === -1) {
      this.currentVerticalArmedStates.push(mode);
    }
  }

  /**
   * Handles when the VS button is pressed.
   */
  handleVSPressed() {
    SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

    switch (this.currentVerticalActiveState) {
      case VerticalNavModeState.PTCH:
      case VerticalNavModeState.FLC:
      case VerticalNavModeState.ALTC:
      case VerticalNavModeState.ALT:
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
        this.currentVerticalActiveState = VerticalNavModeState.VS;
        break;
      case VerticalNavModeState.VS:
        if (this.vPathState === VPathState.ACTIVE) {
          this.currentVerticalActiveState = VerticalNavModeState.PATH;
        }
        else if (this.vPathState === VPathState.ARMED) {
          this.pushVerticalArmedMode(VerticalNavModeState.PATH);
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;

          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
        }
        else {
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
        }
        break;
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the FLC button is pressed.
   */
  handleFLCPressed() {
    switch (this.currentVerticalActiveState) {
      case VerticalNavModeState.PTCH:
      case VerticalNavModeState.VS:
      case VerticalNavModeState.ALTC:
      case VerticalNavModeState.ALT:
        SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 1);
        this.currentVerticalActiveState = VerticalNavModeState.FLC;
        break;
      case VerticalNavModeState.FLC:
        if (this.vPathState === VPathState.ACTIVE) {
          this.currentVerticalActiveState = VerticalNavModeState.PATH;
        }
        else if (this.vPathState === VPathState.ARMED) {
          this.currentVerticalArmedStates.includes(VerticalNavModeState.PATH);
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;

          SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 0);
        }
        else {
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;
          SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 0);
        }
        break;
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the VNAV button is pressed.
   */
  handleVNAVPressed() {
    this.isVNAVOn = !this.isVNAVOn;
  }

  /**
   * Handles when the active altitude slot changes in the sim.
   */
  handleAltSlotChanged() {
    this.currentAltSlotIndex = this._inputDataStates.altSlot.state;
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the selected altitude in altitude lock slot 1 changes in the sim.
   */
  handleAlt1Changed() {
    this.selectedAlt1 = this._inputDataStates.selectedAlt1.state;
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the selected altitude in altitude lock slot 2 changes in the sim.
   */
  handleAlt2Changed() {
    this.selectedAlt2 = this._inputDataStates.selectedAlt2.state;
    this.setProperVerticalArmedStates();
  }

  /**
   * Sets the proper armed vertical states.
   */
  setProperVerticalArmedStates() {

    this.currentVerticalArmedStates = [];

    const selectVerticalArmedModeBySlot = () => {
      if (this.currentAltSlotIndex == 1) {
        this.pushVerticalArmedMode(VerticalNavModeState.ALTS);
      }
      else if (this.currentAltSlotIndex == 2) {
          if (Math.round(this.selectedAlt1) === Math.round(this.selectedAlt2)) {
            this.pushVerticalArmedMode(VerticalNavModeState.ALTS);
          }
          else {
            this.pushVerticalArmedMode(VerticalNavModeState.ALTV);
          }
      }
    };

    if (!this.isAltitudeLocked) {
      if (this.vPathState === VPathState.ACTIVE || (this.currentVerticalActiveState === VerticalNavModeState.FLC || this.currentVerticalActiveState === VerticalNavModeState.VS)) {
        selectVerticalArmedModeBySlot();
      }
    }

    if (this.vPathState === VPathState.ARMED) {
      this.pushVerticalArmedMode(VerticalNavModeState.PATH);
    }
  }

  /**
   * Handles when the HDG button is pressed.
   */
  handleHDGPressed() {
    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
        this.currentLateralActiveState = LateralNavModeState.HDG;
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        this.currentLateralActiveState = LateralNavModeState.HDG;
        break;
      case LateralNavModeState.HDG:
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.APPR:
        //TODO: Make this work
        break;
    }
  }

  /**
   * Handles when the NAV button is pressed.
   */
  handleNAVPressed() {
    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
        this.changeToCorrectLNavForMode(true);
        this.currentLateralActiveState = LateralNavModeState.LNAV;
        break;
      case LateralNavModeState.HDG:
        this.changeToCorrectLNavForMode(false);
        this.currentLateralActiveState = LateralNavModeState.LNAV;
        break;
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.APPR:
        //TODO: Make this work
        break;
    }
  }

  /**
   * Handles when the active nav source changes to follow the nav radio.
   */
  handleNAVChangedToNAV() {
    this.lNavModeState = LNavModeState.RADIO;
    if (this.currentLateralActiveState === LateralNavModeState.NAV || this.currentLateralActiveState === LateralNavModeState.LNAV) {
      this.changeToCorrectLNavForMode(true);
    }   
  }

  /**
   * Handles when the active nav source changes to follow the FMS.
   */
  handleNAVChangedToFMS() {
    this.lNavModeState = LNavModeState.FMS;
    if (this.currentLateralActiveState === LateralNavModeState.NAV || this.currentLateralActiveState === LateralNavModeState.LNAV) {
      this.changeToCorrectLNavForMode(true);
    } 
  }

  /**
   * Changes to the correct nav mode given the current LNAV mode state.
   * @param {boolean} activateHeadingHold Whether or not to toggle the heading hold when switching modes.
   */
  changeToCorrectLNavForMode(activateHeadingHold) {
    if (this.lNavModeState === LNavModeState.FMS) {
      SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
      if (activateHeadingHold) {
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
      }

      this.currentLateralActiveState = LateralNavModeState.LNAV;
    }
    else {
      SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
      SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 1);

      this.currentLateralActiveState = LateralNavModeState.NAV;
    }
  }

  /**
   * Handles when the APPR button is pressed.
   */
  handleAPPRPressed() {

  }

  /**
   * Handles when the altitude lock state has changed.
   */
  handleAltLockChanged() {
    this.isAltitudeLocked = this._inputDataStates.altLocked.state;

    if (this.isAltitudeLocked) {
      this.currentVerticalActiveState = VerticalNavModeState.ALTC;
    }

    if (!this.isAltitudeLocked && (this.currentVerticalActiveState === VerticalNavModeState.ALTC || this.currentVerticalActiveState === VerticalNavModeState.ALT)) {
      if (this.vPathState === VPathState.ACTIVE) {
        this.currentVerticalActiveState = VerticalNavModeState.PATH;
      }
      else {
        this.currentVerticalActiveState = VerticalNavModeState.PTCH;
      }
    }
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the plane has fully captured the assigned lock altitude.
   */
  handleAltCaptured() {
    if (this.isAltitudeLocked) {
      this.currentVerticalActiveState = VerticalNavModeState.ALT;
    }
  }

  /**
   * Handles when the VPath state changes.
   */
  handleVPathChanged() {
    this.vPathState = this._inputDataStates.vpath.state;
    this.setProperVerticalArmedStates();

    if (this.vPathState === VPathState.ACTIVE) {
      this.currentVerticalActiveState = VerticalNavModeState.PATH;
    }
  }
}

class LateralNavModeState { }
LateralNavModeState.NONE = 'NONE';
LateralNavModeState.ROLL = 'ROLL';
LateralNavModeState.LNAV = 'LNV1';
LateralNavModeState.NAV = 'NAV';
LateralNavModeState.HDG = 'HDG';
LateralNavModeState.APPR = 'APPR';

class VerticalNavModeState { }
VerticalNavModeState.NONE = 'NONE';
VerticalNavModeState.PTCH = 'PTCH';
VerticalNavModeState.FLC = 'FLC';
VerticalNavModeState.VS = 'VS';
VerticalNavModeState.GS = 'GS';
VerticalNavModeState.GP = 'GP';
VerticalNavModeState.ALT = 'ALT';
VerticalNavModeState.ALTC = 'ALTC';
VerticalNavModeState.ALTS = 'ALTS';
VerticalNavModeState.ALTV = 'ALTV';
VerticalNavModeState.PATH = 'PATH';

class VPathState { }
VPathState.NONE = 0;
VPathState.ARMED = 1;
VPathState.ACTIVE = 2;

class LNavModeState { }
LNavModeState.FMS = 'fms';
LNavModeState.RADIO = 'radio';

class NavModeEvent { }

NavModeEvent.ALT_LOCK_CHANGED = 'alt_lock_changed';
NavModeEvent.ALT_CAPTURED = 'alt_captured';
NavModeEvent.NAV_PRESSED = 'nav_pressed';
NavModeEvent.NAV_MODE_CHANGED_TO_NAV = 'nav_mode_changed_to_nav';
NavModeEvent.NAV_MODE_CHANGED_TO_FMS = 'nav_mode_changed_to_fms';
NavModeEvent.HDG_PRESSED = 'hdg_pressed';
NavModeEvent.APPR_PRESSED = 'appr_pressed';
NavModeEvent.FLC_PRESSED = 'flc_pressed';
NavModeEvent.VS_PRESSED = 'vs_pressed';
NavModeEvent.BC_PRESSED = 'bc_pressed';
NavModeEvent.VNAV_PRESSED = 'vnav_pressed';
NavModeEvent.ALT_SLOT_CHANGED = 'alt_slot_changed';
NavModeEvent.VPATH_CHANGED = 'vpath_changed';
NavModeEvent.SELECTED_ALT1_CHANGED = 'selected_alt1_changed';
NavModeEvent.SELECTED_ALT2_CHANGED = 'selected_alt2_changed';

class ValueStateTracker {
  constructor(valueGetter, handler) {
    this._valueGetter = valueGetter;
    this._currentState = 0;
    this._handler = handler;
  }

  /** @type {any} */
  get state() {
    return this._currentState;
  }

  updateState() {
    const value = this._valueGetter();
    const isChanged = value !== this._currentState;

    this._currentState = value;
    if (isChanged) {
      return this._handler(value);
    }
  }
}