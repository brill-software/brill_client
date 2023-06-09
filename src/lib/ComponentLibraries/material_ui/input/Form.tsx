// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"

/**
 * Form component.
 * 
 */

 export interface FormOverrides {
    root: object
}

const defaultStyles: any = (theme: Theme) => {
    const formRoot = (theme.overrides?.Form?.root) ? theme.overrides.Form.root : {}
    return  {
        root: {
            ...formRoot
        }
  }}

interface Props {
    id: string
    theme: Theme
    classes: any
    children: any
    [propName: string]: any
}

interface State {
}

class Form extends Component<Props, State> {
   
    render() {
        const {id, theme, classes, ...other} = this.props        

        return (     
            <form className={classes.root} noValidate autoComplete="off" {...other}>
                {this.props.children}
            </form>
        )
    }
}

export default withStyles(defaultStyles, { name: "Form", withTheme: true})(Form)