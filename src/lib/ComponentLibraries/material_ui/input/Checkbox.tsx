// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { FormControl as MuiFormControl, Checkbox as MuiCheckbox, withTheme, FormControlLabel as MuiFormControlLabel} from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Checkbox - based on the MUI Checkbox component.
 * 
 */

interface Props {
    theme: Theme
    name: string
    label: string
    checked?: boolean // Inital state
    subscribeToTopic: string
    labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    checked: boolean
    error: boolean
    helperText: string
}

class Checkbox extends Component<Props, State> {
    token: Token
    token2: Token

    constructor(props: Props) {
        super(props)
        this.state = {checked: this.props.checked ? true : false, error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, this.state.checked, (topic, value) => this.validationCallback(topic,value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic,this.state.checked)
        }
        if (this.props.subscribeToTopic) {
            this.token2 = MB.subscribe(this.props.subscribeToTopic, (topic, checked) => this.dataLoadedCallback(topic, checked), (topic, error) => this.errorCallback(topic, error))
        }
    } 

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2)
    }

    dataLoadedCallback(topic: string, checked: boolean) {
        this.setState({checked: checked})
        MB.publish(this.props.publishToTopic, checked)
    }

    fieldErrorCallback(topic: string, fieldErrorMsg: string) {
        this.setState({error: true, helperText: fieldErrorMsg})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onChangeHandler(event: any) {
        this.setState({checked: event.target.checked})

        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
             MB.publish(this.props.publishToTopic, event.target.checked, (topic, value) => this.validationCallback(topic, value))
        } else {
             MB.publish(this.props.publishToTopic, event.target.checked)
        }
    }
    
    validationCallback(topic: string, value: string): boolean {
        let failed: boolean = false
        if (!Array.isArray(this.props.validationRules)) {
            console.warn(`Checkbox attribute validationRules must be of type array. Topic = ${topic}`)
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
            this.setState({error: true, helperText: "Fatal error while validating checkbox."})
        }
        return failed
    }

    render() {
        const {label, color, subscribeToTopic, publishToTopic, validationRules, ...other} = this.props

        if (publishToTopic === undefined || publishToTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Checkbox component must have a prop of publishToTopic"))
            return null
        }

        return (
            <MuiFormControl component="fieldset">
                <MuiFormControlLabel label={label} {...other}
                    control={<MuiCheckbox checked={this.state.checked} onChange={(event) => this.onChangeHandler(event)} color={color} />} />
            </MuiFormControl>
        )
    }
}

export default withTheme(Checkbox)