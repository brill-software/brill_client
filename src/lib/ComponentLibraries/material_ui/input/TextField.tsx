/* eslint no-eval: 0 */
// © 2022 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component, ChangeEvent} from "react"
import { TextField as MuiTextField } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Text Field component - base on the MUI Text Field component.
 * 
 */

interface Props {
    id: string
    name: string
    subscribeToTopic: string
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    value: string
    error: boolean
    helperText: string
}

export default class TextField extends Component<Props, State> {
    token: Token
    token2: Token

    constructor(props: Props) {
        super(props)
        this.state = {value: "", error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, "", (topic, value) => this.validationCallback(topic, value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), 
                (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, "")
        }
        if (this.props.subscribeToTopic) {
            this.token2 = MB.subscribe(this.props.subscribeToTopic, (topic, fieldValue) => this.dataLoadedCallback(topic, fieldValue), 
                (topic, error) => this.errorCallback(topic, error))
        } 
    } 

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2)
    }

    dataLoadedCallback(topic: string, fieldValue: any) {
        this.setState({value: fieldValue})
        MB.publish(this.props.publishToTopic, fieldValue)
    }

    fieldErrorCallback(topic: string, fieldErrorMsg: string) {
        this.setState({error: true, helperText: fieldErrorMsg})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onChangeHandler(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        this.setState({value: event.target.value, error: false, helperText: ""})
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
             MB.publish(this.props.publishToTopic, event.target.value, (topic,value) => this.validationCallback(topic, value) )
        } else {   
            MB.publish(this.props.publishToTopic, event.target.value)
        }
    }
    
    validationCallback(topic: string, value: string): boolean {
        let failed: boolean = false
        if (!Array.isArray(this.props.validationRules)) {
            console.warn(`TextField attribute validationRules must be of type array. Topic = ${topic}`)
            this.setState({error: true, helperText: "Page Error: validation rules must be of type array."})
            return true
        }
        try {
            this.props.validationRules.forEach( (validationRule: ValidationRule) => {
                const conditionTrue = Eval.isTrue(this.props.id, validationRule.code, value)
                if (!failed && conditionTrue) {
                    failed = true
                    this.setState({error: true, helperText: validationRule.errorMsg})
                }
            })
        } catch (error) {
            console.warn(`Exception while evaluating validation rules for topic %s : %s`, topic, ErrorUtils.cvt(error))
            failed = true
            this.setState({error: true, helperText: "Fatal error while validating field."})
        }
        return failed
    }

    render() {
        const {id, name, subscribeToTopic, publishToTopic, validationRules, ...other} = this.props
        if (publishToTopic === undefined || publishToTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "TextField must have a prop of publishToTopic"))
            return null
        }

        return (
            <MuiTextField {...other} onChange={event => this.onChangeHandler(event)}
                error={this.state.error} 
                helperText={this.state.helperText}
                value={this.state.value}
                InputLabelProps={{shrink: true}}
                {...other}
            />            
        )
    }
}