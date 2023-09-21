// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import { MB, Token  } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Base64 } from "js-base64"

/**
 * Supports Custom Icons that are loaded from the Topic /Icons/custom/*.svg. The Icons are loaded as html.
 * 
 * Icons can be obtained from https://www.flaticon.com/ or you can create your own.
 */

interface Props {
    id: string
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    svgHtml: string
}

export default class CustomIcon extends Component<Props, State> { 
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {svgHtml: ""}
    }

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, (topic, base64SvgHtml) => this.dataLoadedCallback(topic, base64SvgHtml), (topic, error) => this.errorCallback(topic, error))
    }

    dataLoadedCallback(topic: string, base64SvgHtml: any) {
        if (base64SvgHtml.base64) {
            const svgHtml: string = Base64.decode(base64SvgHtml.base64)
            this.setState({svgHtml: svgHtml})
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }    

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    render() {
        const {id, subscribeToTopic, ...other} = this.props
            
        if (this.state.svgHtml.length > 0) {
            return (<span {...other} dangerouslySetInnerHTML={{__html: this.state.svgHtml}}/>)
        } 
        return null
    }
}