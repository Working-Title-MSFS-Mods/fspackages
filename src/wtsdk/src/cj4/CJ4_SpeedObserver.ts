import { FlightPlanManager } from "../flightplanning/FlightPlanManager";
import { MessageService } from "../messages/MessageService";
import { FMS_MESSAGE_ID } from "./CJ4_MessageDefinitions";

export class CJ4_SpeedObserver {
  private _fpChecksum: number = 0;
  private _currentSpeedRestriction = 0;
  private _speedProfile: number[];
  private _vnavDescentIas = 290;

  /**
   *
   */
  constructor(private _fpm: FlightPlanManager) {

  }

  update(): void {
    if (this._fpChecksum !== this._fpm.getFlightPlan(0).checksum) {
      this.updateSpeedProfile();
      this._vnavDescentIas = WTDataStore.get('CJ4_vnavDescentIas', 290);
      this._fpChecksum = this._fpm.getFlightPlan(0).checksum;
    }

    this.observeSpeed();
  }

  /** Observes the current speed restriction */
  observeSpeed(): void {
    // check if vnav is on
    const isVnavOn = SimVar.GetSimVarValue("L:WT_CJ4_VNAV_ON", "number") == 1;

    if (isVnavOn) {
      this._currentSpeedRestriction = this._speedProfile[this._fpm.getActiveWaypointIndex()];
      
      // TODO if VPATH is active check for descent target speed
      
      if (Simplane.getIndicatedSpeed() > (this._currentSpeedRestriction + 20)) {
        MessageService.getInstance().post(FMS_MESSAGE_ID.CHK_SPD, () => {
          return (Simplane.getIndicatedSpeed() < (this._currentSpeedRestriction + 20)) || !isVnavOn;
        });
      }
    }
  }

  /** Looks back in the flight plan to build an array of speed restrictions for each leg */
  updateSpeedProfile(): void {
    // ...
    this._speedProfile = new Array(this._fpm.getFlightPlan(0).waypoints.length).fill(999);
    const wpts = this._fpm.getFlightPlan(0).waypoints;
    let activeRestriction = 999;

    for (let i = 0; i < wpts.length; i++) {
      const wpt = wpts[i];
      let constraint = wpt.speedConstraint;
      if (constraint === -1) {
        constraint = 999;
      }
      if (constraint !== 999 && constraint !== activeRestriction) {
        activeRestriction = constraint;
      }
      this._speedProfile[i] = activeRestriction;
    }
  }

}