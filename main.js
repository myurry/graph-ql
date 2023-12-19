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
        
        if (typeof jwtToken == 'string' && jwtToken.split('.').length == 3){
            // First, remove the loading element
            document.getElementsByClassName("loading")[0].remove();

        // Then, call `get_id()` and wait for it to resolve
            get_id().then(userId => {
                if (userId) {
                    // Once we have the user ID, we can make the fetch request for transactions
                    fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`
                        },
                        body: JSON.stringify({
                            query: `
                            {
                                transaction (where: {userId: {_eq: ${userId}}}) {
                                amount
                                createdAt
                                }
                            }`
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(fill_xp_graph(data.data));
                    })
                    .catch(error => console.error('Error:', error));
                } else {
                    console.error('Failed to get user ID');
                }
            }).catch(error => {
                console.error('Error getting user ID:', error);
            });

            drawAuditRatioGraph();

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

async function get_id() {
    try {
        const response = await fetch(url, {
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
        });
        const data = await response.json();
        // Assuming the data contains the user object and that it's an array
        if (data && data.data && data.data.user && data.data.user.length > 0) {
            const userId = data.data.user[0].id; // Getting the first user's ID
            return userId; // Return the ID
        } else {
            console.error('No user ID found');
            return null; // Return null or throw an error as appropriate
        }
    } catch (error) {
        console.error('Error:', error);
        return null; // Return null or throw an error as appropriate
    }
}

async function get_audit_ratio() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({
                query: `
                {
                    transaction {
                      user {
                        auditRatio
                      }
                    }
                  }`
            })
        });
        const data = await response.json();
        // Assuming the data contains the user object and that it's an array
        if (data && data.data && data.data.user && data.data.user.length > 0) {
            const auditRatio = data.data.transaction[0].user.auditRatio; // Getting the first user's auditRatio
            return auditRatio; // Return the ID
        } else {
            console.error('No user ID found');
            return null; // Return null or throw an error as appropriate
        }
    } catch (error) {
        console.error('Error:', error);
        return null; // Return null or throw an error as appropriate
    }
}

async function drawAuditRatioGraph() {
    const auditRatio = await get_audit_ratio(); // Get the audit ratio
    const maxHeight = 400; // Maximum height for the square representing 1
    let firstSquareHeight = maxHeight; // Height for the square representing 1

    // If the audit ratio is larger than 1, scale down the first square
    if (auditRatio > 1) {
        firstSquareHeight = maxHeight / auditRatio;
    }

    const secondSquareHeight = auditRatio * maxHeight; // Height for the audit_ratio square

    // Assume gap is the space you want between squares
    const gap = 20;

    // Recalculate the x positions to include the gap
    const firstSquareX = 50; // Starting x for the first square
    const firstSquareWidth = 100; // The width of the first square

    const secondSquareX = firstSquareX + firstSquareWidth + gap; // Starting x for the second square

    const squareOnePath = `M ${firstSquareX} 400 H ${firstSquareX + firstSquareWidth} V ${400 - firstSquareHeight} H ${firstSquareX} Z`;
    const squareTwoPath = `M ${secondSquareX} 400 H ${secondSquareX + firstSquareWidth} V ${400 - secondSquareHeight} H ${secondSquareX} Z`;
    
    // Add these paths to your SVG
    const svg = document.getElementById('graph2');
    const squareOne = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    squareOne.setAttribute('d', squareOnePath);
    squareOne.style.fill = 'red'; // Choose your color
    svg.appendChild(squareOne);

    const squareTwo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    squareTwo.setAttribute('d', squareTwoPath);
    squareTwo.style.fill = 'blue'; // Choose your color
    svg.appendChild(squareTwo);
}

function fill_xp_graph(data) {
    let cumulativeSum = 0;
    const transactions = data.transaction
        .map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() })) // Convert createdAt to timestamp
        .sort((a, b) => a.createdAt - b.createdAt) // Sort by createdAt timestamp
        .map(t => ({
            x: t.createdAt,
            y: (cumulativeSum += +t.amount) // Ensure amount is a number and accumulate the sum
        }));


    // Scaling functions remain the same
    const minX = Math.min(...transactions.map(t => t.x));
    const maxX = Math.max(...transactions.map(t => t.x));
    const minY = Math.min(...transactions.map(t => t.y));
    const maxY = Math.max(...transactions.map(t => t.y));
    const scaleX = x => (x - minX) / (maxX - minX) * 600;
    const scaleY = y => 400 - (y - minY) / (maxY - minY) * 400;

    // Draw lines for cumulative values
    const svg = document.getElementById('graph1');
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

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;

    // Force reflow to ensure the animation runs when the class is added
    path.getBoundingClientRect();
    path.style.animation = 'draw-line 5s ease forwards'; 

    let totalXP = transactions[transactions.length - 1].y; // Assuming the last transaction contains the total sum
    // Update the text element for total XP
    document.querySelector('#graph .total-xp').textContent = `Total XP: ${totalXP}`;
    return totalXP;
}