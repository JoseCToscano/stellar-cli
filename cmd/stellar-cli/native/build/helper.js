import { Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
/**
 * Convert a string to a Symbol ScVal
 */
export const stringToSymbol = (val) => {
    return nativeToScVal(val, { type: "symbol" });
};
/**
 * Convert a number to a u64 ScVal with 2 decimal precision
 */
export const numberToU64 = (val) => {
    const num = parseInt((val * 100).toFixed(0));
    return nativeToScVal(num, { type: "u64" });
};
/**
 * Convert a number to an i128 ScVal with 2 decimal precision
 */
export const numberToI128 = (val) => {
    const num = parseInt((val * 100).toFixed(0));
    return nativeToScVal(num, { type: "i128" });
};
/**
 * Convert a Stellar address to ScVal
 */
export function addressToScVal(addressStr) {
    // Validate and convert the address
    const address = Address.fromString(addressStr);
    // Convert to ScVal
    return nativeToScVal(address);
}
/**
 * Convert a string to an i128 ScVal
 * This is useful for handling large numbers that exceed JavaScript's number precision
 */
export function i128ToScVal(value) {
    return nativeToScVal(value, { type: "i128" });
}
/**
 * Convert a string to a u128 ScVal
 * This is useful for handling large numbers that exceed JavaScript's number precision
 */
export function u128ToScVal(value) {
    return nativeToScVal(value, { type: "u128" });
}
/**
 * Convert a boolean to an ScVal
 */
export function boolToScVal(value) {
    return xdr.ScVal.scvBool(value);
}
/**
 * Convert a number to a u32 ScVal
 */
export function u32ToScVal(value) {
    return xdr.ScVal.scvU32(value);
}
