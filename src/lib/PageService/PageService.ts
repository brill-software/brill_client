// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React from "react"
import { Attributes, PageComponent } from "lib/PageService/Page"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { IdGen } from "lib/utils/IdGen"

/**
 * Page Service
 * 
 * Provides some crucial helper methods for dynamically importing the components required by
 * a page and for converting a JSON page into React elements.
 * 
 */

export class PageService {
    /**
      * Searches through a page to get a list of the modules that need to be imported. The method
      * is recursive and imports are only added once to the return map.
      * 
      * Example:
      * 
      * const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
      * await Promise.all(uniqueImports.map( async (moduleName: string) => {
      *        await ComponentManager.loadComponent(moduleName)}))
      * 
      * @param components The page components to scan for modules to import.
      * @returns An array of modules to import, with no duplicates.
      * 
      */
    static getUniqueImports(component: PageComponent): Array<string> {
        let uniqueImportsSet: Set<string> = new Set()
        if (component) {
            uniqueImportsSet.add(component.module)
            if (component.children) {
                for (let child of component.children) {
                    const childImports = this.getUniqueImports(child)
                    for (const childImport of childImports) {
                        uniqueImportsSet.add(childImport)
                    }
                }
            }
        } 
        return Array.from(uniqueImportsSet)
    }

    /**
     * Converts a JSON page to React elements. At the top level there's a root component that has a
     * whole tree of child components. The method traverses the component tree using recursion.
     * 
     * For components that don't have a "key" attribute, a "key" attribute is added with a value of a
     * uniquely allocated id. React uses the "key" to save re-rendering components. Allocating
     * a unique id results in React always rendering  a component and  removes the risk that
     * components doesn't get re-rendered. Auto genertated keys are prefixed with "A-".
     * 
     * The "key" attribute can be specified for components on a page if required. This is useful to
     * prevent a re-render of title bars and menus. The Brill Software web site has key attributes
     * defined for the top part of each page so that the header isn't re-rendered when the user moves
     * from one page to the next.
     *  
     * @param components Array of PageComponent.
     * @returns Array of React Elements.
     */
    static createReactElements(component: PageComponent): React.CElement<any, any> {
        const module: any = ComponentManager.getAlreadyLoadedComponent(component.module)
        let attribs: Attributes = component.attributes

        // Add a key attribute if there isn't already one.
        if (!attribs["key"]) {
            attribs = {...attribs} // Do a shallow copy so that we don't change the component parameters.
            attribs["key"] = "A-" + IdGen.next()
        }
        
        if (component.children === undefined || component.children.length === 0) {
            return React.createElement(module.default, attribs as any)
        }
        let childReactElements: Array<React.CElement<any, any>> = new Array<React.CElement<any, any>>()
        for (const child of component.children) {
            const childReactElement = this.createReactElements(child) // Recursive call
            childReactElements.push(childReactElement)
        }
        return React.createElement(module.default, attribs as any, childReactElements)
    }

    /**
    * Extracts the app name from the topic of a page. 
    * 
    * @param topic Topic starting with json:/
    */
    static getAppName(topic: string) {
        if (!topic.startsWith("json:/")) {
            console.error(`The PageEditor subscribeToTopic attribute must start with "json:/". subscribeToTopic = ${topic}`)
            throw Error("PageEditor subscribeToTopic attribute invalid.")
        }
        const secondSlashPos = topic.indexOf("/", 7)
        if (secondSlashPos < 0) {
            console.error(`PageEditor subscribeToTopic attribute has invalid format.". subscribeToTopic = ${topic}`)
            throw Error("PageEditor subscribeToTopic attribute invalid.")
        }
        const appName = topic.substr(6, secondSlashPos - 6)
        return appName
    }
}