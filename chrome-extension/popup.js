document.addEventListener('DOMContentLoaded', function() {
    // Update the current time
    const timeElement = document.getElementById('currentTime');
    timeElement.textContent = new Date().toLocaleTimeString();

    // Add click event listener to the button
    const greetButton = document.getElementById('greetButton');
    greetButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "greet"}, function(response) {
                alert('Hello from the Sample Extension!');
            });
        });
    });
});
