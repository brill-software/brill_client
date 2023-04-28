// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
/* eslint no-new-func: 0 */

import { ErrorUtils } from "./ErrorUtils"

/**
 * Executes JavaScript validation code in a sandbox.
 * 
 */

export class Eval {

    static hasMoreThanOneAt(value: string): boolean {
        let atCount: number = 0
        for (let i = 0; i < value.length; i++) {
            if (value.charAt(i) === '@') {
                atCount++
            }
        }
        return atCount > 1
    }

    static isProduction(): boolean {
        return (process.env.NODE_ENV === "production")
    }

    static isTrue(componentId: string, code: string, value: string): boolean {
        try {
            const compiledCode = compileCode(code)
            const result: any = compiledCode({ value: value, console: console, hasMoreThanOneAt: Eval.hasMoreThanOneAt })
            if (typeof (result) !== "boolean") {
                throw new Error(`Error evaluating code "${code}" for component "${componentId}". Result must be true or false. Was "${result}".`)
            }
            return result

        } catch (error) {
            throw new Error(`Exception while executing validation rule for component "${componentId}", "${code}": ${ErrorUtils.cvt(error)}`)
        }
    }

    static isConditionTrue(componentId: string, code: string): boolean {
        try {
            const compiledCode = compileCode(code)
            const result: any = compiledCode({ console: console, isProduction: Eval.isProduction })
            if (typeof (result) !== "boolean") {
                throw new Error(`Error evaluating code "${code}" for component "${componentId}". Result must be true or false. Was "${result}".`)
            }
            return result

        } catch (error) {
            throw new Error(`Exception while executing validation rule for component "${componentId}", "${code}": ${ErrorUtils.cvt(error)}`)
        }
    }
}

/**
 * Sandbox code to compile JavaScript ready for execution. Ensures that the code only has access to objects and methods 
 * that are passed into the sandbox. Uses 'with' which is deprecated, so might need an alternative. For more details see:
 * https://blog.risingstack.com/writing-a-javascript-framework-sandboxed-code-evaluation/
 */

const sandboxProxies = new WeakMap()

function compileCode(src: string) {
    src = 'with (sandbox) {' + src + '}'
    const code = new Function('sandbox', src)

    return function (sandbox: any) {
        if (!sandboxProxies.has(sandbox)) {
            const sandboxProxy = new Proxy(sandbox, { has, get })
            sandboxProxies.set(sandbox, sandboxProxy)
        }
        return code(sandboxProxies.get(sandbox))
    }
}

function has(target: any, key: any) {
    return true
}

function get(target: any, key: any) {
    if (key === Symbol.unscopables) return undefined
    return target[key]
}