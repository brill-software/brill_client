// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from 'react'
import { Button as MuiButton } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { IconUtils } from 'lib/utils/IconUtils'
import withStyles from "@mui/styles/withStyles"


/**
 * Test button for testing the Error Boundary component.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    subscribeToTopic: string
    requestTopic: string
    startIcon?: string
    title: string
    endIcon?: string
    [propName: string]: any
}

interface State {
    errorMsg: string
}

class TestThrowErrorButton extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.TestThrowErrorButton?.styleOverrides?.root }}
    }

    constructor(props: Props) {
        super(props)
        this.state = {errorMsg: ""}
    }

    onClickHandler() {
        throw Error("Error thrown on Click")
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    handleErrorResponse(topic: string, response: any) {
        this.setState({errorMsg: response.detail})
    }

    clearErrorMsg() {
        this.setState({errorMsg: ""})
    }

    render() {
        const {theme, classes, subscribeToTopic, requestTopic, startIcon, title, endIcon, route, ...other} = this.props
        const startIconAttr = {startIcon: IconUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: IconUtils.resolveIcon(endIcon)}
        
        return (
            <div>
                <MuiButton className={classes.root}
                    {...startIconAttr} {...endIconAttr} 
                    onClick={() => this.onClickHandler()} {...other}>
                    {title}
                </MuiButton>
            </div>
        )
    }
}

export default withStyles(TestThrowErrorButton.defaultStyles, {withTheme: true})(TestThrowErrorButton)