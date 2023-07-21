// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { FormControl as MuiFormControl, FormLabel as MuiFormLabel, RadioGroup as MuiRadioGroup, FormControlLabel as MuiFormControlLabel, Radio as MuiRadio } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Radio buttons group component - based on the MUI RadioGroup component.
 * 
 */

class Button {
    value: string
    label: string
}

interface Props {
    name: string
    label: string
    color?: "primary" | "secondary" | undefined
    subscribeToTopic: string
    buttonsTopic: string
    labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    value: string
    button: Button[]
    error: boolean
    helperText: string
}

export default class RadioGroup extends Component<Props, State> {
    token: Token
    token2: Token
    token3: Token

    constructor(props: Props) {
        super(props)
        this.state = {value: "", button: [], error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, "", (topic, value) => this.validationCallback(topic, value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), 
                (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, "")
        }
        if (this.props.buttonsTopic) {
            this.token2 = MB.subscribe(this.props.buttonsTopic, (topic, buttonData) => this.buttonDataLoadedCallback(topic, buttonData), 
                (topic, error) => this.errorCallback(topic, error))
        }
        if (this.props.subscribeToTopic) {
            this.token3 = MB.subscribe(this.props.subscribeToTopic, (topic, value) => this.dataLoadedCallback(topic, value), 
                (topic, error) => this.errorCallback(topic, error))
        }
    } 

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2)
        MB.unsubscribe(this.token3)
    }

    buttonDataLoadedCallback(topic: string, buttonData: Button[]) {
        this.setState({button: buttonData})
    }

    dataLoadedCallback(topic: string, value: string) {
        this.setState({value: value}) 
        MB.publish(this.props.publishToTopic, value)
    }

    fieldErrorCallback(topic: string, fieldErrorMsg: string) {
        this.setState({error: true, helperText: fieldErrorMsg})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onChangeHandler(event: any, child: any) {
        this.setState({value: event.target.value, error: false, helperText: ""})
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, event.target.value, (topic, value) => this.validationCallback(topic, value) )
        } else {
            MB.publish(this.props.publishToTopic, event.target.value)
        }
    }
    
    validationCallback(topic: string, value: string): boolean {
        let failed: boolean = false
        if (!Array.isArray(this.props.validationRules)) {
            console.warn(`Radio Group attribute validationRules must be of type array. Topic = ${topic}`)
            this.setState({error: true, helperText: "Page Error: validation rules must be of type array."})
            return true
        }
        try {
            this.props.validationRules.forEach( (validationRule: ValidationRule) => {
                const conditionTrue = Eval.isTrue(this.props.id, validationRule.code, value)
                console.log("Evaluated: " + validationRule.code + " result = " + conditionTrue)
                if (!failed && conditionTrue) {
                    failed = true
                    this.setState({error: true, helperText: validationRule.errorMsg})
                }
            })
        } catch (error) {
            console.warn(`Exception while evaluating validation rules for topic %s : %s`, topic, ErrorUtils.cvt(error))
            failed = true
            this.setState({error: true, helperText: "Fatal error while validating radio buttons group."})
        }
        return failed
    }

    createButtons(): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        if (this.state.button && this.state.button.length) {
            for (const [index,item] of this.state.button.entries()) {
                const button: any = (
                    <MuiFormControlLabel key={index} value={item.value} control={<MuiRadio color={this.props.color} />} label={item.label} labelPlacement={this.props.labelPlacement} />
                )
                reactElements.push(button)
            }
        }    
        return reactElements
    }

    render() {
        const {label, color, buttonsTopic, labelPlacement, subscribeToTopic, publishToTopic, validationRules, ...other} = this.props
        if (buttonsTopic === undefined || buttonsTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Radio Group component must have a prop of buttonsTopic"))
            return null
        }
        if (publishToTopic === undefined || publishToTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Radio Group component must have a prop of publishToTopic"))
            return null
        }
        if (this.state.button.length === 0) {
            return null
        }

        return (
            <MuiFormControl  error={this.state.error} {...other}>
                <MuiFormLabel>{label}</MuiFormLabel>
                <MuiRadioGroup
                    value={this.state.value}
                    onChange={(event, child) => this.onChangeHandler(event, child)}>
                    {this.createButtons()}
                </MuiRadioGroup>
                <MuiFormLabel>{this.state.helperText}</MuiFormLabel>
            </MuiFormControl>     
        )
    }
}