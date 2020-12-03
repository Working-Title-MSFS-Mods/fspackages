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
    PidController* throttleController[2];

    /// <summary>
    /// An instance of the throttle PID controller.
    /// </summary>
    PidController* throttleRightController;

    /// <summary>
    /// The current throttle control axis, from -16384 to 16384.
    /// </summary>  
    int throttleAxis[2] = { -16384, -16384 };


    enum ThrottleMode { UNDEF = 0, CRU = 1, CLB = 2, TO = 3 };

    ThrottleMode throttleMode[2] = { UNDEF, UNDEF };

    bool enabled = true;

    /// <summary>
    /// Calculates and updates thrust according to target and PIDs.
    /// </summary>
    /// <param name="deltaTime"></param>
    void updateThrust(double deltaTime) {
        //static thrust* (1 + (M ^ 2) / 5) ^ 3.5
        //double gThrust = wt_utils::convertToGrossThrust(this->simVars->getThrust(1), this->simVars->getMach());
        //printf("TTHR: %.0f THR: %.0f EL: %f PL: %f \r\n", targetThrust, this->simVars->getThrust(1), errorLeft, pidOutLeft);
        //printf("TTHR: %.0f GTHR: %.0f @ %.0f \r\n", targetThrust, gThrust, this->simVars->getPlaneAltitude());
        //if (this->frameCount % 1000000 == 0) {
        //    printf("AXIS: %d\r\n ", this->throttleAxis);
        //}

        EngineControlData controls;
        controls.throttleLeft = this->getDesiredThrottle(0, deltaTime);
        controls.throttleRight = this->getDesiredThrottle(1, deltaTime);
        //printf("TL: %.0f TR: %.0f \r\n", controls.throttleLeft, controls.throttleRight);
        SimConnect_SetDataOnSimObject(hSimConnect, DataTypes::EngineControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(EngineControlData), &controls);
    }

    /// <summary>
    /// Gets the throttle value to achieve desired thrust
    /// </summary>
    /// <param name="index">The engine index</param>
    /// <returns>Desired throttle value</returns>
    double getDesiredThrottle(int idx, double deltaTime) {
        double throttleLeverPerc = (this->throttleAxis[idx] + 16384) / 32768.0;
        double throttleExp = pow(throttleLeverPerc, 3.5);
        double targetThrust = (3600 * throttleExp); // flat target thrust

        if (!enabled) {
            return throttleLeverPerc * 100;
        }

        double grossSimThrust = wt_utils::convertToGrossThrust(this->simVars->getThrust(idx + 1), this->simVars->getMach());
        double maxDensityThrust = wt_utils::getMaxDensityThrust(this->simVars->getAmbientDensity());
        double thrustF = 0.92;


        // TODO: extract the modes later
        switch (this->throttleMode[idx])
        {
        case TO: {
            targetThrust = 3600;
            return 100;
            break;
        }
        case CLB: {
            double lowAltThrust = max(0, (8000 - this->simVars->getPlaneAltitude()) / 25);

            targetThrust = 2050 + lowAltThrust;
            if ((maxDensityThrust * thrustF) < targetThrust) {
                targetThrust = (maxDensityThrust * thrustF);
            }
            break;
        }
        case UNDEF: {
        case CRU:
            double cruThrPerc = (this->throttleAxis[idx] + 16384) / 25444.0; // -16384 -> 9060
            double cruThrExp = cruThrPerc;

            throttleExp = cruThrExp * thrustF;
            break;
        }
        default:
            break;
        }

        //printf("TA %d TLP: %.4f TTHR: %.0f GTHR: %.0f MDENS: %.0f @ %.0f \r\n", this->throttleAxis[idx], throttleLeverPerc, targetThrust, grossSimThrust, maxDensityThrust, this->simVars->getPlaneAltitude());

        if (this->throttleMode[idx] == CLB)
        {
            double error = targetThrust - grossSimThrust;
            double pidOut = 0;
            pidOut = this->throttleController[idx]->GetOutput(error, deltaTime);
            return max(0, min(100, this->simVars->getThrottleLeverPosition(idx + 1) + pidOut));
        }
        else {
            // target throttle for cru
            return max(0, min(100, throttleExp * 100));
        }
    }

    void updateVisibleThrottle(int idx) {
        int targetThrottle = 0;

        switch (this->throttleMode[idx])
        {
        case TO:
            targetThrottle = 16384;
            break;
        case CLB:
            targetThrottle = 9060;
            break;
        case UNDEF:
        case CRU:
            targetThrottle = this->throttleAxis[idx];
            break;
        default:
            break;
        }

        double throttleLeverPerc = (targetThrottle + 16384) / 32768.0;
        if (idx == 0) {
            this->simVars->setThrottle1Pos(throttleLeverPerc * 100);
        }
        else {
            this->simVars->setThrottle2Pos(throttleLeverPerc * 100);
        }
    }

    void updateThrottleMode(int idx) {
        if (this->throttleAxis[idx] > 15000) {
            this->throttleMode[idx] = TO;
        }
        else if (this->throttleAxis[idx] > 9060) {
            this->throttleMode[idx] = CLB;
        }
        else if (this->throttleAxis[idx] > -15250) {
            this->throttleMode[idx] = CRU;
        }
        else {
            this->throttleMode[idx] = UNDEF;
        }

        if (idx == 0) {
            this->simVars->setThrottle1Mode(this->throttleMode[0]);
        }
        else {
            this->simVars->setThrottle2Mode(this->throttleMode[1]);
        }
    }

public:
    void init()
    {
        printf("FdController init");

        this->simVars = new SimVars();

        float p = 0.0012;
        float i = 0.0001;
        float d = 0.0018;
        this->throttleController[0] = new PidController(p, i, d, -2, 2);
        this->throttleController[1] = new PidController(p, i, d, -2, 2);
    }

    void update(int throttleAxis[], double deltaTime)
    {
        this->throttleAxis[0] = throttleAxis[0];
        this->throttleAxis[1] = throttleAxis[1];
        this->updateThrottleMode(0);
        this->updateThrottleMode(1);
        this->updateThrust(deltaTime);
        this->updateVisibleThrottle(0);
        this->updateVisibleThrottle(1);
    }
};

FdController FdCtrlInstance;

#endif // !FDCTRL