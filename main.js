const url = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
const signup_url = 'https://01.kood.tech/api/auth/signin';
var jwtToken

var userInfo = {
    username: "InitialUser",
    totalXP: 0,
    auditRatio: 0.0
};

var infoDiv;

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting immediately

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const credentials = btoa(username + ':' + password); // Base64 encode the credentials

    update_token(credentials);
    
    displayUserInfo();
    updateUserInfo('username', username);

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
                                transaction(where: {
                                    userId: {_eq: ${userId}},
                                    path: {_like: "/johvi/div-01/%"},
                                    type: {_like: "xp"},
                                    _not: {
                                        _or: [
                                            {path: {_like: "/johvi/div-01/piscine%"}},
                                            {path: {_like: "/johvi/div-01/%/%"}},
                                        ]
                                    }
                                }) {
                                    amount
                                    createdAt
                                }
                            }`
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        updateUserInfo('totalXP', Math.floor(fill_xp_graph(data.data)/1024)); 
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

function displayUserInfo() {
    if (!infoDiv) {
        infoDiv = document.createElement('div'); // Create the div if it doesn't exist
        infoDiv.id = 'userInfoDiv'; // Assign an ID for potential styling or later reference
    }

    // Format the innerHTML with user information
    infoDiv.innerHTML = `Name: ${userInfo.username} &nbsp;&nbsp; XP Amount: ${userInfo.totalXP.toLocaleString()}kB &nbsp;&nbsp; Audit Ratio: ${userInfo.auditRatio.toFixed(2)}`;

    // Find the 'welcomeLabel' element
    const welcomeLabel = document.getElementById('welcomeLabel');

    if (welcomeLabel) {
        // If the welcome label exists, insert the info div right after it
        welcomeLabel.parentNode.insertBefore(infoDiv, welcomeLabel.nextSibling);
    } else {
        // If the welcome label isn't found, add the info at the top of the body
        document.body.insertBefore(infoDiv, document.body.firstChild);
    }
}

function updateUserInfo(attributeName, newValue) {
    if (attributeName in userInfo) {
        userInfo[attributeName] = newValue; // Update the attribute
        displayUserInfo(); // Refresh the display to show updated information
        console.log(`Updated ${attributeName} to ${newValue}.`);
    } else {
        console.error(`Attribute '${attributeName}' not found.`);
    }
}

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
        if (data && data.data && data.data.transaction[0] && data.data.transaction[0].user.auditRatio > 0) {
            const auditRatio = data.data.transaction[0].user.auditRatio; // Getting the first user's auditRatio
            return auditRatio; // Return the Ratio
        } else {
            console.error(`Wrong request sequence, data: ${JSON.stringify(data.data.transaction[0])}`);
            return null; // Return null or throw an error as appropriate
        }
    } catch (error) {
        console.error('Error:', error);
        return null; // Return null or throw an error as appropriate
    }
}

async function drawAuditRatioGraph() {
    const auditRatio = await get_audit_ratio(); // Get the audit ratio
    updateUserInfo('auditRatio', auditRatio);  
    console.log(auditRatio);
    const maxHeight = 350; // Maximum height for the tallest square
    const spaceFromTop = 50; // Space to leave from the top of the SVG

    // Calculate the height of the first square representing '1'
    let firstSquareHeight = maxHeight; 
    if (auditRatio < 1) {
        firstSquareHeight = maxHeight * auditRatio; // If the ratio is less than 1, scale down the first square
    }

    // Calculate the height of the second square based on the audit ratio
    let secondSquareHeight = maxHeight * auditRatio;
    if (secondSquareHeight + spaceFromTop > 400) {
        // If the second square exceeds the SVG height, scale both down proportionally
        secondSquareHeight = 400 - spaceFromTop;
        firstSquareHeight = secondSquareHeight / auditRatio;
    }

    const gap = 50; // Gap between squares
    const firstSquareX = 25; // Starting x for the first square
    const firstSquareWidth = 250; // The width of the first square
    const secondSquareX = firstSquareX + firstSquareWidth + gap; // Starting x for the second square

    // Define the y position for the top of the squares
    const firstSquareY = 400 - firstSquareHeight;
    const secondSquareY = 400 - secondSquareHeight;

    // Add these rectangles to your SVG
    const svg = document.getElementById('graph2');
    
    // First rectangle representing '1'
    const squareOne = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    squareOne.setAttribute('x', firstSquareX);
    squareOne.setAttribute('y', firstSquareY);
    squareOne.setAttribute('width', firstSquareWidth);
    squareOne.setAttribute('height', firstSquareHeight);
    squareOne.style.fill = '#F050F0'; // Choose your color
    svg.appendChild(squareOne);

    // Second rectangle representing auditRatio
    const squareTwo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    squareTwo.setAttribute('x', secondSquareX);
    squareTwo.setAttribute('y', secondSquareY);
    squareTwo.setAttribute('width', firstSquareWidth);
    squareTwo.setAttribute('height', secondSquareHeight);
    squareTwo.style.fill = '#50F0F0'; // Choose your color
    svg.appendChild(squareTwo);

    // Create text label for the first rectangle
    const labelOne = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelOne.setAttribute('x', firstSquareX + firstSquareWidth / 2);
    labelOne.setAttribute('y', firstSquareY - 10); // Position above the square
    labelOne.setAttribute('text-anchor', 'middle');
    labelOne.textContent = '1';
    svg.appendChild(labelOne);

    // Create text label for the second rectangle
    const labelTwo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelTwo.setAttribute('x', secondSquareX + firstSquareWidth / 2);
    labelTwo.setAttribute('y', secondSquareY - 10); // Position above the square
    labelTwo.setAttribute('text-anchor', 'middle');
    labelTwo.textContent = auditRatio.toFixed(2); // Format the audit ratio to two decimal places
    svg.appendChild(labelTwo);

    const recievedAuditLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    recievedAuditLabel.setAttribute('x', firstSquareX + firstSquareWidth / 2);
    recievedAuditLabel.setAttribute('y', firstSquareY + firstSquareHeight - 16); // Near the bottom of the first rectangle
    recievedAuditLabel.setAttribute('class', 'label-text');
    recievedAuditLabel.setAttribute('text-anchor', 'middle');
    recievedAuditLabel.textContent = 'Received';
    svg.appendChild(recievedAuditLabel);

    const givenAuditLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    givenAuditLabel.setAttribute('x', secondSquareX + firstSquareWidth / 2);
    givenAuditLabel.setAttribute('y', secondSquareY + secondSquareHeight - 16); // Near the bottom of the second rectangle
    givenAuditLabel.setAttribute('class', 'label-text');
    givenAuditLabel.setAttribute('text-anchor', 'middle');
    givenAuditLabel.textContent = 'Given';
    svg.appendChild(givenAuditLabel);
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
    const firstTransactionDate = new Date(transactions[0].x);
    const lastTransactionDate = new Date(transactions[transactions.length - 1].x);

    draw_section_descriptions(firstTransactionDate, lastTransactionDate, totalXP);

    console.log(totalXP);
    return totalXP;
}

function draw_section_descriptions(firstTransactionDate, lastTransactionDate, totalXP) {
    const svg = document.getElementById('graph1');
    const months = generateMonthYearArray(firstTransactionDate, lastTransactionDate); // Assume this function returns the array correctly
    const monthPositions = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600]; // X positions for each month

    // Drawing month labels
    months.forEach((month, index) => {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', monthPositions[index]);
        textElement.setAttribute('y', 390); // Adjust based on your SVG layout
        textElement.textContent = month;
        textElement.setAttribute('class', 'axis-text'); // Adjust if you have a specific class for styling
        textElement.setAttribute('class', 'glow'); // Adjust if you have a specific class for styling
        svg.appendChild(textElement);
    });

    // Calculate and draw XP steps
    const xpStepValue = totalXP / 8; // Calculate step value
    // Adjusted Y positions for each XP step to align with the grid lines
    const yPos = [365, 315, 265, 215, 165, 115, 65, 15]; // Y positions for XP steps

    yPos.forEach((y, index) => {
        const xpValue = Math.round(xpStepValue * (index + 1)); // Start from the first step value, not 0
        const xpTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xpTextElement.setAttribute('x', 10); // Adjust X position based on your layout to avoid overlap
        xpTextElement.setAttribute('y', y); // Set Y position from yPos array
        
        xpTextElement.textContent = xpValue.toLocaleString(); // Format number with commas
        
        // Make the '0' text element invisible
        if (xpValue === 0) {
            xpTextElement.style.visibility = 'hidden';
        }
        xpTextElement.setAttribute('class', 'xp-appear axis-text');
        xpTextElement.style.animationDelay = `${index * 0.2}s`;
        svg.appendChild(xpTextElement);
    });
}

function generateMonthYearArray(firstDate, lastDate) {
    let dates = [];
    const startDate = new Date(firstDate);
    const endDate = new Date(lastDate);

    // Calculate the total number of months between the start and end dates
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    // Calculate the step size to evenly distribute the dates. We want 12 intervals for 13 elements.
    const step = totalMonths / 12;

    let currentStep = 0; // Initialize current step
    for (let i = 0; i < 12; i++) { // Generate 12 intermediate steps
        const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + currentStep, startDate.getDate());
        dates.push(currentDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
        currentStep = Math.round((i + 1) * step); // Update current step based on the interval
    }

    // Add the last date explicitly to ensure it's included
    dates.push(endDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }));

    return dates;
}
