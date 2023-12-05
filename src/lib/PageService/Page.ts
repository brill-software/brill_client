// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT License.

/**
 * A page that can be displayed by the Router or edited using the Page Editor.
 */

export class Page {
    $schema?: string
    pageDescrip: string
    permission?: string
    rootComponent: PageComponent

    constructor($schema: string | undefined, pageDescrip: string, permission: string | undefined, rootComponent: PageComponent) {
        this.$schema = $schema
        this.pageDescrip = pageDescrip
        this.permission = permission
        this.rootComponent = rootComponent
    }

}

export class Attributes {
    [propName: string]: any
}

/**
 * A page component. Used to load a corresponding React component.
 * 
 * The id must be unique for the page and is used by the Page Editor and for error reporting. 
 * The module is used to load the React component and the attributes passed in.
 * The children array contians any child page components.
 */
export class PageComponent {
    id: string
    module: string
    attributes: Attributes
    children?: PageComponent[]

    constructor(id: string, module: string, attributes: object) {
        this.id = id
        this.module = module
        this.attributes = attributes
    }
}
export class ValidationRule {
    code: string
    errorMsg: string
}