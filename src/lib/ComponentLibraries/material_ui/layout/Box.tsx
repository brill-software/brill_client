// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Box as MuiBox, withTheme } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { Eval } from "lib/utils/Eval"

/**
 * Box compnent - based on the MUI Box component.
 * 
 */

interface Props {
    id: string
    theme: Theme
    condition: string
    children: any
    [propName: string]: any
}

interface State {
}

class Box extends Component<Props, State> {
 
    render() {
        const {id, theme, children, condition, ...other} = this.props
        
        if (condition && !Eval.isConditionTrue(this.props.id, condition)) {
            return (<div/>)
        }
        
        return (
            <MuiBox {...other}>{children}</MuiBox>            
        )

    }
}

export default withTheme(Box)