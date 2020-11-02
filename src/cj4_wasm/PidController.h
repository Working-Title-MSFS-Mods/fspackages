#pragma once

/// <summary>
/// A class for controlling values via a PID.
/// </summary>
class PidController
{
public:
    /// <summary>
    /// Gets the output of the PID for a given error and timespan.
    /// </summary>
    /// <param name="error">The error vs the target value.</param>
    /// <param name="deltaTime">The delta time vs the previous observation.</param>
    /// <returns>The PID output.</returns>
    double GetOutput(double error, double deltaTime);

    /// <summary>
    /// Creates an instance of a PidController.
    /// </summary>
    /// <param name="gainProportion">The gain of the proportional term.</param>
    /// <param name="gainIntegral">The gain of the integral term.</param>
    /// <param name="gainDerivative">The gain of the derivative term.</param>
    /// <param name="min">The maximum output.</param>
    /// <param name="max">The minimum output.</param>
    PidController(double gainProportion, double gainIntegral, double gainDerivative, double min, double max);
};
