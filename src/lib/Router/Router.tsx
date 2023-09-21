// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, { Component } from "react"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { Page } from "lib/PageService/Page"
import { ErrorUtils } from "lib/utils/ErrorUtils";
import { MB, Token } from "lib/MessageBroker/MB"
import { PageService } from "lib/PageService/PageService"
import { createBrowserHistory } from "history"
import { Site } from "lib/SiteManager/SiteManager"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator";

/**
 * Handles routing between pages.
 * 
 */

const history = createBrowserHistory()

class Props {
}

class State {
    site: Site | undefined
    page: Page | undefined
    error: Error | undefined
}
const SITE_JSON_TOPIC = "json:/global/site.json"
const PAGE_COMPOSER_NEXT_PAGE = "router.nextPage"
export const ROUTER_CURRENT_ROUTE = "router.currentRoute"
const ERROR_MESSAGE_TOPIC_TOPIC = "error.topic"
const ERROR_MESSAGE_TITLE_TOPIC = "error.title"
const ERROR_MESSAGE_DETAIL_TOPIC = "error.detail"

export default class Router extends Component<Props,State> {
    token: Token
    pageToken: Token
    private static notFoundPage: string = ""

    constructor(props: Props) {
        super(props);
        this.state = { site: undefined, page: undefined, error: undefined }
    }

    public static goToPage(route: string | undefined) {
        if (route) {
            /*eslint no-template-curly-in-string: "off"*/
            if (route.startsWith("/${appName}/")) {
                route = "/" + MB.getCurrentApp() + route.substr(11)
            }
            MB.publish(PAGE_COMPOSER_NEXT_PAGE, route)
            // Clear any errors from the previous page.
            MB.publish("app:errors:", null)
        } else {
            console.log("Route is undefined")
            if (Router.notFoundPage) {
                MB.publish(PAGE_COMPOSER_NEXT_PAGE, Router.notFoundPage)
                MB.publish("app:errors:", null)
            }
        }
    }

    public static goBackToPreviousPage() {
        history.goBack()
    }

    public static getCurrentPage(): string {
        const path = history.location
        return path.pathname
    }

    componentDidMount() {
        this.token = MB.subscribe(SITE_JSON_TOPIC, 
            (topic, site) => this.handleSiteDataLoaded(topic, site),
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.pageToken)
    }

    errorCallback(topic: string, error: ErrorMsg) {
        if (error.detail.indexOf("Please login") >= 0 && topic.indexOf("login.json") === -1 &&
            this.state.site && this.state.site.loginPage) {
            Router.goToPage(this.state.site.loginPage)
            return
        } else {
            if (error.detail.indexOf("permission")) {
                return
            }
        }

        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
        if (this.state.site && this.state.site.notFoundPage) {
            MB.publish(ERROR_MESSAGE_TOPIC_TOPIC, `Topic:  ${topic}`)
            MB.publish(ERROR_MESSAGE_TITLE_TOPIC, `Error:  ${error.title}`)
            MB.publish(ERROR_MESSAGE_DETAIL_TOPIC, `Detail: ${error.detail}`)
            Router.goToPage(this.state.site.notFoundPage)
        } else {
            this.setState({error: ErrorUtils.cvt(topic + " " + error.title + " " + error.detail)}) 
        } 
    }

    handleSiteDataLoaded(topic: string, site: Site) {
        console.log("handleSiteDataLoaded - topic = " + topic)
        this.setState({site: site})
        Router.notFoundPage = site.notFoundPage
        history.listen(this.historyChange.bind(this))
        MB.subscribe(PAGE_COMPOSER_NEXT_PAGE, 
            (topic, path) => this.navigateToNewPage(topic, path), 
            (topic, error) => this.errorCallback(topic, error))
        // console.log("Constructor history location = " + JSON.stringify(history.location))
        if (history.location.pathname === "/") {
                history.replace(site.homePage, {})
        } else {
            if (!this.isValidPath(history.location.pathname) && this.state.site && this.state.site.notFoundPage) {
                // TODO
                MB.publish(ERROR_MESSAGE_DETAIL_TOPIC, `The path ${history.location.pathname} is invalid. Page not found.`)
                history.location.pathname = this.state.site.notFoundPage
            }

            MB.setCurrentApp(this.getAppName(history.location.pathname))
            const topic = this.getTopicFromPath(history.location.pathname)
            MB.publish(ROUTER_CURRENT_ROUTE, history.location.pathname)
            this.pageToken = MB.subscribe(topic, 
                (topic, page) => this.loadPageCallback(topic, page), 
                (topic, error) => this.errorCallback(topic, error))
        }
    }

    async historyChange(location: any, action: any) {

        console.log(`The current URL is ${location.pathname}${location.search}${location.hash}`)
        console.log(`The last navigation action was ${action}`)
        MB.publish(ROUTER_CURRENT_ROUTE, history.location.pathname)
        MB.setCurrentApp(this.getAppName(history.location.pathname));
        const topic = this.getTopicFromPath(history.location.pathname)
        MB.unsubscribe(this.pageToken)
        this.pageToken = MB.subscribe(topic, 
            (topic, page) => this.loadPageCallback(topic, page), 
            (topic, error) => this.errorCallback(topic, error))    
    }

    /**
     * Check path contains a second slash.
     * 
     * @param path 
     * 
     */
    private isValidPath(path: string) {
        if (path.length > 2) {
            if (path.indexOf('/', 2) === -1) {
                return false
            }
        }
        return true
    }

    /**
     * Gets the app name from the path. The app name is the string between the first and second slashes.
     * With a path of "/brill_cms/home" the app name returned would be "brill_cms".
     * 
     * If the path doesn't contain two slashes the default name returned is "global".
     * 
     * @param path 
     * 
     */
    private getAppName(path: string): string {
        let appName = "global"
        if (path.length > 2) {
            const secondSlash = path.substr(2).indexOf('/') + 1
            if (secondSlash > 0) {
                appName = path.substr(1, secondSlash)
            }  
        }
        return appName
    }

    /**
     * Converts a path name to a relative Topic. The app name is removed, a /Pages directory added and 
     * an extention of .json added.
     * 
     * For example: a path of /brill_cms/home would be returned as topic /Pages/home.json. When sent to the
     * Server the Message Broker will convert it to an absolute file:/brill_cms/Pages/home.json
     * 
     * @param path 
     * 
     */
    private getTopicFromPath(path: string): string {
        let topic = ""
        if (path.length > 2) {
            const secondSlash = path.substr(2).indexOf('/') + 1
            if (secondSlash > 0) {
                topic = "/Pages" + path.substr(secondSlash + 1) + ".json"
            }
        }
        return topic
    }

    async loadPageCallback(topic: string, page: Page) {
        try {
            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)

            // Import the page component modules in parallel. Await completion of all the imports before carrying on.
            await Promise.all(uniqueImports.map( async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)
            }))
            this.setState({page: page})
        } catch (error) {
            this.setState({error: ErrorUtils.cvt(error)})
        }
    }

    async navigateToNewPage(topic: string, path: string) {
        history.push(path)
    }

    render() {
        if (this.state.error !== undefined) {
            return <div><p>Error while loading page: {this.state.error.message}</p></div>
        }

        if (this.state.page === undefined) {
            return <LoadingIndicator />
        }      
        
        const reactElements: React.CElement<any,any> = PageService.createReactElements(this.state.page.rootComponent)

        return (
            <div>
                {reactElements}
            </div>
            )
    }
}