// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Theme } from "../material_ui/theme/Theme"

/**
 * Brill CMS Status Bar. Displays a small pannel in the bottom right corner with a summary of the last
 * edit operation. THe message is cleared automatically after a peiod of time.
 *
 */

 const defaultStyles: any = (theme: Theme) => {
    return  {
        root: {
            color: "#498ada",
            background: "#f0f0f0",
            fontSize: "16px",
            fontFamily: "Arial",
            paddingLeft: "15px",
            paddingRight: "15px",
            height: "24px",
            position: "absolute", 
            bottom: 0,
            ...theme.overrides?.StatusBar?.root
        }
    }
}

interface Props {
    classes: any
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    message: string | null
}

class StatusBar extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {message: null}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, 
            (topic, message) => this.newMessageCallback(topic, message), 
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    newMessageCallback(topic: string, message: string) {
        this.setState({message: message})
        setTimeout(() => this.clearMessage(), 5000)
    }

    clearMessage() {
        this.setState({message: null})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }
    
    render() {
        const {theme, classes, subscribeToTopic, ...other} = this.props

        if (this.state.message) {
            return (
                <div className={classes.root} {...other}>
                    {this.state.message}
                </div>)
        } else {
            return null
        }
    }
}

export default withStyles(defaultStyles, { name: "StatusBar", withTheme: true})(StatusBar)