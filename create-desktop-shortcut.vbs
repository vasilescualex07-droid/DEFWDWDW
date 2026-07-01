Set oWS = WScript.CreateObject("WScript.Shell")
sDesktopFolder = oWS.SpecialFolders("Desktop")

' Create shortcut for the game
Set oShortcut = oWS.CreateShortcut(sDesktopFolder & "\StakeLite Casino.lnk")
oShortcut.TargetPath = "C:\Users\Admin\New folder\stakelite-7257f573\launch-game.bat"
oShortcut.WorkingDirectory = "C:\Users\Admin\New folder\stakelite-7257f573"
oShortcut.Description = "StakeLite Casino Game with Win Animations"
oShortcut.IconLocation = "C:\Windows\System32\shell32.dll,13"
oShortcut.Save

' Create shortcut in Start Menu Programs
Set oShortcut2 = oWS.CreateShortcut(oWS.SpecialFolders("Programs") & "\StakeLite Casino.lnk")
oShortcut2.TargetPath = "C:\Users\Admin\New folder\stakelite-7257f573\launch-game.bat"
oShortcut2.WorkingDirectory = "C:\Users\Admin\New folder\stakelite-7257f573"
oShortcut2.Description = "StakeLite Casino Game with Win Animations"
oShortcut2.IconLocation = "C:\Windows\System32\shell32.dll,13"
oShortcut2.Save

MsgBox "Desktop shortcut created! You can now launch StakeLite Casino from your desktop.", 64, "Shortcut Created"
