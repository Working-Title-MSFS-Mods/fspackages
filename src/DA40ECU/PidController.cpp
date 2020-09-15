
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
		double Clamp(double value)
		{
			if (value > maxOutput)
			{
				return maxOutput;
			}

			if (value < minOutput)
			{
				return minOutput;
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

		/// <summary>
		/// Gets the output of the PID for a given error and timespan.
		/// </summary>
		/// <param name="error">The error vs the target value.</param>
		/// <param name="deltaTime">The delta time vs the previous observation.</param>
		/// <returns>The PID output.</returns>
		double GetOutput(double error, double deltaTime)
		{
			auto proportion = gainProportion * error;
			integral += (error * deltaTime) + ((deltaTime * (error - prevError)) / 2);
			auto derivative = (error - prevError) / deltaTime;

			auto output = this->Clamp(proportion + (gainIntegral * integral) + (gainDerivative * derivative));

			prevError = error;
			prevOutput = output;

			return output;
		}
};


