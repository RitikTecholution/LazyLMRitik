// Mock DOM implementation
class MockElement {
    constructor(id) {
        this.id = id;
        this.classList = new Set();
        this.src = '';
        this.dataset = {};
        this.eventListeners = {};
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    click() {
        if (this.eventListeners['click']) {
            this.eventListeners['click'].forEach(callback => callback());
        }
    }

    getElementsByClassName(className) {
        return [new MockElement('small-img')];
    }
}

// Mock document object
const document = {
    getElementById: (id) => new MockElement(id),
    querySelectorAll: () => [new MockElement('add-to-cart')]
};

// Mock window object
const window = {
    location: {
        pathname: ''
    }
};

// Mock localStorage
const localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};

// Actual implementation
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
}

// Main script
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

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

if (window.location.pathname.includes('sproduct.html')) {
    const MainImg = document.getElementById('MainImg');
    const smallimg = document.getElementsByClassName('small-img');

    for (let i = 0; i < smallimg.length; i++) {
        smallimg[i].onclick = function() {
            MainImg.src = this.src;
        }
    }
}

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        addToCart(productId);
    });
});

// Test suite
describe('Ecommerce Website Tests', () => {
    beforeEach(() => {
        cart = [];
        localStorage.getItem.mockReturnValue(null);
    });

    test('Toggle mobile menu', () => {
        bar.click();
        expect(nav.classList.has('active')).toBe(true);

        close.click();
        expect(nav.classList.has('active')).toBe(false);
    });

    test('Product details page functionality', () => {
        window.location.pathname = '/sproduct.html';
        const MainImg = document.getElementById('MainImg');
        const smallimg = document.getElementsByClassName('small-img')[0];

        smallimg.src = 'new-image.jpg';
        smallimg.click();

        expect(MainImg.src).toBe('new-image.jpg');
    });

    test('Add to cart', () => {
        addToCart('product1');
        expect(cart).toEqual([{ id: 'product1', quantity: 1 }]);

        addToCart('product1');
        expect(cart).toEqual([{ id: 'product1', quantity: 2 }]);

        addToCart('product2', 3);
        expect(cart).toEqual([
            { id: 'product1', quantity: 2 },
            { id: 'product2', quantity: 3 }
        ]);
    });

    test('Remove from cart', () => {
        cart = [
            { id: 'product1', quantity: 2 },
            { id: 'product2', quantity: 3 }
        ];

        removeFromCart('product1');
        expect(cart).toEqual([{ id: 'product2', quantity: 3 }]);
    });

    test('Update cart', () => {
        cart = [{ id: 'product1', quantity: 2 }];
        updateCart();
        expect(localStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify(cart));
    });

    test('Add to cart button click', () => {
        const addToCartButton = document.querySelectorAll('.add-to-cart')[0];
        addToCartButton.dataset.productId = 'product1';
        addToCartButton.click();

        expect(cart).toEqual([{ id: 'product1', quantity: 1 }]);
    });
});

// Run tests
describe('Run all tests', () => {
    beforeAll(() => {
        console.log('Starting tests...');
    });

    afterAll(() => {
        console.log('All tests completed.');
    });

    it('runs all tests', () => {
        // This will run all the tests defined in the Ecommerce Website Tests describe block
    });
});

// If you want to run the tests, uncomment the following line:
// describe('Ecommerce Website Tests', () => { /* ... */ });