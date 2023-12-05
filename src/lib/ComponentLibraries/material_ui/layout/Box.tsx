// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { Box as MuiBox } from "@mui/material"
import { Eval } from "lib/utils/Eval"

/**
 * Box compnent - based on the MUI Box component.
 * 
 */

interface Props {
    id: string
    condition: string
    children: any
    [propName: string]: any
}

interface State {
}

export default class Box extends Component<Props, State> {
 
    render() {
        const {id, children, condition, ...other} = this.props
        
        if (condition && !Eval.isConditionTrue(this.props.id, condition)) {
            return (<div/>)
        }
        
        return (
            <MuiBox {...other}>{children}</MuiBox>            
        )
    }
}