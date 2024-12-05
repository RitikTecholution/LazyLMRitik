// Main script for Ecommerce Website

// DOM elements
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

// Toggle mobile menu
if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

// Product details page functionality
if (window.location.pathname.includes('sproduct.html')) {
    const MainImg = document.getElementById('MainImg');
    const smallimg = document.getElementsByClassName('small-img');

    for (let i = 0; i < smallimg.length; i++) {
        smallimg[i].onclick = function() {
            MainImg.src = this.src;
        }
    }
}

// Shopping cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId, quantity = 1) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity: quantity });
    }
    updateCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Update cart UI here
}

// Example usage:
// addToCart('product1');
// removeFromCart('product1');

// Event listeners for add to cart buttons
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        addToCart(productId);
    });
});