// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { MB, Token } from "lib/MessageBroker/MB"
import React, {Component} from "react"

/**
 * HTML Div component.
 * 
 * Background images need to be specified using the bgImageTopic prop, rather than using the
 * style attribute backgroundImage. 
 * 
 */

interface Props {
    subscribeToTopic?: string
    text?: string,
    bgImageTopic?: string // The topic of an image to use for the background.
    children?: any
    [propName: string]: any
}

interface State {
    text: string
    backgroundImage: string
}

export default class Div extends Component<Props, State> {
    tokens: Token[] = []

    constructor(props: Props) {
        super(props)
        this.state = {text: this.props.text ?? "", backgroundImage: ""}  
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.tokens.push(MB.subscribe(
                this.props.subscribeToTopic, 
                (topic, data) => this.dataLoadedCallback(topic, data), 
                (topic, error) => this.errorCallback(topic, error)))
        }
        if (this.props.bgImageTopic) {
            this.tokens.push(MB.subscribe(
                this.props.bgImageTopic,
                (topic, image) => this.backgroundImageCallback(topic, image),
                (topic, error) => this.errorCallback(topic, error)))
        }
    }

    componentWillUnmount() {
        MB.unsubscribeAll(this.tokens)
     } 

    dataLoadedCallback(topic: string, data: any) {
        if (typeof data === "string") {
            this.setState({text: data as string})
        } else {
            this.setState({text: JSON.stringify(data)})
        }
    }

    backgroundImageCallback(topic: string, image: string) {
        this.setState({backgroundImage: image})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(error.detail)
    }

    render() {
        const {subscribeToTopic, text, children, style, bgImageTopic, ...other} = this.props
        let updatedStyle = style ? {...style} : []
        if (bgImageTopic) {
            updatedStyle["backgroundImage"] = "url('" + this.state.backgroundImage + "')"
        }
        return <div style={updatedStyle} {...other}>{this.state.text}{children}</div>
    }
}