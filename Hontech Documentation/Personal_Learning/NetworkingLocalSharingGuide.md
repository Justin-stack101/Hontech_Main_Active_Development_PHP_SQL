# Local Network Sharing & Deployment Guide

This guide explains the network concepts and troubleshooting steps required to share a locally hosted Web Application (like Hontech AutoCenter Operations System) with other devices on the same Local Area Network (LAN).

---

## 1. Loopback vs. LAN IP Addresses

### Localhost (`127.0.0.1`)
- **What it is**: The loopback address. It points directly back to the machine you are currently typing on.
- **Limitation**: If you send `http://localhost:5001` to a teammate, their browser will search for the website running on *their* machine. They will get a `Connection Refused` error.

### IPv4 Network Address (`e.g., 192.168.1.8`)
- **What it is**: The unique IP address assigned to your machine by your local Wi-Fi router.
- **Usage**: To share your site, you must provide your network IP address:
  ```text
  http://192.168.1.8:5001/
  ```

---

## 2. Server Interface Bindings (`127.0.0.1` vs. `0.0.0.0`)

When a web server starts up, it binds to a specific network interface to listen for traffic:

1. **`127.0.0.1` (Localhost Loopback)**:
   - Restricts listening exclusively to internal requests.
   - External devices on the LAN cannot access the server.
2. **`0.0.0.0` (All Interfaces)**:
   - Instructs Node.js / Express to listen on all available adapters (Wi-Fi, Ethernet, Loopback).
   - Allows external machines to connect.

### How it is configured in Hontech:
In `backend/server.js`, we configure the server to listen on all interfaces:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 3. Resolving Windows Defender Firewall Blocks

Windows automatically blocks incoming network packets on unrecognized ports (such as `5001`) to protect your OS. 

To open port `5001` to let teammates connect:
- Open **Command Prompt** (Run as Administrator) and execute:
  ```cmd
  netsh advfirewall firewall add rule name="Allow Hontech Port 5001" dir=in action=allow protocol=TCP localport=5001
  ```

---

## 4. Bypassing Wi-Fi AP Isolation

Many university, school, or public coffee shop Wi-Fi networks block direct device-to-device communication for privacy. This is called **Access Point (AP) Isolation**.

### The Hotspot Workaround:
If the server is active and the firewall is open, but your teammate still cannot connect:
1. Turn on a **Mobile Hotspot** on your phone.
2. Connect **both laptops** to your phone's hotspot.
3. Open CMD and type `ipconfig` to find your new IP address.
4. Send your teammate the updated link (e.g., `http://192.168.43.12:5001/`). It will connect instantly.
