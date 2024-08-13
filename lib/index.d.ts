import { Device } from './types';
export default class ZebraBrowserPrintWrapper {
    device: Device;
    API_URL: string;
    constructor(api_url: string);
    setApiUrl: (api_url: string) => void;
    getAvailablePrinters: () => Promise<any>;
    getDefaultPrinter: () => Promise<Device>;
    setPrinter: (device: Device) => void;
    getPrinter: () => Device;
    cleanUpString: (str: string) => string;
    checkPrinterStatus: () => Promise<{
        isReadyToPrint: boolean;
        errors: string;
    }>;
    write: (data: string) => Promise<void>;
    read: () => Promise<string>;
    print: (text: string) => Promise<void>;
}
