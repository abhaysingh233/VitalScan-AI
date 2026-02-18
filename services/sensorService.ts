
/**
 * Sensor Service
 * Handles Web Bluetooth API connections and Camera-based PPG signal processing.
 */

// Web Bluetooth API Type Definitions
interface BluetoothRemoteGATTCharacteristic {
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: (event: any) => void): void;
  value?: DataView;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth: {
    requestDevice(options: any): Promise<BluetoothDevice>;
  };
}

// Service UUIDs
const HR_SERVICE = 0x180D;
const HR_CHAR = 0x2A37;

const BP_SERVICE = 0x1810;
const BP_CHAR = 0x2A35;

const THERM_SERVICE = 0x1809;
const THERM_CHAR = 0x2A1C;

const SPO2_SERVICE = 0x1822; // Pulse Oximeter
const SPO2_CHAR = 0x2A5F; // PLX Continuous Measurement

export type SensorType = 'HEART_RATE' | 'BLOOD_PRESSURE' | 'THERMOMETER' | 'OXIMETER';

export class BluetoothSensorManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  
  async connect(type: SensorType, onData: (data: any) => void): Promise<string> {
    const nav = navigator as unknown as NavigatorWithBluetooth;
    if (!nav.bluetooth) {
      throw new Error("Web Bluetooth not supported on this browser.");
    }

    let serviceUuid: number;
    let charUuid: number;
    let parser: (value: DataView) => any;

    switch (type) {
        case 'HEART_RATE':
            serviceUuid = HR_SERVICE;
            charUuid = HR_CHAR;
            parser = this.parseHeartRate;
            break;
        case 'BLOOD_PRESSURE':
            serviceUuid = BP_SERVICE;
            charUuid = BP_CHAR;
            parser = this.parseBloodPressure;
            break;
        case 'THERMOMETER':
            serviceUuid = THERM_SERVICE;
            charUuid = THERM_CHAR;
            parser = this.parseTemperature;
            break;
        case 'OXIMETER':
            serviceUuid = SPO2_SERVICE;
            charUuid = SPO2_CHAR;
            parser = this.parseOximeter;
            break;
        default:
            throw new Error("Unknown sensor type");
    }

    try {
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }],
        optionalServices: ['battery_service'] 
      });

      if (!this.device || !this.device.gatt) throw new Error("Device selection cancelled.");

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(charUuid);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const parsed = parser.call(this, value);
        if (parsed !== null) onData(parsed);
      });

      return this.device.name || "Unknown Device";
    } catch (error) {
      console.error("Bluetooth Error:", error);
      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  // --- Parsers ---

  private parseHeartRate(value: DataView) {
    const flags = value.getUint8(0);
    let hr = 0;
    if ((flags & 0x01) === 1) {
        hr = value.getUint16(1, true); // 16-bit
    } else {
        hr = value.getUint8(1); // 8-bit
    }
    return hr;
  }

  private parseBloodPressure(value: DataView) {
    const flags = value.getUint8(0);
    const unitsInKpa = (flags & 0x01) === 1;
    
    // SFLOAT fields: Systolic, Diastolic, MAP
    // Basic SFLOAT parsing (IEEE-11073 16-bit)
    // Simplified: Assuming standard implementation often sends raw values or simple flags for demo
    // Real implementation requires robust SFLOAT parser.
    
    // Byte 1-2: Systolic
    // Byte 3-4: Diastolic
    // Byte 5-6: MAP
    // Only if units bit is correct, offsets shift if timestamps present (bit 1).
    // Assuming simplest case for standard monitors:
    
    let offset = 1;
    const systolic = this.getSfloat(value, offset);
    offset += 2;
    const diastolic = this.getSfloat(value, offset);
    
    // Convert kPa to mmHg if needed
    const sys = unitsInKpa ? systolic * 7.50062 : systolic;
    const dia = unitsInKpa ? diastolic * 7.50062 : diastolic;

    return { sys: Math.round(sys), dia: Math.round(dia) };
  }

  private parseTemperature(value: DataView) {
    const flags = value.getUint8(0);
    // Bit 0: 0=Celsius, 1=Fahrenheit
    const isFahrenheit = (flags & 0x01) === 1;
    
    // 32-bit Float (IEEE-11073) at offset 1
    // Simplified: most devices might use standard IEEE-754 float32 if not strict medical
    // But standard is IEEE-11073 FLOAT (32-bit). 
    // Top 8 exponent, bottom 24 mantissa.
    
    const tempRaw = this.getFloat(value, 1);
    const tempC = isFahrenheit ? (tempRaw - 32) * (5/9) : tempRaw;
    
    return parseFloat(tempC.toFixed(1));
  }

  private parseOximeter(value: DataView) {
    // PLX Continuous Measurement
    // Flags at 0
    // SpO2 (SFLOAT) at 1
    // Pulse Rate (SFLOAT) at 3
    const spo2 = this.getSfloat(value, 1);
    return spo2;
  }

  // Helper for IEEE-11073 16-bit SFLOAT
  private getSfloat(data: DataView, offset: number) {
     const val = data.getUint16(offset, true);
     if (val === 0x07FF) return NaN;
     const mantissa = ((val & 0x0FFF) << 20) >> 20; // Sign extend 12-bit
     const exponent = ((val & 0xF000) >> 12); 
     const signedExponent = (exponent >= 8) ? exponent - 16 : exponent;
     return mantissa * Math.pow(10, signedExponent);
  }

  // Helper for IEEE-11073 32-bit FLOAT
  private getFloat(data: DataView, offset: number) {
      const val = data.getUint32(offset, true);
      const mantissa = ((val & 0x00FFFFFF) << 8) >> 8; // Sign extend 24-bit
      const exponent = ((val & 0xFF000000) >> 24); // 8-bit
      return mantissa * Math.pow(10, exponent); // exponent is 8-bit signed usually
  }
}

// 2. Camera PPG (Photoplethysmography) Processor
export class CameraVitalScanner {
  private isActive = false;
  private frameInterval: any;
  private buffer: number[] = [];
  private lastBPM = 72;

  start(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement, onReading: (bpm: number, respiration: number) => void) {
    this.isActive = true;
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    this.frameInterval = setInterval(() => {
        if (!this.isActive || videoEl.paused || videoEl.ended) return;

        // Draw current frame to canvas
        ctx.drawImage(videoEl, 0, 0, 100, 100); // Downscale for performance
        
        // Get center region (forehead/cheek approximation)
        const frame = ctx.getImageData(40, 40, 20, 20);
        const data = frame.data;
        
        // Calculate average Red channel intensity
        let rSum = 0;
        for (let i = 0; i < data.length; i += 4) {
            rSum += data[i];
        }
        const rAvg = rSum / (data.length / 4);

        this.processSignal(rAvg, onReading);

    }, 1000 / 30); // 30 FPS processing
  }

  stop() {
    this.isActive = false;
    clearInterval(this.frameInterval);
    this.buffer = [];
  }

  // Simplified PPG Peak Detection Algorithm
  private processSignal(value: number, callback: (bpm: number, resp: number) => void) {
    this.buffer.push(value);
    
    // Keep 5 seconds of data at 30fps = 150 frames
    if (this.buffer.length > 150) {
        this.buffer.shift();
    } else {
        return; // Wait for buffer to fill
    }

    // Simple peak detection on the Red signal
    // In a real app, we would use FFT or a bandpass filter here
    const smoothed = this.movingAverage(this.buffer, 5);
    const peaks = this.findPeaks(smoothed);

    if (peaks.length > 2) {
        // Calculate interval between peaks
        const intervals = [];
        for(let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i-1]);
        }
        const avgIntervalFrames = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = 60 / (avgIntervalFrames / 30); // 30 FPS

        // Dampen rapid changes
        this.lastBPM = (this.lastBPM * 0.7) + (bpm * 0.3);
        
        // Constrain to realistic human limits
        const outputBPM = Math.min(Math.max(Math.round(this.lastBPM), 40), 180);
        
        // Estimate respiration (derived from baseline wander of PPG or separate calculation)
        // Simulating respiration as a fraction of HR variability for this demo
        const respiration = Math.round(outputBPM / 4); 

        callback(outputBPM, respiration);
    }
  }

  private movingAverage(data: number[], windowSize: number) {
      const result = [];
      for (let i = 0; i < data.length - windowSize; i++) {
          const chunk = data.slice(i, i + windowSize);
          result.push(chunk.reduce((a, b) => a + b) / windowSize);
      }
      return result;
  }

  private findPeaks(data: number[]) {
      const peaks = [];
      for (let i = 1; i < data.length - 1; i++) {
          if (data[i] > data[i-1] && data[i] > data[i+1]) {
              peaks.push(i);
          }
      }
      return peaks;
  }
}
