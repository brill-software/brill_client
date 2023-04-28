// © 2022 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * HTML Image component. The image is specified as a topic using the subscribeToTopic property.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    subscribeToTopic: string // The topic for the image.
    [propName: string]: any
}

interface State {
    image: string
}

class Img extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: {display: "block", ...theme.overrides?.Img?.root }}
    }
    constructor(props: Props) {
        super(props)
        this.state = {image: ""}
    }

    componentDidMount() {
        this.token = MB.subscribe(
            this.props.subscribeToTopic, 
            (topic, image) => this.dataLoadedCallback(topic, image), 
            (topic, error) => this.errorCallback(topic, error), this.props.filter)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
     }

     dataLoadedCallback(topic: string, image: string) {
        this.setState({image: image})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(`Image component error for topic {topic} : {error.detail}`)
    }

    render() {
        const {theme, classes, subscribeToTopic, ...other} = this.props
        if (!this.state.image) {
            return null
        }
        return (
            <img className={classes.root} src={this.state.image} alt="" {...other} />
        )
    }
}

export default withStyles(Img.defaultStyles, {withTheme: true})(Img)