// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { MB, Token } from "lib/MessageBroker/MB"
import React, {Component} from "react"
import { Alert, AlertTitle, AlertColor } from "@mui/lab"
import Draggable from "react-draggable"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Alert component - based on Material UI Alert component.
 * 
 */

interface Props {
    subscribeToTopic: string
    clearOnChangeToTopic: string
    [propName: string]: any
}

interface State {
    error: ErrorMsg | null
}

export default class Div extends Component<Props, State> {
    token: Token
    token2: Token

    constructor(props: Props) {
        super(props)
        this.state = {error: null}  
    }
    
    componentDidMount() {
        this.token = MB.subscribe(
            this.props.subscribeToTopic, 
            (topic, errorMsg) => this.dataLoadedCallback(topic, errorMsg), 
            (topic, errorMsg) => this.errorCallback(topic, errorMsg))
        this.token2 = MB.subscribe(
                this.props.clearOnChangeToTopic, 
                (topic, data) => this.clearCallback(topic, data), 
                (topic, errorMsg) => this.errorCallback(topic, errorMsg))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.token2)
    }  

    dataLoadedCallback(topic: string, errorMsg: ErrorMsg) {
        this.setState({error: errorMsg})
    }

    errorCallback(topic: string, errorMsg: ErrorMsg) {
        this.setState({error: errorMsg})
    }

    clearCallback(topic: string, data: any) {
        this.setState({error: null})
    }

    onClose() {
        this.setState({error: null})
        // Clear any other alerts.
        MB.publish(this.props.subscribeToTopic, undefined);
    }

    render() {
        const {subscribeToTopic, clearOnChangeToTopic, ...other} = this.props
        
        if (this.state.error) {
            const {title, detail, severity} = this.state.error
            return (
                <div style={{position: "relative"}}>
                    <div style={{position: "absolute", zIndex: 15}}>
                        <Draggable handle=".handle">
                            <Alert className="handle" severity={severity as AlertColor} onClose={() => {this.onClose()}} {...other}>
                            <AlertTitle>{title}</AlertTitle>
                                <div dangerouslySetInnerHTML={{__html: Html.sanitize(detail)}} />
                            </Alert>
                        </Draggable>
                    </div>
                </div>
            )
        }
        return null
    }
}