// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { Theme as MuiTheme} from "@material-ui/core/styles"
import { Mixins as MuiMixins } from "@material-ui/core/styles/createMixins"
import { Overrides as MuiOverrides} from "@material-ui/core/styles/overrides"
import { Typography as MuiTypography } from "@material-ui/core/styles/createTypography"

/**
 * Extends the MUI Theme interface to include our own mixins, overrides and typography.
 * 
 */

interface Mixins extends MuiMixins {
    [propName: string]: any
}

interface Overrides extends MuiOverrides {
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
    overrides?: Overrides
    typography: Typography
}
