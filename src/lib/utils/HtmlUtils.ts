// © 2023 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import DOMPurify from "dompurify"

/**
 * HTML Utilities
 * 
 */

export class Html {

    static ALLOWED_TAGS: string[] = ["p", "span", "b", "strong", "i", "em", "mark", "small", "s" ,"sub", "sup", "code", "ol", "ul", "li", 
                    "font", "span", "br", "hr", "pre", "img", "table", "thead", "tbody", "th", "tr", "td", "svg", "path"]

    static ALLOWED_ATTRIBUTES: string[] = ["style", "height", "width", "src", "border", "cellpadding", "cellspacing", "bgcolor", "color", "d", "opacity"]

    /**
     * Removes any dangerous HTML tags for when using dangerouslySetInnerHTML.
     * @param html 
     * @returns 
     */

    static sanitize(html: string): string {
        return DOMPurify.sanitize(html, {ALLOWED_TAGS: Html.ALLOWED_TAGS, ALLOWED_ATTR: Html.ALLOWED_ATTRIBUTES})
    }

    /**
     * Converts a HTML attribute value to an object.
     * 
     * @param htmlAttrValue 
     * @returns 
     */
    static toObject(htmlAttrValue: string): Object {
        let result: any = {}
        const array = htmlAttrValue.split(";")
        for (let i = 0; i < array.length; i++) {
            const row = array[i].split(':')
            const name = row[0]
            const value = row[1].trimStart()
            result[name] = value
        }
        return result
    }
}

export class CursorPosition {
    lineNumber: number
    column: number

    constructor(lineNumber: number, column: number) {
        this.lineNumber = lineNumber
        this.column = column
    }
}

export class BlockPosition {
    blockNumber: number
    offset: number

    constructor(blockNumber: number, offset: number) {
        this.blockNumber = blockNumber
        this.offset = offset
    }
} 
export class CursorHandler {

    /**
     * Converts a XhtmlEditor cursor position to a TextEditor cursor position. This is used
     * when switching from Edit to XHTML mode. The XhtmlEditor deals in blocks and offsets within blocks
     * whereas the TextEditor uses line and column numbers.
     * 
     * Note that the XHTML has to match the format produced by the XhtmlEditor.
     * 
     * @param xhtml The XHTML produced by XhtmlEditor.
     * @param blockNumber The draft-js block number of the cursor.
     * @param offset The draft-js offset within the block of the cursor.
     * @returns The equivalent line number and column of the cursor.
     */
    static convert(xhtml: string, blockNumber: number, offset: number): CursorPosition {
        let line = 1
        let column = -1
        let block = -1
        let textPos = -1
        let inBlockStartTag = false
        let inTag = false
        let inEntity = false
        
        for (let i = 0; i < xhtml.length; i++) {
            const ch = xhtml.charAt(i)
            if (block === blockNumber && textPos === offset) {
                // Got there
                return new CursorPosition(line, column + 2)
            }

            if (ch === '\n') {
                line++
                column = -1
                textPos++
                continue
            }

            column++

            if (column === 0 && ch === '<') {
                block++
                inBlockStartTag = true
                textPos = -1
                continue
            }
            if (inBlockStartTag && ch === '>') {
                inBlockStartTag = false
                textPos = 0
                continue
            }
            if (!inBlockStartTag) {
                if (ch === '<') {
                    inTag = true
                    continue
                }
                if (inTag && ch === '>') {
                    inTag = false
                    continue
                }
                if (ch === '&') {
                    inEntity = true
                    continue
                }
                if (inEntity && ch === ';') {
                    textPos++
                    inEntity = false
                    continue
                }
                if (!inTag && !inEntity) {
                    textPos++
                    continue
                }
            }
        }
        return new CursorPosition(0, 0)
    }

    /**
     * Converts a TextEditor cursor position to a XhtmlEditor block number and offset.
     * 
     * @param xhtml
     * @param lineNumber 
     * @param columnNum 
     * @returns 
     */
    static convertToXhtmlEditor(xhtml: string, lineNumber: number, columnNum: number): BlockPosition {
        let line = 1
        let column = 0
        let block = -1
        let textPos = -1
        let inBlockStartTag = false
        let inTag = false
        let inEntity = false
        
        for (let i = 0; i < xhtml.length; i++) {
            const ch = xhtml.charAt(i)
            if (line > lineNumber || (line === lineNumber && column === columnNum)) {
                // Got there
                return new BlockPosition(block, textPos - 1)
            }

            if (ch === '\n') {
                line++
                column = 0
                textPos++
                continue
            }

            column++

            if (column === 1) {
                if (ch === '<') {
                    block++
                    inBlockStartTag = true
                    textPos = -1
                    continue
                } else {
                    textPos++
                    continue
                }
            } 
            if (inBlockStartTag && ch === '>') {
                inBlockStartTag = false
                textPos = 0
                continue
            }
            if (!inBlockStartTag) {
                if (ch === '<') {
                    inTag = true
                    textPos++
                    continue
                }
                if (inTag && ch === '>') {
                    inTag = false
                    textPos--
                    continue
                }
                if (ch === '&') {
                    inEntity = true
                    continue
                }
                if (inEntity && ch === ';') {
                    textPos++
                    inEntity = false
                    continue
                }
                if (!inTag && !inEntity) {
                    textPos++
                    continue
                }
            }
        }
        return new BlockPosition(0, 0)
    }
}
