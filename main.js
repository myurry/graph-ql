const url = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
const jwtToken = 'placeholder';

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
        query: `
        {
          user {
            id
          }
        }`
    })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting immediately
    console.log("prevented default action")
    // Add the 'shutdown' class to trigger the animation
    document.getElementById('login-container').classList.add('shutdown');

    // Optional: Redirect or perform actions after the animation ends
    setTimeout(function() {
        // Redirect or further actions
        // window.location.href = 'homepage.html'; // Example redirect
    }, 1000); // The timeout duration should match the animation duration
});