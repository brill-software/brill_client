// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
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

class MenuButtonV2 extends Component<Props, State> {
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

        let barClass = (this.state.onPage) ? classes.bar : classes.no_bar
        return (
            <div className={classes.root}>
                <MuiButton 
                    sx={{":hover": {bgcolor: theme.palette.primary.light}}} 
                    className={classes.button} 
                    color="inherit" {...other} 
                    onClick={() => this.onClickHandler()}>
                        {title}
                </MuiButton>  
                <div className={barClass}> </div>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { 
            root: {
                color: "white", 
                ...theme.components?.MenuButton?.styleOverrides?.root
            },
            button: {
                // Hover only appears works reliably when set using the sx attribute.
                // "&:hover": {background: theme.palette.primary.light},
                padding: "10px 8px 2px 8px",
                ...theme.components?.MenuButton?.styleOverrides?.button
            },
            bar: {
                width: "100%", 
                height: "5px", 
                background: theme.palette.secondary.main,
                ...theme.components?.MenuButton?.styleOverrides?.bar
            },
            no_bar: {
                width: "100%", 
                height: "5px", 
                ...theme.components?.MenuButton?.styleOverrides?.no_bar
            }
        }
    }
}

export default withStyles(MenuButtonV2.defaultStyles, {withTheme: true})(MenuButtonV2)