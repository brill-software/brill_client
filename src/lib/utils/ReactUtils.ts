// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * React Utilities
 * 
 */

import React from "react";

export class ReactUtils {                         
    /**
     * Loads an Icon.
     */
    static resolveIcon(name: string | undefined): React.CElement<any, any> | undefined {
        if (!name) return undefined
        let resolved: any = undefined
        try {
            resolved = require(`@material-ui/icons/${name}.js`).default  
        } catch (error) {
            console.warn(`Unable to load icon ${name}`)
            resolved = require(`@material-ui/icons/ErrorTwoTone.js`).default
        }
        return React.createElement(resolved)
    }
}