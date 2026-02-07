document.addEventListener('DOMContentLoaded', () => {
    const reloadButton = document.getElementById('reload');
    
    // Function to check online status
    const checkOnlineStatus = async () => {
        try {
            const response = await fetch(window.location.origin, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Handle retry button click
    reloadButton.addEventListener('click', async () => {
        reloadButton.disabled = true;
        reloadButton.classList.add('loading');
        reloadButton.textContent = 'Connecting...';

        const isOnline = await checkOnlineStatus();
        
        if (isOnline) {
            window.location.reload();
        } else {
            reloadButton.textContent = 'Retry Connection';
            reloadButton.disabled = false;
            reloadButton.classList.remove('loading');
            alert('Still offline. Please check your internet connection.');
        }
    });

    // Check for online status periodically
    setInterval(async () => {
        const isOnline = await checkOnlineStatus();
        if (isOnline) {
            window.location.reload();
        }
    }, 30000); // Check every 30 seconds
});
