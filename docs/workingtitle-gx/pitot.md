## Using the pitot heater

The real-world G3X can be paired with a regulated pitot heater.  The operation of the GAP-26 regulated heater is [described thusly](https://www.steinair.com/product/garmin-gap-26-heated-pitot-tube-with-aoa-regulated/):

> You get in your plane on a cold day when the temperature is below 7 degs C (45 degs F) and power on your avionics with the pitot heat switch turned off. A yellow “PITOT TEMP” alert message pops up on your PFD reminding you that it is cold enough that you might want to turn on your pitot heat. You turn your pitot heat on and as soon as the pitot probe temperature rises above approximately 25 degs C (77 degs F) the yellow “PITOT TEMP” annunciator goes away, and you are ready to fly. If you are flying along and experience a problem with your pitot heat and the probe gets too cold the yellow “PITOT TEMP” annunciator will pop up on your PFD as a warning that your pitot probe heat is not working.

The Working Title G3X Touch is capable of somewhat emulating this behavior.  When enabled, it will automatically turn the pitot heater on when the engine is on and the OAT is below 7C.  When it turns on a `PITOT TEMP` indicator will appear on the CAS.  After a variable period of time -- longer if it is colder -- that message will extinguish as the heater reaches full temperature.  If the OAT rises above 7C the system turns the heater back off again.

(This isn't quite the same as the real thing, but it gives us functional pitot control in cockpits that otherwise lack any.)

To enable this feature you need to add an `<AutoPitotHeat>` section to the instruments configuration for the PFD in your `panel.xml` file.  As an example, take this configuration from the excellent [Bush League Legends XCub Performance mod](https://www.bushleaguelegends.com/addons/msfs/msfs-mods) which supports it natively:

    <Instrument>
      <Name>AS3X_Touch_1</Name>
      <SyntheticVision>True</SyntheticVision>
      <AutoPitotHeat>True</AutoPitotHeat>
      <Electric>
        <Simvar name="CIRCUIT GENERAL PANEL ON" unit="Bool"/>
      </Electric>
    </Instrument>

To emulate the `PITOT TEMP` warning you should add something like this to the `<Annunciatons>` section of your `panel.xml`, again from the BLL mod:

    <Annunciation>
      <Type>Caution</Type>
      <Text>PITOT TEMP</Text>
      <Condition>
        <And>
          <Lower>
            <Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
            <Constant>7</Constant>
          </Lower>
          <GreaterEqual>
            <Simvar name="L:G3X_Pitot_Heating" unit="Boolean"/>
            <Constant>1</Constant>
          </GreaterEqual>
        </And>
      </Condition>
    </Annunciation>


## Notes

1. Even without the second addition to `panel.xml` the heater will still function, you just will not have notification
2. At the moment the heater is "on" in the sim the moment the notification comes on.  In a future version this will be changed to better simulate warming by not turning it on until after the notification is extinguished.