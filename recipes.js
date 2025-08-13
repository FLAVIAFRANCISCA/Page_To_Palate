document.addEventListener('DOMContentLoaded', () => {
    const recipesContainer = document.getElementById('recipesGrid');
    const searchInput = document.getElementById('searchInput');
    const recipeModal = document.getElementById('recipeModal');
    const recipeModalContent = document.getElementById('modalBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');

    // Add event listener for the close button on the recipe modal
    const recipeModalCloseButton = document.querySelector('#recipeModal .close-button');
    if (recipeModalCloseButton) {
        recipeModalCloseButton.addEventListener('click', () => {
            recipeModal.style.display = 'none';
        });
    }

    // Also close the modal when clicking outside of it
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
    
    // Function to fetch recipes from TheMealDB API
    async function fetchRecipes(category) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        const data = await response.json();
        return data.meals ? data.meals.map(meal => ({ ...meal, category: category, source: 'api' })) : [];
    }

    // Function to fetch and combine all recipes
    async function fetchAndDisplayAllRecipes() {
        recipesContainer.innerHTML = `<p class="text-center">Fetching delicious recipes...</p>`;
        publicRecipes = [];

        try {
            const categoriesToFetch = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pork', 'Seafood', 'Starter', 'Vegetarian', 'Vegan', 'Breakfast'];
            for (const category of categoriesToFetch) {
                const recipes = await fetchRecipes(category);
                publicRecipes.push(...recipes);
            }
            
            // Add user-created public recipes from local storage
            const userPublicRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];
            publicRecipes.push(...userPublicRecipes);

            allRecipes = publicRecipes;
            currentRecipes = allRecipes;
            displayRecipes(currentRecipes);
        } catch (error) {
            recipesContainer.innerHTML = `<p class="text-center">Failed to load recipes. Please try again later.</p>`;
            console.error('Error fetching recipes:', error);
        }
    }

    // Function to fetch and display private recipes
    function fetchPrivateRecipes() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            privateRecipes = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
            currentRecipes = privateRecipes;
            displayRecipes(currentRecipes);
        } else {
            recipesContainer.innerHTML = `<p class="text-center">Please log in to view your private collection.</p>`;
        }
    }

    // Function to create a single recipe card HTML
    function createRecipeCard(recipe) {
        const imageUrl = recipe.strMealThumb || recipe.image;
        const recipeTitle = recipe.strMeal || recipe.title;
        const recipeId = recipe.idMeal || recipe.id;
        const recipeCategory = recipe.strCategory || recipe.category;
        const isFavorite = isRecipeInFavorites(recipeId);
        const isPrivate = recipe.isPrivate || false;
        
        return `
            <div class="recipe-card-container">
                <div class="recipe-card" data-id="${recipeId}" data-source="${recipe.source || 'api'}">
                    <img src="${imageUrl}" alt="${recipeTitle}" />
                    <div class="recipe-card-content">
                        <p class="recipe-category">${recipeCategory}</p>
                        <h3>${recipeTitle}</h3>
                        <button class="button view-recipe-btn" data-id="${recipeId}">View Recipe</button>
                    </div>
                </div>
                ${!isPrivate ? `<span class="favorite-icon ${isFavorite ? 'active' : ''}" data-id="${recipeId}">&#x2764;</span>` : ''}
            </div>
        `;
    }

    // Function to render all recipe cards
    function displayRecipes(recipes) {
        recipesContainer.innerHTML = '';
        if (recipes.length === 0) {
            noResultsMessage.classList.remove('hide');
        } else {
            noResultsMessage.classList.add('hide');
            recipes.forEach(recipe => {
                const cardHtml = createRecipeCard(recipe);
                recipesContainer.innerHTML += cardHtml;
            });
        }
        addCardClickListeners();
        addFavoriteIconListeners();
    }

    // Function to get ingredients for a recipe from API details
    async function getIngredientsFromAPI(recipe) {
        if (recipe.instructions && recipe.ingredients) {
            return recipe.ingredients; // Return local storage recipe ingredients
        }
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
        const data = await response.json();
        const meal = data.meals[0];
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
            } else {
                break;
            }
        }
        return ingredients;
    }

    // Function to get instructions for a recipe from API details
    async function getInstructionsFromAPI(recipe) {
        if (recipe.instructions) {
            return recipe.instructions; // Return local storage recipe instructions
        }
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
        const data = await response.json();
        const meal = data.meals[0];
        return meal.strInstructions;
    }

    // Function to handle opening the recipe modal
    function addCardClickListeners() {
        document.querySelectorAll('.view-recipe-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                const id = button.dataset.id;
                const recipe = currentRecipes.find(r => (r.idMeal || r.id) === id);

                if (!recipe) {
                    window.showNotification('Recipe details not found.', 'error');
                    return;
                }

                const ingredients = await getIngredientsFromAPI(recipe);
                const instructions = await getInstructionsFromAPI(recipe);
                const imageUrl = recipe.strMealThumb || recipe.image;
                
                recipeModalContent.innerHTML = `
                    <div class="modal-image-container">
                        <img src="${imageUrl}" alt="${recipe.strMeal || recipe.title}" />
                    </div>
                    <h2>${recipe.strMeal || recipe.title}</h2>
                    <div class="modal-text-content">
                        <h3>Ingredients</h3>
                        <ul>
                            ${ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                        </ul>
                        <h3>Instructions</h3>
                        <p>${instructions}</p>
                    </div>
                `;
                recipeModal.style.display = 'block';
            });
        });
    }

    // Function to handle adding/removing favorites
    function addFavoriteIconListeners() {
        document.querySelectorAll('.favorite-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const id = icon.dataset.id;
                const loggedInUser = localStorage.getItem('loggedInUser');

                if (!loggedInUser) {
                    window.showNotification('You must be logged in to add favorites.', 'error');
                    return;
                }
                
                let favorites = JSON.parse(localStorage.getItem(`favorites-${loggedInUser}`)) || [];
                const recipe = currentRecipes.find(r => (r.idMeal || r.id) === id);
                
                if (!recipe) {
                    return;
                }

                const isCurrentlyFavorite = favorites.some(fav => (fav.idMeal || fav.id) === id);

                if (isCurrentlyFavorite) {
                    // Remove from favorites
                    favorites = favorites.filter(fav => (fav.idMeal || fav.id) !== id);
                    icon.classList.remove('active');
                    window.showNotification('Recipe removed from favorites.', 'info');
                } else {
                    // Add to favorites
                    favorites.push(recipe);
                    icon.classList.add('active');
                    window.showNotification('Recipe added to favorites!', 'success');
                }

                localStorage.setItem(`favorites-${loggedInUser}`, JSON.stringify(favorites));

                if (window.location.pathname.endsWith('favorites.html')) {
                    const favoritesPageRecipes = JSON.parse(localStorage.getItem(`favorites-${loggedInUser}`)) || [];
                    displayRecipes(favoritesPageRecipes);
                }
            });
        });
    }

    // Helper function to check if a recipe is in the user's favorites
    function isRecipeInFavorites(recipeId) {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            return false;
        }
        const favorites = JSON.parse(localStorage.getItem(`favorites-${loggedInUser}`)) || [];
        return favorites.some(fav => (fav.idMeal || fav.id) === recipeId);
    }
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const recipesToSearch = currentRecipes;
        const filteredRecipes = recipesToSearch.filter(recipe => {
            const title = (recipe.strMeal || recipe.title || '').toLowerCase();
            const category = (recipe.strCategory || recipe.category || '').toLowerCase();
            return title.includes(searchTerm) || category.includes(searchTerm);
        });
        displayRecipes(filteredRecipes);
    });

    // Favorites Toggle Button
    if (favoritesToggleBtn) {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            favoritesToggleBtn.classList.remove('hide');
        }
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
    
    const page = document.body.dataset.page;
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