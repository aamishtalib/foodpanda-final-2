/**
 * Cart System - Simplified Implementation
 * This handles all cart functionality across the website
 */
console.log('Cart.js loaded - Starting cart system initialization');

// Single source of truth for cart data
let cartItems = [];

// Cart initialization flag to prevent multiple initializations
window.cartInitialized = window.cartInitialized || false;

// Cart initialization - happens only once
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cart system initializing...');
  
  // Check if already initialized to prevent duplicate initialization
  if (window.cartInitialized) {
    console.log('Cart already initialized, skipping');
    return;
  }
  
  // Set initialization flag
  window.cartInitialized = true;
  
  // Load cart from storage
  loadCart();
  
  // Create UI elements if needed
    createCartUI();
  
  // Setup UI functionality
    setupCartUI();
  
  // Setup Add to Cart buttons
  setupAddToCartButtons();
  
  // Update cart display
  updateCartDisplay();
  
  console.log('Cart system initialized successfully with', cartItems.length, 'items');
  
  // Check if we should open the cart (requested by fix-cart.js)
  if (window.openCartWhenReady) {
    console.log('Opening cart as requested');
    window.openCartWhenReady = false;
    openCart();
  }
});

/**
 * Core Cart Functions
 */

// Get cart contents
function getCart() {
  return cartItems;
}

// Save cart to localStorage
function saveCart() {
  try {
    localStorage.setItem('foodpanda_cart', JSON.stringify(cartItems));
    console.log('Cart saved with', cartItems.length, 'items');
    return true;
  } catch (error) {
    console.error('Error saving cart:', error);
    return false;
  }
}

// Load cart from localStorage
function loadCart() {
  try {
    const savedCart = localStorage.getItem('foodpanda_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (Array.isArray(parsedCart)) {
        cartItems = parsedCart;
        console.log('Cart loaded with', cartItems.length, 'items');
      } else {
        console.warn('Invalid cart data format, resetting cart');
        cartItems = [];
        saveCart();
      }
    } else {
      console.log('No saved cart found, starting with empty cart');
      cartItems = [];
    }
  } catch (error) {
    console.error('Error loading cart:', error);
    cartItems = [];
  }
}

// Add item to cart
function addToCart(item) {
  console.log('addToCart called with:', item);
  if (!item) {
    console.error('No item provided to addToCart');
    showToast('Error: No item data provided', 'error');
    return false;
  }

  if (!item.name) {
    console.error('Item missing name:', item);
    showToast('Error: Item missing name', 'error');
    return false;
  }

  if (!item.price && item.price !== 0) {
    console.error('Item missing price:', item);
    showToast('Error: Item missing price', 'error');
    return false;
  }
  
  try {
    // Prevent duplicate calls if this function is also defined globally
    if (window.addToCart && window.addToCart !== addToCart && typeof window.addToCart === 'function') {
      console.log('Using global addToCart function');
      return window.addToCart(item);
    }
    
    // Standardize item format
    const standardItem = {
      id: item.id || ('item_' + Date.now()),
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      image: item.image || 'images/default-dish.jpg'
    };
    
    console.log('Standardized item:', standardItem);
    
    // Make sure we have a valid price
    if (isNaN(standardItem.price)) {
      console.error('Invalid price format:', item.price);
      standardItem.price = 499; // Default to a reasonable price
    }
    
    // Check if item already exists
    const existingItemIndex = cartItems.findIndex(i => i.id === standardItem.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity if item exists
      cartItems[existingItemIndex].quantity += 1;
      console.log('Increased quantity for', standardItem.name, 'to', cartItems[existingItemIndex].quantity);
    } else {
      // Add new item
      cartItems.push(standardItem);
      console.log('Added new item to cart:', standardItem.name);
    }
    
    // Save and update UI
    const saveResult = saveCart();
    console.log('Save result:', saveResult);
    
    updateCartDisplay();
    
    // Try to open the cart to give user feedback
    setTimeout(() => {
      if (typeof window.openCart === 'function') {
        window.openCart();
        
        // Add highlight effect to the added/updated item
        setTimeout(() => {
          const itemElements = document.querySelectorAll('.cart-item');
          const targetItem = existingItemIndex >= 0 
            ? itemElements[existingItemIndex] 
            : itemElements[itemElements.length - 1];
            
          if (targetItem) {
            targetItem.classList.add('highlight-item');
            setTimeout(() => {
              targetItem.classList.remove('highlight-item');
            }, 1000);
          }
        }, 300);
      }
    }, 300);
    
    return true;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    showToast('Error adding item to cart: ' + error.message, 'error');
    return false;
  }
}

// Remove item from cart
function removeFromCart(itemId) {
  if (!itemId) return false;
  
  try {
    // Find the item to get its name for the confirmation message
    const item = cartItems.find(item => item.id === itemId);
    if (!item) {
      console.error('Item not found in cart:', itemId);
      return false;
    }
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to remove "${item.name}" from your cart?`)) {
      console.log('Item removal cancelled by user');
      return false;
    }
    
    const initialLength = cartItems.length;
    cartItems = cartItems.filter(item => item.id !== itemId);
    
    if (cartItems.length !== initialLength) {
      console.log('Item removed from cart');
      saveCart();
      updateCartDisplay();
      
      // Show toast notification of successful removal
      showToast(`"${item.name}" has been removed from your cart`, 'success');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return false;
  }
}

// Update item quantity
function updateCartItemQuantity(itemId, quantityOrAction) {
  console.log('Updating quantity for item', itemId, 'with', quantityOrAction);
  if (!itemId) return false;
  
  try {
    const itemIndex = cartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.error('Item not found in cart:', itemId);
      return false;
    }
    
    let newQuantity;
    
    // Handle both direct quantity values and increase/decrease actions
    if (quantityOrAction === 'increase') {
      newQuantity = (cartItems[itemIndex].quantity || 1) + 1;
    } else if (quantityOrAction === 'decrease') {
      newQuantity = (cartItems[itemIndex].quantity || 1) - 1;
    } else {
      newQuantity = parseInt(quantityOrAction);
    }
    
    console.log('New quantity will be:', newQuantity);
    
    // If quantity will become zero, ask for confirmation before removing
    if (newQuantity <= 0) {
      console.log('Quantity is zero or less, confirming removal');
      
      // Ask for confirmation before removing
      if (!confirm(`Are you sure you want to remove "${cartItems[itemIndex].name}" from your cart?`)) {
        console.log('Item removal cancelled by user');
        return false;
      }
      
      return removeFromCart(itemId);
    }
    
    // Update quantity
    cartItems[itemIndex].quantity = newQuantity;
    console.log('Updated quantity for', cartItems[itemIndex].name, 'to', newQuantity);
    
    // Save and update UI
    saveCart();
    updateCartDisplay();
    
    return true;
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return false;
  }
}

// Clear entire cart
function clearCart() {
  // Ask for confirmation before clearing the cart
  if (!confirm('Are you sure you want to clear all items from your cart?')) {
    console.log('Cart clearing cancelled by user');
    return false;
  }
  
  cartItems = [];
  saveCart();
  updateCartDisplay();
  console.log('Cart cleared');
  
  // Show toast notification
  showToast('Your cart has been cleared', 'success');
  return true;
}

/**
 * UI Functions
 */

// Create cart UI elements
function createCartUI() {
  // Only create UI elements if they don't exist
  if (!document.getElementById('cartPopup') && !document.querySelector('.cart-container')) {
    console.log('Creating cart UI elements');
    
    // Create cart popup
    const cartPopupHTML = `
      <div class="cart-popup" id="cartPopup">
        <div class="cart-header">
          <h3><i class="fas fa-shopping-cart"></i> Your Cart</h3>
          <button id="closeCart"><i class="fas fa-times"></i></button>
        </div>
        <div class="cart-items" id="cartItems">
          <!-- Cart items will be added here dynamically -->
        </div>
        <div class="cart-footer">
          <div class="cart-total">
            <span>Total:</span>
            <span id="cartTotal">PKR 0</span>
          </div>
          <a href="customer/cart.html" id="viewCartBtn" class="checkout-btn">View Cart</a>
        </div>
      </div>
    `;
    
    // Create cart overlay for mobile
    const cartOverlayHTML = `<div id="cartOverlay" class="cart-overlay"></div>`;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', cartOverlayHTML);
    document.body.insertAdjacentHTML('beforeend', cartPopupHTML);
  
    console.log('Cart UI elements created');
    
    // Add styles if not already present
  if (!document.getElementById('cart-styles')) {
      const style = document.createElement('style');
      style.id = 'cart-styles';
      style.textContent = `
        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .cart-popup.active + .cart-overlay {
          display: block;
          opacity: 1;
          animation: fade-in 0.3s ease;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
      .cart-popup {
        position: fixed;
        top: 0;
        right: -350px;
        width: 350px;
        height: 100vh;
        background-color: white;
          box-shadow: -4px 0 15px rgba(0, 0, 0, 0.15);
        z-index: 1000;
          transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
          border-left: 4px solid #ff0080;
      }
      
      .cart-popup.active {
        right: 0;
          animation: cart-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes cart-slide-in {
          0% { right: -350px; }
          100% { right: 0; }
      }
      
      .cart-header {
          padding: 18px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
          background-color: #fff;
      }
      
      .cart-header h3 {
        margin: 0;
        color: #333;
          font-size: 20px;
          font-weight: 600;
        }
        
        .cart-header h3 i {
          color: #ff0080;
          margin-right: 8px;
      }
      
      #closeCart {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #777;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        #closeCart:hover {
          background-color: #f5f5f5;
          color: #ff0080;
      }
      
      .cart-items {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px;
          scrollbar-width: thin;
          scrollbar-color: #ddd #f5f5f5;
        }
        
        .cart-items::-webkit-scrollbar {
          width: 6px;
        }
        
        .cart-items::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        
        .cart-items::-webkit-scrollbar-thumb {
          background-color: #ddd;
          border-radius: 6px;
      }
      
      .empty-cart-message {
        text-align: center;
        color: #777;
        margin-top: 30px;
          padding: 20px;
        }
        
        .empty-cart-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
          background-color: #fff5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .empty-cart-icon i {
          font-size: 30px;
          color: #ff0080;
        }
        
        .empty-cart-message h3 {
          font-size: 18px;
          color: #333;
          margin-bottom: 10px;
        }
        
        .empty-cart-message p {
          margin-bottom: 20px;
          font-size: 14px;
          color: #777;
          line-height: 1.5;
        }
        
        .continue-shopping {
          padding: 8px 16px;
          background: #ff0080;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .continue-shopping:hover {
          background: #e0006f;
      }
      
      .cart-item {
        display: flex;
        align-items: center;
          padding: 15px 0;
        border-bottom: 1px solid #eee;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }
        
        .cart-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          background-color: #fcfcfc;
          border-radius: 8px;
          padding-left: 8px;
          padding-right: 8px;
        }
        
        .cart-item-image {
          width: 65px;
          height: 65px;
          border-radius: 8px;
          overflow: hidden;
          margin-right: 15px;
          border: 1px solid #eee;
          background-color: #fff;
        }
        
        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .cart-item:hover .cart-item-image img {
          transform: scale(1.05);
      }
      
      .cart-item-info {
        flex-grow: 1;
      }
      
      .cart-item-info h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
          font-weight: 600;
          color: #333;
      }
      
      .cart-item-info p {
          margin: 0 0 10px 0;
        color: #ff0080;
          font-weight: 600;
          font-size: 15px;
      }
      
      .cart-item-quantity {
        display: flex;
        align-items: center;
          margin-top: 8px;
      }
      
      .qty-btn {
          width: 28px;
          height: 28px;
        border-radius: 50%;
        border: 1px solid #ddd;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
          transition: all 0.2s;
        }
        
        .qty-btn:hover {
          background: #ff0080;
          color: white;
          border-color: #ff0080;
      }
      
      .cart-item-quantity span {
          margin: 0 10px;
          min-width: 20px;
          text-align: center;
          font-weight: 600;
      }
      
      .remove-btn {
        background: none;
        border: none;
          color: #aaa;
        cursor: pointer;
          transition: all 0.2s;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
      }
      
      .remove-btn:hover {
        color: #ff0080;
          background-color: #ffebf3;
      }
      
      .cart-footer {
          display: flex;
          flex-direction: column;
          padding: 18px 20px;
          background-color: #f9f9f9;
        border-top: 1px solid #eee;
      }
      
      .cart-total {
          font-size: 1.25rem;
          font-weight: 700;
          color: #333;
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #ddd;
        }
        
        .cart-total span:last-child {
          color: #ff0080;
      }
      
      .checkout-btn {
        display: block;
        width: 100%;
          padding: 14px;
        background: #ff0080;
        color: white;
        text-align: center;
        border: none;
          border-radius: 6px;
          font-weight: 600;
        cursor: pointer;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(255, 0, 128, 0.2);
      }
      
      .checkout-btn:hover {
          background: #e0006f;
          color: white;
          text-decoration: none;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(255, 0, 128, 0.3);
        }
        
        .checkout-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(255, 0, 128, 0.2);
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .cart-popup {
            width: 100%;
            right: -100%;
          }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    console.log('Cart UI elements already exist');
  }
}

// Setup cart UI interactions
function setupCartUI() {
  console.log('Setting up cart UI interactions');
  
  // Setup cart icon click handlers - include more possible selectors
  const cartIcons = document.querySelectorAll('.cart-icon, .cart-btn, .cart-icon-container a, a.cart-btn, a.cart-icon');
  console.log('Found', cartIcons.length, 'cart icons/buttons');
  
  const cartPopup = document.getElementById('cartPopup');
  const closeCartBtn = document.getElementById('closeCart');
  const viewCartBtn = document.getElementById('viewCartBtn');
  
  if (!cartPopup) {
    console.error('Cart popup not found in DOM');
  }
  
  if (cartIcons.length > 0) {
    // For each cart icon
    cartIcons.forEach((icon, index) => {
      console.log('Setting up cart icon', index + 1, icon.tagName, icon.className);
      
      // Remove old event listeners by cloning nodes
      const newIcon = icon.cloneNode(true);
      if (icon.parentNode) {
        icon.parentNode.replaceChild(newIcon, icon);
        
        // Add new event listener
        newIcon.addEventListener('click', function(e) {
          console.log('Cart icon clicked');
          e.preventDefault(); // Stop default navigation
          
          openCart();
          return false; // Extra prevention
        });
      } else {
        console.warn('Cart icon has no parent node', icon);
      }
    });
  } else {
    console.warn('No cart icons found on page');
  }
  
  // Setup close cart button
  if (closeCartBtn) {
    console.log('Setting up close cart button');
    // First remove any existing listeners
    const newCloseBtn = closeCartBtn.cloneNode(true);
    closeCartBtn.parentNode.replaceChild(newCloseBtn, closeCartBtn);
    
    newCloseBtn.addEventListener('click', function() {
      console.log('Close cart button clicked');
      closeCart();
    });
  } else {
    console.warn('Close cart button not found');
  }
  
  // Setup View Cart button
  if (viewCartBtn) {
    console.log('Setting up view cart button');
    // First remove any existing listeners
    const newViewCartBtn = viewCartBtn.cloneNode(true);
    viewCartBtn.parentNode.replaceChild(newViewCartBtn, viewCartBtn);
    
    newViewCartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('View cart button clicked');
      
      // Get the current path and determine the correct path to cart.html
      const currentPath = window.location.pathname;
      let cartPath;
      
      // Check if we're already in the customer directory
      if (currentPath.includes('/customer/')) {
        cartPath = 'cart.html';
      } else {
        // Check if we're at the root or in another directory
        const pathParts = currentPath.split('/').filter(part => part.length > 0);
        if (pathParts.length <= 1) {
          // We're at or near root
          cartPath = 'customer/cart.html';
        } else {
          // We might be in a subdirectory
          const levelsUp = pathParts.length - 1;
          cartPath = '../'.repeat(levelsUp) + 'customer/cart.html';
        }
      }
      
      console.log('Navigating to cart page:', cartPath);
      window.location.href = cartPath;
    });
  } else {
    console.warn('View cart button not found');
  }
  
  // Close cart when clicking outside
  document.addEventListener('click', function(e) {
    if (cartPopup && 
        cartPopup.classList.contains('active') && 
        !cartPopup.contains(e.target) && 
        !Array.from(document.querySelectorAll('.cart-icon, .cart-btn, .cart-icon-container')).some(icon => icon.contains(e.target))) {
      console.log('Clicked outside cart, closing');
      closeCart();
    }
  });
  
  console.log('Cart UI setup complete');
}

// Setup Add to Cart buttons
function setupAddToCartButtons() {
  // Flag to track if setup has been completed
  if (window.addToCartButtonsSetup) {
    console.log('Add to cart buttons already set up, skipping');
    return;
  }
  
  console.log('Setting up Add to Cart buttons');
  
  // Get all add to cart buttons with expanded selectors
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, button[data-id][data-price], .action-btn.add-to-cart-btn, button.add-cart-btn, .reorder-btn, button[class*="add-to-cart"], button[class*="cart-btn"], button:has(i.fa-cart-plus)');
  console.log('Found', addToCartButtons.length, 'add-to-cart buttons');
  
  if (addToCartButtons.length === 0) {
    console.warn('No add-to-cart buttons found! Check your HTML markup.');
  }
  
  addToCartButtons.forEach(button => {
    console.log('Setting up button:', button.dataset || button.getAttribute('data-id'));
    
    // Remove existing event listeners by cloning the button
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add new click event listener
    newButton.addEventListener('click', function(e) {
      console.log('Add to cart button clicked!', this);
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Get item details from button data attributes - try multiple approaches
        const itemId = this.getAttribute('data-id') || this.dataset.id;
        const itemName = this.getAttribute('data-name') || this.dataset.name;
        const itemPrice = this.getAttribute('data-price') || this.dataset.price;
        const itemImage = this.getAttribute('data-image') || this.dataset.image;
        
        console.log('Initial item data from button:', { itemId, itemName, itemPrice, itemImage });
        
        // If missing primary data, try to get from parent elements
        let finalItemId = itemId;
        let finalItemName = itemName;
        let finalItemPrice = itemPrice;
        let finalItemImage = itemImage;
        
        // If we're missing data, try to find it in parent elements or children
        if (!finalItemName || !finalItemPrice) {
          console.log('Looking for item data in parent elements');
          // Try to find item name or price in parent card
          const card = this.closest('.dish-card, .food-card, .menu-item, .cart-item, .food-item, .item');
          if (card) {
            if (!finalItemName) {
              const nameEl = card.querySelector('.dish-name, .food-name, .item-name, h3, h4, .title');
              if (nameEl) finalItemName = nameEl.textContent.trim();
            }
            
            if (!finalItemPrice) {
              const priceEl = card.querySelector('.dish-price, .food-price, .item-price, .price');
              if (priceEl) {
                const priceText = priceEl.textContent.trim();
                // Extract numbers from price text (e.g. "PKR 499" -> "499")
                const priceMatch = priceText.match(/\d+/);
                if (priceMatch) finalItemPrice = priceMatch[0];
              }
            }
            
            if (!finalItemImage) {
              const imgEl = card.querySelector('img');
              if (imgEl) finalItemImage = imgEl.src;
            }
          }
        }
        
        // If still missing data, look in the whole document based on context
        if (!finalItemName || !finalItemPrice) {
          console.log('Looking for item data in surrounding elements');
          
          // Find closest heading or title
          if (!finalItemName) {
            let parent = this.parentNode;
            for (let i = 0; i < 5 && parent && !finalItemName; i++) {
              const heading = parent.querySelector('h1, h2, h3, h4, h5, .title, .name');
              if (heading) {
                finalItemName = heading.textContent.trim();
              }
              parent = parent.parentNode;
            }
          }
          
          // Find closest price
          if (!finalItemPrice) {
            let parent = this.parentNode;
            for (let i = 0; i < 5 && parent && !finalItemPrice; i++) {
              const priceEl = parent.querySelector('.price, [class*="price"], strong, b');
              if (priceEl) {
                const priceText = priceEl.textContent.trim();
                const priceMatch = priceText.match(/\d+/);
                if (priceMatch) finalItemPrice = priceMatch[0];
              }
              parent = parent.parentNode;
            }
          }
        }
        
        // Last resort - generate default values to prevent errors
        if (!finalItemId) {
          finalItemId = 'item_' + Date.now();
        }
        
        if (!finalItemName) {
          finalItemName = "Food Item";
        }
        
        if (!finalItemPrice) {
          finalItemPrice = "499"; // Default price
        }
        
        console.log('Final item data:', { finalItemId, finalItemName, finalItemPrice, finalItemImage });
        
        // Format item data
        const item = {
          id: finalItemId,
          name: finalItemName,
          price: parseFloat(finalItemPrice),
          image: finalItemImage || 'images/default-dish.jpg'
        };
        
        // Add to cart with explicit function call
        console.log('Adding to cart:', item);
        const result = window.addToCart(item);
        if (result) {
          showToast(finalItemName + ' added to cart!', 'success');
          // Add small animation for feedback
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = '';
          }, 150);
        } else {
          showToast('Could not add item to cart', 'error');
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
        showToast('Error adding item to cart', 'error');
      }
    });
  });
  
  // Mark setup as complete
  window.addToCartButtonsSetup = true;
  console.log('Add to Cart buttons setup complete');
}

// Update cart display (counters, totals, items)
function updateCartDisplay() {
  console.log('Updating cart display');
  
  // Update cart counters
  updateCartCounters();
  
  // Update cart total
      updateCartTotal();
      
  // Update cart UI if we're on the cart page
  if (window.location.href.includes('cart.html') && typeof window.displayCart === 'function') {
    console.log('On cart.html page, calling displayCart()');
    window.displayCart();
  }
  
  // If we're in the cart popup, update items displayed there
  if (document.getElementById('cartPopup') && document.getElementById('cartPopup').classList.contains('active')) {
    console.log('Cart popup is open, updating items');
    renderCartItems();
  }
}

// Update cart counters
function updateCartCounters() {
  const itemCount = cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
  
  // Update all cart counter elements
  const cartCounters = document.querySelectorAll('.cart-counter, .cart-count');
  cartCounters.forEach(counter => {
    counter.textContent = itemCount.toString();
    // Make sure it's visible even if zero
    counter.style.display = 'flex';
  });
  
  console.log('Updated cart counters to:', itemCount);
}

// Update cart total
function updateCartTotal() {
  const total = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * parseInt(item.quantity || 1));
  }, 0);
  
  // Update all cart total elements
  const cartTotalElements = document.querySelectorAll('#cartTotal, .cart-total-display');
  cartTotalElements.forEach(element => {
    element.textContent = `PKR ${total.toFixed(0)}`;
  });
  
  console.log('Updated cart total to:', total);
}

// Render cart items
function renderCartItems() {
  const cartItemsContainer = document.querySelector('#cartItems, .cart-items');
  
  if (!cartItemsContainer) {
    console.log('Cart items container not found');
    return;
  }
  
  // Clear existing items
  cartItemsContainer.innerHTML = '';
  
  // Check if cart is empty
  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-message">
        <div class="empty-cart-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <h3>Your cart is empty</h3>
        <p>Add some delicious food items to your cart and order now!</p>
        <button class="continue-shopping" onclick="closeCart()">Continue Shopping</button>
      </div>
    `;
    
    // Hide the View Cart button if cart is empty
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.style.display = 'none';
    }
    
    return;
  }
  
  // Calculate total
  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Update cart total display
  const cartTotalElement = document.getElementById('cartTotal');
  if (cartTotalElement) {
    cartTotalElement.textContent = `PKR ${total.toLocaleString()}`;
  }
  
  // Show the View Cart button if cart has items
  const viewCartBtn = document.getElementById('viewCartBtn');
  if (viewCartBtn) {
    viewCartBtn.style.display = 'block';
  }
  
  // Render each item
  cartItems.forEach(item => {
    // Create element
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    
    // Check if Font Awesome is available
    const hasFontAwesome = typeof FontAwesome !== 'undefined' || 
                          document.querySelector('link[href*="font-awesome"]');
    
    const trashIcon = hasFontAwesome ? '<i class="fas fa-trash"></i>' : 'Remove';
    const minusIcon = hasFontAwesome ? '<i class="fas fa-minus"></i>' : '-';
    const plusIcon = hasFontAwesome ? '<i class="fas fa-plus"></i>' : '+';
    
    // Set content
    itemElement.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.image || 'images/default-dish.jpg'}" alt="${item.name}">
      </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
        <p>PKR ${parseFloat(item.price).toFixed(0)}</p>
        <div class="cart-item-quantity">
          <button class="qty-btn decrease-btn" data-id="${item.id}">${minusIcon}</button>
          <span>${item.quantity || 1}</span>
          <button class="qty-btn increase-btn" data-id="${item.id}">${plusIcon}</button>
        </div>
        </div>
        <button class="remove-btn" data-id="${item.id}">
        ${trashIcon}
        </button>
    `;
    
    // Add to container
    cartItemsContainer.appendChild(itemElement);
  });
  
  // Set up event listeners for cart item buttons
  setupCartItemEventListeners();
  
  console.log('Rendered', cartItems.length, 'cart items');
}

// Setup event listeners for cart item buttons
function setupCartItemEventListeners() {
  // Get all buttons
  const increaseButtons = document.querySelectorAll('.increase-btn');
  const decreaseButtons = document.querySelectorAll('.decrease-btn');
  const removeButtons = document.querySelectorAll('.remove-btn');
  
  // Set up increase buttons
  increaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.id;
      updateCartItemQuantity(itemId, 'increase');
    });
  });
  
  // Set up decrease buttons
  decreaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.id;
      updateCartItemQuantity(itemId, 'decrease');
    });
  });
  
  // Set up remove buttons
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.id;
      // Removal confirmation handled in removeFromCart function
      if (removeFromCart(itemId)) {
        // If removal was successful and confirmed by user, we don't need to do anything here
        // as removeFromCart will update the display
      }
    });
  });
}

// Open cart
function openCart() {
  console.log('Opening cart...');
  const cartPopup = document.getElementById('cartPopup');
  
  if (cartPopup) {
    console.log('Cart popup found, opening');
    cartPopup.classList.add('active');
    
    // Render cart items only when cart is opened
      renderCartItems();
  } else {
    console.error('Cart popup element not found!');
    // Try to create cart UI if it doesn't exist
    createCartUI();
    setupCartUI();
    
    // Try again to find the cart popup
    const newCartPopup = document.getElementById('cartPopup');
    if (newCartPopup) {
      console.log('Cart popup created and found, opening');
      newCartPopup.classList.add('active');
      renderCartItems();
    } else {
      console.error('Failed to create cart popup!');
      showToast('Could not open cart', 'error');
    }
  }
}

// Close cart
function closeCart() {
  console.log('Closing cart...');
  const cartPopup = document.getElementById('cartPopup');
  
  if (cartPopup) {
    console.log('Cart popup found, closing');
    cartPopup.classList.remove('active');
  } else {
    console.error('Cart popup element not found!');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  console.log('Showing toast:', message, type);
  if (!message) return;
  
  // Create toast container if it doesn't exist
  let toast = document.getElementById('toast');
  if (!toast) {
    console.log('Creating new toast element');
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  
  // Clear any existing timeouts
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  // Set message and type
  toast.textContent = message;
  toast.className = ''; // Clear classes first
  toast.classList.add(type); // Add type class (success, error, etc)
  
  // Force redraw
  toast.offsetHeight;
  
  // Add show class to trigger animation
  toast.classList.add('show');
  
  // Auto-hide after delay
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    // Remove the element after animation completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('hide');
        toast.style.display = 'none';
      }
    }, 300);
  }, 3000);
}

// Expose functions globally
window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.showToast = showToast;

// IMPORTANT: Comment out the second initialization to avoid duplicates
// document.addEventListener('DOMContentLoaded', () => {
//   console.log("Setting up add to cart buttons...");
//   setupAddToCartButtons();
// }); 