document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    fetchCoffees();
    setupThemeSwitcher();
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Default to system preference if no theme saved
        document.body.classList.add('dark-mode');
    }
}

function setupThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}

async function fetchCoffees() {
    try {
        const response = await fetch('/api/coffees');
        const coffees = await response.json();
        renderCoffees(coffees);
        addUpvoteListeners();
    } catch (error) {
        console.error('Error fetching coffees:', error);
    }
}

function renderCoffees(coffees) {
    const coffeeListDiv = document.getElementById('coffee-list');
    coffeeListDiv.innerHTML = ''; // Clear existing content

    coffees.forEach(coffee => {
        const coffeeItemDiv = document.createElement('div');
        coffeeItemDiv.className = 'coffee-item';
        coffeeItemDiv.innerHTML = `
            <img src="${coffee.image_url}" alt="${coffee.name}">
            <h2>${coffee.name}</h2>
            <p>${coffee.description}</p>
            <div class="votes">Votes: ${coffee.votes}</div>
            <button data-id="${coffee.id}">Upvote</button>
        `;
        coffeeListDiv.appendChild(coffeeItemDiv);
    });
}

function addUpvoteListeners() {
    document.querySelectorAll('.coffee-item button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const coffeeId = event.target.dataset.id;
            await upvoteCoffee(coffeeId, event.target);
        });
    });
}

async function upvoteCoffee(coffeeId, buttonElement) {
    try {
        const response = await fetch(`/api/coffees/${coffeeId}/vote`, {
            method: 'POST',
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);
            
            // Increment displayed vote count
            const votesDiv = buttonElement.previousElementSibling;
            let currentVotes = parseInt(votesDiv.textContent.replace('Votes: ', ''));
            votesDiv.textContent = `Votes: ${currentVotes + 1}`;

            // Disable button and add class
            buttonElement.disabled = true;
            buttonElement.textContent = 'Voted!';
            buttonElement.classList.add('voted-button');

        } else {
            const errorData = await response.json();
            console.error('Error upvoting coffee:', errorData.detail);
            alert(errorData.detail); // Provide feedback to user
        }
    } catch (error) {
        console.error('Network error during upvote:', error);
        alert('Network error. Please try again.');
    }
}
