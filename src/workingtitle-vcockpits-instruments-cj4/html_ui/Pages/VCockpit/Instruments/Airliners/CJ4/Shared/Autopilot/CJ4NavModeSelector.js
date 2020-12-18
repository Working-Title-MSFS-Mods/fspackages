/**
 * A class that handles state transitions to the different autopilot modes of
 * the CJ4.
 */
class CJ4NavModeSelector {

  /**
   * Creates a new instance of the CJ4NavModeSelector.
   * @param {FlightPlanManager} flightPlanManager The flight plan manager to use with this instance.
   */
  constructor(flightPlanManager) {

    /** The current flight plan manager. */
    this.flightPlanManager = flightPlanManager;

    /** The current flight plan version. */
    this.currentPlanVersion = 0;

    /** The current loaded approach name. */
    this.currentApproachName = '';

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

    /** The currently selected approach type. */
    this.approachMode = WT_ApproachType.NONE;

    /** The vnav requested slot. */
    this.vnavRequestedSlot = undefined;

    /**
     * The queue of state change events to process.
     * @type {string[]}
     */
    this._eventQueue = [];
    
    /** The current states of the input data. */
    this._inputDataStates = {
      altLocked: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean"), () => NavModeEvent.ALT_LOCK_CHANGED),
      altSlot: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number"), () => NavModeEvent.ALT_SLOT_CHANGED),
      selectedAlt1: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", "feet"), () => NavModeEvent.SELECTED_ALT1_CHANGED),
      selectedAlt2: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"), () => NavModeEvent.SELECTED_ALT2_CHANGED),
      navmode: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number"), () => NavModeEvent.NAV_MODE_CHANGED),
      vpath: new ValueStateTracker(() => SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number"), () => NavModeEvent.VPATH_CHANGED),
      gs_arm: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean"), () => NavModeEvent.GS_ARM_CHANGED),
      gs_active: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean"), () => NavModeEvent.GS_ACTIVE_CHANGED),
      hdg_lock: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean"), () => NavModeEvent.HDG_LOCK_CHANGED)
    };

    /** The event handlers for each event type. */
    this._handlers = {
      [`${NavModeEvent.VS_PRESSED}`]: this.handleVSPressed.bind(this),
      [`${NavModeEvent.NAV_PRESSED}`]: this.handleNAVPressed.bind(this),
      [`${NavModeEvent.NAV_MODE_CHANGED}`]: this.handleNAVModeChanged.bind(this),
      [`${NavModeEvent.HDG_PRESSED}`]: this.handleHDGPressed.bind(this),
      [`${NavModeEvent.APPR_PRESSED}`]: this.handleAPPRPressed.bind(this),
      [`${NavModeEvent.FLC_PRESSED}`]: this.handleFLCPressed.bind(this),
      [`${NavModeEvent.VNAV_PRESSED}`]: this.handleVNAVPressed.bind(this),
      [`${NavModeEvent.ALT_LOCK_CHANGED}`]: this.handleAltLockChanged.bind(this),
      [`${NavModeEvent.ALT_CAPTURED}`]: this.handleAltCaptured.bind(this),
      [`${NavModeEvent.VPATH_CHANGED}`]: this.handleVPathChanged.bind(this),
      [`${NavModeEvent.ALT_SLOT_CHANGED}`]: this.handleAltSlotChanged.bind(this),
      [`${NavModeEvent.SELECTED_ALT1_CHANGED}`]: this.handleAlt1Changed.bind(this),
      [`${NavModeEvent.SELECTED_ALT2_CHANGED}`]: this.handleAlt2Changed.bind(this),
      [`${NavModeEvent.APPROACH_CHANGED}`]: this.handleApproachChanged.bind(this),
      [`${NavModeEvent.GS_ARM_CHANGED}`]: this.handleGSArmChanged.bind(this),
      [`${NavModeEvent.GS_ACTIVE_CHANGED}`]: this.handleGSActiveChanged.bind(this),
      [`${NavModeEvent.VNAV_REQUEST_SLOT_1}`]: this.handleVnavRequestSlot1.bind(this),
      [`${NavModeEvent.VNAV_REQUEST_SLOT_2}`]: this.handleVnavRequestSlot2.bind(this),
      [`${NavModeEvent.HDG_LOCK_CHANGED}`]: this.handleHeadingLockChanged.bind(this)
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
   * Called when a AP button is pressed.
   * @param {string} evt 
   */
  onNavChangedEvent(evt) {
    this.queueEvent(evt);
    this.processEvents();
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

    const planVersion = SimVar.GetSimVarValue("L:WT.FlightPlan.Version", "number");
    if (planVersion != this.currentPlanVersion) {
      this.currentPlanVersion = planVersion;

      const approach = this.flightPlanManager.getApproach();
      if (approach && approach.name !== this.currentApproachName) {
        this.currentApproachName = approach.name;
        this.queueEvent(NavModeEvent.APPROACH_CHANGED);
      }
      else if (this.flightPlanManager.getFlightPlan(0).procedureDetails.destinationRunwayIndex !== -1) {
        this.currentApproachName = 'VISUAL';
        this.queueEvent(NavModeEvent.APPROACH_CHANGED);
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

  /**
   * Pushes the supplied vertical armed mode to the collection of vertical armed modes.
   * @param {string} mode The mode to push to the collection. 
   */
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
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
        this.currentVerticalActiveState = VerticalNavModeState.VS;
        break;
      case VerticalNavModeState.VS:
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
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
      case VerticalNavModeState.PATH:
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 1);
        this.currentVerticalActiveState = VerticalNavModeState.VS;
        break;
    }
    if (this.isVNAVOn) {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", this.vnavRequestedSlot);
    }
    else {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
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
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
        if (Simplane.getAutoPilotMachModeActive()) {
          const mach = Simplane.getMachSpeed();
          Coherent.call("AP_MACH_VAR_SET", 0, parseFloat(mach.toFixed(2)));
        } else {
          const airspeed = Simplane.getIndicatedSpeed();
          Coherent.call("AP_SPD_VAR_SET", 0, airspeed);
        }
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

    if (this.isVNAVOn) {
      // console.log("handleFLCPressed - VNAV ON: " + this.vnavRequestedSlot);
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", this.vnavRequestedSlot);
    }
    else {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the VNAV button is pressed.
   */
  handleVNAVPressed() {
    if (this.currentLateralActiveState !== LateralNavModeState.APPR) {
      this.isVNAVOn = !this.isVNAVOn;
      SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", this.isVNAVOn ? 1 : 0);

      if (this.isVNAVOn) {
        this.handleVPathChanged();
      }
      else {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
  
        if (this.currentVerticalActiveState === VerticalNavModeState.PATH) {    
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;
        }
      }
    }
  }

  /**
   * Handles when the active altitude slot changes in the sim.
   */
  handleAltSlotChanged() {
    this.currentAltSlotIndex = this._inputDataStates.altSlot.state;
    // console.log("alt slot changed to: " + this.currentAltSlotIndex);

    //Prevent sim from changing to alt slot 1 automatically if we're trying to drive via
    //VNAV and PATH
    if (this.currentAltSlotIndex === 1 && this.vPathState === VPathState.ACTIVE && (this.isVNAVOn === true || this.currentVerticalActiveState === VerticalNavModeState.GP)) {
      console.log("alt slot changed to 2 for path");
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
      this.currentAltSlotIndex = 2;
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the selected altitude in altitude lock slot 1 changes in the sim.
   */
  handleAlt1Changed() {
    this.selectedAlt1 = this._inputDataStates.selectedAlt1.state;
    // console.log("handleAlt1Changed: " + this.selectedAlt1);
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the selected altitude in altitude lock slot 2 changes in the sim.
   */
  handleAlt2Changed() {
    this.selectedAlt2 = this._inputDataStates.selectedAlt2.state;
    // console.log("handleAlt2Changed: " + this.selectedAlt2);
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

    if (this.currentLateralActiveState !== LateralNavModeState.APPR) {
      if (!this.isAltitudeLocked) {
        if (this.vPathState === VPathState.ACTIVE || (this.currentVerticalActiveState === VerticalNavModeState.FLC || this.currentVerticalActiveState === VerticalNavModeState.VS)) {
          selectVerticalArmedModeBySlot();
        }
      }
  
      if (this.vPathState === VPathState.ARMED) {
        this.pushVerticalArmedMode(VerticalNavModeState.PATH);
      }
      else if (this.vPathState === VPathState.UNABLEARMED) {
        this.pushVerticalArmedMode(VerticalNavModeState.NOPATH);
      }
    }
    
    if (this.currentLateralActiveState === LateralNavModeState.APPR 
      && (this.approachMode === WT_ApproachType.RNAV || this.approachMode === WT_ApproachType.VISUAL) 
      && this.vPathState !== VPathState.ACTIVE) {
        this.currentVerticalArmedStates = [VerticalNavModeState.GP];
    }
  }

  /**
   * Handles when the HDG button is pressed.
   */
  handleHDGPressed() {
    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 1);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
        this.currentLateralActiveState = LateralNavModeState.HDG;
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 1);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        this.currentLateralActiveState = LateralNavModeState.HDG;
        break;
      case LateralNavModeState.HDG:
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.APPR:
        this.cancelApproachMode(false);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 1);

        if (this.approachMode === WT_ApproachType.ILS || this.approachMode === WT_ApproachType.NONE) {
          SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
        }

        this.currentLateralActiveState = LateralNavModeState.HDG;
        break;
    }
  }

  /**
   * Handles when the NAV button is pressed.
   */
  handleNAVPressed() {
    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 1);
        this.changeToCorrectLNavForMode(true);
        break;
      case LateralNavModeState.HDG:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 1);
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
        this.changeToCorrectLNavForMode(false);
        break;
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
      case LateralNavModeState.APPR:
        this.cancelApproachMode(true);
        this.changeToCorrectLNavForMode(true);

        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 1);
        break;
    }
  }

  /**
   * Handles when the active nav source changes to follow the nav radio.
   */
  handleNAVModeChanged() {
    const value = this._inputDataStates.navmode.state;
    switch (value) {
      case 0:
        this.lNavModeState = LNavModeState.FMS;
        break;
      case 1:
        this.lNavModeState = LNavModeState.NAV1;
        break;
      case 2:
        this.lNavModeState = LNavModeState.NAV2;
        break;
    }

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
      if (this.lNavModeState === LNavModeState.NAV1) {
        SimVar.SetSimVarValue('K:AP_NAV_SELECT_SET', 'number', 1);
      }
      else {
        SimVar.SetSimVarValue('K:AP_NAV_SELECT_SET', 'number', 2);
      }

      if (this.currentLateralActiveState !== LateralNavModeState.NAV) {
        const apOnGPS = SimVar.GetSimVarValue('GPS DRIVES NAV1', 'Bool');
        if (apOnGPS) {
          SimVar.SetSimVarValue('K:TOGGLE_GPS_DRIVES_NAV1', 'number', 0);
        }

        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 1);
      }
      
      this.currentLateralActiveState = LateralNavModeState.NAV;
    }
  }

  /**
   * Handles when the APPR button is pressed.
   */
  handleAPPRPressed() {
    
    const setProperVNAVState = () => {
      SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", 0);

      switch(this.approachMode) {
        case WT_ApproachType.RNAV:
          this.isVNAVOn = true;
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);

          if (this.vPathState === VPathState.ACTIVE) {
            this.currentVerticalActiveState = VerticalNavModeState.GP;
          }
          else {
            this.currentVerticalArmedStates = [VerticalNavModeState.GP];
          }

          break;
        case WT_ApproachType.NONE:
        case WT_ApproachType.VISUAL:
        case WT_ApproachType.ILS: {
          this.isVNAVOn = false;
          // console.log("ILS APPR");
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);

          if (this.lNavModeState === LNavModeState.NAV2) {
            SimVar.SetSimVarValue('K:AP_NAV_SELECT_SET', 'number', 2);
          }
          else {
            SimVar.SetSimVarValue('K:AP_NAV_SELECT_SET', 'number', 1);
          }

          const apOnGPS = SimVar.GetSimVarValue('GPS DRIVES NAV1', 'Bool');
          if (apOnGPS) {
            SimVar.SetSimVarValue('K:TOGGLE_GPS_DRIVES_NAV1', 'number', 0);
          }

          const headingLockActive = SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'number') === 1;
          if (headingLockActive) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'number', 0);
          }

          if (this.currentLateralActiveState !== LateralNavModeState.NAV) {
            SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 1);
          }

          setTimeout(() => {
            if (this.currentLateralActiveState === LateralNavModeState.APPR) {
              SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 1);
            }        
          }, 1000);

          break;
        }
      }
    };

    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
        setProperVNAVState();

        this.currentLateralActiveState = LateralNavModeState.APPR;
        break;
      case LateralNavModeState.HDG:
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
        setProperVNAVState();

        this.currentLateralActiveState = LateralNavModeState.APPR;
        break;
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        setProperVNAVState();

        this.currentLateralActiveState = LateralNavModeState.APPR;
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        setProperVNAVState();

        this.currentLateralActiveState = LateralNavModeState.APPR;
        break;
      case LateralNavModeState.APPR:
        this.cancelApproachMode(true);
        this.currentLateralActiveState = LateralNavModeState.ROLL;
        break;
    }
  }

  /**
   * Cancels approach mode.
   * @param {boolean} cancelHeadingHold Whether or not to cancel heading mode while disabling approach mode.
   */
  cancelApproachMode(cancelHeadingHold) {
    SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);

    if (this.approachMode === WT_ApproachType.RNAV) {
      this.isVNAVOn = false;
      this.currentVerticalActiveState = VerticalNavModeState.PTCH;

      if (this.vPathState === VPathState.ACTIVE) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
      }

      if (cancelHeadingHold) {
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
      }
    }

    if (this.approachMode === WT_ApproachType.ILS) {
      SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 0);
    }
  }

  /**
   * Handles when the altitude lock state has changed.
   */
  handleAltLockChanged() {
    this.isAltitudeLocked = this._inputDataStates.altLocked.state;

    if (this.isAltitudeLocked) {
      this.currentVerticalActiveState = VerticalNavModeState.ALTC;

      Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, 0);
      Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
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
      if (SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number") != 1) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
      }
      if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") != 3) {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 3);
      }
    }
  }

  /**
   * Handles when autopilot heading lock changes.
   */
  handleHeadingLockChanged() {
    const isLocked = this._inputDataStates.hdg_lock.state;
    if (!isLocked) {
      switch (this.currentLateralActiveState) {
        case LateralNavModeState.APPR:
          if (this.approachMode === WT_ApproachType.RNAV || this.approachMode === WT_ApproachType.VISUAL) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'number', 1);
          }
          break;
        case LateralNavModeState.LNAV:
          SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'number', 1);
          break;
        case LateralNavModeState.HDG:
          SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'number', 1);
          break;
      }
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
      if (SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number") != 2) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 2);
      }
      if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") != 2) {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
      }
      if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
      }
    }

    if (this.currentLateralActiveState === LateralNavModeState.APPR) {
      switch (this.vPathState) {
        case VPathState.NONE:
        case VPathState.ARMED:
        case VPathState.UNABLEARMED:
          this.currentVerticalArmedStates = [VerticalNavModeState.GP];
          break;
        case VPathState.ACTIVE:
          this.currentVerticalArmedStates = [];
          this.currentVerticalActiveState = VerticalNavModeState.GP;
          break;
      }
    }
  }

  /**
   * Handles when the currently loaded approach has been changed.
   */
  handleApproachChanged() {
    if (this.currentApproachName.startsWith('RN')) {
      this.approachMode = WT_ApproachType.RNAV;
      if (this.currentLateralActiveState === LateralNavModeState.APPR) {
        this.isVNAVOn = true;
      }
      
      if (this.currentVerticalActiveState === VerticalNavModeState.GS) {
        this.currentVerticalActiveState = VerticalNavModeState.GP;
      }

      if (this.currentVerticalArmedStates.includes(VerticalNavModeState.GS)) {
        this.currentVerticalArmedStates = [VerticalNavModeState.GP];
      }
    }

    if (this.currentApproachName.startsWith('ILS')) {
      this.approachMode = WT_ApproachType.ILS;
      if (this.currentLateralActiveState === LateralNavModeState.APPR) {
        this.isVNAVOn = false;
      }

      if (this.currentVerticalActiveState === VerticalNavModeState.GP) {
        this.currentVerticalActiveState = VerticalNavModeState.GS;
      }

      if (this.currentVerticalArmedStates.includes(VerticalNavModeState.GP)) {
        this.currentVerticalArmedStates = [VerticalNavModeState.GS];
      }
    }
  }

  /**
   * Handles when glideslope arm changes in the sim autopilot.
   */
  handleGSArmChanged() {
    const isArmed = this._inputDataStates.gs_arm.state;
    if (isArmed) {
      this.currentVerticalArmedStates = [VerticalNavModeState.GS];
    }
    else if (this.currentVerticalArmedStates.includes(VerticalNavModeState.GS)) {
      this.currentVerticalArmedStates = [];
    }
  }

  /**
   * Handles when glideslope active changes in the sim autopilot.
   */
  handleGSActiveChanged() {
    const isActive = this._inputDataStates.gs_active.state;
    if (isActive) {
      this.currentVerticalActiveState = VerticalNavModeState.GS;
    }
    else if (this.currentVerticalActiveState === VerticalNavModeState.GS) {
      this.currentVerticalActiveState = VerticalNavModeState.PTCH;
    }
  }

  /**
   * Handles when vnav autopilot requests alt slot 1 in the sim autopilot.
   */
  handleVnavRequestSlot1() {
    SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
    this.vnavRequestedSlot = 1;
  }

  /**
   * Handles when vnav autopilot requests alt slot 2 in the sim autopilot.
   */
  handleVnavRequestSlot2() {
    SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
    this.vnavRequestedSlot = 2;
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
VerticalNavModeState.NOPATH = 'NOPATH';

class VPathState { }
VPathState.NONE = 0;
VPathState.ARMED = 1;
VPathState.UNABLEARMED = 2;
VPathState.ACTIVE = 3;

class LNavModeState { }
LNavModeState.FMS = 'fms';
LNavModeState.NAV1 = 'nav1';
LNavModeState.NAV2 = 'nav2';

class NavModeEvent { }

NavModeEvent.ALT_LOCK_CHANGED = 'alt_lock_changed';
NavModeEvent.ALT_CAPTURED = 'alt_captured';
NavModeEvent.NAV_PRESSED = 'NAV_PRESSED';
NavModeEvent.NAV_MODE_CHANGED = 'nav_mode_changed_to_nav';
NavModeEvent.NAV_MODE_CHANGED_TO_FMS = 'nav_mode_changed_to_fms';
NavModeEvent.HDG_PRESSED = 'HDG_PRESSED';
NavModeEvent.APPR_PRESSED = 'APPR_PRESSED';
NavModeEvent.FLC_PRESSED = 'FLC_PRESSED';
NavModeEvent.VS_PRESSED = 'VS_PRESSED';
NavModeEvent.BC_PRESSED = 'BC_PRESSED';
NavModeEvent.VNAV_PRESSED = 'VNAV_PRESSED';
NavModeEvent.ALT_SLOT_CHANGED = 'alt_slot_changed';
NavModeEvent.VPATH_CHANGED = 'vpath_changed';
NavModeEvent.SELECTED_ALT1_CHANGED = 'selected_alt1_changed';
NavModeEvent.SELECTED_ALT2_CHANGED = 'selected_alt2_changed';
NavModeEvent.APPROACH_CHANGED = 'approach_changed';
NavModeEvent.GS_ARM_CHANGED = 'gs_arm_changed';
NavModeEvent.GS_ACTIVE_CHANGED = 'gs_active_changed';
NavModeEvent.VNAV_REQUEST_SLOT_1 = 'vnav_request_slot_1';
NavModeEvent.VNAV_REQUEST_SLOT_2 = 'vnav_request_slot_2';
NavModeEvent.HDG_LOCK_CHANGED = 'hdg_lock_changed';

class WT_ApproachType { }
WT_ApproachType.NONE = 'none';
WT_ApproachType.ILS = 'ils';
WT_ApproachType.RNAV = 'rnav';
WT_ApproachType.VISUAL = 'visual';

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