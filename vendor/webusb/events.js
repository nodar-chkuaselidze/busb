"use strict";
/*
* Node WebUSB
* Copyright (c) 2019 Rob Moran
*
* The MIT License (MIT)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
/**
 * @hidden
 */
class DOMEvent {
    constructor() {
        /**
         * @hidden
         */
        this.bubbles = false;
        /**
         * @hidden
         */
        this.cancelable = false;
        /**
         * @hidden
         */
        this.cancelBubble = false;
        /**
         * @hidden
         */
        this.composed = false;
        /**
         * @hidden
         */
        this.defaultPrevented = false;
        /**
         * @hidden
         */
        this.eventPhase = 0;
        /**
         * @hidden
         */
        this.isTrusted = true;
        /**
         * @hidden
         */
        this.returnValue = true;
    }
    /**
     * @hidden
     */
    composedPath() {
        return [];
    }
    /**
     * @hidden
     */
    initEvent(type, bubbles, cancelable) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
    }
    /**
     * @hidden
     */
    preventDefault() {
        this.defaultPrevented = true;
    }
    /**
     * @hidden
     */
    stopImmediatePropagation() {
        return;
    }
    /**
     * @hidden
     */
    stopPropagation() {
        return;
    }
}
exports.DOMEvent = DOMEvent;
/**
 * @hidden
 */
class W3CUSBConnectionEvent extends DOMEvent {
    /**
     * @hidden
     */
    constructor(target, type, eventInitDict) {
        super();
        this.initEvent(type, eventInitDict.bubbles, eventInitDict.cancelable);
        this.target = target;
        this.device = eventInitDict.device;
    }
}
exports.W3CUSBConnectionEvent = W3CUSBConnectionEvent;
