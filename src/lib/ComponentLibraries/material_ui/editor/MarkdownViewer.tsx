// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import Markdown from "markdown-to-jsx"
import { Theme } from "../theme/Theme"
import withStyles from "@mui/styles/withStyles"
import { Typography } from "@mui/material"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"

/**
 * Markdown Viewer - uses the markdown-to-jsx library.
 * 
 * The h1, h2, etc. styles are obtained from the current theme.
 * 
 */
interface Props {
    id: string
    theme: Theme
    classes: any
    fileName: string
    text?: string
    subscribeToTopic?: string
    filter?: object
    [propName: string]: any
}
interface State {
    text: string | undefined
}
class MarkdownViewer extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {text: this.props.text}  
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.token = MB.subscribe(
                this.props.subscribeToTopic, 
                (topic, data) => this.dataLoadedCallback(topic, data), 
                (topic, error) => this.errorCallback(topic, error), this.props.filter)
        }
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
        console.warn(`MarkdownViewer component error for topic {topic} : {error.detail}`)
        this.setState({text: error.detail})
    }

    render() {
        const { id, theme, classes, subscribeToTopic, filter, ...other } = this.props

        if (!this.state.text) {
            return <LoadingIndicator />
        }

        return (
            <div id={id}>
                <Markdown 
                    options={{
                        overrides: {
                            h1: {component: Typography, props: {variant: "h1"}},
                            h2: {component: Typography, props: {variant: "h2"}},
                            h3: {component: Typography, props: {variant: "h3"}},
                            h4: {component: Typography, props: {variant: "h4"}},
                            h5: {component: Typography, props: {variant: "h5"}},
                            h6: {component: Typography, props: {variant: "h6"}},
                            p: {component: Typography, props: {variant: "body1"}},
                            pre: {component: Typography, props: {variant: "pre"}},
                            code: {component: Typography, props: {variant: "code"}},
                            blockquote: {component: Typography, props: {variant: "blockquote"}},
                            ul: {component: Typography, props: {variant: "ul"}},
                            ol: {component: Typography, props: {variant: "ol"}},
                            img: {component: Typography, props: {variant: "img"}}
                        }
                    }}
                    className={classes.root} {...other}>{this.state.text}
                </Markdown>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.MarkdownViewer?.styleOverrides?.root }}
    }
}

export default withStyles(MarkdownViewer.defaultStyles, {withTheme: true})(MarkdownViewer)