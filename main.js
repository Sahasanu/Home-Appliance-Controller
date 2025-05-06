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
                    selectedDevice.style.border = "none";
                }
                selectedDevice = device;
                selectedDevice.style.border = "2px solid black";
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
        if (bleDevice?.gatt?.connected) {
            bleDevice.gatt.disconnect();
        }
    }

    function onDisconnected() {
        console.log("ESP32 Disconnected.");
        connectButton.innerText = "Connect";
        connectButton.style.backgroundColor = "green";
        contd.innerHTML = "Disconnected";
        contd.style.color = "red";
        contddevice.innerHTML = "No Device";
        bleCharacteristic = null;
        bleDevice = null;
    }

    function onConnected() {
        connectButton.innerText = "Disconnect";
        connectButton.style.backgroundColor = "red";
        contd.innerHTML = "Connected";
        contd.style.color = "green";
        contddevice.innerHTML = bleDevice?.name || "Unknown Device";
    }

    async function sendCommand(command) {
        if (!bleCharacteristic) {
            alert("❗ Please connect to the ESP32 first!");
            return;
        }

        try {
            await bleCharacteristic.writeValue(new TextEncoder().encode(command));
            console.log(`✅ Sent command: ${command}`);
        } catch (error) {
            console.error("Error sending command:", error);
            alert("⚠️ Failed to send command!");
        }
    }

    function Clickhandeler() {
        if (!bleDevice?.gatt?.connected) {
            alert("Please Connect Your Device First!");
            return;
        }

        if (!selectedDevice) {
            alert("⚡ Please select an appliance first!");
            return;
        }

        const statusEl = selectedDevice.querySelector(".status");
        const applianceName = selectedDevice.querySelector("p")?.textContent.replace(" ", "-");
        
        if (!statusEl || !applianceName) {
            alert("⚠️ Could not determine appliance status!");
            return;
        }

        const currentStatus = statusEl.textContent.includes("ON");
        const newStatus = currentStatus ? "OFF" : "ON";
        const command = `${newStatus}_${applianceName}`;

        statusEl.textContent = `Status: ${newStatus}`;
        onButton.style.backgroundColor = newStatus === "ON" ? "red" : "green";
        onButton.textContent = newStatus === "ON" ? "OFF" : "ON";

        sendCommand(command);
    }

    onButton.addEventListener("click", Clickhandeler);
    connectButton.addEventListener("click", () => {
        bleDevice?.gatt?.connected ? disconnectBluetooth() : connectBluetooth();
    });
});