// © 2021 Brill Software Limited - Brill Utils, distributed under the MIT License.
import Module from "module";

/**
 * Reflection Logging Utilities
 * 
 */

export class Reflection {
  
    logModuleDetails(module: Module) : void {

        console.log("Start");

        if (module === undefined) {
          console.log("Module is undefined");
          return;
        }

        const protoType : any  = Reflect.getPrototypeOf(module);

        console.log("Prototype = " + protoType);

        const moduleAny: any = module as any;

        for (const key of Reflect.ownKeys(moduleAny)) {
            console.log("Key = " + (typeof(key) !== 'symbol' ? key : 'Symbol')  + " Typeof = " + typeof(key) + " Type of value = " + typeof(moduleAny[key]) );
         }

         console.log("End");
    }

    logPropsDetails(props: any) {

      console.log("Logging of props");

      for (const key of Reflect.ownKeys(props)) {
        console.log("Key = " + (typeof(key) !== 'symbol' ? key : 'Symbol') + " Typeof = " + typeof(props[key]) + " Value = " + props[key]);
      }

    }
}
