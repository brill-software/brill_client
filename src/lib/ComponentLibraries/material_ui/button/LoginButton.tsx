// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { Button as MuiButton } from "@mui/material"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { WebSocketClient } from "lib/MessageBroker/WebSocketClient"
import { CryptoService } from "lib/MessageBroker/CryptoService"
import { IconUtils } from "lib/utils/IconUtils"
import withStyles from "@mui/styles/withStyles"

/**
 * Login button.
 * 
 * Based on SubmitButton but saves the username and re-connection data and also the password is encrypted.  
 * Routes the user to the either the Change Password page or Home page.
 */

export class User {
    username: string
    permissions: string
    changePassword: string
    sessionId: string
    [propName: string]: any
}

interface Props {
    theme: Theme
    classes: any
    subscribeToTopic: string
    requestTopic: string
    startIcon?: string
    title: string
    endIcon?: string
    successRoute: string
    changePasswordRoute: string
    [propName: string]: any
}

interface State {
}

class LoginButton extends Component<Props, State> {
    token: Token
    token2: Token

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.LoginButton?.styleOverrides?.root }}
    }  

    constructor(props: Props) {
        super(props)
        this.state = {serverPublicKey: ""}
    }

    componentDidMount() {  
        if (!CryptoService.isSharedSecretAvailable()) {
            const clientPublicKey = CryptoService.generateClientKeys()
            // eslint-disable-next-line no-template-curly-in-string
            this.token2 = MB.sendRequest("auth:/${appName}/server_public_key", 
                (topic, serverPublicKey) => this.publicKeyCallback(topic, serverPublicKey), 
                (topic, error) => this.errorCallback(topic, error), 
                {clientPublicKey: clientPublicKey})
        }
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2, true)
    }

    publicKeyCallback(topic: string, serverPublicKey: string) {
        CryptoService.generateSharedSecret(serverPublicKey)
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.log(error.detail)
    } 

    async onClickHandler() {
        if (MB.validationFailed(this.props.subscribeToTopic)) {
            return
        }
        let data: any = MB.getData(this.props.subscribeToTopic)

        if (data.password) {
            data.password = await CryptoService.encrypt(data.password);
        }
    
        this.token = MB.sendRequest(this.props.requestTopic, 
                                    (topic, user) => this.handleSuccessResponse(topic, user), 
                                    (topic, error) => this.handleErrorResponse(topic, error), data)
    }

    handleSuccessResponse(topic: string, user: User) {
        MB.publish("username", user.username)
        MB.publish("userDetails", user)
        WebSocketClient.saveAuthenticationResponse(user)
        if (user.changePassword === "Y") {
            Router.goToPage(this.props.changePasswordRoute)
        } else {
            Router.goToPage(this.props.successRoute)
        }
    }

    handleErrorResponse(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    render() {
        const {theme, classes, subscribeToTopic, requestTopic, startIcon, title, endIcon, successRoute, changePasswordRoute, ...other} = this.props
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

export default withStyles(LoginButton.defaultStyles, {withTheme: true})(LoginButton)