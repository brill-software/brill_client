// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT License.
import Module from "module"

/**
 * Loads a component.
 * 
 */

export class ComponentManager {
    private static componentMap: Map<string, Module> = new Map<string, Module>()

    static async loadComponent(moduleName: string): Promise<string> {
        // Return the component if it's already loaded
        let module = ComponentManager.componentMap.get(moduleName)
        if (module !== undefined) {
            return "ok"
        }

        let newModule: Module | void = await import(`lib/ComponentLibraries/${moduleName}`)
        if (newModule === undefined) {
            console.log("Failed to load component")
            throw Error("Unable to load component")
        } else {
            ComponentManager.componentMap.set(moduleName, newModule)
            return "ok"
        }     
    }

    static getAlreadyLoadedComponent(moduleName: string): Module | undefined{
        let module: Module | undefined = ComponentManager.componentMap.get(moduleName)
        if (module === undefined) {
            console.error("Module is undefined")
        }
        return module
    }
}