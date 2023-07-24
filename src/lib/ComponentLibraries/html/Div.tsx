// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { MB, Token } from "lib/MessageBroker/MB"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * HTML Div component.
 * 
 * Background images need to be specified using either a URL and the backgroundImage prop or
 * a topic and the bgImageTopic prop. 
 * 
 */

interface Props {
    classes: any
    subscribeToTopic?: string
    text?: string,
    backgroundImage?: string, // Background image URL.
    bgImageTopic?: string     // The topic of an image to use for the background.
    children?: any
    [propName: string]: any
}

interface State {
    text: string
    backgroundImage: string
}

class Div extends Component<Props, State> {
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
            console.log("Div Subscribing to topic:" + this.props.bgImageTopic)
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
        console.log("Loaded background image. Length = " + image.length)
        this.setState({backgroundImage: image})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(error.detail)
    }

    render() {
        const {classes, subscribeToTopic, text, children, style, backgroundImage, bgImageTopic, ...other} = this.props

        let updatedStyle = style ? {...style} : []

        if (backgroundImage) {
            updatedStyle["backgroundImage"] = "url('" + backgroundImage + "')"
        } else {
            if (bgImageTopic) {
                updatedStyle["backgroundImage"] = "url('" + this.state.backgroundImage + "')"
                console.log("Rendering Div. Length = " + this.state.backgroundImage.length)
            }
        }
        
        return <div className={classes.root} style={updatedStyle} {...other}>{this.state.text}{children}</div>
    }

    static defaultStyles(theme: Theme): any {
        return  {root: { ...theme.overrides?.Div?.root }}
    }

}

export default withStyles(Div.defaultStyles)(Div)