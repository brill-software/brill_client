// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from 'react'
import { Button as MuiButton, CircularProgress } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import Router from "lib/Router/Router"
import { IconUtils } from 'lib/utils/IconUtils'
import withStyles from "@mui/styles/withStyles"

/**
 * Chatbot Button. Sneds messages via the Server to a Chatbot using request/response messaging.
 * 
 */

// Tell ChatGPT to always return the results in Markdown format.
const INITIAL_SYSTEM_MSG: string = "Helpful assistant that answers in Markdown format."

class Message {
    role: "system" | "user" | "assistant"
    content: string
}

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

class ChatbotButton extends Component<Props, State> {

    token: Token
    messages: Message[]

    constructor(props: Props) {
        super(props)
        this.messages = [{role: "system", content: INITIAL_SYSTEM_MSG}]
        this.state = {disabled: false, errorMsg: ""}
    }

    onClickHandler() {
        if (MB.validationFailed(this.props.subscribeToTopic)) {
            this.setState({errorMsg: "Please correct the fields in error."})
            setTimeout(() => this.clearErrorMsg(), 3000)
            return
        }
        const data: any = MB.getCurrentData(this.props.subscribeToTopic)

        const userMesssage: string = data.message

        if (userMesssage.toLowerCase().startsWith("clear") && userMesssage.length < 8) {
            this.messages =  [{role: "system", content: INITIAL_SYSTEM_MSG}]
            MB.publish(this.props.subscribeToTopic + ".initial_message", "")
            MB.publish(this.props.publishToTopic, "")
            return
        }

        this.messages.push({role: "user", content: data.message})
        const content = {messages: this.messages}

        this.token = MB.sendRequest(this.props.requestTopic, (topic, response) => this.handleSuccessResponse(topic, response), 
                                    (topic, response) => this.handleErrorResponse(topic, response), content);
        this.setState({disabled: true})
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    async handleSuccessResponse(topic: string, responseData: any) {
        this.setState({disabled: false})
        this.messages = responseData.messages
        
        // Clear the message field of the question
        MB.publish(this.props.subscribeToTopic + ".initial_message", "")

        if (this.props.publishToTopic) {
            let markdown = ""
            let lastMsgStartPos = 0
            for (let i = 0; i < this.messages.length; i++) {
                switch (this.messages[i].role) {
                    case "user":
                        markdown += "\n**" + this.messages[i].content + "**\n\n"  
                        break
                    case "assistant":
                        lastMsgStartPos = markdown.length
                        markdown += this.messages[i].content + "\n"
                        break
                    case "system":
                        break    
                }
            }

            // Display the last answer in delayed sections to give a chatbot like appearance.
            let pos = lastMsgStartPos
            while (pos < markdown.length) {
                pos += 30
                if (pos > markdown.length) { 
                    pos = markdown.length
                } else {
                    // Advance to the next space.
                    const nextSpace = markdown.indexOf(' ', pos)
                    if (nextSpace !== -1) {
                        pos = nextSpace
                    }
                }
                const dotEnding = (pos < markdown.length) ? " **•**" : ""
                MB.publish(this.props.publishToTopic, markdown.substring(0,pos) + dotEnding)
                await new Promise(r => setTimeout(r, 500));
            }
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

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.SubmitButton?.styleOverrides?.root }}
    }

}
export default withStyles(ChatbotButton.defaultStyles, {withTheme: true})(ChatbotButton)