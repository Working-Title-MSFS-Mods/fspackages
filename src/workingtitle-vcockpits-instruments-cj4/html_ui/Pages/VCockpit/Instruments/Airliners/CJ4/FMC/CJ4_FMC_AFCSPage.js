/** A FMC page for controlling and observing the AFCS. */
class AFCSPage {

  /**
   * Creates an instance of a AFCSPage.
   * @param {CJ4_FMC} fmc The FMC instance to use with this AFCS page.
   */
  constructor(fmc) {
    this.fmc = fmc;

    this.rollRateController = new RollRateController();
    this.bankAngleController = new BankAngleController(this.rollRateController);

    this.bankAngleIsActive = false;
    this.targetBankAngle = 0;

    this.pitchRateController = new PitchRateController();
    this.pitchAngleController = new PitchAngleController(this.pitchRateController);
    this.verticalSpeedController = new VerticalSpeedController(this.pitchAngleController);

    this.elevatorTrimServo = new ElevatorTrimServo();

    this.pitchAngleIsActive = false;
    this.targetPitchAngle = 0;

    this.vsIsActive = false;
    this.targetVs = 0;
  }

  updateControllers(deltaTime) {
    if (this.bankAngleIsActive) {
      this.bankAngleController.update(deltaTime);
    }

    if (this.pitchAngleIsActive) {
      this.pitchAngleController.update(deltaTime);
      this.elevatorTrimServo.update(deltaTime);
    }

    if (this.vsIsActive) {
      this.verticalSpeedController.update(deltaTime);
      this.elevatorTrimServo.update(deltaTime);
    }
  }

  toggleBankAngleActive() {
    this.bankAngleController.reset();
    this.bankAngleController.setTargetBankAngle(this.targetBankAngle);

    this.bankAngleIsActive = !this.bankAngleIsActive;
  }

  setTargetBankAngle(bankAngle) {
    this.bankAngleController.setTargetBankAngle(bankAngle);
    this.targetBankAngle = bankAngle;
  }

  togglePitchAngleActive() {
    this.pitchAngleController.reset();
    this.pitchAngleController.setTargetPitchAngle(this.targetPitchAngle);

    this.pitchAngleIsActive = !this.pitchAngleIsActive;
  }

  setTargetPitchAngle(pitchAngle) {
    this.pitchAngleController.setTargetPitchAngle(pitchAngle);
    this.targetPitchAngle = pitchAngle;
  }

  toggleVerticalSpeedActive() {
    this.verticalSpeedController.reset();
    this.verticalSpeedController.setTargetVerticalSpeed(this.targetVs);

    this.vsIsActive = !this.vsIsActive;
  }

  setTargetVerticalSpeed(verticalSpeed) {
    this.verticalSpeedController.setTargetVerticalSpeed(verticalSpeed);
    this.targetVs = verticalSpeed;
  }

  render() {
    this.fmc.clearDisplay();

    const bankAngleSwitch = this.fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.bankAngleIsActive ? 1 : 0, "green");
    const pitchAngleSwitch = this.fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.pitchAngleIsActive ? 1 : 0, "green");
    const verticalSpeedSwitch = this.fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.vsIsActive ? 1 : 0, "green");

    this.fmc._templateRenderer.setTemplateRaw([
      ["", "1/1[blue]", "AFCS[blue]"],
      [" BANK MODE[blue]", "PITCH MODE [blue]"],
      [bankAngleSwitch, pitchAngleSwitch],
      [" BANK ANGLE[blue]", "PITCH ANGLE [blue]"],
      [this.targetBankAngle.toFixed(2), this.targetPitchAngle.toFixed(2)],
      [" HDG MODE[blue]", "VS MODE [blue]"],
      ['', verticalSpeedSwitch],
      [" HEADING[blue]", "V SPEED [blue]"],
      ['0', this.targetVs.toFixed(0)]
    ]);

    this.bindInputs();
  }

  bindInputs() {
    this.fmc.onLeftInput[0] = () => {
      this.toggleBankAngleActive();
      this.render();
    };

    this.fmc.onLeftInput[1] = () => {
      const degreesBank = parseFloat(this.fmc.inOut);
      if (!isNaN(degreesBank)) {
        this.setTargetBankAngle(degreesBank);
        this.fmc.inOut = '';
      }
      else {
        this.fmc.showErrorMessage('INVALID BANK ANGLE');
      }

      this.render();
    };

    this.fmc.onRightInput[0] = () => {
      this.togglePitchAngleActive();
      this.render();
    };

    this.fmc.onRightInput[1] = () => {
      const degreesPitch = parseFloat(this.fmc.inOut);
      if (!isNaN(degreesPitch)) {
        this.setTargetPitchAngle(degreesPitch);
        this.fmc.inOut = '';
      }
      else {
        this.fmc.showErrorMessage('INVALID PITCH ANGLE');
      }

      this.render();
    };

    this.fmc.onRightInput[2] = () => {
      this.toggleVerticalSpeedActive();
      this.render();
    };

    this.fmc.onRightInput[3] = () => {
      const verticalSpeed = parseFloat(this.fmc.inOut);
      if (!isNaN(verticalSpeed)) {
        this.setTargetVerticalSpeed(verticalSpeed);
        this.fmc.inOut = '';
      }
      else {
        this.fmc.showErrorMessage('INVALID VERTICAL SPEED');
      }

      this.render();
    };
  }
}