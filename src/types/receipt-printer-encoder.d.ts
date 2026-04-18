declare module '@point-of-sale/receipt-printer-encoder' {
  export default class ReceiptPrinterEncoder {
    initialize(): this;
    codepage(codepage: string): this;
    align(alignment: 'left' | 'center' | 'right'): this;
    size(size: 'normal' | 'double'): this;
    text(value: string): this;
    newline(): this;
    cut(): this;
    encode(): Uint8Array;
  }
}
