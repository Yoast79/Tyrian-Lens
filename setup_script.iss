; Tyrian Lens Inno Setup Script
; Updated to reflect current project structure

[Setup]
AppName=Tyrian Lens
AppVersion=1.2.4
DefaultDirName={autopf}\Tyrian Lens
DefaultGroupName=Tyrian Lens
OutputBaseFilename=Tyrian_Lens_Setup
OutputDir=E:\GW2_Coding\Inno Setup 6\Output
SetupIconFile=E:\GW2_Coding\GW2PS\GW2_Map_GPS\Assets\app_icon.ico
UninstallDisplayIcon={app}\Tyrian Lens.exe
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; 1. The main executable - Renamed on install
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\GW2PS.exe"; DestDir: "{app}"; DestName: "Tyrian Lens.exe"; Flags: ignoreversion

; 2. Support Files (DLLs, JSON configs)
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\*.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\*.json"; DestDir: "{app}"; Flags: ignoreversion

; 3. Asset, Module, and Data Folders (Structure must match the project root for local mapping to work)
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\Assets\*"; DestDir: "{app}\Assets"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\modules\*"; DestDir: "{app}\modules"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\Data\*"; DestDir: "{app}\Data"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\runtimes\*"; DestDir: "{app}\runtimes"; Flags: recursesubdirs createallsubdirs

; 4. Localized Resources (Ensures UI elements for standard dialogs are correct)
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\cs\*"; DestDir: "{app}\cs"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\de\*"; DestDir: "{app}\de"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\es\*"; DestDir: "{app}\es"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\fr\*"; DestDir: "{app}\fr"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\it\*"; DestDir: "{app}\it"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\ja\*"; DestDir: "{app}\ja"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\ko\*"; DestDir: "{app}\ko"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\pl\*"; DestDir: "{app}\pl"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\pt-BR\*"; DestDir: "{app}\pt-BR"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\ru\*"; DestDir: "{app}\ru"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\tr\*"; DestDir: "{app}\tr"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\zh-Hans\*"; DestDir: "{app}\zh-Hans"; Flags: recursesubdirs createallsubdirs
Source: "E:\GW2_Coding\GW2PS\GW2_Map_GPS\bin\Release\net9.0-windows\publish\win-x64\zh-Hant\*"; DestDir: "{app}\zh-Hant"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Tyrian Lens"; Filename: "{app}\Tyrian Lens.exe"
Name: "{autodesktop}\Tyrian Lens"; Filename: "{app}\Tyrian Lens.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Tyrian Lens.exe"; Description: "{cm:LaunchProgram,Tyrian Lens}"; Flags: nowait postinstall

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\TyrianLens"
