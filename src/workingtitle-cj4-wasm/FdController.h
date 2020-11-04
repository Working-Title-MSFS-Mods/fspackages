#pragma once

#ifndef FDCTRL
#define FDCTRL

#include "common.h"
#include "PidController.h"

class FdController
{
private:
    SimVars* simVars;

    /// <summary>
    /// An instance of the throttle PID controller.
    /// </summary>
    PidController* throttleLeftController;

    /// <summary>
    /// An instance of the throttle PID controller.
    /// </summary>
    PidController* throttleRightController;

    /// <summary>
    /// The current throttle control axis, from -16384 to 16384.
    /// </summary>  
    int throttleAxis = 0;

    /// <summary>
    /// Calculates and updates thrust according to target and PIDs.
    /// </summary>
    /// <param name="deltaTime"></param>
    void updateThrust(double deltaTime) {
        //static thrust* (1 + (M ^ 2) / 5) ^ 3.5
        //double gThrust = wt_utils::convertToGrossThrust(this->simVars->getThrust(1), this->simVars->getMach());
        //printf("TTHR: %.0f THR: %.0f EL: %f PL: %f \r\n", targetThrust, this->simVars->getThrust(1), errorLeft, pidOutLeft);
        //printf("TTHR: %.0f GTHR: %.0f @ %.0f \r\n", targetThrust, gThrust, this->simVars->getPlaneAltitude());

        EngineControlData controls;
        controls.throttleLeft = this->getDesiredThrottle(1, deltaTime);
        controls.throttleRight = this->getDesiredThrottle(2, deltaTime);
        //printf("TL: %.0f TR: %.0f \r\n", controls.throttleLeft, controls.throttleRight);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypes::EngineControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(EngineControlData), &controls);
    }

    /// <summary>
    /// Gets the throttle value to achieve desired thrust
    /// </summary>
    /// <param name="index">The engine index</param>
    /// <returns>Desired throttle value</returns>
    double getDesiredThrottle(int index, double deltaTime) {
        double throttleLeverPerc = (this->throttleAxis + 16384) / 32768.0;
        double throttleExp = pow(throttleLeverPerc, 3.5);
        double targetThrust = (2950 * throttleExp); // this is gross thrust (one engine)

        double grossSimThrust = wt_utils::convertToGrossThrust(this->simVars->getThrust(index), this->simVars->getMach());
        double maxDensityThrust = wt_utils::getMaxDensityThrust(this->simVars->getAmbientDensity());

        if (maxDensityThrust < 3200) {
            targetThrust = (maxDensityThrust * throttleExp);
        }

        double error = targetThrust - grossSimThrust;

        // TODO: this could be more generic i guess
        double pidOut = 0;
        if (index == 1) {
            pidOut = this->throttleLeftController->GetOutput(error, deltaTime);
        }
        else {
            pidOut = this->throttleRightController->GetOutput(error, deltaTime);
        }

        if (index == 1)
            printf("TTHR: %.0f THR: %.0f EL: %f PL: %f \r\n", targetThrust, this->simVars->getThrust(1), error, pidOut);


        //printf("TLP: %.0f DTLP %.0f\r\n", this->simVars->getThrottleLeverPosition(index), max(0, min(100, this->simVars->getThrottleLeverPosition(index) + pidOut)));

        return max(0, min(100, this->simVars->getThrottleLeverPosition(index) + pidOut));
    }

public:
    void init()
    {
        printf("FdController init");

        this->simVars = new SimVars();

        float p = 0.0012;
        float i = 0.0001;
        float d = 0.0018;
        this->throttleLeftController = new PidController(p, i, d, -2, 2);
        this->throttleRightController = new PidController(p, i, d, -2, 2);
    }

    void update(double throttleAxis, double deltaTime)
    {
        this->throttleAxis = throttleAxis;
        this->updateThrust(deltaTime);
    }
};

FdController FdCtrlInstance;

#endif // !FDCTRL