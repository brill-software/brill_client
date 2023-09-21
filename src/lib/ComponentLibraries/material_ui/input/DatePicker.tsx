// © 2022 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, { Component } from "react"
import dayjs from 'dayjs';
import "dayjs/locale/en-gb"
import "dayjs/locale/de"
import "dayjs/locale/fr"
import "dayjs/locale/es"
import { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers'
import { ValidationRule } from "lib/PageService/Page"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"

/**
 * Date Picker component - base on the MUI v6 Date Picker component.
 * 
 */

interface Props {
    id: string 
    locale?: string
    format: string // e.g. YYYY-MM-DD
    subscribeToTopic?: string // Date string in YYYY-MM-DD format.
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}
 
interface State {
    value: string
    error: boolean
    helperText: string
}

export default class DatePicker extends Component<Props, State> {
    token: Token
    token2: Token



    constructor(props: Props) {
        super(props)
        const date = new Date()
        const currentDateStr = `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        this.state = {value: currentDateStr, error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, this.state.value, (topic, value) => this.validationCallback(topic, value) )
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), 
                (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, this.state.value)
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

    onChangeHandler(newValue: Dayjs| null) {
        if (newValue !== null) {
            const date =  newValue?.format("YYYY-MM-DD")
            if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
                 MB.publish(this.props.publishToTopic, date, (topic, date) => this.validationCallback(topic, date) )
            } else {   
                MB.publish(this.props.publishToTopic, date)
            }
            this.setState({value: date})
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
        const {id, locale, format, subscribeToTopic, publishToTopic, validationRules, ...other} = this.props
       
        return (
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
                <MuiDatePicker 
                    label="Date"
                    format={format}
                    value={dayjs(this.state.value)}
                    onChange={(newValue: Dayjs | null) => this.onChangeHandler(newValue)}
                    {...other} />
            </LocalizationProvider>         
        )
    }
}