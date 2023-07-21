// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from 'react'
import { Button as MuiButton, CircularProgress } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { IconUtils } from 'lib/utils/IconUtils'
import withStyles from "@mui/styles/withStyles"

/**
 * Submit Button. Sneds field data to the server using request/response messaging.
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
    publishToTopic?: string
    action?: string
    route?: string
    [propName: string]: any
}

interface State {
    disabled: boolean
    errorMsg: string
}

class SubmitButton extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.overrides?.SubmitButton?.root }}
    }

    constructor(props: Props) {
        super(props)
        this.state = {disabled: false, errorMsg: ""}
    }

    onClickHandler() {
        if (MB.validationFailed(this.props.subscribeToTopic)) {
            this.setState({errorMsg: "Please correct the fields above."})
            setTimeout(() => this.clearErrorMsg(), 3000)
            return
        }
        const data: any = MB.getCurrentData(this.props.subscribeToTopic)
        // console.log("===== Field data = " + JSON.stringify(data))
        this.token = MB.sendRequest(this.props.requestTopic, (topic, response) => this.handleSuccessResponse(topic, response), 
                                    (topic, response) => this.handleErrorResponse(topic, response), data);
        this.setState({disabled: true})
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    handleSuccessResponse(topic: string, response: any) {
        this.setState({disabled: false})
        if (this.props.publishToTopic) {
            MB.publish(this.props.publishToTopic, this.props.action)
        }
        if (this.props.route) {
            if (this.props.route.toLowerCase() === "back") {
                Router.goBackToPreviousPage()
            } else {
                Router.goToPage(this.props.route)
            }      
        }
    }

    handleErrorResponse(topic: string, response: any) {
        this.setState({disabled: false, errorMsg: response.detail})
    }

    clearErrorMsg() {
        this.setState({errorMsg: ""})
    }

    render() {
        const {theme, classes, subscribeToTopic, requestTopic, publishToTopic, action, startIcon, title, endIcon, route, ...other} = this.props
        const startIconAttr = {startIcon: IconUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: IconUtils.resolveIcon(endIcon)}

        return (
            <div style={{position: "relative"}}>
                <MuiButton className={classes.root}
                    disabled={this.state.disabled}
                    {...startIconAttr} {...endIconAttr} 
                    onClick={() => this.onClickHandler()} {...other}>
                    {title}
                </MuiButton>
                {this.state.disabled && (
                    <CircularProgress
                        size={24}
                        style={{position: "absolute", top: "50%", right: "50%", marginTop: "-12px", marginLeft: "-12px"}}
                    />
                )}
            </div>
        )
    }
}
export default withStyles(SubmitButton.defaultStyles, {withTheme: true})(SubmitButton)