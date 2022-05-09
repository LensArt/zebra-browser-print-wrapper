import { API_URL } from './constants';
import { Device } from './types';

export default class ZebraBrowserPrintWrapper {
  device: Device = {} as Device;
  apiUrl: string = API_URL;

  constructor(apiUrlOverride: string | null = null) {
    if (apiUrlOverride != null) {
      this.apiUrl = apiUrlOverride.slice(-1) != "/" ? apiUrlOverride + "/" : apiUrlOverride;
    }
  }

  setApiUrl = (apiUrl: string) => {
    this.apiUrl = apiUrl.slice(-1) != "/" ?  apiUrl + "/" : apiUrl;
  }

  getAvailablePrinters = async () => {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
    };

    const endpoint = this.apiUrl + 'available';

    try {
      const res = await fetch(endpoint, config);

      const data = await res.json();

      if (typeof data === 'object' && data !== null && 'printer' in data && data.printer && data.printer !== undefined && Array.isArray(data.printer) && data.printer.length > 0) {
        return data.printer;
      }

      return new Error('No printers available');
    } catch (error) {
      throw new Error(error as string);
    }
  };

  getDefaultPrinter = async (): Promise<Device> => {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
    };

    const endpoint = this.apiUrl + 'default';

    try {
      const res = await fetch(endpoint, config);
      const data = await res.text();

      if (data && data !== undefined && typeof data !== 'object' && data.split('\n\t').length === 7) {
        const deviceRaw = data.split('\n\t');

        const name = this.cleanUpString(deviceRaw[1]);
        const deviceType = this.cleanUpString(deviceRaw[2]);
        const connection = this.cleanUpString(deviceRaw[3]);
        const uid = this.cleanUpString(deviceRaw[4]);
        const provider = this.cleanUpString(deviceRaw[5]);
        const manufacturer = this.cleanUpString(deviceRaw[6]);

        return {
          connection,
          deviceType,
          manufacturer,
          name,
          provider,
          uid,
          version: 0,
        };
      }

      throw new Error("There's no default printer");
    } catch (error) {
      throw new Error(error as string);
    }
  };

  setPrinter = (device: Device) => {
    this.device = device;
  };

  getPrinter = (): Device => {
    return this.device;
  };

  cleanUpString = (str: string): string => {
    const arr = str.split(':');
    const result = arr[1].trim();
    return result;
  };

  checkPrinterStatus = async (): Promise<{
      isReadyToPrint: boolean,
      errors: string,
    }> => {
    await this.write('~HQES');
    const result = await this.read();

    const errors = [];
    let isReadyToPrint = false;

    const isError = result.charAt(70);
    const media = result.charAt(88);
    const head = result.charAt(87);
    const pause = result.charAt(84);

    isReadyToPrint = isError === '0';

    switch (media) {
      case '1':
        errors.push('Paper out');
        break;
      case '2':
        errors.push('Ribbon Out');
        break;
      case '4':
        errors.push('Media Door Open');
        break;
      case '8':
        errors.push('Cutter Fault');
        break;
      default:
        break;
    }

    switch (head) {
      case '1':
        errors.push('Printhead Overheating');
        break;
      case '2':
        errors.push('Motor Overheating');
        break;
      case '4':
        errors.push('Printhead Fault');
        break;
      case '8':
        errors.push('Incorrect Printhead');
        break;
      default:
        break;
    }

    if (pause === '1') errors.push('Printer Paused');

    if (!isReadyToPrint && errors.length === 0) errors.push('Error: Unknown Error');

    return {
      isReadyToPrint,
      errors: errors.join(),
    };
  };

  write = async (data: string) => {
    try {
      const endpoint = this.apiUrl + 'write';

      const myData = {
        device: this.device,
        data,
      };

      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify(myData),
      };

      await fetch(endpoint, config);
    } catch (error) {
      throw new Error(error as string);
    }
  };

  writeBlob = async (data: Blob) => {
    try {
      const endpoint = this.apiUrl + 'write';

      const deviceData = {
        device: this.device
      };

      const formData = new FormData;
      formData.append("json", JSON.stringify(deviceData));
      formData.append("blob", data);

      const config = {
        method: "POST",
        body: formData,
      };

      await fetch(endpoint, config);
    } catch (error) {
      throw new Error(error as string);
    }
  };

  writeUrl = async (url: string) => {
    try {
      const endpoint = this.apiUrl + 'write';

      const deviceData = {
        device: this.device
      };

      const contentBlob = await fetch(url).then(r => r.blob());

      const formData = new FormData;
      formData.append("json", JSON.stringify(deviceData));
      formData.append("blob", contentBlob);

      const config = {
        method: 'POST',
        body: formData,
      };

      await fetch(endpoint, config);
    } catch (error) {
      throw new Error(error as string);
    }
  };

  read = async () => {
    try {
      const endpoint = this.apiUrl + 'read';

      const myData = {
        device: this.device,
      };

      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify(myData),
      };

      const res = await fetch(endpoint, config);
      const data = await res.text();
      return data;
    } catch (error) {
      throw new Error(error as string);
    }
  };

  print = async (text: string) => {
    try {
      await this.write(text);
    } catch (error) {
      throw new Error(error as string);
    }
  };

  printBlob = async (text: Blob) => {
    try {
      await this.writeBlob(text);
    } catch (error) {
      throw new Error(error as string);
    }
  };

  printUrl = async (url: string) => {
    try {
      await this.writeUrl(url);
    } catch (error) {
      throw new Error(error as string);
    }
  };
}
