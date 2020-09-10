/**
 * A class that implements the DA40 ECU controller.
 */
class DA40ECU {

  /**
   * Constructs an instance of the DA40ECU.
   */
  constructor() {
    console.log("DA40 ECU constructed.");
    this.hookECUInstance();
  }

  
  /**
   * Since MSFS doesn't allow more than one instrument per page, hook into
   * the existing GPS for updates.
   */
  hookECUInstance() {

    let hookHandler = () => {
      if (document.getElementsByTagName("as1000-mfd-element").length === 0) {
        console.log("AS1000 not loaded. Retrying...");
        setTimeout(hookHandler, 1000);
      }
      else {
        console.log("Hooking into instrument...");

        let existingInstrument = document.getElementsByTagName("as1000-mfd-element")[0];
        let existingUpdate = existingInstrument.Update.bind(existingInstrument);

        existingInstrument.Update = () => {
          existingUpdate();
          this.Update();
        };
      }
    };

    hookHandler();
  }

  /**
   * Updates the state of the ECU at each simulation tick.
   */
  Update() {
    
    if (!this._previousRpmError) {
      this._previousRpmError = 0;
    }

    if (!this.previousRpmIntegral) {
      this._previousRpmIntegral = 0;
    }

    let time = performance.now();
    if (!this._previousTime) {
      this._previousTime = time;
    }
    else {
      let iterationTime = time - this._previousTime;

      let currentRpm = SimVar.GetSimVarValue("PROP RPM:1", "rpm");
      let currentLeverPos = SimVar.GetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "Percent");

      let currentTorque = SimVar.GetSimVarValue("ENG TORQUE:1", "Foot pounds");
      let currentEngineRpm = SimVar.GetSimVarValue("GENERAL ENG RPM:1", "rpm");

      let maxHp = 180.7;
      let currentHp = currentTorque * currentEngineRpm / 5252;

      let currentLoad = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
      let targetRpm = this.getTargetRpm(currentLeverPos);

      let error = currentRpm - targetRpm;
      let integral = this._previousRpmIntegral + error * iterationTime;
      let derivative = (error - this._previousRpmError) / iterationTime;

      let output = (.005 * error) + (0 * integral) + (0 * derivative);

      this._previousRpmError = error;
      this._previousRpmIntegral = integral;

      let currentProp = SimVar.GetSimVarValue("GENERAL ENG PROPELLER LEVER POSITION:1", "Percent");
      let newProp = Math.min(100, Math.max(0, currentProp - output));

      SimVar.SetSimVarValue("GENERAL ENG PROPELLER LEVER POSITION:1", "Percent", newProp);
      if (currentLeverPos >= 92) {
        //SimVar.SetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "Percent", 100);
      }

      let inputStatus = GetInputStatus("PLANE", "KEY_AXIS_THROTTLE_SET");

      this._previousTime = time;

      console.log(`RPM: ${Math.round(currentRpm)}|${this.getTargetRpm(currentLeverPos)}|${this.getTargetRpm(currentLoad)} | HP: ${currentHp.toFixed(2)}`)
      console.log(`Current: ${currentProp.toFixed(2)} | New: ${newProp.toFixed(2)} | Thr: ${currentLeverPos.toFixed(4)}`);
    }
  }

  /**
   * Gets the target RPM for a given power setting.
   * @param {number} power The power setting, expressed as a percentage in 100s. 
   */
  getTargetRpm(power) {
    if (power >= 90.5853) {
      return 2100 + (((power - 90.5853) / 9.4147) * 200);
    }
    if (power >= 20) {
      return 1800 + (((power - 20) / 72) * 300);
    }
    else {
      return 2150 - (power / 20) * 250;
    }
  }
}

var da40ecu = new DA40ECU();
