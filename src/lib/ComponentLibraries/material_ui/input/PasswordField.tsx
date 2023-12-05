// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component, ChangeEvent} from "react"
import { TextField as MuiTextField } from "@mui/material"
import { MB, Token } from "lib/MessageBroker/MB"
import { Eval } from "lib/utils/Eval"
import { ValidationRule } from "lib/PageService/Page"
import { HashUtils } from "lib/utils/HashUtils"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Password entry field. Based on the TextField component.
 * 
 * The password has to be at least 8 characters long and is checked against a list of common
 * passwords.
 * 
 * A "pepper" string is appended to the password to make it difficult for a hacker to carry 
 * out a dictionary style attack. The hacker needs to know the pepper and can't use a pre-built
 * dictionary. The pepper is held in the application.yaml file and should be made different between
 * development and production systems,to prevents copying of password hashes from one system to another.
 * 
 */

const COMMON_PASSWORDS = ["12345", "abcdef", "qwerty", "password", "abc123", "iloveyou", "1q2w3e4", "11111", "77777", "zaq123", "dragon", "sunshine", 
                          "princess", "letmein", "54321", "monkey", "1qaz", "superman", "asdfg", "2wsx", "ghjkl", "00000", "yuiop", "56789",
                          "azerty", "football", "ashley", "baseball", "basketball", "secret", "starwars", "batman", "login", "admin"]

const MIN_PWD_LEN = 8                          
interface Props {
    id: string
    publishToTopic: string
    validationRules: ValidationRule[]
    [propName: string]: any
}

interface State {
    pepper: string
    error: boolean
    helperText: string   
}

export default class PasswordField extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {pepper: "", error: false, helperText: ""}
    }

    componentDidMount() {
        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, "", (topic, value) => this.validationCallback(topic, value))
            this.token = MB.subscribe("fieldErrors", (topic, fieldErrorMsg) => this.fieldErrorCallback(topic, fieldErrorMsg), 
                (topic, error) => this.errorCallback(topic, error))
        } else {
            MB.publish(this.props.publishToTopic, "")
        }
        this.token = MB.subscribe("config:/passwords.pepper", (topic, configValue) => this.dataLoadedCallback(topic, configValue), 
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    dataLoadedCallback(topic: string, configValue: string) {
        this.setState({pepper: configValue})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.log(error.detail)
    }    

    fieldErrorCallback(topic: string, fieldErrorMsg: string) {
        this.setState({error: true, helperText: fieldErrorMsg})
    }

    async onChangeHandler(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        this.setState({error: false, helperText: ""})
        if (!this.isAcceptablePassword(event.target.value)) {
            MB.publish(this.props.publishToTopic, "")
            return
        }
        
        const hashHex = await HashUtils.hashPwd(this.state.pepper, event.target.value)

        if (this.props.validationRules !== undefined && this.props.validationRules.length > 0) {
            MB.publish(this.props.publishToTopic, hashHex, (topic, value) => this.validationCallback(topic, value))
        } else {
            MB.publish(this.props.publishToTopic, hashHex)
        }
    }

    isAcceptablePassword(pwd: string) {
        if (pwd.length < MIN_PWD_LEN) {
            return false
        }
        const lowerCasePwd = pwd.toLowerCase()
        for (const searchStr of COMMON_PASSWORDS) {
            if (lowerCasePwd.indexOf(searchStr) !== -1) {
                return false
            }
        }
        return true
    }

    validationCallback(topic: string, value: string): boolean {
        let failed: boolean = false
        this.props.validationRules.forEach( (validationRule: ValidationRule) => {
            if (!failed && Eval.isTrue(this.props.id, validationRule.code, value)) {
                failed = true
                this.setState({error: true, helperText: validationRule.errorMsg})
            }
        })
        return failed
    }

    render() {
        const {id, publishToTopic, validationRules, ...other} = this.props
        if (publishToTopic === undefined || publishToTopic.length === 0) {
            throw new Error(`Password field ${id} must have a prop of publishToTopic`)
        }

        if (!this.state.pepper) {
            return null
        }

        return (
            <MuiTextField
                autoComplete=""
                type="password"
                onChange={event => this.onChangeHandler(event)}
                error={this.state.error} 
                helperText={this.state.helperText}
                {...other}
            />
        )
    }
}