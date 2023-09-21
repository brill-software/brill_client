// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { Typography as MuiTypography } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Typography - based on MUI Typography component but also supports inline HTML tags such as <b> for bold and <i> for Italic.
 * 
 * DOMPurify is used to gaurd against Cross-site scripting (XSS) attacks. Only certain tags and attributes are allowed, with any 
 * disallowed tags and attributes removed. 
 * 
 */

interface Props {
    id: string
    text: string // Can include HTML tags.
    subscribeToTopic?: string
    [propName: string]: any
}

interface State {
    text: string
}
export default class Typography extends Component<Props, State> {
    unsubscribeToken: Token

    public static defaultProps = {
        text: ""
    }

    constructor(props: Props) {
        super(props)
        this.state = {text: props.text}
    }

    componentDidMount() {
        if (this.props.subscribeToTopic) {
            this.unsubscribeToken = MB.subscribe(this.props.subscribeToTopic, (topic, text) => this.dataLoadedCallback(topic, text), 
                (topic, error) => this.errorCallback(topic, error))
        }
    }    

    dataLoadedCallback(topic: string, text: string) {
        this.setState({text: text})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    componentWillUnmount() {
        if (this.props.subscribeToTopic) {
            MB.unsubscribe(this.unsubscribeToken)
        }
    }

    render() {
        const {id, subscribeToTopic, text, ...other} = this.props

        return (
            <MuiTypography
                {...other}
                dangerouslySetInnerHTML={{__html: Html.sanitize(this.state.text)}}
            />
        )
    }
}