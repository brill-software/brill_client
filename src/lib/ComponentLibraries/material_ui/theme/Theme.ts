// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { Theme as MuiTheme} from "@mui/material"
import { Mixins as MuiMixins } from "@mui/material/styles/createMixins"
// TODO import { Overrides as MuiOverrides} from "@mui/material/styles/overrides"
import { Typography as MuiTypography } from "@mui/material/styles/createTypography"

/**
 * Extends the Mui Theme interface to include our own mixins, overrides and typography.
 * 
 */

interface Mixins extends MuiMixins {
    [propName: string]: any
}

// interface Components extends MuiComponents {
    interface Components {
        [propName: string]: any
    }

interface Typography extends MuiTypography {
    html?: {style: object}
    body?: {style: object}
    pre?: object
    blockquote?: object
    code?: object
    ul?: object
    ol?: object
    img?: object
}

export interface Theme extends MuiTheme {
    mixins: Mixins
    components?: Components   // v5 
    typography: Typography
}