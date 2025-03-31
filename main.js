let bleDevice;
let bleCharacteristic;
let selectedDevice = null;

document.addEventListener("DOMContentLoaded", () => {
    const devices = document.querySelectorAll(".devices .device1, .devices .device2, .devices .device3, .devices .device4");
    const onButton = document.querySelector(".on");
    const connectButton = document.querySelector(".btn .connect");

    devices.forEach(device => {
        device.addEventListener("click", () => {
            if (selectedDevice) {
                selectedDevice.style.border = "none";
            }
            selectedDevice = device;
            selectedDevice.style.border = "2px solid black";
        });
    });

    async function connectBluetooth() {
        try {
            console.log("Requesting Bluetooth device...");
            bleDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['12345678-1234-5678-1234-56789abcdef0']
            });

            console.log("Connecting to GATT Server...");
            const server = await bleDevice.gatt.connect();
            console.log("Connected to GATT Server!");

            console.log("Getting Service...");
            const service = await server.getPrimaryService('12345678-1234-5678-1234-56789abcdef0');

            console.log("Getting Characteristic...");
            bleCharacteristic = await service.getCharacteristic('abcd1234-5678-1234-5678-abcdef123456');

            connectButton.innerText = "Disconnect";
            connectButton.style.backgroundColor = "red";
            alert("✅ Connected to ESP32 via Bluetooth!");

            // Handle disconnect event
            bleDevice.addEventListener("gattserverdisconnected", onDisconnected);

        } catch (error) {
            console.error("Bluetooth connection failed:", error);
            alert("❌ Failed to connect to ESP32! Please try again.");
        }
    }

    function disconnectBluetooth() {
        if (bleDevice && bleDevice.gatt.connected) {
            console.log("Disconnecting...");
            bleDevice.gatt.disconnect();
        } else {
            alert("You're not connected to any device.");
        }
    }

    function onDisconnected() {
        console.log("ESP32 Disconnected.");
        connectButton.innerText = "Connect";
        connectButton.style.backgroundColor = "green";
        alert("🔌 ESP32 Disconnected!");
    }

    async function sendCommand(command) {
        if (!bleCharacteristic) {
            alert("❗ Please connect to the ESP32 first!");
            return;
        }

        try {
            let encoder = new TextEncoder();
            await bleCharacteristic.writeValue(encoder.encode(command));
            console.log(`✅ Sent command: ${command}`);
        } catch (error) {
            console.error("Error sending command:", error);
            alert("⚠️ Failed to send command!");
        }
    }

    onButton.addEventListener("click", () => {
        if (selectedDevice) {
            const statusEl = selectedDevice.querySelector(".status");
            const currentStatus = statusEl.textContent.includes("ON");
            const deviceName = selectedDevice.querySelector("p").textContent;
            const newStatus = currentStatus ? "OFF" : "ON";
            const combinedData = newStatus + "_" + deviceName;

            statusEl.textContent = `Status: ${newStatus}`;
            newStatus === "ON" ? (onButton.style.backgroundColor = "red") : (onButton.style.backgroundColor = "green");
            onButton.innerHTML = newStatus === "ON" ? "OFF" : "ON";

            sendCommand(combinedData);
        } else {
            alert("⚡ Please select an appliance first!");
        }
    });

    connectButton.addEventListener("click", () => {
        if (bleDevice && bleDevice.gatt.connected) {
            disconnectBluetooth();
        } else {
            connectBluetooth();
        }
    });
});
