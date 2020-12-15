#pragma once

#ifndef WTUTILS
#define WTUTILS

#include "common.h"

class wt_utils
{
public:
    static double convertToGrossThrust(FLOAT64 thrustIn, FLOAT64 machIn) {
        return thrustIn * pow((1 + (pow(machIn, 2) / 5)), 3.5);
    }

    static double getMaxDensityThrust(FLOAT64 ambientDensity) {
        double density = ambientDensity * 1000;
        double densityFactor = 1351.6;
        double maxDensityThrust = (density * densityFactor) + 250;
        return maxDensityThrust;
    }
};

#endif // !WTUTILS
