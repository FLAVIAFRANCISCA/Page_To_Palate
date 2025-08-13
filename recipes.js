document.addEventListener('DOMContentLoaded', () => {
    const recipesContainer = document.getElementById('recipesGrid');
    const searchInput = document.getElementById('searchInput');
    const recipeModal = document.getElementById('recipeModal');
    const recipeModalContent = document.getElementById('modalBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');

    const recipeModalCloseButton = document.querySelector('#recipeModal .close-button');
    if (recipeModalCloseButton) {
        recipeModalCloseButton.addEventListener('click', () => {
            recipeModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });

    let allRecipes = [];
    let publicRecipes = [];
    let privateRecipes = [];
    let currentRecipes = [];
    let favoritesMode = false;

    async function fetchRecipes(category) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        const data = await response.json();
        return data.meals ? data.meals.map(meal => ({ ...meal, isApiRecipe: true })) : [];
    }

    const fetchUserRecipes = () => {
        const publicUserRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];
        return publicUserRecipes.map(recipe => ({ ...recipe, isApiRecipe: false, isUserRecipe: true }));
    };

    async function fetchAndDisplayAllRecipes() {
        const categories = ['Beef', 'Chicken', 'Dessert', 'Vegetarian', 'Seafood', 'Pork'];
        const apiRecipePromises = categories.map(category => fetchRecipes(category));
        const apiRecipesByCategory = await Promise.all(apiRecipePromises);
        const apiRecipes = apiRecipesByCategory.flat();
        const userRecipes = fetchUserRecipes();
        allRecipes = [...apiRecipes, ...userRecipes];
        currentRecipes = allRecipes;
        displayRecipes(currentRecipes);
    }

    const displayRecipes = (recipes) => {
        recipesContainer.innerHTML = '';
        if (recipes.length === 0) {
            recipesContainer.innerHTML = '<p class="text-center">No recipes found.</p>';
            return;
        }
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.dataset.id = recipe.idMeal || recipe.id;
            recipeCard.innerHTML = `
                <img src="${recipe.strMealThumb || recipe.image}" alt="${recipe.strMeal || recipe.name}">
                <div class="card-content">
                    <h3>${recipe.strMeal || recipe.name}</h3>
                    <div class="card-actions">
                        <button class="button details-btn">View Details</button>
                        ${localStorage.getItem('loggedInUser') && window.location.pathname.endsWith('private-collection.html') ? `<button class="button delete-btn" data-id="${recipe.id}">Delete</button>` : ''}
                    </div>
                </div>
            `;
            recipesContainer.appendChild(recipeCard);
        });
    };

    const fetchPrivateRecipes = () => {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            privateRecipes = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
            currentRecipes = privateRecipes;
            displayRecipes(currentRecipes);
        } else {
            recipesContainer.innerHTML = '<p class="text-center">Please log in to view your private collection.</p>';
        }
    };

    const deleteRecipe = (recipeId) => {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            let privateCollection = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
            // Filter out the recipe from the user's private collection
            const updatedPrivateCollection = privateCollection.filter(recipe => recipe.id !== recipeId);
            localStorage.setItem(`privateCollection-${loggedInUser}`, JSON.stringify(updatedPrivateCollection));

            let publicRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];
            // Filter out the recipe from the public collection
            const updatedPublicRecipes = publicRecipes.filter(recipe => recipe.id !== recipeId);
            localStorage.setItem('publicUserRecipes', JSON.stringify(updatedPublicRecipes));

            window.showNotification('Recipe deleted successfully!', 'success');
            fetchPrivateRecipes();
        }
    };

    recipesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const recipeId = e.target.dataset.id;
            deleteRecipe(recipeId);
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredRecipes = allRecipes.filter(recipe =>
                (recipe.strMeal || recipe.name).toLowerCase().includes(searchTerm)
            );
            displayRecipes(filteredRecipes);
        });
    }

    if (favoritesToggleBtn) {
        favoritesToggleBtn.addEventListener('click', () => {
            favoritesMode = !favoritesMode;
            if (favoritesMode) {
                fetchPrivateRecipes();
                favoritesToggleBtn.textContent = 'Show All Recipes';
            } else {
                currentRecipes = allRecipes;
                displayRecipes(currentRecipes);
                favoritesToggleBtn.textContent = 'Show My Private Collection';
            }
        });
    }
    
    if (window.location.pathname.endsWith('private-collection.html')) {
        fetchPrivateRecipes();
        document.getElementById('pageTitle').textContent = 'My Private Collection';
        if(favoritesToggleBtn) {
            favoritesToggleBtn.classList.add('hide');
        }
    } else if (window.location.pathname.endsWith('favorites.html')) {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            const favoritesPageRecipes = JSON.parse(localStorage.getItem(`favorites-${loggedInUser}`)) || [];
            currentRecipes = favoritesPageRecipes;
            displayRecipes(currentRecipes);
        } else {
            recipesContainer.innerHTML = `<p class="text-center">Please log in to view your favorites.</p>`;
        }
        document.getElementById('pageTitle').textContent = 'My Favorites';
        if(favoritesToggleBtn) {
            favoritesToggleBtn.classList.add('hide');
        }
    } else {
        fetchAndDisplayAllRecipes();
    }
});
