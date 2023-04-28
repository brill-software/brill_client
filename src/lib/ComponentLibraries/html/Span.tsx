// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * HTML Span component.
 */

interface Props {
    subscribeToTopic?: string
    text?: string,
    children?: any
    [propName: string]: any
}

interface State {
    text: string
}

export default class Span extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {text: this.props.text ?? ""}  
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.token = MB.subscribe(
                this.props.subscribeToTopic, 
                (topic, text) => this.dataLoadedCallback(topic, text), 
                (topic, error) => this.errorCallback(topic, error))
        }
    }
   
    dataLoadedCallback(topic: string, text: string) {
        this.setState({text: text})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(error.detail)
    }

    componentWillUnmount() {
       MB.unsubscribe(this.token)
    }  

    render() {
        const {subscribeToTopic, text, children, ...other} = this.props
        return <span {...other}>{this.state.text}{children}</span>
    }
}