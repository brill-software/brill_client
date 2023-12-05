// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * Form component.
 * 
 */

 export interface FormOverrides {
    root: object
}

interface Props {
    id: string
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

    static defaultStyles(theme: Theme): any {
        return  {root: {...theme.components?.Form?.styleOverrides?.root}}
    } 
}

export default withStyles(Form.defaultStyles)(Form)