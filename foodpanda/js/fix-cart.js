/**
 * Fix Cart JS
 * This script ensures cart initialization happens only once
 */

// This script runs before cart.js and sets up flags to prevent duplicate initialization
window.cartInitialized = window.cartInitialized || false;
window.addToCartButtonsSetup = window.addToCartButtonsSetup || false;

console.log('Fix-cart.js loaded - Preventing duplicate cart initialization');

// Fix for cart buttons that use href links instead of JS
document.addEventListener('DOMContentLoaded', function() {
  console.log('Fix-cart.js - Setting up cart button overrides');
  
  // Function to handle cart button clicks
  const handleCartButtonClick = function(e) {
    console.log('Cart button clicked from fix-cart.js');
    e.preventDefault();
    // If the main cart.js is loaded, use its openCart function
    if (typeof window.openCart === 'function') {
      window.openCart();
    } else {
      console.warn('openCart function not available yet');
      // Store that we want to open the cart when it's ready
      window.openCartWhenReady = true;
    }
    return false;
  };
  
  // Apply the handler to all cart buttons on the page
  const cartButtons = document.querySelectorAll('.cart-icon, .cart-btn, .cart-icon-container a, a.cart-btn, a.cart-icon');
  console.log('Found', cartButtons.length, 'cart buttons');
  
  cartButtons.forEach(button => {
    console.log('Setting up', button.tagName, button.className);
    // Temporarily store original href for buttons that are links
    if (button.tagName === 'A' && button.getAttribute('href')) {
      button.dataset.originalHref = button.getAttribute('href');
    }
    
    // Add the click event handler
    button.addEventListener('click', handleCartButtonClick);
  });
}); 