// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles"
import { MB, Token } from "lib/MessageBroker/MB"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Paper } from "@mui/material"
import { LocalStorage } from "lib/utils/LocalStorage"

/**
 * Theme Provider.
 * 
 * Supports either one theme or two themes (one light, one dark). For two themes, the prop themeTopicDark
 * must be supplied to specify the dark theme. The theme can be switched by publishing a string to the
 * topic "theme_provider.switch". The current theme is published to the topic "theme_provider.dark_theme"
 * as either "Y" for the dark theme or "N" for the light theme. These topics are used by the 
 * ThemeSwitchButton compoment.
 * 
 * The current theme is saved to local storage so that the choice is remembered for when the user visits
 * again.
 * 
 */
interface Props {
    children: any
    themeTopic: string
    themeTopicDark?: string
    [propName: string]: any
}

interface State {
    theme: Theme | undefined
}

export const THEME_PROVIDER_SWITCH_TOPIC = "theme_provider.switch" // Publishing to this topic switches the theme
export const THEME_PROVIDER_DARK_TOPIC = "theme_provider.dark_theme" // Current theme. Y for dark or N for light
const IS_DARK_THEME_KEY = ".dark_theme" // Local Storage Key - Value is either Y or N
export default class ThemeProvider extends Component<Props, State> {
    dark: boolean = false
    unsubscribeTokenLight: Token
    unsubscribeTokenDark: Token
    unsubscribeTokenSwitch: Token
    themeLight: Theme | undefined
    themeDark: Theme | undefined

    constructor(props: Props) {
        super(props);
        this.state = {theme: undefined};
    }

    /**
     * Convenience method to allow other components to switch the theme.
     */
    public static switchLightDark() {
        MB.publish(THEME_PROVIDER_SWITCH_TOPIC, "switch")
    }

    componentDidMount() {
        this.dark = this.isSavedThemeDark()
        this.unsubscribeTokenLight = MB.subscribe(this.props.themeTopic, 
            (topic, data) => this.themeLightLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
        if (this.props.themeTopicDark) {
            this.unsubscribeTokenDark = MB.subscribe(this.props.themeTopicDark, 
                (topic, data) => this.themeDarkLoadedCallback(topic, data), 
                (topic,error) => this.errorCallback(topic, error))
        }
        this.unsubscribeTokenSwitch = MB.subscribe(THEME_PROVIDER_SWITCH_TOPIC, 
            (topic, data)  => this.switchCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
    }

    themeLightLoadedCallback(topic: string, data: Theme) {
        this.themeLight = createTheme(data)
        if (!this.dark || this.props.themeTopicDark === undefined) {
            this.setBodyAndHtmlTagStyles(this.themeLight)
            MB.publish(THEME_PROVIDER_DARK_TOPIC, "N")
            this.setState({theme: this.themeLight})
        }
    }

    themeDarkLoadedCallback(topic: string, data: Theme) {
        this.themeDark = createTheme(data)
        if (this.dark) {
            this.setBodyAndHtmlTagStyles(this.themeDark)
            MB.publish(THEME_PROVIDER_DARK_TOPIC, "Y")
            this.setState({theme: this.themeDark})
        }
    }

    private setBodyAndHtmlTagStyles(theme: Theme) {
        if (theme.typography.html?.style) {
            for (const styleKey in theme.typography.html.style) {
                (document.documentElement.style as any)[styleKey] = (theme.typography.html.style as any)[styleKey]
            }
        }
        if (theme.typography.body?.style) {
            for (const styleKey in theme.typography.body.style) {
                (document.body.style as any)[styleKey] = (theme.typography.body.style as any)[styleKey]
            }
        }
    }

    private unsetBodyAndHtmlTagStyles(theme: Theme) {
        if (theme?.typography.html?.style) {
            for (const styleKey in theme.typography.html.style) { 
                (document.documentElement.style as any)[styleKey] = null
            }
        }
        if (theme?.typography.body?.style) {
            for (const styleKey in theme.typography.body.style) { 
                if (styleKey !== "margin") { // Don't unload margin as default margin of <body> is 8px.
                    (document.body.style as any)[styleKey] = null
                } 
            }
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    /**
     * Callback that switches the theme between light and dark.
     * 
     * @param topic 
     * @param content 
     * @returns 
     */
    switchCallback(topic: string, content: string) {
        if (!this.dark && this.props.themeTopicDark && this.themeLight && this.themeDark) {
            // Switch to dark theme
            this.dark = true
            this.saveTheme()
            this.unsetBodyAndHtmlTagStyles(this.themeLight)
            this.setBodyAndHtmlTagStyles(this.themeDark)
            MB.publish(THEME_PROVIDER_DARK_TOPIC, "Y")
            this.setState({theme: this.themeDark})
            return
        }

        if (this.dark && this.themeLight && this.themeDark) {
            // Switch to light theme
            this.dark = false
            this.saveTheme()
            this.unsetBodyAndHtmlTagStyles(this.themeDark)
            this.setBodyAndHtmlTagStyles(this.themeLight)
            MB.publish(THEME_PROVIDER_DARK_TOPIC, "N")
            this.setState({theme: this.themeLight})
        }
    }

    /**
     * Checks the local storage to see if the user was previously using the dark theme.
     * 
     * @returns True if user was previously using the dark theme, otherwise false.
     */
    private isSavedThemeDark(): boolean {
        const isDarkTheme = LocalStorage.getValue(MB.getCurrentApp() + IS_DARK_THEME_KEY)
        return (isDarkTheme === "Y")
    }

    /**
     * Saves the current theme to local storage.
     */
    private saveTheme() {
        LocalStorage.setValue(MB.getCurrentApp() + IS_DARK_THEME_KEY, this.dark ? "Y" : "N")
    }

    componentWillUnmount() {
        if (this.dark && this.themeDark) {
            this.unsetBodyAndHtmlTagStyles(this.themeDark)
        }
        if (!this.dark && this.themeLight) {
            this.unsetBodyAndHtmlTagStyles(this.themeLight)
        }
        MB.unsubscribe(this.unsubscribeTokenLight)
        MB.unsubscribe(this.unsubscribeTokenDark)
        MB.unsubscribe(this.unsubscribeTokenSwitch)
    }

    render() {
        if (this.state.theme === undefined) {
            // 
            return null
        }

        const {themeTopic, themeTopicDark, ...other} = this.props

        return (
            <MuiThemeProvider theme={this.state.theme}>
                <Paper {...other}>
                    {this.props.children}
                </Paper>         
            </MuiThemeProvider>
        )
    }
}