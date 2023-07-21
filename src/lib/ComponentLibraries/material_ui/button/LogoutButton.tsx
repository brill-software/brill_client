// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from 'react'
import { Button as MuiButton } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { WebSocketClient } from 'lib/MessageBroker/WebSocketClient'
import { ErrorMsg } from 'lib/MessageBroker/ErrorMsg'
import ConfirmDialog from '../dialog/ConfirmDialog'
import { IconUtils } from 'lib/utils/IconUtils'
import withStyles from "@mui/styles/withStyles"

/**
 * Logout button.
 * 
 * Based on SubmitButton but also prompts the user to confirm the logout and clears
 * the username and authentication details.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    publishToTopic: string
    startIcon: string
    title: string
    endIcon: string
    route: string
    [propName: string]: any
}

interface State {
}

class LogoutButton extends Component<Props, State> {
   token: Token

   static defaultStyles(theme: Theme): any {
    return  { root: { ...theme.overrides?.LogoutButton?.root }}
}

    constructor(props: Props) {
        super(props)
        this.state = {errorMsg: ""}
    }

    componentDidMount() {
        this.token = MB.subscribe("logout.confirmDialog.response", (topic, response) => this.handleResponse(topic, response), (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
    }

    handleResponse(topic: string, response: string) {
        if (response === "Yes") {
            WebSocketClient.clearAuthenticationResponse()
            MB.publish("username", "")
            Router.goToPage(this.props.route)
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onClickHandler() {  
        MB.publish("logout.confirmDialog.open", true)
    }

    render() {
        const {theme, classes, startIcon, title, endIcon, route, publishToTopic, ...other} = this.props
        const startIconAttr = {startIcon: IconUtils.resolveIcon(startIcon)}
        const endIconAttr = {endIcon: IconUtils.resolveIcon(endIcon)}
      
        return (
            <div>
                <MuiButton className={classes.root} {...other}
                    {...startIconAttr} {...endIconAttr}
                    onClick={() => this.onClickHandler()}
                >{title}</MuiButton>
                <ConfirmDialog title="Confirm Logout" 
                    prompt="Are you sure you want to logout?" 
                    key="logoutConfirmDialog"
                    subscribeToTopic="logout.confirmDialog.open"
                    publishToTopic="logout.confirmDialog.response" />
            </div>
        )
    }
}
export default withStyles(LogoutButton.defaultStyles, {withTheme: true})(LogoutButton)