document.addEventListener('DOMContentLoaded', async () => {

    const shortLibraryData = await fetch('/api/short-library');
    const shortLibrary = await shortLibraryData.json()

})