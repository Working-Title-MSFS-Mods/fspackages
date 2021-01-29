/**
 * A class for handling nav-to-nav transfers.
 */
class NavToNavTransfer {

  /**
   * Creates an instance of NavToNavTransfer.
   * @param {FlightPlanManager} fpm The instance of the FlightPlanManager.
   * @param {CJ4_NavRadioSystem} navRadioSystem The instance of RadioNav.
   * @param {CJ4NavModeSelector} navModeSelector The instance of the nav mode selector.
   */
  constructor(fpm, navRadioSystem, navModeSelector) {

    /** The instance of the FlightPlanManager. */
    this.fpm = fpm;

    /** The instance of RadioNav. */
    this.navRadioSystem = navRadioSystem;

    /** The instance of the nav mode selector. */
    this.navModeSelector = navModeSelector;

    /** The amount of time since entering term or greater. */
    this.termTimestamp = undefined;

    /** The previously observed nav sensitivity. */
    this.previousNavSensitivity = NavSensitivity.NORMAL;

    /** The current nav-to-nav transfer state. */
    this.transferState = NavToNavTransfer.NONE;
  }

  /**
   * Updates the NavToNavTransfer.
   */
  update() {
    const approachType = this.navModeSelector.approachMode;
    const navSensitivity = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number');

    if (approachType === WT_ApproachType.ILS) {

      if (this.previousNavSensitivity === 0 && navSensitivity >= 1) {
        this.tryTuneLocalizer();
      }
      else if (this.previousNavSensitivity >= 1 && navSensitivity === 0) {
        this.transferState = NavToNavTransfer.NONE;
        this.termTimestamp = undefined;
      }

      switch (this.transferState) {
        case NavToNavTransfer.TUNE_PENDING:
          this.handleTunePending();
          break;
        case NavToNavTransfer.TUNE_FAILED:
          this.handleTuneFailed();
          break;
        case NavToNavTransfer.ARMED:
          this.handleArmed();
          break;
      }

      this.previousNavSensitivity = navSensitivity;
    }
    else {
      this.transferState = NavToNavTransfer.NONE;
      this.previousNavSensitivity = NavSensitivity.NORMAL;
      this.termTimestamp = undefined;
    }

    SimVar.SetSimVarValue('L:WT_NAV_TO_NAV_TRANSFER_STATE', 'number', this.transferState);
  }

  handleTunePending() {
    const timeStamp = Date.now();
    if (timeStamp - this.termTimestamp > 30000 || this.navRadioSystem.radioStates[1].mode === NavRadioMode.Auto) {
      const frequency = this.fpm.getApproachNavFrequency();

      if (isFinite(frequency) && frequency >= 108 && frequency <= 117.95) {
        this.navRadioSystem.radioStates[1].setManualFrequency(frequency);
        this.transferState = NavToNavTransfer.ARMED;
      }
      else {
        this.transferState = NavToNavTransfer.TUNE_FAILED;
      }
    }
  }

  handleTuneFailed() {
    const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:1', 'number');
    const frequency = this.fpm.getApproachNavFrequency();

    if (isNaN(frequency)) {
      if (!hasLoc) {
        MessageService.getInstance().post(FMS_MESSAGE_ID.CHECK_LOC_TUNING, () => this.transferState === NavToNavTransfer.ARMED);
      }
      else {
        this.transferState = NavToNavTransfer.ARMED;
      }
    }
    else {
      if (this.navRadioSystem.radioStates[1].frequency !== frequency) {
        MessageService.getInstance().post(FMS_MESSAGE_ID.CHECK_LOC_TUNING, () => this.transferState === NavToNavTransfer.ARMED);
      }
      else {
        this.transferState = NavToNavTransfer.ARMED;
      }
    }
  }

  handleArmed() {
    const frequency = this.fpm.getApproachNavFrequency();
    if (isNaN(frequency)) {
      const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:1', 'number') !== 0;
      if (!hasLoc) {
        this.transferState = NavToNavTransfer.TUNE_FAILED;
      }
      else if (hasLoc && this.navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
        this.transferState = NavToNavTransfer.TRANSFERRED;
      }
    }
    else if (isFinite(frequency) && frequency >= 108 && frequency <= 117.95) {
      this.tryTransferActive(frequency);
    }
  }

  /**
   * Attempts to set the nav to nav transfer to transferred.
   * @param {number} frequency The frequency of the approach.
   */
  tryTransferActive(frequency) {
    if (this.navRadioSystem.radioStates[1].frequency !== frequency) {
      this.transferState = NavToNavTransfer.TUNE_FAILED;
    }
    else if (this.navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
      this.transferState = NavToNavTransfer.TRANSFERRED;
    }
  }

  /**
   * Attempts to auto-tune the localizer.
   */
  tryTuneLocalizer() {
    if (this.navRadioSystem.radioStates[1].mode === NavRadioMode.Auto) {
      this.transferState = NavToNavTransfer.ARMED;
    }
    else {
      this.transferState = NavToNavTransfer.TUNE_PENDING;

      MessageService.getInstance().post(FMS_MESSAGE_ID.LOC_WILL_BE_TUNED, () => this.transferState !== NavToNavTransfer.TUNE_PENDING);
      this.termTimestamp = Date.now();
    }
  }
}

NavToNavTransfer.NONE = 0;
NavToNavTransfer.TUNE_PENDING = 1;
NavToNavTransfer.TUNE_FAILED = 2;
NavToNavTransfer.ARMED = 3;
NavToNavTransfer.TRANSFERRED = 4;
