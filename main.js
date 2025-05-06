let bleDevice = null;
let bleCharacteristic = null;
let selectedDevice = null;

document.addEventListener("DOMContentLoaded", () => {
    const devices = document.querySelectorAll(".devices .device1, .devices .device2, .devices .device3, .devices .device4");
    const onButton = document.querySelector(".on");
    const connectButton = document.querySelector(".ConnectDiv .connect");
    const contd = document.querySelector(".contd");
    const contddevice = document.querySelector(".contddevice");

    function aplnceHandeler() {
        devices.forEach(device => {
            device.addEventListener("click", () => {
                if (selectedDevice) {
                    selectedDevice.style.border = "none"; // Remove border from previously selected
                }

                selectedDevice = device;
                selectedDevice.style.border = "2px solid black"; // Highlight new selection
            });
        });
    }
    aplnceHandeler();

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

            onConnected();

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
            bleCharacteristic = null; // Reset characteristic
            bleDevice = null; // Reset device
        } else {
            alert("You're not connected to any device.");
        }
    }

    function onDisconnected() {
        console.log("ESP32 Disconnected.");
        connectButton.innerText = "Connect";
        connectButton.style.backgroundColor = "green";
        contd.innerHTML = "Disconnected";
        contd.style.color = "red";
        contddevice.innerHTML = "No Device";
        bleCharacteristic = null; // Ensure BLE characteristic is reset
        bleDevice = null; // Ensure BLE device is reset
    }

    function onConnected() {
        connectButton.innerText = "Disconnect";
        connectButton.style.backgroundColor = "red";
        contd.innerHTML = "Connected";
        contd.style.color = "green";

        if (contddevice) {
            contddevice.innerHTML = bleDevice.name || "Unknown Device";
        }
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

    function Clickhandeler() {
        if (!bleDevice || !bleDevice.gatt.connected) {
            alert("Please Connect Your Device First!");
            return;
        }

        if (!selectedDevice) {
            alert("⚡ Please select an appliance first!");
            return;
        }

        const statusEl = selectedDevice.querySelector(".status");
        if (!statusEl) {
            alert("⚠️ Selected appliance has no status element!");
            return;
        }

        const applianceName = selectedDevice.querySelector("p")?.textContent;
        if (!applianceName) {
            alert("⚠️ Could not determine appliance name!");
            return;
        }

        const currentStatus = statusEl.textContent.includes("ON");
        const newStatus = currentStatus ? "OFF" : "ON";
        const combinedData = `${newStatus}_${applianceName}`;

        statusEl.textContent = `Status: ${newStatus}`;
        onButton.style.backgroundColor = newStatus === "ON" ? "red" : "green";
        onButton.innerHTML = newStatus === "ON" ? "OFF" : "ON";

        sendCommand(combinedData);
    }

    onButton.addEventListener("click", Clickhandeler);

    connectButton.addEventListener("click", () => {
        if (bleDevice && bleDevice.gatt.connected) {
            disconnectBluetooth();
        } else {
            connectBluetooth();
        }
    });
});
