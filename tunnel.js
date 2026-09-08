import localtunnel from 'localtunnel';

async function startTunnel() {
    try {
        console.log('[Tunnel] Creating tunnel on port 8000...');
        const tunnel = await localtunnel({ port: 8000, subdomain: 'hontech-capstone-active' });
        
        console.log(`========================================`);
        console.log(`ACTIVE_URL: ${tunnel.url}`);
        console.log(`========================================`);

        tunnel.on('close', () => {
            console.log('[Tunnel] Tunnel closed. Reconnecting in 3s...');
            setTimeout(startTunnel, 3000);
        });

        tunnel.on('error', (err) => {
            console.error('[Tunnel] Error:', err.message);
            setTimeout(startTunnel, 3000);
        });

    } catch (err) {
        console.error('[Tunnel] Failed to start:', err.message);
        setTimeout(startTunnel, 5000);
    }
}

process.on('uncaughtException', (err) => {
    console.error('[Tunnel] Uncaught exception:', err.message);
    setTimeout(startTunnel, 3000);
});

startTunnel();

// Keep process active
setInterval(() => {}, 1000 * 60 * 60);

