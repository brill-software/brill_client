// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { MB, Token } from "lib/MessageBroker/MB"
import React, {Component} from "react"
import { Alert as MuiAlert, AlertTitle as MuiAlertTitle, AlertColor } from "@mui/material"
import Draggable from "react-draggable"
import { Html } from "lib/utils/HtmlUtils"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * Alert component - based on Material UI Alert component.
 * 
 */

interface Props {
    classes: any
    subscribeToTopic: string
    clearOnChangeToTopic: string
    [propName: string]: any
}

interface State {
    error: ErrorMsg | null
}

class Alert extends Component<Props, State> {
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
        const {classes, subscribeToTopic, clearOnChangeToTopic, ...other} = this.props
        
        if (this.state.error) {
            const {title, detail, severity} = this.state.error
            const classNames = classes.root + " handle"
            return (
                <div style={{position: "relative"}}>
                    <div style={{position: "absolute", zIndex: 15}}>
                        <Draggable handle=".handle">
                            <MuiAlert className={classNames} severity={severity as AlertColor} onClose={() => {this.onClose()}} {...other}>
                            <MuiAlertTitle className={classes.title}>{title}</MuiAlertTitle>
                                <div dangerouslySetInnerHTML={{__html: Html.sanitize(detail)}} />
                            </MuiAlert>
                        </Draggable>
                    </div>
                </div>
            )
        }
        return null
    }

    static defaultStyles(theme: Theme): any {
        return  {
            root: {
                cursor: "move", 
                ...theme.components?.Alert?.styleOverrides?.root },
            title: { ...theme.components?.Alert?.styleOverrides?.title }
        }
    }
}

export default withStyles(Alert.defaultStyles)(Alert)