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
        //    resolved = require(`@material-ui/icons/${nameOrTopic}.js`).default
        //
        // Doing so would result in the Bundler including every single icon file
        // from @material-ui/icons. You can check the bundle size using: 
        // % yarn analyze
        //
        switch (name) {
            // General use icons and icons used in the code.
            case "Home":
                resolved = require("@material-ui/icons/Home.js").default
                break
            case "Close":
                resolved = require("@material-ui/icons/Close.js").default
                break
            case "HorizontalSplitTwoTone":
                resolved = require("@material-ui/icons/HorizontalSplitTwoTone.js").default
                break
            case "VerticalSplitTwoTone":
                resolved = require("@material-ui/icons/VerticalSplitTwoTone.js").default
                break
            case "ExpandMore":
                resolved = require("@material-ui/icons/ExpandMore.js").default
                break
            case "ChevronRight":
                resolved = require("@material-ui/icons/ChevronRight.js").default
                break
            case "GridOffTwoTone":
                resolved = require("@material-ui/icons/GridOffTwoTone.js").default
                break
            case "GridOnTwoTone":
                resolved = require("@material-ui/icons/GridOnTwoTone.js").default
                break
            case "Brightness4":
                resolved = require("@material-ui/icons/Brightness4.js").default
                break
            case "Brightness7":
                resolved = require("@material-ui/icons/Brightness7.js").default
                break        
            case "Edit":
                resolved = require("@material-ui/icons/Edit.js").default
                break
            
            // CMS file upload dialog
            case "HourglassEmpty":
                resolved = require("@material-ui/icons/HourglassEmpty.js").default
                break
            case "Check":
                resolved = require("@material-ui/icons/Check.js").default
                break

            // CMS Editor Icons
            case "ArrowDownward":
                resolved = require("@material-ui/icons/ArrowDownward.js").default
                break
            case "ArrowUpward":
                resolved = require("@material-ui/icons/ArrowUpward.js").default
                break    
            case "Code":
                resolved = require("@material-ui/icons/Code.js").default
                break
            case "FindReplace":
                resolved = require("@material-ui/icons/FindReplace.js").default
                break
            case "FormatBold":
                resolved = require("@material-ui/icons/FormatBold.js").default
                break
            case "FormatItalic":
                resolved = require("@material-ui/icons/FormatItalic.js").default
                break
            case "FormatListBulleted":
                resolved = require("@material-ui/icons/FormatListBulleted.js").default
                break
            case "FormatListNumbered":
                resolved = require("@material-ui/icons/FormatListNumbered.js").default
                break
            case "FormatPaintTwoTone":
                resolved = require("@material-ui/icons/FormatPaintTwoTone.js").default
                break
            case "FormatUnderlined":
                resolved = require("@material-ui/icons/FormatUnderlined.js").default
                break
            case "ListAltTwoTone":
                resolved = require("@material-ui/icons/ListAltTwoTone.js").default
                break
            case "Redo":
                resolved = require("@material-ui/icons/Redo.js").default
                break
            case "Restore":
                resolved = require("@material-ui/icons/Restore.js").default
                break
            case "SaveTwoTone":
                resolved = require("@material-ui/icons/SaveTwoTone.js").default
                break
            case "Search":
                resolved = require("@material-ui/icons/Search.js").default
                break
            case "StrikethroughS":
                resolved = require("@material-ui/icons/StrikethroughS.js").default
                break
            case "Undo":
                resolved = require("@material-ui/icons/Undo.js").default
                break

            // CMS Files Tree View icons specified in the CMS themes
            case "SubjectTwoTone":
                resolved = require("@material-ui/icons/SubjectTwoTone.js").default
                break   
            case "FolderOpenTwoTone":
                resolved = require("@material-ui/icons/FolderOpenTwoTone.js").default
                break
            case "FolderSpecialTwoTone":
                resolved = require("@material-ui/icons/FolderSpecialTwoTone.js").default
                break
            case "BusinessCenterTwoTone":
                resolved = require("@material-ui/icons/BusinessCenterTwoTone.js").default
                break
            case "InsertPhotoTwoTone":
                resolved = require("@material-ui/icons/InsertPhotoTwoTone.js").default
                break
            case "Wallpaper":
                resolved = require("@material-ui/icons/Wallpaper.js").default
                break
            case "ImageTwoTone":
                resolved = require("@material-ui/icons/ImageTwoTone.js").default
                break
            case "PagesTwoTone":
                resolved = require("@material-ui/icons/PagesTwoTone.js").default
                break
            case "DescriptionTwoTone":
                resolved = require("@material-ui/icons/DescriptionTwoTone.js").default
                break
            case "StyleTwoTone":
                resolved = require("@material-ui/icons/StyleTwoTone.js").default
                break

            // CMS File Tree View icons in code
            case "FolderTwoTone":
                resolved = require("@material-ui/icons/FolderTwoTone.js").default
                break
            case "InsertDriveFileTwoTone":
                resolved = require("@material-ui/icons/InsertDriveFileTwoTone.js").default
                break

            // CMS Changes Buttons
            case "RemoveCircleTwoTone":
                resolved = require("@material-ui/icons/RemoveCircleTwoTone.js").default
                break
            case "RefreshTwoTone":
                resolved = require("@material-ui/icons/RefreshTwoTone.js").default
                break
            case "CheckCircleTwoTone":
                resolved = require("@material-ui/icons/CheckCircleTwoTone.js").default
                break
            case "AddTwoTone":
                resolved = require("@material-ui/icons/AddTwoTone.js").default
                break
            case "RemoveTwoTone":
                resolved = require("@material-ui/icons/RemoveTwoTone.js").default
                break
            case "DeleteTwoTone":
                resolved = require("@material-ui/icons/DeleteTwoTone.js").default
                break
            case "SettingsBackupRestore":
                resolved = require("@material-ui/icons/SettingsBackupRestore.js").default
                break

            default:
                console.warn(`Material UI Icon ${name} not currently supported. Update IconUtils.ts to add support.`);
                resolved = require("@material-ui/icons/ErrorTwoTone.js").default
        }

        return React.createElement(resolved, attribs)
    }
}