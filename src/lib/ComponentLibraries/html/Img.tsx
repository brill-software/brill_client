// © 2022 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import withStyles from "@mui/styles/withStyles"

/**
 * HTML Image component. The image is specified as a topic using the subscribeToTopic property.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    src?: string              // The URL for the image.
    subscribeToTopic?: string // The topic for the image.
    [propName: string]: any
}

interface State {
    image: string
}

class Img extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {image: ""}
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.token = MB.subscribe(
                this.props.subscribeToTopic, 
                (topic, image) => this.dataLoadedCallback(topic, image), 
                (topic, error) => this.errorCallback(topic, error), this.props.filter)
        }
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
     }

     dataLoadedCallback(topic: string, image: string) {
        this.setState({image: image})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.warn(`Img component error for topic {topic} : {error.detail}`)
    }

    render() {
        const {theme, classes, src, subscribeToTopic, ...other} = this.props

        if (src) {
            return (
                <img className={classes.root} src={src} alt="" {...other} />
            )
        }

        if (!this.state.image) {
            return null
        }
        return (
            <img className={classes.root} src={this.state.image} alt="" {...other} />
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { 
            root: {display: "block", 
                ...theme.components?.Img?.styleOverrides?.root }
            }
    }
}

export default withStyles(Img.defaultStyles, { withTheme: true })(Img)