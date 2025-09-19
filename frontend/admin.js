document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    fetchCoffees();
    setupAddCoffeeForm();
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
        addDeleteListeners();
        addEditListeners();
        addSaveCancelListeners();
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
        coffeeItemDiv.dataset.id = coffee.id; // Add data-id for easy access
        coffeeItemDiv.innerHTML = `
            <img src="${coffee.image_url}" alt="${coffee.name}">
            <h2 class="coffee-name">${coffee.name}</h2>
            <p class="coffee-description">${coffee.description}</p>
            <div class="coffee-image-url" style="display:none;">${coffee.image_url}</div>
            <div class="votes">Votes: ${coffee.votes}</div>
            <button class="edit-button" data-id="${coffee.id}">Edit</button>
            <button class="delete-button" data-id="${coffee.id}">Delete</button>
            <div class="edit-mode" style="display:none;">
                <input type="text" class="edit-name" value="${coffee.name}" placeholder="Name">
                <input type="text" class="edit-description" value="${coffee.description}" placeholder="Description">
                <input type="text" class="edit-image-url" value="${coffee.image_url}" placeholder="Image URL">
                <button class="save-button" data-id="${coffee.id}">Save</button>
                <button class="cancel-button" data-id="${coffee.id}">Cancel</button>
            </div>
        `;
        coffeeListDiv.appendChild(coffeeItemDiv);
    });
}

function setupAddCoffeeForm() {
    const form = document.getElementById('add-coffee-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('coffee-name').value;
        const description = document.getElementById('coffee-description').value;
        const imageUrl = document.getElementById('coffee-image-url').value;

        try {
            const response = await fetch('/api/coffees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, image_url: imageUrl }),
            });

            if (response.ok) {
                const newCoffee = await response.json();
                console.log('Coffee added:', newCoffee);
                // Clear form fields
                form.reset();
                // Re-fetch and re-render coffees to show the new entry
                fetchCoffees();
            } else {
                const errorData = await response.json();
                console.error('Error adding coffee:', errorData.detail);
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error('Network error during add coffee:', error);
            alert('Network error. Please try again.');
        }
    });
}

function addDeleteListeners() {
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const coffeeId = event.target.dataset.id;
            if (confirm('Are you sure you want to delete this coffee?')) {
                try {
                    const response = await fetch(`/api/coffees/${coffeeId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        console.log(`Coffee ${coffeeId} deleted.`);
                        fetchCoffees(); // Re-fetch and re-render coffees
                    } else {
                        const errorData = await response.json();
                        console.error('Error deleting coffee:', errorData.detail);
                        alert(`Error: ${errorData.detail}`);
                    }
                } catch (error) {
                    console.error('Network error during delete:', error);
                    alert('Network error. Please try again.');
                }
            }
        });
    });
}

function addEditListeners() {
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const coffeeItemDiv = event.target.closest('.coffee-item');
            const coffeeId = coffeeItemDiv.dataset.id;

            // Hide display elements
            coffeeItemDiv.querySelector('.coffee-name').style.display = 'none';
            coffeeItemDiv.querySelector('.coffee-description').style.display = 'none';
            coffeeItemDiv.querySelector('img').style.display = 'none';
            coffeeItemDiv.querySelector('.votes').style.display = 'none';
            event.target.style.display = 'none'; // Hide Edit button
            coffeeItemDiv.querySelector('.delete-button').style.display = 'none'; // Hide Delete button

            // Show edit elements
            const editModeDiv = coffeeItemDiv.querySelector('.edit-mode');
            editModeDiv.style.display = 'block';

            // Populate edit fields with current values
            editModeDiv.querySelector('.edit-name').value = coffeeItemDiv.querySelector('.coffee-name').textContent;
            editModeDiv.querySelector('.edit-description').value = coffeeItemDiv.querySelector('.coffee-description').textContent;
            editModeDiv.querySelector('.edit-image-url').value = coffeeItemDiv.querySelector('.coffee-image-url').textContent;
        });
    });
}

function addSaveCancelListeners() {
    document.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const coffeeItemDiv = event.target.closest('.coffee-item');
            const coffeeId = coffeeItemDiv.dataset.id;
            const name = coffeeItemDiv.querySelector('.edit-name').value;
            const description = coffeeItemDiv.querySelector('.edit-description').value;
            const imageUrl = coffeeItemDiv.querySelector('.edit-image-url').value;

            try {
                const response = await fetch(`/api/coffees/${coffeeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: parseInt(coffeeId), name, description, image_url: imageUrl, votes: 0 }),
                });

                if (response.ok) {
                    console.log(`Coffee ${coffeeId} updated.`);
                    fetchCoffees(); // Re-fetch and re-render coffees
                } else {
                    const errorData = await response.json();
                    console.error('Error updating coffee:', errorData.detail);
                    alert(`Error: ${errorData.detail}`);
                }
            } catch (error) {
                console.error('Network error during update:', error);
                alert('Network error. Please try again.');
            }
        });
    });

    document.querySelectorAll('.cancel-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const coffeeItemDiv = event.target.closest('.coffee-item');
            // Revert to display mode
            coffeeItemDiv.querySelector('.coffee-name').style.display = 'block';
            coffeeItemDiv.querySelector('.coffee-description').style.display = 'block';
            coffeeItemDiv.querySelector('img').style.display = 'block';
            coffeeItemDiv.querySelector('.votes').style.display = 'block';
            coffeeItemDiv.querySelector('.edit-button').style.display = 'inline-block';
            coffeeItemDiv.querySelector('.delete-button').style.display = 'inline-block';
            coffeeItemDiv.querySelector('.edit-mode').style.display = 'none';
        });
    });
}
