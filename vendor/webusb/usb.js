"use strict";
/*
* Node WebUSB
* Copyright (c) 2017 Rob Moran
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
const dispatcher_1 = require("./dispatcher");
const adapter_1 = require("./adapter");
const events_1 = require("./events");
/**
 * USB class
 */
class USB extends dispatcher_1.EventDispatcher {
    /**
     * USB constructor
     * @param options USB initialisation options
     */
    constructor(options) {
        super();
        this.allowedDevices = [];
        options = options || {};
        this.devicesFound = options.devicesFound;
        const deviceConnectCallback = device => {
            // When connected, emit an event if it was a known allowed device
            if (this.replaceAllowedDevice(device)) {
                const event = new events_1.W3CUSBConnectionEvent(this, "connect", { device });
                this.dispatchEvent(event);
                if (this.onconnect) {
                    this.onconnect(event);
                }
            }
        };
        const deviceDisconnectCallback = handle => {
            // When disconnected, emit an event if the device was a known allowed device
            const device = this.allowedDevices.find(allowedDevices => allowedDevices._handle === handle);
            if (device) {
                const event = new events_1.W3CUSBConnectionEvent(this, "disconnect", { device });
                this.dispatchEvent(event);
                if (this.ondisconnect) {
                    this.ondisconnect(event);
                }
            }
        };
        this.on("newListener", event => {
            const listenerCount = this.listenerCount(event);
            if (listenerCount !== 0) {
                return;
            }
            if (event === "connect") {
                adapter_1.adapter.addListener(adapter_1.USBAdapter.EVENT_DEVICE_CONNECT, deviceConnectCallback);
            }
            else if (event === "disconnect") {
                adapter_1.adapter.addListener(adapter_1.USBAdapter.EVENT_DEVICE_DISCONNECT, deviceDisconnectCallback);
            }
        });
        this.on("removeListener", event => {
            const listenerCount = this.listenerCount(event);
            if (listenerCount !== 0) {
                return;
            }
            if (event === "connect") {
                adapter_1.adapter.removeListener(adapter_1.USBAdapter.EVENT_DEVICE_CONNECT, deviceConnectCallback);
            }
            else if (event === "disconnect") {
                adapter_1.adapter.removeListener(adapter_1.USBAdapter.EVENT_DEVICE_DISCONNECT, deviceDisconnectCallback);
            }
        });
    }
    set onconnect(fn) {
        if (this._onconnect) {
            this.removeEventListener("connect", this._onconnect);
        }
        this._onconnect = fn;
        this.addEventListener("connect", this._onconnect);
    }
    set ondisconnect(fn) {
        if (this._ondisconnect) {
            this.removeEventListener("disconnect", this._ondisconnect);
        }
        this._ondisconnect = fn;
        this.addEventListener("disconnect", this._ondisconnect);
    }
    replaceAllowedDevice(device) {
        for (const i in this.allowedDevices) {
            if (this.isSameDevice(device, this.allowedDevices[i])) {
                this.allowedDevices[i] = device;
                return true;
            }
        }
        return false;
    }
    isSameDevice(device1, device2) {
        return (device1.productId === device2.productId
            && device1.vendorId === device2.vendorId
            && device1.serialNumber === device2.serialNumber);
    }
    filterDevice(options, device) {
        return options.filters.some(filter => {
            // Vendor
            if (filter.vendorId && filter.vendorId !== device.vendorId)
                return false;
            // Product
            if (filter.productId && filter.productId !== device.productId)
                return false;
            // Class
            if (filter.classCode) {
                // Interface Descriptors
                const match = device.configuration.interfaces.some(iface => {
                    // Class
                    if (filter.classCode && filter.classCode !== iface.alternate.interfaceClass)
                        return false;
                    // Subclass
                    if (filter.subclassCode && filter.subclassCode !== iface.alternate.interfaceSubclass)
                        return false;
                    // Protocol
                    if (filter.protocolCode && filter.protocolCode !== iface.alternate.interfaceProtocol)
                        return false;
                    return true;
                });
                if (match)
                    return true;
            }
            // Class
            if (filter.classCode && filter.classCode !== device.deviceClass)
                return false;
            // Subclass
            if (filter.subclassCode && filter.subclassCode !== device.deviceSubclass)
                return false;
            // Protocol
            if (filter.protocolCode && filter.protocolCode !== device.deviceProtocol)
                return false;
            // Serial
            if (filter.serialNumber && filter.serialNumber !== device.serialNumber)
                return false;
            return true;
        });
    }
    /**
     * Gets all allowed Web USB devices which are connected
     * @returns Promise containing an array of devices
     */
    getDevices() {
        // Refresh devices and filter for allowed ones
        return adapter_1.adapter.listUSBDevices()
            .then(devices => {
            const allowed = devices.filter(device => {
                if (!device.connected) {
                    return false;
                }
                for (const i in this.allowedDevices) {
                    if (this.isSameDevice(device, this.allowedDevices[i])) {
                        return true;
                    }
                }
                return false;
            });
            return allowed;
        });
    }
    /**
     * Requests a single Web USB device
     * @param options The options to use when scanning
     * @returns Promise containing the selected device
     */
    requestDevice(options) {
        return new Promise((resolve, reject) => {
            // Must have options
            if (!options) {
                return reject(new TypeError("requestDevice error: 1 argument required, but only 0 present"));
            }
            // Options must be an object
            if (options.constructor !== {}.constructor) {
                return reject(new TypeError("requestDevice error: parameter 1 (options) is not an object"));
            }
            // Must have a filter
            if (!options.filters) {
                return reject(new TypeError("requestDevice error: required member filters is undefined"));
            }
            // Filter must be an array
            if (options.filters.constructor !== [].constructor) {
                return reject(new TypeError("requestDevice error: the provided value cannot be converted to a sequence"));
            }
            // Check filters
            const check = options.filters.every(filter => {
                // Protocol & Subclass
                if (filter.protocolCode && !filter.subclassCode) {
                    reject(new TypeError("requestDevice error: subclass code is required"));
                    return false;
                }
                // Subclass & Class
                if (filter.subclassCode && !filter.classCode) {
                    reject(new TypeError("requestDevice error: class code is required"));
                    return false;
                }
                return true;
            });
            if (!check)
                return;
            return adapter_1.adapter.listUSBDevices()
                .then(devices => {
                devices = devices.filter(device => this.filterDevice(options, device));
                if (devices.length === 0) {
                    return reject(new Error("requestDevice error: no devices found"));
                }
                function selectFn(device) {
                    if (!this.replaceAllowedDevice(device))
                        this.allowedDevices.push(device);
                    resolve(device);
                }
                // If no devicesFound function, select the first device found
                if (!this.devicesFound)
                    return selectFn.call(this, devices[0]);
                return this.devicesFound(devices)
                    .then(device => {
                    if (!device) {
                        reject(new Error("selected device not found"));
                    }
                    return selectFn.call(this, device);
                });
            }).catch(error => {
                reject(new Error(`requestDevice error: ${error}`));
            });
        });
    }
}
exports.USB = USB;
