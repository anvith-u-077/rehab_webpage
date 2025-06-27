import serial
import time
from openpyxl import Workbook
import os

# Configuration
SERIAL_PORT = 'COM5'  # ✅ Make sure this matches your actual device
BAUD_RATE = 9600
LOG_INTERVAL = 20  # seconds
EXCEL_FILE = 'sensor_log.xlsx'

COLUMNS = [
    'Velostat Index (V)', 'Velostat Middle (V)', 'Velostat Ring (V)', 'Velostat Little (V)',
    'Velostat Thumb (V)', 'FSR Readings (N)', 'Accelerometer Output (g)', 'Gyroscope Output (deg/s)'
]

def parse_line(line):
    parts = line.strip().split(',')
    if len(parts) != 9:
        return None
    try:
        return [float(p) for p in parts]
    except ValueError:
        return None

def average_buffer(buffer):
    num_cols = len(buffer[0])
    sums = [0.0] * num_cols
    for row in buffer:
        for i in range(num_cols):
            sums[i] += row[i]
    return [round(s / len(buffer), 3) for s in sums]

def main():
    wb = None
    ser = None
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)  # Allow Arduino to settle
        print(f"✅ Serial connection established on {SERIAL_PORT}")
        print(f"📊 Logging to Excel every {LOG_INTERVAL} seconds...")

        wb = Workbook()
        ws = wb.active
        ws.title = "Sensor Data"
        ws.append(COLUMNS)

        while True:
            buffer = []
            start_time = time.time()

            while time.time() - start_time < LOG_INTERVAL:
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8', errors='ignore')
                    values = parse_line(line)
                    if values:
                        buffer.append(values)

            if buffer:
                avg_values = average_buffer(buffer)[:8]
                ws.append(avg_values)
                wb.save(EXCEL_FILE)
                print(f"📝 Logged average of {len(buffer)} samples at {time.strftime('%H:%M:%S')}")

    except KeyboardInterrupt:
        print("🛑 Stopped by user.")
    except Exception as e:
        print(f"⚠️ Error: {e}")
    finally:
        if ser:
            try:
                ser.close()
            except:
                pass
        if wb:
            wb.save(EXCEL_FILE)
        print("📁 Excel file saved and serial connection closed.")

if __name__ == "__main__":
    main()





