// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.

import React from "react";

/**
 * Icon Utilities
 * 
 * There are a very large number of Material UI Icons and loading them all would increase the bunddle size
 * by 6MB. For performance reasons, only the icons that are required should be loaded. 
 * 
 * Additional Material UI icons can be added to the switch statement below.
 * 
 * You can also use the CMS to upload custom SVG icons.
 * 
 */
export class IconUtils {    

    /**
     * Gets a Material UI icon, given the icon name.
     * 
     * @param name Name of the Material UI icon.
     * @param attribs Optional parameters containing attributes for the icon.
     * @returns React element for the icon or the Error icon.
     */
    static resolveIcon(name: string | undefined, attribs: any = {}): React.CElement<any, any> | undefined {
        if (!name) return undefined
        let resolved: any
        
        // IMPORTANT: Don't be tempted to replace the switch statement with:
        //
        //    resolved = require(`@mui/icons-material/${nameOrTopic}.js`).default
        //
        // Doing so would result in the Bundler including every single icon file from @mui/icons-material. 
        //
        // You can check the bundle size using: 
        // % yarn analyze
        //
        switch (name) {
            // General use icons and icons used in the code.
            case "Home":
                resolved = require("@mui/icons-material/Home.js").default
                break
            case "Close":
                resolved = require("@mui/icons-material/Close.js").default
                break
            case "Cancel":
                resolved = require("@mui/icons-material/Cancel.js").default
                break
            case "Delete":
                resolved = require("@mui/icons-material/Delete.js").default
                break
            case "FastRewindTwoTone":
                resolved = require("@mui/icons-material/FastRewindTwoTone.js").default
                break
            case "PlayArrowTwoTone":
                resolved = require("@mui/icons-material/PlayArrowTwoTone.js").default
                break
            case "PlayCircleTwoTone":
                resolved = require("@mui/icons-material/PlayCircleTwoTone.js").default
                break
            case "FastForwardTwoTone":
                resolved = require("@mui/icons-material/FastForwardTwoTone.js").default
                break
            case "HorizontalSplitTwoTone":
                resolved = require("@mui/icons-material/HorizontalSplitTwoTone.js").default
                break
            case "VerticalSplitTwoTone":
                resolved = require("@mui/icons-material/VerticalSplitTwoTone.js").default
                break
            case "ExpandMore":
                resolved = require("@mui/icons-material/ExpandMore.js").default
                break
            case "ChevronRight":
                resolved = require("@mui/icons-material/ChevronRight.js").default
                break
            case "GridOffTwoTone":
                resolved = require("@mui/icons-material/GridOffTwoTone.js").default
                break
            case "GridOnTwoTone":
                resolved = require("@mui/icons-material/GridOnTwoTone.js").default
                break
            case "Brightness4":
                resolved = require("@mui/icons-material/Brightness4.js").default
                break
            case "Brightness7":
                resolved = require("@mui/icons-material/Brightness7.js").default
                break        
            case "Edit":
                resolved = require("@mui/icons-material/Edit.js").default
                break
            case "ExitToApp":
                resolved = require("@mui/icons-material/ExitToApp.js").default
                break

            // Error, Warning, Info, Close
            case "ErrorTwoTone":
                resolved = require("@mui/icons-material/ErrorTwoTone.js").default
                break
            case "WarningTwoTone":
                resolved = require("@mui/icons-material/WarningTwoTone.js").default
                break
            case "InfoTwoTone":
                resolved = require("@mui/icons-material/InfoTwoTone.js").default
                break
            case "CancelTwoTone":
                resolved = require("@mui/icons-material/CancelTwoTone.js").default
                break


            // CMS file upload dialog
            case "HourglassEmpty":
                resolved = require("@mui/icons-material/HourglassEmpty.js").default
                break
            case "Check":
                resolved = require("@mui/icons-material/Check.js").default
                break

            // CMS Editor Icons
            case "ArrowDownward":
                resolved = require("@mui/icons-material/ArrowDownward.js").default
                break
            case "ArrowUpward":
                resolved = require("@mui/icons-material/ArrowUpward.js").default
                break    
            case "Code":
                resolved = require("@mui/icons-material/Code.js").default
                break
            case "FindReplace":
                resolved = require("@mui/icons-material/FindReplace.js").default
                break
            case "FormatBold":
                resolved = require("@mui/icons-material/FormatBold.js").default
                break
            case "FormatItalic":
                resolved = require("@mui/icons-material/FormatItalic.js").default
                break
            case "FormatListBulleted":
                resolved = require("@mui/icons-material/FormatListBulleted.js").default
                break
            case "FormatListNumbered":
                resolved = require("@mui/icons-material/FormatListNumbered.js").default
                break
            case "FormatPaintTwoTone":
                resolved = require("@mui/icons-material/FormatPaintTwoTone.js").default
                break
            case "FormatUnderlined":
                resolved = require("@mui/icons-material/FormatUnderlined.js").default
                break
            case "ListAltTwoTone":
                resolved = require("@mui/icons-material/ListAltTwoTone.js").default
                break
            case "Redo":
                resolved = require("@mui/icons-material/Redo.js").default
                break
            case "Restore":
                resolved = require("@mui/icons-material/Restore.js").default
                break
            case "SaveTwoTone":
                resolved = require("@mui/icons-material/SaveTwoTone.js").default
                break
            case "SaveAlt":
                resolved = require("@mui/icons-material/SaveAlt.js").default
                break
            case "Search":
                resolved = require("@mui/icons-material/Search.js").default
                break
            case "StrikethroughS":
                resolved = require("@mui/icons-material/StrikethroughS.js").default
                break
            case "Undo":
                resolved = require("@mui/icons-material/Undo.js").default
                break
            case "Launch":
                resolved = require("@mui/icons-material/Launch.js").default
                break

            // CMS Files Tree View icons specified in the CMS themes
            case "SubjectTwoTone":
                resolved = require("@mui/icons-material/SubjectTwoTone.js").default
                break   
            case "FolderOpenTwoTone":
                resolved = require("@mui/icons-material/FolderOpenTwoTone.js").default
                break
            case "FolderSpecialTwoTone":
                resolved = require("@mui/icons-material/FolderSpecialTwoTone.js").default
                break
            case "BusinessCenterTwoTone":
                resolved = require("@mui/icons-material/BusinessCenterTwoTone.js").default
                break
            case "InsertPhotoTwoTone":
                resolved = require("@mui/icons-material/InsertPhotoTwoTone.js").default
                break
            case "Wallpaper":
                resolved = require("@mui/icons-material/Wallpaper.js").default
                break
            case "ImageTwoTone":
                resolved = require("@mui/icons-material/ImageTwoTone.js").default
                break
            case "PagesTwoTone":
                resolved = require("@mui/icons-material/PagesTwoTone.js").default
                break
            case "DescriptionTwoTone":
                resolved = require("@mui/icons-material/DescriptionTwoTone.js").default
                break
            case "StyleTwoTone":
                resolved = require("@mui/icons-material/StyleTwoTone.js").default
                break

            // CMS File Tree View icons in code
            case "FolderTwoTone":
                resolved = require("@mui/icons-material/FolderTwoTone.js").default
                break
            case "InsertDriveFileTwoTone":
                resolved = require("@mui/icons-material/InsertDriveFileTwoTone.js").default
                break

            // CMS Changes Buttons
            case "RemoveCircleTwoTone":
                resolved = require("@mui/icons-material/RemoveCircleTwoTone.js").default
                break
            case "RefreshTwoTone":
                resolved = require("@mui/icons-material/RefreshTwoTone.js").default
                break
            case "CheckCircleTwoTone":
                resolved = require("@mui/icons-material/CheckCircleTwoTone.js").default
                break
            case "AddTwoTone":
                resolved = require("@mui/icons-material/AddTwoTone.js").default
                break
            case "RemoveTwoTone":
                resolved = require("@mui/icons-material/RemoveTwoTone.js").default
                break
            case "DeleteTwoTone":
                resolved = require("@mui/icons-material/DeleteTwoTone.js").default
                break
            case "SettingsBackupRestore":
                resolved = require("@mui/icons-material/SettingsBackupRestore.js").default
                break

            default:
                console.warn(`Material UI Icon ${name} not currently supported. Update IconUtils.ts to add support.`);
                resolved = require("@mui/icons-material/ErrorTwoTone.js").default
        }

        return React.createElement(resolved, attribs)
    }
}