chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'greet') {
        console.log('Greeting received from popup.');
        sendResponse({message: 'Hello from background!'});
    }
});
