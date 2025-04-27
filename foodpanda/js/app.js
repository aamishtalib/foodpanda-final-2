// Initialize Firebase with the configuration from index.html
let db, auth, storage;
let useLocalStorage = false; // Force Firebase mode - NEVER use localStorage
let firebaseInitialized = false;

// Check if Firebase was already initialized in the HTML
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
  console.log('Using Firebase instance already initialized in HTML');
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  firebaseInitialized = true;
} else {
  // Firebase configuration if it wasn't initialized yet
  const firebaseConfig = {
    apiKey: "AIzaSyDgx9bKrdhSz5Z5IS9sG1mxGlVnbyJNRG4",
    authDomain: "foodpanda-clone-7340c.firebaseapp.com",
    projectId: "foodpanda-clone-7340c",
    storageBucket: "foodpanda-clone-7340c.appspot.com",
    messagingSenderId: "735457527905",
    appId: "1:735457527905:web:08ae983fd213dc41b34220",
    measurementId: "G-YLE16W2SZJ"
  };

  // Wait for Firebase to be ready
  document.addEventListener('firebase-ready', function() {
    if (typeof firebase !== 'undefined') {
      console.log('Firebase is ready in app.js');
      db = firebase.firestore();
      auth = firebase.auth();
      storage = firebase.storage();
      firebaseInitialized = true;
    }
  });
}

// Initialize Firebase function for async initialization
function initFirebase() {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized) {
      console.log('Firebase already initialized');
      resolve(true);
      return;
    }

    // Configuration 
    const firebaseConfig = {
      apiKey: "AIzaSyDgx9bKrdhSz5Z5IS9sG1mxGlVnbyJNRG4",
      authDomain: "foodpanda-clone-7340c.firebaseapp.com",
      projectId: "foodpanda-clone-7340c",
      storageBucket: "foodpanda-clone-7340c.appspot.com",
      messagingSenderId: "735457527905",
      appId: "1:735457527905:web:08ae983fd213dc41b34220",
      measurementId: "G-YLE16W2SZJ"
    };

    try {
      if (typeof firebase !== 'undefined') {
        // Check if Firebase is already initialized 
        if (firebase.apps.length === 0) {
          // Initialize Firebase
          console.log('Initializing Firebase in app.js');
          firebase.initializeApp(firebaseConfig);
        }
        
        // Set up services
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        
        firebaseInitialized = true;
        console.log('Firebase initialized successfully in app.js');
        resolve(true);
      } else {
        console.error('Firebase SDK not available in app.js');
        reject(new Error('Firebase SDK not available'));
      }
    } catch (error) {
      console.error('Error initializing Firebase in app.js:', error);
      reject(error);
    }
  });
}

// Initialize if not already initialized
if (!firebaseInitialized) {
  console.log('Attempting to initialize Firebase from app.js');
  initFirebase()
    .then(() => {
      console.log('Firebase successfully initialized from app.js');
    })
    .catch(error => {
      console.error('Failed to initialize Firebase from app.js:', error);
      alert('Error connecting to Firebase. Please try refreshing the page.');
    });
}

// Local Storage Keys
const STORAGE_KEYS = {
  USERS: 'foodpanda_users',
  CURRENT_USER: 'foodpanda_current_user',
  RESTAURANTS: 'foodpanda_restaurants',
  CATEGORIES: 'foodpanda_categories',
  MENU_ITEMS: 'foodpanda_menu_items',
  CART: 'foodpanda_cart'
};

// Helper function to check Firebase initialization status
function ensureFirebaseInitialized() {
  // Attempt to initialize first
  if (!firebaseInitialized) {
    return initFirebase();
  }
  
  // Already initialized
  return Promise.resolve(true);
}

// Helper Functions
function getLocalStorageItem(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setLocalStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Function to convert file to base64
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Image upload function
async function uploadImage(file) {
  try {
    if (!useLocalStorage) {
      // Using Firebase Storage
      if (!file) {
        return {
          success: false,
          error: 'No file provided'
        };
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        return {
          success: false,
          error: 'Only image files are allowed'
        };
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return {
          success: false,
          error: 'Image size should be less than 2MB'
        };
      }
      
      // Create a unique filename
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = storage.ref(`images/${filename}`);
      
      // Upload file
      const uploadTask = await storageRef.put(file);
      
      // Get download URL
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      return {
        success: true,
        imageUrl: downloadURL
      };
    } else {
      // Using Base64 encoding for local storage
      if (!file) {
        return {
          success: false,
          error: 'No file provided'
        };
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        return {
          success: false,
          error: 'Only image files are allowed'
        };
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return {
          success: false,
          error: 'Image size should be less than 2MB'
        };
      }
      
      // Convert to base64
      const base64String = await convertFileToBase64(file);
      
      return {
        success: true,
        imageUrl: base64String
      };
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// User Authentication Functions
async function registerUser(email, password, name, phone = '', userType = 'customer') {
  try {
    console.log(`Starting user registration: email=${email}, name=${name}, userType=${userType}`);
    
    // Validate input
    if (!email || !password || !name) {
      return {
        success: false,
        error: 'Please fill in all required fields'
      };
    }
    
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }
    
    // Validate password length
    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters'
      };
    }
    
    // Check if Firebase is ready - with faster initialization
    if (!firebaseInitialized) {
      // Try waiting for Firebase to initialize with shorter timeout
      try {
        const initPromise = initFirebase();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase initialization timeout')), 5000)
        );
        
        await Promise.race([initPromise, timeoutPromise]);
      } catch (error) {
        console.error('Firebase not initialized during registration:', error);
        return {
          success: false,
          error: 'Firebase connection issue. Please try again.'
        };
      }
    }
    
    console.log('Using Firebase for registration...');
    try {
      // Using Firebase Auth with shorter timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
      );
      
      // Race between Firebase operation and timeout
      const result = await Promise.race([
        (async () => {
          console.log('Creating user in Firebase Authentication...');
          // Create user in Firebase
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          console.log('User created in Firebase Auth:', userCredential.user.uid);
          
          // Do profile update and database write in parallel
          const [profileUpdateResult, firestoreResult] = await Promise.all([
            // Update profile with display name
            userCredential.user.updateProfile({
            displayName: name
            }).then(() => console.log('User profile updated with display name')),
          
          // Store additional user data in Firestore
            db.collection('users').doc(userCredential.user.uid).set({
            email,
            name,
            phone,
            userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => console.log('User data successfully stored in Firestore'))
          ]);
          
          // Store user in local storage
          const user = {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            name,
            phone,
            userType,
            createdAt: new Date().toISOString()
          };
          setLocalStorageItem(STORAGE_KEYS.CURRENT_USER, user);
          
          return {
            success: true,
            user,
            // Redirect admin users to the new dashboard
            redirectPath: userType === 'admin' ? '/admin/new-dashboard.html' : null
          };
        })(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check for specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'This email is already registered. Please use a different email or login.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.'
      };
    }
  } catch (error) {
    console.error('Unexpected registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

async function loginUser(email, password) {
  try {
    console.log(`Starting user login: email=${email}`);
    
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Please fill in all required fields'
      };
    }
    
    // Check if Firebase is ready
    if (!firebaseInitialized) {
      try {
        await ensureFirebaseInitialized();
      } catch (error) {
        console.error('Firebase not initialized during login:', error);
        return {
          success: false,
          error: 'Firebase not ready. Please refresh the page and try again.'
        };
      }
    }
    
    console.log('Using Firebase for login...');
    try {
      // Using Firebase Auth with timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase connection timeout')), 15000)
      );
      
      // Race between Firebase operation and timeout
      const result = await Promise.race([
        (async () => {
          console.log('Authenticating with Firebase...');
          // Sign in using Firebase
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          console.log('User authenticated with Firebase:', userCredential.user.uid);
          
          // Get additional user data from Firestore
          const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
          console.log('User data retrieved from Firestore');
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Combine auth user and Firestore data
            const user = {
              id: userCredential.user.uid,
              email: userCredential.user.email,
              ...userData
            };
            
            // Store user in local storage
            setLocalStorageItem(STORAGE_KEYS.CURRENT_USER, user);
            
            // Return user data
            return {
              success: true,
              user,
              // Redirect admin users to the new dashboard
              redirectPath: userData.userType === 'admin' ? '/admin/new-dashboard.html' : null
            };
          } else {
            console.error('User document not found in Firestore');
            return {
              success: false,
              error: 'User data not found'
            };
          }
        })(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed. Please try again.'
    };
  }
}

/**
 * Logs the user out
 */
async function logoutUser() {
  try {
    console.log('Logging out user...');
    
    // Check if Firebase is ready
    if (!firebaseInitialized) {
      // Try waiting for Firebase to initialize
      try {
        await ensureFirebaseInitialized();
      } catch (error) {
        console.error('Firebase not initialized during logout:', error);
        return {
          success: false,
          error: 'Firebase not ready. Please refresh the page and try again.'
        };
      }
    }
    
    // Sign out from Firebase
    await auth.signOut();
    
    // Clear local storage data
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    console.log('User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to log out'
    };
  }
}

function getCurrentUser() {
  // Check if Firebase is ready
  if (!firebaseInitialized) {
    console.warn('Trying to get current user, but Firebase is not initialized');
    return null;
  }
  
  if (!useLocalStorage) {
    // Using Firebase Auth
    return auth.currentUser;
  } else {
    // Using Local Storage
    return getLocalStorageItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Function to check if the current user is an admin
function isAdminUser() {
  const user = getCurrentUser();
  return user && user.userType === 'admin';
}

// Function to enforce admin access for admin-only operations
function requireAdminAccess() {
  if (!isAdminUser()) {
    showMessage('Admin access required for this operation', 'error');
    throw new Error('Admin access required');
  }
  return true;
}

// Restaurant Functions
async function createRestaurant(restaurantData) {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Add owner ID to restaurant data
      const restaurantWithOwner = {
        ...restaurantData,
        ownerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('restaurants').add(restaurantWithOwner);
      return {
        success: true,
        restaurantId: docRef.id
      };
    } else {
      // Using Local Storage
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      
      // Create new restaurant
      const newRestaurant = {
        id: 'restaurant_' + Date.now().toString(),
        ...restaurantData,
        ownerId: user.id,
        createdAt: new Date().toISOString()
      };
      
      restaurants.push(newRestaurant);
      setLocalStorageItem(STORAGE_KEYS.RESTAURANTS, restaurants);
      
      return {
        success: true,
        restaurantId: newRestaurant.id
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getRestaurants() {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      const querySnapshot = await db.collection('restaurants').get();
      const restaurants = [];
      
      querySnapshot.forEach(doc => {
        restaurants.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        restaurants
      };
    } else {
      // Using Local Storage
      let restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      
      // If no restaurants exist, create default ones
      if (restaurants.length === 0) {
        console.log('No restaurants found, creating default restaurants');
        await createDefaultRestaurants();
        restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      }
      
      return {
        success: true,
        restaurants
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to get restaurants filtered by city
async function getRestaurantsByCity(city) {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      let query = db.collection('restaurants');
      
      if (city && city.trim() !== '') {
        query = query.where('city', '==', city);
      }
      
      const querySnapshot = await query.get();
      const restaurants = [];
      
      querySnapshot.forEach(doc => {
        restaurants.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        restaurants
      };
    } else {
      // Using Local Storage
      let restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      console.log(`Total restaurants in localStorage: ${restaurants.length}`);
      
      // If no restaurants exist at all, create default ones
      if (restaurants.length === 0) {
        console.log('No restaurants found, creating default restaurants');
        await createDefaultRestaurants();
        // Fetch the newly created restaurants
        restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
        
        // If still empty after creation attempt, create some emergency restaurants
        if (restaurants.length === 0) {
          console.log('Emergency: Creating restaurants directly');
          restaurants = [
            {
              id: 'restaurant_default_1',
              name: 'Karachi Biryani House',
              description: 'Best biryani in town',
              rating: 4.7,
              deliveryTime: '25-40 min',
              city: 'Karachi',
              image: 'assets/images (1).jpg',
              ownerId: 'default_owner',
              createdAt: new Date().toISOString()
            },
            {
              id: 'restaurant_default_2',
              name: 'Lahore Cuisine',
              description: 'Authentic Lahori taste',
              rating: 4.5,
              deliveryTime: '30-45 min',
              city: 'Lahore',
              image: 'assets/images (2).jpg',
              ownerId: 'default_owner',
              createdAt: new Date().toISOString()
            },
            {
              id: 'restaurant_default_3',
              name: 'Islamabad Grill',
              description: 'Premium BBQ and grilled items',
              rating: 4.8,
              deliveryTime: '20-35 min',
              city: 'Islamabad',
              image: 'assets/images (3).jpg',
              ownerId: 'default_owner',
              createdAt: new Date().toISOString()
            }
          ];
          
          setLocalStorageItem(STORAGE_KEYS.RESTAURANTS, restaurants);
          
          // Create default categories and menu items for these restaurants
          for (const restaurant of restaurants) {
            await createDefaultCategories(restaurant.id);
            await createDefaultMenuItems(restaurant.id);
          }
        }
      }
      
      // If restaurants array is still empty after all attempts, return an error
      if (restaurants.length === 0) {
        console.error('Failed to create restaurants');
        return {
          success: false,
          error: 'Failed to load or create restaurants'
        };
      }
      
      // If no city specified or empty string, return all restaurants
      if (!city || city.trim() === '') {
        console.log('No city specified, returning all restaurants');
        return {
          success: true,
          restaurants
        };
      }
      
      // Clean the city name for comparison (lowercase, trim spaces)
      const cleanCity = city.toLowerCase().trim();
      console.log(`Filtering for city: "${cleanCity}"`);
      
      // Get all available cities for logging
      const availableCities = [...new Set(restaurants.map(r => r.city ? r.city.toLowerCase() : null).filter(Boolean))];
      console.log('Available cities in data:', availableCities);
      
      // Filter restaurants by city - use case-insensitive comparison
      let filteredRestaurants = restaurants.filter(restaurant => 
        restaurant.city && restaurant.city.toLowerCase().trim() === cleanCity
      );
      
      console.log(`Found ${filteredRestaurants.length} restaurants for city "${cleanCity}"`);
      
      // If no restaurants found for this city, return a subset of all restaurants
      // This ensures users always see some restaurants even when no exact city match
      if (filteredRestaurants.length === 0) {
        console.log('No restaurants found for the selected city. Showing a subset of available restaurants instead.');
        
        // Add city to random restaurants if we don't have any for this city
        if (!availableCities.includes(cleanCity)) {
          console.log(`Adding new city "${cleanCity}" to restaurant database`);
          
          // Create at least 2 restaurants for this city
          const cityRestaurants = [
            {
              id: 'restaurant_' + Date.now() + '_' + cleanCity + '1',
              name: cleanCity + ' Food House',
              description: 'The best local cuisine in ' + city,
              rating: 4.3,
              deliveryTime: '20-35 min',
              city: city,
              image: 'assets/images (' + (Math.floor(Math.random() * 16) + 1) + ').jpg',
              ownerId: 'default_owner',
              createdAt: new Date().toISOString()
            },
            {
              id: 'restaurant_' + Date.now() + '_' + cleanCity + '2',
              name: cleanCity + ' Gourmet',
              description: 'Premium dining experience delivered to your door in ' + city,
              rating: 4.6,
              deliveryTime: '25-40 min',
              city: city,
              image: 'assets/images (' + (Math.floor(Math.random() * 16) + 1) + ').jpg',
              ownerId: 'default_owner',
              createdAt: new Date().toISOString()
            }
          ];
          
          // Add to existing restaurants
          restaurants = [...restaurants, ...cityRestaurants];
          setLocalStorageItem(STORAGE_KEYS.RESTAURANTS, restaurants);
          
          // Create categories and menu items for these new restaurants
          for (const restaurant of cityRestaurants) {
            await createDefaultCategories(restaurant.id);
            await createDefaultMenuItems(restaurant.id);
          }
          
          // Now filter for this city again
          filteredRestaurants = restaurants.filter(restaurant => 
            restaurant.city && restaurant.city.toLowerCase().trim() === cleanCity
          );
        } else {
          // Return a subset of top-rated restaurants instead
          filteredRestaurants = restaurants
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
        }
      }
      
      return {
        success: true,
        restaurants: filteredRestaurants
      };
    }
  } catch (error) {
    console.error('Error getting restaurants by city:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getMyRestaurant() {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    if (!useLocalStorage) {
      // Using Firebase
      const snapshot = await db.collection('restaurants')
        .where('ownerId', '==', user.uid)
        .get();
      
      if (snapshot.empty) {
        return {
          success: true,
          restaurant: null
        };
      }
      
      return {
        success: true,
        restaurant: {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        }
      };
    } else {
      // Using Local Storage
      const restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      const myRestaurant = restaurants.find(r => r.ownerId === user.id);
      
      return {
        success: true,
        restaurant: myRestaurant || null
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Category Functions
async function createCategory(restaurantId, categoryData) {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user owns this restaurant
      const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
      if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== user.uid) {
        throw new Error('Unauthorized access to restaurant');
      }
      
      const categoryWithRestaurant = {
        ...categoryData,
        restaurantId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('categories').add(categoryWithRestaurant);
      return {
        success: true,
        categoryId: docRef.id
      };
    } else {
      // Using Local Storage
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      const restaurant = restaurants.find(r => r.id === restaurantId);
      
      if (!restaurant || restaurant.ownerId !== user.id) {
        throw new Error('Unauthorized access to restaurant');
      }
      
      const categories = getLocalStorageItem(STORAGE_KEYS.CATEGORIES) || [];
      
      // Create new category
      const newCategory = {
        id: 'category_' + Date.now().toString(),
        ...categoryData,
        restaurantId,
        createdAt: new Date().toISOString()
      };
      
      categories.push(newCategory);
      setLocalStorageItem(STORAGE_KEYS.CATEGORIES, categories);
      
      return {
        success: true,
        categoryId: newCategory.id
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getCategories(restaurantId) {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      const snapshot = await db.collection('categories')
        .where('restaurantId', '==', restaurantId)
        .orderBy('name')
        .get();
      
      return {
        success: true,
        categories: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    } else {
      // Using Local Storage
      const categories = getLocalStorageItem(STORAGE_KEYS.CATEGORIES) || [];
      const filteredCategories = categories.filter(c => c.restaurantId === restaurantId);
      
      return {
        success: true,
        categories: filteredCategories
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to create default categories if none exist
async function createDefaultCategories(restaurantId) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    // Check if categories already exist
    const categoriesResult = await getCategories(restaurantId);
    if (categoriesResult.success && categoriesResult.categories.length > 0) {
      return {
        success: true,
        message: 'Categories already exist',
        skipCreation: true
      };
    }
    
    // Create default categories
    const defaultCategories = [
      {
        name: 'Main Dishes',
        description: 'Our signature main courses'
      },
      {
        name: 'Desserts',
        description: 'Sweet treats to end your meal'
      }
    ];
    
    // Create each category
    const results = [];
    for (const category of defaultCategories) {
      const result = await createCategory(restaurantId, category);
      results.push(result);
      
      if (!result.success) {
        throw new Error(`Failed to create default category: ${result.error}`);
      }
    }
    
    return {
      success: true,
      message: 'Default categories created successfully',
      results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Menu Item Functions
async function createMenuItem(restaurantId, categoryId, itemData) {
  try {
    // Check if user is admin
    requireAdminAccess();
    
    if (!useLocalStorage) {
      // Using Firebase
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user owns this restaurant
      const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
      if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== user.uid) {
        throw new Error('Unauthorized access to restaurant');
      }
      
      const menuItemWithIds = {
        ...itemData,
        restaurantId,
        categoryId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('menuItems').add(menuItemWithIds);
      return {
        success: true,
        menuItemId: docRef.id
      };
    } else {
      // Using Local Storage
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const restaurants = getLocalStorageItem(STORAGE_KEYS.RESTAURANTS) || [];
      const restaurant = restaurants.find(r => r.id === restaurantId);
      
      if (!restaurant || restaurant.ownerId !== user.id) {
        throw new Error('Unauthorized access to restaurant');
      }
      
      const menuItems = getLocalStorageItem(STORAGE_KEYS.MENU_ITEMS) || [];
      
      // Create new menu item
      const newMenuItem = {
        id: 'menuItem_' + Date.now().toString(),
        ...itemData,
        restaurantId,
        categoryId,
        createdAt: new Date().toISOString()
      };
      
      menuItems.push(newMenuItem);
      setLocalStorageItem(STORAGE_KEYS.MENU_ITEMS, menuItems);
      
      return {
        success: true,
        menuItemId: newMenuItem.id
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getMenuItems(restaurantId, categoryId = null) {
  try {
    if (!useLocalStorage) {
      // Using Firebase
      let query = db.collection('menuItems').where('restaurantId', '==', restaurantId);
      
      if (categoryId) {
        query = query.where('categoryId', '==', categoryId);
      }
      
      const snapshot = await query.get();
      
      return {
        success: true,
        menuItems: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    } else {
      // Using Local Storage
      const menuItems = getLocalStorageItem(STORAGE_KEYS.MENU_ITEMS) || [];
      let filteredMenuItems = menuItems.filter(item => item.restaurantId === restaurantId);
      
      if (categoryId) {
        filteredMenuItems = filteredMenuItems.filter(item => item.categoryId === categoryId);
      }
      
      return {
        success: true,
        menuItems: filteredMenuItems
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Create default menu items
async function createDefaultMenuItems(restaurantId) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    // Check if menu items already exist
    const menuItemsResult = await getMenuItems(restaurantId);
    if (menuItemsResult.success && menuItemsResult.menuItems.length > 0) {
      return {
        success: true,
        message: 'Menu items already exist',
        skipCreation: true
      };
    }
    
    // Get categories
    const categoriesResult = await getCategories(restaurantId);
    if (!categoriesResult.success) {
      throw new Error('Failed to fetch categories');
    }
    
    const categories = categoriesResult.categories;
    if (categories.length === 0) {
      // Create default categories first
      const defaultCategoriesResult = await createDefaultCategories(restaurantId);
      if (!defaultCategoriesResult.success) {
        throw new Error('Failed to create default categories');
      }
      
      // Fetch the newly created categories
      const newCategoriesResult = await getCategories(restaurantId);
      if (!newCategoriesResult.success) {
        throw new Error('Failed to fetch newly created categories');
      }
      
      categories.push(...newCategoriesResult.categories);
    }
    
    // Sample menu items organized by category
    const defaultMenuItems = {
      'Main Dishes': [
        {
          name: 'Classic Burger',
          description: 'Juicy beef patty with lettuce, tomato, and special sauce',
          price: 12.99,
          image: '../assets/burger.jpg'
        },
        {
          name: 'Margherita Pizza',
          description: 'Traditional pizza with tomato sauce, mozzarella, and basil',
          price: 14.99,
          image: '../assets/pizza.jpg'
        },
        {
          name: 'Grilled Chicken Salad',
          description: 'Fresh greens with grilled chicken, avocado, and house dressing',
          price: 10.99,
          image: '../assets/salad.jpg'
        },
        {
          name: 'Pasta Carbonara',
          description: 'Creamy pasta with bacon, egg, and parmesan cheese',
          price: 13.99,
          image: '../assets/pasta.jpg'
        }
      ],
      'Desserts': [
        {
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake with a gooey center',
          price: 6.99,
          image: '../assets/chocolate-cake.jpg'
        },
        {
          name: 'Strawberry Cheesecake',
          description: 'Creamy cheesecake with fresh strawberry topping',
          price: 7.99,
          image: '../assets/cheesecake.jpg'
        },
        {
          name: 'Ice Cream Sundae',
          description: 'Vanilla ice cream with hot fudge, whipped cream, and a cherry',
          price: 5.99,
          image: '../assets/ice-cream.jpg'
        },
        {
          name: 'Apple Pie',
          description: 'Homemade apple pie with a flaky crust',
          price: 6.49,
          image: '../assets/apple-pie.jpg'
        }
      ]
    };
    
    const results = [];
    
    // Create menu items for each category
    for (const category of categories) {
      const categoryName = category.name;
      
      // Skip if no default items for this category
      if (!defaultMenuItems[categoryName]) continue;
      
      for (const item of defaultMenuItems[categoryName]) {
        const menuItemData = {
          ...item,
          restaurantId,
          categoryId: category.id
        };
        
        const result = await createMenuItem(restaurantId, category.id, menuItemData);
        results.push(result);
        
        if (!result.success) {
          console.error(`Failed to create menu item ${item.name}: ${result.error}`);
        }
      }
    }
    
    return {
      success: true,
      message: 'Default menu items created successfully',
      results
    };
    
  } catch (error) {
    console.error('Error creating default menu items:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Cart Functions
function getCart() {
  // Try to get cart from local storage
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('Cart loaded:', cart);
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved:', cart);
    return true;
  } catch (error) {
    console.error('Error saving cart:', error);
    return false;
  }
}

function addToCart(item) {
  try {
    // Validate item
    if (!item || !item.id || !item.name || isNaN(parseFloat(item.price))) {
      console.error('Invalid item:', item);
    return false;
  }
  
    // Get cart
    const cart = getCart();
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      // Add new item
      cart.push({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        image: item.image || 'img/default-dish.jpg'
      });
    }
    
    // Save cart
    if (saveCart(cart)) {
    // Update UI
    updateCartUI();
    return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
}

// Update cart UI - helper function to check if UI elements exist
function updateCartUI() {
  // Only update if we're on a page with cart UI
  const cartCounter = document.querySelector('.cart-counter, #cartCounter');
  const cartTotal = document.querySelector('.cart-total, #cartTotal');
  
  // If no UI elements, don't attempt to update
  if (!cartCounter && !cartTotal) {
    console.log('No cart UI elements found, skipping update');
    return;
  }
  
  // Get cart and calculate totals
    const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const totalAmount = cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
    
  // Update cart counter if it exists
  if (cartCounter) {
    cartCounter.textContent = totalItems;
        
    // Show/hide counter based on items
    if (totalItems > 0) {
      cartCounter.style.display = 'flex';
    } else {
      cartCounter.style.display = 'none';
    }
        }
        
  // Update cart total if it exists
  if (cartTotal) {
    cartTotal.textContent = `PKR ${totalAmount.toLocaleString()}`;
  }
}

// Remove item from cart
function removeFromCart(itemId) {
  try {
    // Get cart
    const cart = getCart();
    
    // Remove item
    const updatedCart = cart.filter(item => item.id !== itemId);
    
    // Save cart
    if (saveCart(updatedCart)) {
      // Update UI
      updateCartUI();
    
      // Re-render cart items if function exists
      if (typeof renderCartItems === 'function') {
        renderCartItems();
        }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
}

// Update item quantity
function updateItemQuantity(itemId, change) {
  try {
    // Get cart
    const cart = getCart();
    
    // Find item
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.error('Item not found in cart:', itemId);
    return false;
  }
    
    // Update quantity
    cart[itemIndex].quantity = (cart[itemIndex].quantity || 1) + change;
    
    // Remove item if quantity is 0 or less
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      
    // Save cart
    if (saveCart(cart)) {
      // Update UI
      updateCartUI();
      
      // Re-render cart items if function exists
      if (typeof renderCartItems === 'function') {
        renderCartItems();
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return false;
  }
}

// Update cart counter
function updateCartCounter() {
  // Only update if we're on a page with cart counter
  const cartCounter = document.querySelector('.cart-counter, #cartCounter');
  
  if (!cartCounter) {
    return;
  }
  
  // Get cart and calculate total items
  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  
  // Update cart counter
  cartCounter.textContent = totalItems;
  
  // Show/hide counter based on items
  if (totalItems > 0) {
    cartCounter.style.display = 'flex';
  } else {
    cartCounter.style.display = 'none';
  }
}

// Update cart total
function updateCartTotal() {
  // Only update if we're on a page with cart total
  const cartTotal = document.querySelector('.cart-total, #cartTotal');
  
  if (!cartTotal) {
    return;
  }
  
  // Get cart and calculate total amount
  const cart = getCart();
  const totalAmount = cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  
  // Update cart total
  cartTotal.textContent = `PKR ${totalAmount.toLocaleString()}`;
}

// UI Helper Functions
function showMessage(message, type = 'info') {
  const messageContainer = document.getElementById('message-container');
  if (!messageContainer) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;
  
  messageContainer.appendChild(messageElement);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleMenu = (selector) => {
    const element = document.querySelector(selector);
    if (element) element.classList.toggle('active');
  };

  document.querySelector('.hamburger')?.addEventListener('click', () => toggleMenu('.mobile-nav'));

  // Check if user is logged in and update UI accordingly
  const user = getCurrentUser();
  updateAuthUI(user);
});

// Update UI based on authentication status
function updateAuthUI(user) {
  // Update UI based on authentication status
  const authLinks = document.querySelectorAll('.auth-links');
  const userMenus = document.querySelectorAll('.user-menu');
  
  if (user) {
    // User is logged in
    authLinks.forEach(linkContainer => {
      // Hide login/signup, show user options
      const loginLinks = linkContainer.querySelectorAll('a[href*="login.html"], a[href*="signup.html"]');
      loginLinks.forEach(link => {
        const listItem = link.closest('li');
        if (listItem) listItem.style.display = 'none';
      });
      
      // Check if user-info element already exists
      let userInfo = linkContainer.querySelector('.user-info');
      
      if (!userInfo) {
        // Create user info element
        userInfo = document.createElement('li');
        userInfo.className = 'user-info';
        
        const userButton = document.createElement('a');
        userButton.href = '#';
        userButton.className = 'user-button';
        userButton.innerHTML = `
          <span class="user-name">${user.displayName || user.name || 'User'}</span>
          <i class="fas fa-user-circle"></i>
        `;
        
        userInfo.appendChild(userButton);
        
        // Create dropdown
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        
        // Add dropdown links based on user type
        if (user.userType === 'admin') {
          userDropdown.innerHTML = `
            <a href="../admin/new-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            <a href="../admin/restaurant.html"><i class="fas fa-utensils"></i> My Restaurant</a>
            <a href="../admin/orders.html"><i class="fas fa-clipboard-list"></i> Orders</a>
            <a href="#" id="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>
          `;
        } else {
          userDropdown.innerHTML = `
            <a href="../customer/dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            <a href="../customer/orders.html"><i class="fas fa-clipboard-list"></i> My Orders</a>
            <a href="../customer/profile.html"><i class="fas fa-user-cog"></i> Profile</a>
            <a href="#" id="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>
          `;
        }
        
        userInfo.appendChild(userDropdown);
        linkContainer.appendChild(userInfo);
        
        // Add event listener for dropdown toggle
        userButton.addEventListener('click', function(e) {
          e.preventDefault();
          userDropdown.classList.toggle('show');
        });
        
        // Add event listener for logout
        const logoutLink = userDropdown.querySelector('#logout-link');
        logoutLink.addEventListener('click', function(e) {
          e.preventDefault();
          logoutUser().then(() => {
            window.location.href = '../index.html';
          });
        });
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.user-info')) {
        document.querySelectorAll('.user-dropdown').forEach(dropdown => {
          dropdown.classList.remove('show');
        });
      }
    });
    
    // Update cart counter if it exists
    updateCartCounter();
  } else {
    // User is logged out
    authLinks.forEach(linkContainer => {
      // Show login/signup
      const loginLinks = linkContainer.querySelectorAll('a[href*="login.html"], a[href*="signup.html"]');
      loginLinks.forEach(link => {
        const listItem = link.closest('li');
        if (listItem) listItem.style.display = '';
      });
      
      // Remove user info
      const userInfo = linkContainer.querySelector('.user-info');
      if (userInfo) {
        userInfo.remove();
      }
    });
  }
}

// Create default restaurants for testing
async function createDefaultRestaurants() {
  try {
    console.log('Creating default restaurants');
    
    // Default restaurants data
    const defaultRestaurants = [
      {
        id: 'restaurant_' + Date.now() + '_1',
        name: 'Karachi Biryani House',
        description: 'Best biryani in town',
        rating: 4.7,
        deliveryTime: '25-40 min',
        city: 'Karachi',
        image: 'assets/images (1).jpg',
        ownerId: 'default_owner',
        createdAt: new Date().toISOString()
      },
      {
        id: 'restaurant_' + Date.now() + '_2',
        name: 'Lahore Cuisine',
        description: 'Authentic Lahori taste',
        rating: 4.5,
        deliveryTime: '30-45 min',
        city: 'Lahore',
        image: 'assets/images (2).jpg',
        ownerId: 'default_owner',
        createdAt: new Date().toISOString()
      },
      {
        id: 'restaurant_' + Date.now() + '_3',
        name: 'Islamabad Grill',
        description: 'Premium BBQ and grilled items',
        rating: 4.8,
        deliveryTime: '20-35 min',
        city: 'Islamabad',
        image: 'assets/images (3).jpg',
        ownerId: 'default_owner',
        createdAt: new Date().toISOString()
      },
      {
        id: 'restaurant_' + Date.now() + '_4',
        name: 'Peshawar Chapli Kebab',
        description: 'Famous chapli kebab from Peshawar',
        rating: 4.6,
        deliveryTime: '15-30 min',
        city: 'Peshawar',
        image: 'assets/images (4).jpg',
        ownerId: 'default_owner',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Save to localStorage
    console.log('Saving default restaurants to localStorage:', defaultRestaurants);
    setLocalStorageItem(STORAGE_KEYS.RESTAURANTS, defaultRestaurants);
    
    // Create default categories and menu items for each restaurant
    for (const restaurant of defaultRestaurants) {
      await createDefaultCategories(restaurant.id);
      await createDefaultMenuItems(restaurant.id);
    }
    
    console.log('Default restaurants created successfully with categories and menu items');
    return true;
  } catch (error) {
    console.error('Error creating default restaurants:', error);
    return false;
  }
}

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileNav.classList.toggle('active');
    });
  }
});

// Expose cart functions to window object for cart.js to use
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.updateCartUI = updateCartUI;
window.updateCartCounter = updateCartCounter;
window.updateCartTotal = updateCartTotal;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateItemQuantity;
window.clearCart = clearCart;

// Export all functions
window.foodPandaApp = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAdminUser,
  requireAdminAccess,
  createRestaurant,
  getRestaurants,
  getRestaurantsByCity,
  getMyRestaurant,
  createCategory,
  getCategories,
  createMenuItem,
  getMenuItems,
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  showMessage,
  updateCartCounter,
  uploadImage,
  createDefaultCategories,
  createDefaultMenuItems,
  createDefaultRestaurants,
  
  // Allow forcing localStorage mode
  get forceLocalStorage() {
    return useLocalStorage;
  },
  
  set forceLocalStorage(value) {
    useLocalStorage = Boolean(value);
    console.log('localStorage mode force set to:', useLocalStorage);
  }
}; 