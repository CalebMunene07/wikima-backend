"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRef = void 0;
// src/utils/generateRef.ts
const generateRef = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let ref = "WS-";
    for (let i = 0; i < 6; i++) {
        ref += chars[Math.floor(Math.random() * chars.length)];
    }
    return ref;
    // e.g. WS-A1B2C3
};
exports.generateRef = generateRef;
