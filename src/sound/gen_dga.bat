MediaIDCheck.exe mediaIDs.txt FlightSim.mediaid
"%WWISEROOT%\Authoring\x64\Release\bin\WwiseConsole.exe" generate-soundbank "D:\Development\GitHub\fspackages\src\sound\FlightSim.wproj" --platform "Windows" 

xcopy "D:\Development\GitHub\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WorkingTitle.PC.PCK" "D:\Development\GitHub\fspackages\src\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WorkingTitle.PC.PCK" /y

:CopyFile
xcopy "D:\Development\GitHub\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WorkingTitle.PC.PCK" "C:\Users\Dominik\AppData\Local\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WorkingTitle.PC.PCK" /y
echo Exit code is: %ERRORLEVEL%
IF "%ErrorLevel%"=="4" (
    Goto :CopyFile
)
