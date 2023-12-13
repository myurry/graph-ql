const url = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
const signup_url = 'https://01.kood.tech/api/auth/signin';
var jwtToken

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting immediately

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const credentials = btoa(username + ':' + password); // Base64 encode the credentials

    /* FETCH PASSING BASE64 CREDENTIALS AND GETTING TOKEN */
    fetch(signup_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        jwtToken = data; // Update the jwtToken variable with the new token
    })
    .catch(error => console.error('Error:', error));


    // Add the 'shutdown' class to trigger the animation
    document.getElementById('login-container').classList.add('shutdown');

    setTimeout(function() {
        // Optional: Redirect or perform actions after the animation ends
        // window.location.href = 'homepage.html';
        if (typeof jwtToken == 'string' && jwtToken.split('.').length == 3){
            document.getElementsByClassName("loading")[0].remove();

            /* Next steps */
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
                        login
                    }
                    }`
                })
            })
            .then(response => response.json())
            .then(data => data.data.user[0])
            .then(user => console.log(user.id, user.login))
            .catch(error => console.error('Error:', error));

        }else{
            const element = document.getElementsByClassName("loading")[0]
            for (let node of element.childNodes) {
                // Check if the node is a text node
                if (node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = 'Try again. Awaiting connection'; // Replace with your new text
                    break; // Remove this line if you want to change all text nodes
                }
            }
            document.getElementById('login-container').classList.remove('shutdown');
        }

    }, 1000); 
});



function test1() {
    /* TEST QUERY TO GET USER ID */
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

}