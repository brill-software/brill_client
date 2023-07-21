// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Button as MuiButton } from "@mui/material"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import Router, { ROUTER_CURRENT_ROUTE } from "lib/Router/Router"
import withStyles from "@mui/styles/withStyles"

/**
 * Displays a button that acts as a menu bar link. If the current page matchs the link, a bar is displayed under the
 * button to indicate which page the user is currently on.
 */

const defaultStyles: any = (theme: Theme) => {
    const root = (theme.overrides?.MenuButton?.root) ? theme.overrides.MenuButton.root : {color: "white"}
    const button = (theme.overrides?.MenuButton?.button) ? theme.overrides.MenuButton.button : {padding: "10px 8px 2px 8px"}
    const bar = (theme.overrides?.MenuButton?.bar) ? theme.overrides.MenuButton.bar : {width: "100%", height: "5px", background: "red"}
    return  { 
        root: {
            ...root
        },
        button: {
            ...button
        },
        bar: {
            ...bar
        }
  }}

interface Props {
    id: string
    theme: Theme
    classes: any
    title: string
    route: string
    [propName: string]: any
}

interface State {
    onPage: Boolean // Set to true when user is on the page that matches the props route. Bar displayed.
}

class MenuButton extends Component<Props, State> {
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {onPage: false}
    }

    componentDidMount() {
        this.token = MB.subscribe(ROUTER_CURRENT_ROUTE, (topic, text) => this.dataLoadedCallback(topic, text), (topic, error) => this.errorCallback(topic, error))
    }

    dataLoadedCallback(topic: string, text: string) {
        /*eslint no-template-curly-in-string: "off"*/
        const fullRoute = this.props.route.replace("${appName}", MB.getCurrentApp())
        this.setState({onPage: (text.endsWith(fullRoute))})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onClickHandler() {
        Router.goToPage(this.props.route)
    }

    render() {
        const {id, classes, theme, title, ...other} = this.props

        let barClass = (this.state.onPage) ? classes.bar : ""
        return (
            <div className={classes.root}>
                <MuiButton className={classes.button} color="inherit" {...other} onClick={() => this.onClickHandler()}>{title}</MuiButton>  
                <div className={barClass}> </div>
            </div>
        )
    }
}

export default withStyles(defaultStyles, { name: "MenuButton"})(MenuButton)