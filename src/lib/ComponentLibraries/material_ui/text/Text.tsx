// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Theme } from "../theme/Theme"
import { withStyles } from "@material-ui/core"

/**
 * Text component.
 * 
 */
interface Props {
    theme: Theme
    classes: any
    text: string
    subscribeToTopic: string
    filter?: object
    [propName: string]: any
}
interface State {
    text: string
}
class Text extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.typography.body1, ...theme.overrides?.Text?.root }}
    }

    constructor(props: Props) {
        super(props)
        this.state = {text: this.props.text}  
    }

    componentDidMount() {
        this.token = MB.subscribe(
            this.props.subscribeToTopic, 
            (topic, data) => this.dataLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error), this.props.filter)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
     }  
   
    dataLoadedCallback(topic: string, data: any) {
        let text = ""
        if (data.base64) {
            text = atob(data.base64)
        } else {
            if (typeof data === "object") {
                text = JSON.stringify(data,null, 4)
            } else {
                text = data as string
            }
        }
        this.setState({text: text})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(`Text component error for topic {topic} : {error.detail}`)
        this.setState({text: error.detail})
    }

    render() {
        const {theme, classes, subscribeToTopic, filter, ...other} = this.props     
        return <p className={classes.root}{...other}>{this.state.text}</p>
    }
}

export default withStyles(Text.defaultStyles, {withTheme: true})(Text)