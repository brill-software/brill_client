// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import { PageComponent } from "lib/PageService/Page"

/**
 * Parser for pasted Page Components.
 *
 */

export class Parser {

    /**
     * Parses pasted text. Checks that the result is a Page Component. A fallback component with
     * the invalid text is returned otherwise.
     * 
     * @param text 
     * @returns 
     */
    static convertToPageComponent(text: string): PageComponent {
        try {
            const jsonObj = JSON.parse(text)

            if (this.isValidPageComponent(jsonObj)) {
                return jsonObj as PageComponent
            } 
            
            console.warn("Pasted JSON doesn't contain a Page Compoent id or module: ")
            console.warn(`Pasted text:\n${text}`)
            
        } catch (e) {
            console.warn("Pasted text is not a valid page component: ", e)
            console.warn(`Pasted text:\n${text}`)
        }

        const fallback = new PageComponent("pastedText", "material_ui/text/Typography", {variant: "body1", text: text})
        return fallback 
    }

    /**
     * Checks that the object contains an id, module and attributes and that any child components are also valid.
     * 
     * @param jsonObj Page Component to be checked.
     * @returns 
     */
    private static isValidPageComponent(jsonObj: any) {
        if (!jsonObj.id || !jsonObj.module || !jsonObj.attributes) {
            return false
        }
        if (jsonObj.children) {
            for (const child of jsonObj.children) {
                if (!this.isValidPageComponent(child)) { // Recursive call
                    return false
                }
            }
        }
        return true
    }
}