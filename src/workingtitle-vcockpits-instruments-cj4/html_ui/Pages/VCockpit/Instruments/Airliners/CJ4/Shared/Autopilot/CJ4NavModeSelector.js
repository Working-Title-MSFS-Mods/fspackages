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

    /** The current armed altitude mode. */
    this.currentArmedAltitudeState = VerticalNavModeState.NONE;

    /** The current armed vnav mode. */
    this.currentArmedVnavState = VerticalNavModeState.NONE;

    /** Whether or not VNAV is on. */
    this.isVNAVOn = false;

    /** The current VPath state. */
    this.vPathState = VnavPathStatus.NONE;

    /** The current RNAV Glidepath state. */
    this.glidepathState = GlidepathStatus.NONE;

    /** The current ILS Glideslope state. */
    this.glideslopeState = GlideslopeStatus.NONE;

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

    /** The vnav managed altitude target. */
    this.managedAltitudeTarget = undefined;

    /** The current AP target altitude type. */
    this.currentAltitudeTracking = AltitudeState.SELECTED;

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
      hdg_lock: new ValueStateTracker(() => SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean"), () => NavModeEvent.HDG_LOCK_CHANGED),
      toga: new ValueStateTracker(() => Simplane.getAutoPilotTOGAActive(), () => NavModeEvent.TOGA_CHANGED),
      grounded: new ValueStateTracker(() => Simplane.getIsGrounded(), () => NavModeEvent.GROUNDED),
      autopilot: new ValueStateTracker(() => Simplane.getAutoPilotActive(), () => NavModeEvent.AP_CHANGED)
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
      [`${NavModeEvent.PATH_ACTIVE}`]: this.handleVPathActivate.bind(this),
      [`${NavModeEvent.GP_ACTIVE}`]: this.handleGPGSActivate.bind(this),
      [`${NavModeEvent.GS_ACTIVE}`]: this.handleGPGSActivate.bind(this),
      [`${NavModeEvent.ALT_SLOT_CHANGED}`]: this.handleAltSlotChanged.bind(this),
      [`${NavModeEvent.SELECTED_ALT1_CHANGED}`]: this.handleAlt1Changed.bind(this),
      [`${NavModeEvent.SELECTED_ALT2_CHANGED}`]: this.handleAlt2Changed.bind(this),
      [`${NavModeEvent.APPROACH_CHANGED}`]: this.handleApproachChanged.bind(this),
      [`${NavModeEvent.VNAV_REQUEST_SLOT_1}`]: this.handleVnavRequestSlot1.bind(this),
      [`${NavModeEvent.VNAV_REQUEST_SLOT_2}`]: this.handleVnavRequestSlot2.bind(this),
      [`${NavModeEvent.HDG_LOCK_CHANGED}`]: this.handleHeadingLockChanged.bind(this),
      [`${NavModeEvent.TOGA_CHANGED}`]: this.handleTogaChanged.bind(this),
      [`${NavModeEvent.GROUNDED}`]: this.handleGrounded.bind(this),
      [`${NavModeEvent.AP_CHANGED}`]: this.handleAPChanged.bind(this),
      [`${NavModeEvent.LOC_ACTIVE}`]: this.handleLocActive.bind(this)
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

    if (this.currentVerticalActiveState === VerticalNavModeState.ALTCAP ||
        this.currentVerticalActiveState === VerticalNavModeState.ALTSCAP || this.currentVerticalActiveState === VerticalNavModeState.ALTVCAP) {
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

    const getLateralAnnunciation = (mode) => {
      if (mode === LateralNavModeState.APPR) {
        switch(this.approachMode) {
          case WT_ApproachType.RNAV:
          case WT_ApproachType.VISUAL:
          case WT_ApproachType.NONE:
            lateralMode = "APPR FMS1";
            break;
          case WT_ApproachType.ILS:
            if (this.lNavModeState === LNavModeState.NAV1) {
              lateralMode = "APPR LOC1";
            } else if (this.lNavModeState === LNavModeState.NAV2) {
              lateralMode = "APPR LOC2";
            }
            break;
        }
      }

      return mode;
    };

    const fmaValues = {
      lateralMode: getLateralAnnunciation(this.currentLateralActiveState),
      lateralArmed: getLateralAnnunciation(this.currentLateralArmedState),
      verticalMode: `${this.isVNAVOn ? "V" : ""}${this.currentVerticalActiveState}`,
      verticalArmed1: this.currentArmedAltitudeState !== VerticalNavModeState.NONE ? this.currentArmedAltitudeState : "",
      verticalArmed2: this.currentArmedVnavState !== VerticalNavModeState.NONE ? this.currentArmedVnavState : ""
    };

    //WTDataStore.set('CJ4_fmaValues', JSON.stringify(fmaValues));
    localStorage.setItem("CJ4_fmaValues", JSON.stringify(fmaValues));
  }

  /**
   * Queues an event with the mode selector state machine.
   * @param {string} event The event type to queue. 
   */
  queueEvent(event) {
    this._eventQueue.push(event);
  }

  /**
   * Handles when the autopilot turns on or off.
   */
  handleAPChanged() {
    if (this._inputDataStates.autopilot.state) {
      if (this.currentLateralActiveState === LateralNavModeState.TO || this.currentLateralActiveState === LateralNavModeState.GA
        || this.currentVerticalActiveState === VerticalNavModeState.TO || this.currentVerticalActiveState === VerticalNavModeState.GA) {
          SimVar.SetSimVarValue("K:AUTO_THROTTLE_TO_GA", "number", 0);
      }
    }
  }

  /**
   * Handles when APPR LOC mode goes active.
   */
  handleLocActive() {
    if (this.currentLateralArmedState === LateralNavModeState.APPR) {
      this.currentLateralArmedState = LateralNavModeState.NONE;
      this.currentLateralActiveState = LateralNavModeState.APPR;
    }
  }

  /**
   * Handles when the plane changes from on ground to in air or in air to on ground.
   */
  handleGrounded() {
    if (this._inputDataStates.grounded.state) {
      switch (this.currentLateralActiveState) {
        case LateralNavModeState.NAV:
          SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
          SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
          break;
        case LateralNavModeState.LNAV:
        case LateralNavModeState.HDG:
        case LateralNavModeState.TO:
        case LateralNavModeState.GA:
          SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
          SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
          break;
        case LateralNavModeState.APPR:
          this.cancelApproachMode(true);
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
          SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
          break;
        case LateralNavModeState.ROLL:
          break;
      }
      this.currentLateralActiveState = LateralNavModeState.ROLL;

      switch (this.currentVerticalActiveState) {
        case VerticalNavModeState.FLC:
          SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 0);
          break;
        case VerticalNavModeState.ALTCAP:
        case VerticalNavModeState.ALTVCAP:
        case VerticalNavModeState.ALTSCAP:
        case VerticalNavModeState.ALTV:
        case VerticalNavModeState.ALTS:
        case VerticalNavModeState.ALT:
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
          SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
          Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, 0);
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
          break;
        case VerticalNavModeState.VS:
        case VerticalNavModeState.PATH:
        case VerticalNavModeState.GP:
          SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
          break;
        case VerticalNavModeState.PTCH:
          break;
      }
      this.currentVerticalActiveState = VerticalNavModeState.PTCH;
      if (this.isVNAVOn) {
        this.isVNAVOn = false;
        SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", 0);
      }
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
      SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

    }
  }

  /**
   * Handles when the VS button is pressed.
   */
  handleVSPressed() {
    
    switch (this.currentVerticalActiveState) {
      case VerticalNavModeState.TO:
      case VerticalNavModeState.GA:
        SimVar.SetSimVarValue("K:AUTO_THROTTLE_TO_GA", "number", 0);
      case VerticalNavModeState.PTCH:
      case VerticalNavModeState.FLC:
      case VerticalNavModeState.ALTCAP:
      case VerticalNavModeState.ALTVCAP:
      case VerticalNavModeState.ALTSCAP:
      case VerticalNavModeState.ALTV:
      case VerticalNavModeState.ALTS:
      case VerticalNavModeState.ALT:
      case VerticalNavModeState.GS:
      case VerticalNavModeState.PATH:
      case VerticalNavModeState.GP:
        this.engageVerticalSpeed();
        this.currentVerticalActiveState = VerticalNavModeState.VS;
        break;
      case VerticalNavModeState.VS:
        this.engagePitch();
        this.currentVerticalActiveState = VerticalNavModeState.PTCH;
        break;
    }

    this.setProperVerticalArmedStates();
  }

    /**
   * Handles when the FLC button is pressed.
   */
  handleFLCPressed() {
    switch (this.currentVerticalActiveState) {
      case VerticalNavModeState.TO:
      case VerticalNavModeState.GA:
        SimVar.SetSimVarValue("K:AUTO_THROTTLE_TO_GA", "number", 0);
      case VerticalNavModeState.PTCH:
      case VerticalNavModeState.VS:
      case VerticalNavModeState.ALTCAP:
      case VerticalNavModeState.ALTVCAP:
      case VerticalNavModeState.ALTSCAP:
      case VerticalNavModeState.ALTV:
      case VerticalNavModeState.ALTS:
      case VerticalNavModeState.ALT:
      case VerticalNavModeState.GS:
      case VerticalNavModeState.PATH:
      case VerticalNavModeState.GP:
        this.engageFlightLevelChange();
        this.currentVerticalActiveState = VerticalNavModeState.FLC;
        break;
      case VerticalNavModeState.FLC:
        this.engagePitch();
        this.currentVerticalActiveState = VerticalNavModeState.PTCH;
        break;
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Engage VS to Slot.
   * @param {number} vsslot is the slot to engage VS with.
   * @param {number} vs is the starting VS value to set.
   */
  engageVerticalSpeed(vsslot = 1, vs = Simplane.getVerticalSpeed()) {
    SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 1);
    SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
    SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", vsslot);
    Coherent.call("AP_VS_VAR_SET_ENGLISH", vsslot, vs);
    this.checkCorrectAltSlot();
    if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "number") != 1) {
      SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
    }
  }

  /**
   * Engage Pitch Mode (disengages all other vertical modes).
   */
  engagePitch() {
    if (SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean") == 0) {
      if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "number") == 1) {
        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 0);
      }
      else if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") == 1) {
        SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE_ON", "Number", 0);
      }
    }
    this.checkCorrectAltSlot();
    SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
    SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
    
    //TODO: ADD APPR MODE AFTER WE INTEGRATE ILS WITH NEW LNAV/VNAV
  }

  /**
   * Engage FLC to Speed.
   * @param {number} speed is the speed to set FLC with.
   */
  engageFlightLevelChange(speed = undefined) {
    SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 1);
    SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
    this.checkCorrectAltSlot();
    if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
      SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
    }
    if (!SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean")) {
      SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "Number", 1);
    }
    if (speed === undefined) {
      if (Simplane.getAutoPilotMachModeActive()) {
        const mach = Simplane.getMachSpeed();
        Coherent.call("AP_MACH_VAR_SET", 0, parseFloat(mach.toFixed(2)));
      } else {
        const airspeed = Simplane.getIndicatedSpeed();
        Coherent.call("AP_SPD_VAR_SET", 0, airspeed);
      }
    } else {
      Coherent.call("AP_SPD_VAR_SET", 0, speed);
    }
  }

  /**
   * Handles when the VNAV button is pressed.
   */
  handleVNAVPressed() {
    if (this.currentLateralActiveState !== LateralNavModeState.APPR) {
      this.isVNAVOn = !this.isVNAVOn;
      SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", this.isVNAVOn ? 1 : 0);

      if (!this.isVNAVOn) {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        if (this.currentVerticalActiveState === VerticalNavModeState.PATH) {    
          this.engagePitch();
          this.currentVerticalActiveState = VerticalNavModeState.PTCH;
        }
        this.currentAltitudeTracking = AltitudeState.SELECTED;
      }
    }
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the active altitude slot changes in the sim.
   */
  handleAltSlotChanged() {
    this.currentAltSlotIndex = this._inputDataStates.altSlot.state;
  }

  /**
   * Handles when the selected altitude in altitude lock slot 1 changes in the sim.
   */
  handleAlt1Changed() {
    if (this._inputDataStates.selectedAlt1.state < 0) {
      this.selectedAlt1 = 0;
      Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, 0);
    } else {
      this.selectedAlt1 = this._inputDataStates.selectedAlt1.state;
    }

    switch(this.currentVerticalActiveState) {
      case VerticalNavModeState.ALTV:
      case VerticalNavModeState.ALTS:
      case VerticalNavModeState.ALT:
        this.checkCorrectAltMode();
      case VerticalNavModeState.ALTCAP:
      case VerticalNavModeState.ALTVCAP:
      case VerticalNavModeState.ALTSCAP:
        console.log("setting slot 3 in handleAlt1Changed");
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 3);
        break;
    }

    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the selected altitude in altitude lock slot 2 changes in the sim.
   */
  handleAlt2Changed() {
    this.selectedAlt2 = this._inputDataStates.selectedAlt2.state;
    this.checkCorrectAltMode();
    //this.setProperVerticalArmedStates();
  }

  /**
   * Checks the altitude configuration to set the correct altitude hold type
   * between ALTV (MANAGED), ALTS (SELECTED) and ALT (PRESSURE).
   */
  checkCorrectAltMode() {
    if (this.currentVerticalActiveState === VerticalNavModeState.ALTS || this.currentVerticalActiveState === VerticalNavModeState.ALTV
      || this.currentVerticalActiveState === VerticalNavModeState.ALT) {
      let newValue = VerticalNavModeState.ALT;
      const altLockValue = Math.floor(Simplane.getAutoPilotDisplayedAltitudeLockValue());
      if (altLockValue == Math.floor(this.selectedAlt1)) {
        newValue = VerticalNavModeState.ALTS;
      }
      else if (altLockValue == Math.floor(this.selectedAlt2) || altLockValue == Math.floor(this.managedAltitudeTarget)) {
        newValue = VerticalNavModeState.ALTV;
      }
      if (this.currentVerticalActiveState !== newValue) {
        this.currentVerticalActiveState = newValue;
      }
    }
  }

  checkCorrectAltSlot() {
    if (!this.isVNAVOn) {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
    }
  }

  /**
   * Handles when the pitch ref changes in the sim.
   */
  handleTogaChanged() {
    
    if (this._inputDataStates.toga.state) {
      const flightDirector = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Boolean") == 1;
      if (!flightDirector) {
        SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 1);
      }
      if (Simplane.getIsGrounded()) { //PLANE IS ON THE GROUND?
        this.currentVerticalActiveState = VerticalNavModeState.TO;

        //SET LATERAL
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
        Coherent.call("HEADING_BUG_SET", 2, SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Degrees'));
        this.currentLateralActiveState = LateralNavModeState.TO;
      }
      else {
        if (this.currentLateralActiveState === LateralNavModeState.APPR) {
          if (this.approachMode === WT_ApproachType.ILS) {
            SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 0);
          }
        }
        if (this.isVNAVOn) {
          this.isVNAVOn = false;
          SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", 0);
          SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
          SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        }
        this.currentVerticalActiveState = VerticalNavModeState.GA;

        //SET LATERAL
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "number") != 1) {
          SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
        }
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
        Coherent.call("HEADING_BUG_SET", 2, SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Degrees'));
        this.currentLateralActiveState = LateralNavModeState.GA;

        const activeWaypoint = this.flightPlanManager.getActiveWaypoint();
        if (activeWaypoint && activeWaypoint.isRunway) {
          this.flightPlanManager.setActiveWaypointIndex(this.flightPlanManager.getActiveWaypointIndex() + 1);
        }
      }
      
    } else {
      //SET LATERAL
      if (this.currentLateralActiveState === LateralNavModeState.TO || this.currentLateralActiveState === LateralNavModeState.GA) {
        if (SimVar.GetSimVarValue("L:WT_CJ4_HDG_ON", "number") == 1) {
          SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
        }
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "number") == 1) {
          SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        }
        this.currentLateralActiveState = LateralNavModeState.ROLL;
      }
      //SET VERTICAL
      if (this.currentVerticalActiveState === VerticalNavModeState.TO || this.currentVerticalActiveState === VerticalNavModeState.GA) {
        this.currentVerticalActiveState = VerticalNavModeState.PTCH;
      }
    }
    this.setProperVerticalArmedStates();
  }

  /**
   * Sets the armed altitude state.
   */
  setArmedAltitudeState(state = false) {
    if (state) {
      this.currentArmedAltitudeState = state;
    } else {
      this.currentArmedAltitudeState = VerticalNavModeState.NONE;
    }
  }

  /**
   * Sets the armed vnav state.
   */
  setArmedVnavState(state = false) {
    if (state) {
      this.currentArmedVnavState = state;
    } else {
      this.currentArmedVnavState = VerticalNavModeState.NONE;
    }
  }
  
  /**
   * Sets the proper armed vertical states.
   */
  setProperVerticalArmedStates(clear = false, state = undefined, slot = 0) {

    let currentArmedAltitudeState = VerticalNavModeState.NONE;
    let currentArmedVnavState = VerticalNavModeState.NONE;

    if (clear) {
      this.currentArmedVnavState = VerticalNavModeState.NONE;
      this.currentArmedAltitudeState = VerticalNavModeState.NONE;
    } else {
      console.log("setting ARMED ALTS/ALTV");
      if (slot !== 1 && !this.isAltitudeLocked && (this.currentVerticalActiveState === VerticalNavModeState.VS
        || this.currentVerticalActiveState === VerticalNavModeState.FLC)) {
          if (!this.isVNAVOn) {
            console.log("vnav off");
  
            if ((Simplane.getVerticalSpeed() > 0 && this.selectedAlt1 > Simplane.getAltitude())
              || (Simplane.getVerticalSpeed() < 0 && this.selectedAlt1 < Simplane.getAltitude())) {
                console.log("setting alts");
                currentArmedAltitudeState = VerticalNavModeState.ALTS;
            }
          } else {
            console.log("vnav on: " + this.currentAltitudeTracking);
  
            switch(this.currentAltitudeTracking) {
              case AltitudeState.SELECTED:
                console.log("setting ALTS");
                currentArmedAltitudeState = VerticalNavModeState.ALTS; 
                // if ((Simplane.getVerticalSpeed() > 0 && this.selectedAlt1 > Simplane.getAltitude())
                //   || (Simplane.getVerticalSpeed() < 0 && this.selectedAlt1 < Simplane.getAltitude())) {
                //     armState0 = VerticalNavModeState.ALTS;
                // }
                break;
              case AltitudeState.MANAGED:
                console.log("setting ALTV"); 
                currentArmedAltitudeState = VerticalNavModeState.ALTV;
                break;
            }
          }
      }
      if (slot !== 2 && this.currentLateralActiveState === LateralNavModeState.APPR) {
        if (this.glidepathState === GlidepathStatus.GP_ARMED) {
          currentArmedVnavState = VerticalNavModeState.GP;
        } else if (this.glidepathState === GlidepathStatus.GS_ARMED) {
          currentArmedVnavState = VerticalNavModeState.GS;
        }
      }
    }

    if (state !== undefined) {
      switch(slot) {
        case 1:
          currentArmedAltitudeState = state;
          break
        case 2:
          currentArmedVnavState = state;
          break
      }
    }

    if (currentArmedAltitudeState !== this.currentArmedAltitudeState) {
      this.currentArmedAltitudeState = currentArmedAltitudeState;
    }
    if (currentArmedVnavState !== this.currentArmedVnavState) {
      this.currentArmedVnavState = currentArmedVnavState;
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
      case LateralNavModeState.TO:
      case LateralNavModeState.GA:
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
      case LateralNavModeState.TO:
      case LateralNavModeState.GA:
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

    //TODO: add SimVar.SetSimVarValue("H:Upr_Push_NAV", "number", 1) to change NAV modes
    
    const setProperApprState = () => {
      SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", 0);
      this.isVNAVOn = false;

      switch(this.approachMode) {
        case WT_ApproachType.ILS:
          this.currentLateralArmedState = LateralNavModeState.APPR;
          break;
        case WT_ApproachType.RNAV:
          SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);

          if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "number") == 0) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
          }

          this.currentLateralActiveState = LateralNavModeState.APPR;
          break;
        case WT_ApproachType.NONE:
        case WT_ApproachType.VISUAL: {
          SimVar.SetSimVarValue("L:WT_CJ4_VNAV_ON", "number", 0);
          SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
          SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

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

          this.currentLateralActiveState = LateralNavModeState.APPR;
          break;
        }
      }
    };

    switch (this.currentLateralActiveState) {
      case LateralNavModeState.ROLL:
        setProperApprState();
        break;
      case LateralNavModeState.HDG:
      case LateralNavModeState.TO:
      case LateralNavModeState.GA:
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", 0);
        setProperApprState();
        break;
      case LateralNavModeState.NAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        setProperApprState();
        break;
      case LateralNavModeState.LNAV:
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", 0);
        setProperApprState();
        break;
      case LateralNavModeState.APPR:
        this.cancelApproachMode(true);
        this.currentLateralArmedState = LateralNavModeState.ROLL;
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

      if (this.glidepathState === GlidepathStatus.GP_ACTIVE) {
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

      if (this.currentVerticalActiveState === VerticalNavModeState.TO || this.currentVerticalActiveState === VerticalNavModeState.GA) {
        SimVar.SetSimVarValue("K:AUTO_THROTTLE_TO_GA", "number", 0);
      }

      switch(this.currentAltitudeTracking) {
        case AltitudeState.SELECTED:
          this.currentVerticalActiveState = VerticalNavModeState.ALTSCAP;
          break;
        case AltitudeState.MANAGED:
          this.currentVerticalActiveState = VerticalNavModeState.ALTVCAP;
          break;
        default:
          this.currentVerticalActiveState = VerticalNavModeState.ALTCAP;
          break;
      }
    }

    if (!this.isAltitudeLocked) {

      switch(this.currentVerticalActiveState) {
        case VerticalNavModeState.ALTCAP:
        case VerticalNavModeState.ALTVCAP:
        case VerticalNavModeState.ALTSCAP:
        case VerticalNavModeState.ALTV:
        case VerticalNavModeState.ALTS:
        case VerticalNavModeState.ALT:
          if (this.vPathState === VnavPathStatus.PATH_ACTIVE) {
            this.currentVerticalActiveState = VerticalNavModeState.PATH;
          }
          else {
            this.currentVerticalActiveState = VerticalNavModeState.PTCH;
          }
          break;
      }
    }
    this.setProperVerticalArmedStates();
  }

  /**
   * Handles when the plane has fully captured the assigned lock altitude.
   */
  handleAltCaptured() {
    if (this.isAltitudeLocked) {

      if (this.currentVerticalActiveState === VerticalNavModeState.ALTSCAP || this.currentVerticalActiveState === VerticalNavModeState.ALTVCAP
        || this.currentVerticalActiveState === VerticalNavModeState.ALTCAP) {
        const altLockValue = Math.floor(Simplane.getAutoPilotDisplayedAltitudeLockValue());
        if (altLockValue == Math.floor(this.selectedAlt1)) {
          this.currentVerticalActiveState = VerticalNavModeState.ALTS;
        }
        else if (altLockValue == Math.floor(this.selectedAlt2) || altLockValue == Math.floor(this.managedAltitudeTarget)) {
          this.currentVerticalActiveState = VerticalNavModeState.ALTV;
        }
        else {
          this.currentVerticalActiveState = VerticalNavModeState.ALT;
        }
      }

      if (SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number") != 1) {
        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
      }
      if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") != 3) {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 3);
      }

      //MOVED SETTING 0 VS rates from ALT CAP TO ALT CAPTURED
      if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:1", "feet per minute") != 0) {
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, 0);
      }
      if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute") != 0) {
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, 0);
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
   * Handles when the Glidepath state changes.
   */
  handleGPGSActivate() {
    
    if (this.glidepathState === GlidepathStatus.GP_ACTIVE && !SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
      SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
    }
    else if (this.glideslopeState === GlideslopeStatus.GS_ACTIVE && !SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
      SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
    }

  }

  /**
   * Handles when the VPath state changes.
   */
  handleVPathActivate() {
    
    switch(this.vPathState) {
      case VnavPathStatus.PATH_ACTIVE:
        if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
          SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
        }
        break;
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
      
      if (this.currentArmedVnavState === VerticalNavModeState.GS) {
        this.currentArmedVnavState = VerticalNavModeState.GP;
      }
    }

    if (this.currentApproachName.startsWith('ILS') || this.currentApproachName.startsWith('LDA')) {
      this.approachMode = WT_ApproachType.ILS;
      if (this.currentLateralActiveState === LateralNavModeState.APPR) {
        this.isVNAVOn = false;
      }

      if (this.currentVerticalActiveState === VerticalNavModeState.GP) {
        this.currentVerticalActiveState = VerticalNavModeState.GS;
      }

      if (this.currentArmedVnavState = VerticalNavModeState.GP) {
        this.currentArmedVnavState = VerticalNavModeState.GS;
      }
    }
  }

  /**
   * Handles when glideslope arm changes in the sim autopilot.
   */
  handleGSArmChanged() {
    const isArmed = this._inputDataStates.gs_arm.state;
    if (isArmed) {
      this.currentArmedVnavState = VerticalNavModeState.GS;
    }
    else if (this.currentArmedVnavState === VerticalNavModeState.GS) {
      this.currentArmedVnavState = VerticalNavModeState.NONE;
    }
  }

  /**
   * Handles when glideslope active changes in the sim autopilot.
   */
  handleGSActiveChanged() {
    const isActive = this._inputDataStates.gs_active.state;
    if (isActive) {
      this.currentVerticalActiveState = VerticalNavModeState.GS;
      this.isVNAVOn = false;
    }
    else if (this.currentVerticalActiveState === VerticalNavModeState.GS) {
      this.currentVerticalActiveState = VerticalNavModeState.PTCH;
    }
  }

  /**
   * Handles when vnav autopilot requests alt slot 1 in the sim autopilot.
   * @param {boolean} force set to true to force the slot even if in one of the protected ALT states.
   */
  handleVnavRequestSlot1(force = false) {

    switch(this.currentVerticalActiveState) {
      case VerticalNavModeState.ALTCAP:
      case VerticalNavModeState.ALTVCAP:
      case VerticalNavModeState.ALTSCAP:
      case VerticalNavModeState.ALTV:
      case VerticalNavModeState.ALTS:
      case VerticalNavModeState.ALT:
        this.vnavRequestedSlot = 1;
        break;
      default:
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        this.vnavRequestedSlot = 1;
        break;
    }
    if (force) {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
    }
  }

  /**
   * Handles when vnav autopilot requests alt slot 2 in the sim autopilot.
   * @param {boolean} force set to true to force the slot even if in one of the protected ALT states.
   */
  handleVnavRequestSlot2(force = false) {

    switch(this.currentVerticalActiveState) {
      case VerticalNavModeState.ALTCAP:
      case VerticalNavModeState.ALTVCAP:
      case VerticalNavModeState.ALTSCAP:
      case VerticalNavModeState.ALTV:
      case VerticalNavModeState.ALTS:
      case VerticalNavModeState.ALT:
        this.vnavRequestedSlot = 2;
        break;
      default:
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        this.vnavRequestedSlot = 2;
        break;
    }
    if (force) {
      SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
    }
  }

  /**
   * Handles when vnav autopilot requests alt slot 3 in the sim autopilot.
   */
  handleVnavRequestSlot3() {
    SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 3);
    this.vnavRequestedSlot = 3;
  }
}

class LateralNavModeState { }
LateralNavModeState.NONE = 'NONE';
LateralNavModeState.ROLL = 'ROLL';
LateralNavModeState.LNAV = 'LNV1';
LateralNavModeState.NAV = 'NAV';
LateralNavModeState.HDG = 'HDG';
LateralNavModeState.APPR = 'APPR';
LateralNavModeState.TO = 'TO';
LateralNavModeState.GA = 'GA';

class VerticalNavModeState { }
VerticalNavModeState.NONE = 'NONE';
VerticalNavModeState.PTCH = 'PTCH';
VerticalNavModeState.FLC = 'FLC';
VerticalNavModeState.VS = 'VS';
VerticalNavModeState.GS = 'GS';
VerticalNavModeState.GP = 'GP';
VerticalNavModeState.ALT = 'ALT';
VerticalNavModeState.ALTCAP = 'ALT CAP';
VerticalNavModeState.ALTS = 'ALTS';
VerticalNavModeState.ALTSCAP = 'ALTS CAP';
VerticalNavModeState.ALTV = 'ALTV';
VerticalNavModeState.ALTVCAP = 'ALTV CAP';
VerticalNavModeState.PATH = 'PATH';
VerticalNavModeState.NOPATH = 'NOPATH';
VerticalNavModeState.TO = 'TO';
VerticalNavModeState.GA = 'GA';

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
NavModeEvent.SELECTED_ALT1_CHANGED = 'selected_alt1_changed';
NavModeEvent.SELECTED_ALT2_CHANGED = 'selected_alt2_changed';
NavModeEvent.APPROACH_CHANGED = 'approach_changed';
NavModeEvent.VNAV_REQUEST_SLOT_1 = 'vnav_request_slot_1';
NavModeEvent.VNAV_REQUEST_SLOT_2 = 'vnav_request_slot_2';
NavModeEvent.HDG_LOCK_CHANGED = 'hdg_lock_changed';
NavModeEvent.TOGA_CHANGED = 'toga_changed';
NavModeEvent.GROUNDED = 'grounded';
NavModeEvent.PATH_NONE = 'path_none';
NavModeEvent.PATH_ARM = 'path_arm';
NavModeEvent.PATH_ACTIVE = 'path_active';
NavModeEvent.GP_NONE = 'gp_none';
NavModeEvent.GP_ARM = 'gp_arm';
NavModeEvent.GP_ACTIVE = 'gp_active';
NavModeEvent.GS_NONE = 'gs_none';
NavModeEvent.GS_ARM = 'gs_arm';
NavModeEvent.GS_ACTIVE = 'gs_active';
NavModeEvent.AP_CHANGED = 'ap_changed';
NavModeEvent.LOC_ACTIVE = 'loc_active';

class WT_ApproachType { }
WT_ApproachType.NONE = 'none';
WT_ApproachType.ILS = 'ils';
WT_ApproachType.RNAV = 'rnav';
WT_ApproachType.VISUAL = 'visual';

class AltitudeState { }
AltitudeState.SELECTED = 'SELECTED';
AltitudeState.MANAGED = 'MANAGED';
AltitudeState.PRESSURE = 'PRESSURE';
AltitudeState.NONE = 'NONE';

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