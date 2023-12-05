// © 2023 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, { Component } from "react"
import { FormControl as MuiFormControl, InputLabel as MuiInputLabel, Select as MuiSelect, MenuItem as MuiMenuItem } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Select component - based on the MUI Select component.
 * 
 * Hanldes single select and multi-select dropdowns. With multi-select, the values are
 * passed in and returned as a string containing comma seperated values.
 * Individual values must not contain commas. Labels can contain commas.
 * 
 */

class MenuItem {
    value: string
    label: string
}

interface Props {
    name: string
    multiple: boolean
    label: string
    variant: "filled" | "standard" | "outlined" 
    subscribeToTopic: string
    menuItemsTopic: string
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    value: string | string[]
    menuItem: MenuItem[]
    error: boolean
    helperText: string
}

export default class Select extends Component<Props, State> {
    token: Token
    token2: Token
    token3: Token

    constructor(props: Props) {
        super(props)
        this.state = {value: (this.props.multiple ? [] : ""), menuItem: [], error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, "", (topic, value) => this.validationCallback(topic, value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), 
                (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, "")
        }
        if (this.props.menuItemsTopic) {
            this.token2 = MB.subscribe(this.props.menuItemsTopic, (topic, menuItemData) => this.menuItemsLoadedCallback(topic, menuItemData), 
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

    menuItemsLoadedCallback(topic: string, menuItemData: MenuItem[]) {
        this.setState({menuItem: menuItemData})
    }

    dataLoadedCallback(topic: string, value: string) {
        this.setState({value: this.props.multiple ? value.split(',') : value}) 
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
            MB.publish(this.props.publishToTopic, this.props.multiple ? event.target.value.join(',') : event.target.value)
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
                console.log("Evaluated: " + validationRule.code + " result = " + conditionTrue)
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

    createMenuItems(): React.DOMElement<any,any>[] {
        let reactElements: Array<React.DOMElement<any,any>> = new Array<React.DOMElement<any,any>>()
        if (this.state.menuItem && this.state.menuItem.length) {
            for (const item of this.state.menuItem) {
                const menuItem: any = (
                    <MuiMenuItem value={item.value}>
                        {item.label}
                    </MuiMenuItem>)
                reactElements.push(menuItem)
            }
        }    
        return reactElements
    }

    render() {
        const {multiple, label, menuItemsTopic, subscribeToTopic, publishToTopic, validationRules, variant, ...other} = this.props
        if (menuItemsTopic === undefined || menuItemsTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Select component must have a prop of menuItemsTopic"))
            return null
        }
        if (publishToTopic === undefined || publishToTopic.length === 0) {
            MB.publish("app:errors:", new ErrorMsg("Component Error", "Select component must have a prop of publishToTopic"))
            return null
        }

        return (
            <MuiFormControl variant={variant} {...other}>
                <MuiInputLabel>{label}</MuiInputLabel>
                <MuiSelect
                    multiple={multiple}
                    onChange={(event, child) => this.onChangeHandler(event, child)}
                    label={label}
                    value={this.state.value}>   
                        {this.createMenuItems()}
                </MuiSelect>
            </MuiFormControl>     
        )
    }
}