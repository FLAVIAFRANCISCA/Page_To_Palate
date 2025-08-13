document.addEventListener('DOMContentLoaded', () => {
    const addRecipeForm = document.getElementById('addRecipeForm');
    const imageInput = document.getElementById('recipeImageFile');
    const placeholderImage = 'https://via.placeholder.com/300x200';
    const confirmationModal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const modalCloseBtn = document.querySelector('#confirmationModal .close-btn');

    if (addRecipeForm) {
        addRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const loggedInUser = localStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                window.showNotification('You must be logged in to add a recipe.', 'error');
                return;
            }
            handleNewRecipeSubmission(loggedInUser);
        });
    }

    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
            window.location.href = 'recipes.html';
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
        });
    }

    // Function to handle the form submission
    function handleNewRecipeSubmission(loggedInUser) {
        const title = document.getElementById('recipeTitle').value.trim();
        const category = document.getElementById('recipeCategory').value;
        const instructions = document.getElementById('instructions').value;
        const ingredients = document.getElementById('ingredients').value.split('\n').filter(ingredient => ingredient.trim() !== '');
        const imageFile = imageInput.files[0];
        const isPrivate = document.getElementById('isPrivate').checked;

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                const newRecipe = createNewRecipeObject(title, category, imageUrl, ingredients, instructions, loggedInUser, isPrivate);
                addRecipe(newRecipe, isPrivate, loggedInUser);
            };
            reader.readAsDataURL(imageFile);
        } else {
            const newRecipe = createNewRecipeObject(title, category, placeholderImage, ingredients, instructions, loggedInUser, isPrivate);
            addRecipe(newRecipe, isPrivate, loggedInUser);
        }
    }

    function createNewRecipeObject(title, category, image, ingredients, instructions, user, isPrivate) {
        return {
            id: `user-${Date.now()}`,
            title: title,
            category: category,
            image: image,
            ingredients: ingredients,
            instructions: instructions,
            addedBy: user,
            isPrivate: isPrivate
        };
    }

    // Function to add a recipe to local storage and show confirmation
    function addRecipe(recipe, isPrivate, loggedInUser) {
        const privateCollection = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
        
        // Check for duplicate recipes by title
        const recipeExists = privateCollection.some(existingRecipe => existingRecipe.title.toLowerCase() === recipe.title.toLowerCase());
        
        if (recipeExists) {
            window.showNotification('You have already added a recipe with this title.', 'error');
            return;
        }

        privateCollection.push(recipe);
        localStorage.setItem(`privateCollection-${loggedInUser}`, JSON.stringify(privateCollection));

        if (!isPrivate) {
            const publicRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];
            publicRecipes.push(recipe);
            localStorage.setItem('publicUserRecipes', JSON.stringify(publicRecipes));
        }

        modalMessage.textContent = 'You have successfully added a new recipe!';
        confirmationModal.style.display = 'block';
        document.getElementById('addRecipeForm').reset();
    }
});
