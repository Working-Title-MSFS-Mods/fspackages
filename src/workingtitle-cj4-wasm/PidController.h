#pragma once

#ifndef PIDC
#define PIDC

/// <summary>
/// A class for controlling values via a PID.
/// </summary>
class PidController
{
private:
    /// <summary>
    /// The gain of the proportional term.
    /// </summary>
    double gainProportion;

    /// <summary>
    /// The gain of the integral term.
    /// </summary>
    double gainIntegral;

    /// <summary>
    /// The gain of the derivative term.
    /// </summary>
    double gainDerivative;

    /// <summary>
    /// The minimum output allowed.
    /// </summary>
    double minOutput;

    /// <summary>
    /// The maximum output allowed.
    /// </summary>
    double maxOutput;

    /// <summary>
    /// The previous error amount.
    /// </summary>
    double prevError;

    /// <summary>
    /// The previous PID output.
    /// </summary>
    double prevOutput;

    /// <summary>
    /// The current integral term.
    /// </summary>
    double integral;

    /// <summary>
    /// Clamps a value to the PID min and max outputs.
    /// </summary>
    /// <param name="value">The value to clamp.</param>
    /// <returns>The clamped value.</returns>
    double Clamp(double value, double max, double min)
    {
        if (value > max)
        {
            return max;
        }

        if (value < min)
        {
            return min;
        }

        return value;
    }

public:
    /// <summary>
    /// Creates an instance of a PidController.
    /// </summary>
    /// <param name="gainProportion">The gain of the proportional term.</param>
    /// <param name="gainIntegral">The gain of the integral term.</param>
    /// <param name="gainDerivative">The gain of the derivative term.</param>
    /// <param name="minOutput">The maximum output.</param>
    /// <param name="maxOutput">The minimum output.</param>
    PidController(double gainProportion, double gainIntegral, double gainDerivative, double minOutput, double maxOutput)
        : gainProportion(gainProportion), gainIntegral(gainIntegral), gainDerivative(gainDerivative),
        minOutput(minOutput), maxOutput(maxOutput), prevError(0), prevOutput(0), integral(0) { }

    template <typename T> int sgn(T val) {
        return (T(0) < val) - (val < T(0));
    }

    /// <summary>
    /// Gets the output of the PID for a given error and timespan.
    /// </summary>
    /// <param name="error">The error vs the target value.</param>
    /// <param name="deltaTime">The delta time vs the previous observation.</param>
    /// <returns>The PID output.</returns>
    double GetOutput(double error, double deltaTime)
    {
        auto proportion = gainProportion * error;
        //if ((gainIntegral * integral) >= maxOutput) {
            //integral -= (error * deltaTime) + ((deltaTime * (error - prevError)) / 2);
        //}
        //else if ((gainIntegral * integral) <= minOutput) {
        integral += (error * deltaTime) + ((deltaTime * (error - prevError)) / 2);
        //}


        if (sgn(error) != sgn(prevError)) {
            integral = 0;
        }

        auto derivative = gainDerivative * ((error - prevError) / deltaTime);
        derivative = this->Clamp(derivative, 20.0, -20.0);

        auto output = this->Clamp(proportion + (gainIntegral * integral) + (derivative), this->maxOutput, this->minOutput);

        //printf("P: %.2f I: %.2f D %.2f \r\n", proportion, (gainIntegral * integral), (derivative));

        prevError = error;
        prevOutput = output;

        return output;
    }
};

#endif