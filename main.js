const url = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
const signup_url = 'https://01.kood.tech/api/auth/signin';
var jwtToken


document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting immediately

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const credentials = btoa(username + ':' + password); // Base64 encode the credentials

    update_token(credentials);
    

    // Add the 'shutdown' class to trigger the animation
    document.getElementById('login-container').classList.add('shutdown');

    setTimeout(function() {
        // Optional: Redirect or perform actions after the animation ends
        // window.location.href = 'homepage.html';
        if (typeof jwtToken == 'string' && jwtToken.split('.').length == 3){
            document.getElementsByClassName("loading")[0].remove();

            /* Attempt to get data for svg graphs */
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({
                    query: `
                    {
                        transaction {
                          amount
                          createdAt
                        }
                    }`
                })
            })
            .then(response => response.json())
            .then(data => fill_graph(data.data))
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


/* FETCH PASSING BASE64 CREDENTIALS AND GETTING TOKEN */
function update_token(credentials) {
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
}

function fill_graph(data) {
    let cumulativeSum = 0;
    const transactions = data.transaction
        .map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() })) // Convert createdAt to timestamp
        .sort((a, b) => a.createdAt - b.createdAt) // Sort by createdAt timestamp
        .map(t => ({
            x: t.createdAt,
            y: (cumulativeSum += +t.amount) // Ensure amount is a number and accumulate the sum
        }));
    
    console.log(transactions);
    console.log(transactions);

    // Scaling functions remain the same
    const minX = Math.min(...transactions.map(t => t.x));
    const maxX = Math.max(...transactions.map(t => t.x));
    const minY = Math.min(...transactions.map(t => t.y));
    const maxY = Math.max(...transactions.map(t => t.y));
    const scaleX = x => (x - minX) / (maxX - minX) * 600;
    const scaleY = y => 400 - (y - minY) / (maxY - minY) * 400;

    // Draw lines for cumulative values
    const svg = document.getElementById('graph');
    let pathD = `M ${scaleX(transactions[0].x)} ${scaleY(transactions[0].y)}`; // Move to the first point

    for (let i = 1; i < transactions.length; i++) {
        // Draw line to the next point
        pathD += ` L ${scaleX(transactions[i].x)} ${scaleY(transactions[i].y)}`;
    }

    // Create a <path> element to represent the line graph
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.style.stroke = 'green';
    path.style.strokeWidth = '2';
    path.style.fill = 'none';
    svg.appendChild(path);

    let totalXP = transactions[transactions.length - 1].y; // Assuming the last transaction contains the total sum
    // Update the text element for total XP
    document.querySelector('#graph .total-xp').textContent = `Total XP: ${totalXP}`;

}