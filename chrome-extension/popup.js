document.addEventListener('DOMContentLoaded', function() {
    // Update the current time
    const timeElement = document.getElementById('currentTime');
    timeElement.textContent = new Date().toLocaleTimeString();

    // Function to call the API and get data
    function fetchData() {
        fetch('http://127.0.0.1:5000/api/demo')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log(data); // Handle the data as needed
                // You can update the UI or do something with the data here
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }

    // Call the function when needed, e.g., on button click or popup open
    fetchData();

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
