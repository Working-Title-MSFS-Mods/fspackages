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
    int throttleAxis = -16384;

    int frameCount = 0;

    enum ThrottleMode { UNDEF = 0, CRU = 1, CLB = 2, TO = 3 };

    ThrottleMode throttleMode = UNDEF;

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
        double targetThrust = (3400 * throttleExp); // flat target thrust

        if (!enabled) {
            return throttleLeverPerc * 100;
        }

        double grossSimThrust = wt_utils::convertToGrossThrust(this->simVars->getThrust(index), this->simVars->getMach());
        double maxDensityThrust = wt_utils::getMaxDensityThrust(this->simVars->getAmbientDensity());
        double thrustF = 0.95;


        // TODO: extract the modes later
        switch (this->throttleMode)
        {
        case TO:
            targetThrust = 3400;
            return 100;
            break;
        case CLB:
            targetThrust = 2000;
            if ((maxDensityThrust * thrustF) < targetThrust) {
                targetThrust = (maxDensityThrust * thrustF);
            }
            break;
        case UNDEF:
        case CRU: {
            double cruThrPerc = (this->throttleAxis + 16384) / 25444.0; // -16384 -> 9060
            double cruThrExp = pow(cruThrPerc, 3.5);
            targetThrust = (3400 * cruThrPerc); // flat target thrust
            if ((maxDensityThrust < targetThrust)) {
                targetThrust = (maxDensityThrust * cruThrPerc); // TODO 100% = 0 -> CRU
            }
            targetThrust *= thrustF;
            //targetThrottle = this->throttleAxis;
            break;
        }
        default:
            break;
        }


        if (this->frameCount % 10000000 == 0) {
            printf("TA %d TLP: %.4f TTHR: %.0f GTHR: %.0f MDENS: %.0f @ %.0f \r\n",this->throttleAxis, throttleLeverPerc, targetThrust, grossSimThrust, maxDensityThrust, this->simVars->getPlaneAltitude());
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

        return max(0, min(100, this->simVars->getThrottleLeverPosition(index) + pidOut));
    }

    void updateVisibleThrottle() {
        int targetThrottle = 0;

        switch (this->throttleMode)
        {
        case TO:
            targetThrottle = 16384;
            break;
        case CLB:
            targetThrottle = 9060;
            break;
        case UNDEF:
        case CRU:
            targetThrottle = this->throttleAxis;
            break;
        default:
            break;
        }

        double throttleLeverPerc = (targetThrottle + 16384) / 32768.0;
        this->simVars->setThrottlePos(throttleLeverPerc * 100);
    }

    void updateThrottleMode() {
        bool simOnGround = this->simVars->getSimOnGround() > 0;

        if (this->throttleAxis > 15000) {
            this->throttleMode = TO;
        }
        else if (this->throttleAxis > 9060 && !simOnGround) {
            this->throttleMode = CLB;
        }
        else if (this->throttleAxis > -15250 && !simOnGround) {
            this->throttleMode = CRU;
        }
        else {
            this->throttleMode = UNDEF;
        }

        this->simVars->setThrottleMode(this->throttleMode);

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
        this->frameCount += deltaTime;
        if (this->frameCount > 1147483647) {
            this->frameCount = 0;
        }

        this->throttleAxis = throttleAxis;
        this->updateThrottleMode();
        this->updateThrust(deltaTime);
        this->updateVisibleThrottle();
    }
};

FdController FdCtrlInstance;

#endif // !FDCTRL