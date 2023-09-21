// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.

/**
 * Text Utilities
 * 
 */

export class Match {
    startLine: number
    endLine: number

    constructor(startLine: number, endLine: number) {
        this.startLine = startLine
        this.endLine = endLine
    }
}

export class TextUtils {

    /**
     * Indents text
     */
    static indent(text: string, spaces: number): string {
        const indent = ' '
        const regex = /^(?!\s*$)/gm
        return text.replace(regex, indent.repeat(spaces))
    }

    /**
     * Finds the position of a search string within a body of text, disregarding spaces.
     * Used by the Text Editor to select a section of JSON that corresponds to a Page Editor
     * component.
     * 
     * @param text The document.
     * @param searchText The string to search for.
     * @returns The start line and end line or null if the search string was not found.
     */
    static findMatch(text: string, searchText: string): Match | null {
        const strippedText = text.replace(/ /g, "")
        const strippedSearchText = searchText.replace(/ /g, "")
        const pos = strippedText.indexOf(strippedSearchText)
        if (pos === -1) {
            return null
        }
        const startLine = strippedText.substr(0, pos).split(/\r\n|\r|\n/).length
        const endLine = startLine + strippedSearchText.split(/\r\n|\r|\n/).length
        return new Match(startLine, endLine)
    }
}