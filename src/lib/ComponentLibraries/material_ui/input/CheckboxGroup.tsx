// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { FormControl as MuiFormControl, FormLabel as MuiFormLabel, FormGroup as MuiFormGroup, FormControlLabel as MuiFormControlLabel, Checkbox as MuiCheckbox } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Checkbox Group component - based on the MUI Checkbox Group component.
 * 
 */

class Checkbox {
    value: string
    label: string
}

interface Props {
    name: string
    label: string
    color?: "primary" | "secondary" | undefined
    subscribeToTopic: string
    checkboxesTopic: string
    labelPlacement?: "end" | "start" | "top" | "bottom" | undefined
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    initialValue: string | undefined // CSV of initally selelected checkboxes
    checked: boolean[]
    checkbox: Checkbox[]
    error: boolean
    helperText: string
}

export default class CheckboxGroup extends Component<Props, State> {
    token: Token
    token2: Token
    token3: Token

    constructor(props: Props) {
        super(props)
        this.state = {initialValue: undefined,  checked: [], checkbox: [], error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, "", (topic, value) =>  this.validationCallback(topic, value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, "")
        }
        if (this.props.checkboxesTopic) {
            this.token2 = MB.subscribe(this.props.checkboxesTopic, 
                (topic, checkboxData) => this.checkboxDataLoadedCallback(topic, checkboxData), (topic, error) => this.errorCallback(topic, error))
        }
        if (this.props.subscribeToTopic) {
            this.token3 = MB.subscribe(this.props.subscribeToTopic, 
                (topic, value) => this.dataLoadedCallback(topic, value), (topic, error) => this.errorCallback(topic, error))
        }
    } 

    componentWillUnmount() {
        MB.unsubscribe(this.token, true)
        MB.unsubscribe(this.token2)
        MB.unsubscribe(this.token3)
    }

    checkboxDataLoadedCallback(topic: string, checkboxData: Checkbox[]) {
        if (this.state.initialValue) {
            const valueArray = this.state.initialValue.split(',')
            let newCheckedArray: boolean[] = []
            for (const [index, entry] of checkboxData.entries()) {
                newCheckedArray[index] = false
                for (const v of valueArray) {
                    if (v ===  entry.value) {
                        newCheckedArray[index] = true
                        break
                    }
                }
            }
            this.setState({checkbox: checkboxData,checked: newCheckedArray})
        } else {
            this.setState({checkbox: checkboxData})
        }
    }

    dataLoadedCallback(topic: string, value: string) {
        if (this.state.checkbox && this.state.checkbox.length > 0) {
            const valueArray = value.split(',')
            let newCheckedArray: boolean[] = []
            for (const [index, entry] of this.state.checkbox.entries()) {
                newCheckedArray[index] = false
                for (const v of valueArray) {
                    if (v ===  entry.value) {
                        newCheckedArray[index] = true
                        break
                    }
                }
            }
            this.setState({initialValue: value, checked: newCheckedArray})
        } else {
            this.setState({initialValue: value})
        }
       
        MB.publish(this.props.publishToTopic, value)
    }

    fieldErrorCallback(topic: string, fieldErrorMsg: string) {
        this.setState({error: true, helperText: fieldErrorMsg})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onChangeHandler(event: any, checkboxIndex: number) {
        let newCheckedArray: boolean[] = [...this.state.checked]
        newCheckedArray[checkboxIndex] = event.target.checked
        this.setState({checked: newCheckedArray, error: false, helperText: ""})

        // Build an array containing a value for each checked checkbox.
        let values = []
        for (const [index, ticked] of newCheckedArray.entries()) {
            if (ticked) {
                values.push(this.state.checkbox[index].value)
            }
        }

        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
             MB.publish(this.props.publishToTopic, values.join(','), (topic, value) => this.validationCallback(topic, value) )
        } else {
             MB.publish(this.props.publishToTopic, values.join(','))
        }
    }
    
    validationCallback(topic: string, value: string): boolean {
        let failed: boolean = false
        if (!Array.isArray(this.props.validationRules)) {
            console.warn(`Checkbox Group attribute validationRules must be of type array. Topic = ${topic}`)
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
            this.setState({error: true, helperText: "Fatal error while validating checkbox group."})
        }
        return failed
    }

    createCheckboxes(): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        if (this.state.checkbox && this.state.checkbox.length) {
            for (const [index, item] of this.state.checkbox.entries()) {
                const checkbox: any = (
                    <MuiFormControlLabel
                        control={<MuiCheckbox checked={this.state.checked[index]} color={this.props.color} />}
                        onChange={(event:any) => this.onChangeHandler(event, index)}
                        label={item.label} labelPlacement={this.props.labelPlacement} />
                )
                reactElements.push(checkbox)
            }
        }    
        return reactElements
    }

    render() {
        const {label, color, checkboxesTopic, labelPlacement, subscribeToTopic, publishToTopic, validationRules, ...other} = this.props
        if (checkboxesTopic === undefined || checkboxesTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Checkbox Group component must have a prop of checkboxesTopic"))
            return null
        }
        if (publishToTopic === undefined || publishToTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Checkbox Group component must have a prop of publishToTopic"))
            return null
        }
        // Fix to overcome MUI Checkbox bug where the initial checked setting of checkboxes is not displayed.
        // Only render the checkboxes after we have the list of checkboxes and the initial checked values loaded.
        if (this.state.checkbox.length === 0 || (this.props.subscribeToTopic && this.state.initialValue === undefined)) {
            return null
        }

        return (
            <MuiFormControl component="fieldset" {...other}>
                <MuiFormLabel component="legend">{label}</MuiFormLabel>
                <MuiFormGroup>
                    {this.createCheckboxes()}
                </MuiFormGroup> 
            </MuiFormControl>     
        )
    }
}