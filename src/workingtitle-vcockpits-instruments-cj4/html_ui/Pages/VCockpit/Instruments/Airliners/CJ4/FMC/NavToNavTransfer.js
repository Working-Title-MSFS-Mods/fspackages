/**
 * A class for handling nav-to-nav transfers.
 */
class NavToNavTransfer {

  /**
   * Creates an instance of NavToNavTransfer.
   * @param {FlightPlanManager} fpm The instance of the FlightPlanManager.
   * @param {RadioNav} radioNav The instance of RadioNav.
   * @param {CJ4NavModeSelector} navModeSelector The instance of the nav mode selector.
   */
  constructor(fpm, radioNav, navModeSelector) {

    /** The instance of the FlightPlanManager. */
    this.fpm = fpm;

    /** The instance of RadioNav. */
    this.radioNav = radioNav;

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
   * @param {number} deltaTime The time since the previous update.
   */
  update(deltaTime) {
    const approachType = this.navModeSelector.approachMode;
    const navSensitivity = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number');

    if (approachType === WT_ApproachType.ILS) {
      
      if (this.previousNavSensitivity === 0 && navSensitivity >= 1) {
        this.transferState = NavToNavTransfer.TUNE_PENDING;
        
        MessageService.getInstance().post(FMS_MESSAGE_ID.LOC_WILL_BE_TUNED, () => this.transferState !== NavToNavTransfer.TUNE_PENDING);
        this.termTimestamp = Date.now();
      }
      else if (this.previousNavSensitivity >= 1 && navSensitivity === 0) {
        this.transferState = NavToNavTransfer.NONE;
        this.termTimestamp = undefined;
      }

      if (this.transferState === NavToNavTransfer.TUNE_PENDING) {
        const timeStamp = Date.now();

        if (timeStamp - this.termTimestamp > 30000) {

          const frequency = this.fpm.getApproachNavFrequency();
          this.radioNav.setVORStandbyFrequency(1, frequency).then(() => {
            this.radioNav.swapVORFrequencies(1);
          });

          this.transferState = NavToNavTransfer.ARMED;
        }
      }

      if (this.transferState === NavToNavTransfer.ARMED && this.navModeSelector.currentLateralActiveState === LateralNavModeState.APPR) {
        this.transferState = NavToNavTransfer.TRANSFER;
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
}

NavToNavTransfer.NONE = 0;
NavToNavTransfer.TUNE_PENDING = 1;
NavToNavTransfer.ARMED = 2;
NavToNavTransfer.TRANSFER = 3;
