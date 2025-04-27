# Firebase Setup Guide for Food Panda Clone

Follow these steps to connect your Firebase account to the Food Panda clone:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "Food Panda Clone")
4. Follow the setup wizard to create your project
5. Once your project is created, you'll be redirected to the project dashboard

## 2. Set Up Firebase Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click the "Get started" button
3. Enable the "Email/Password" sign-in method by clicking on it and toggling the switch to "Enabled"
4. Click "Save"
5. Optionally, enable other sign-in methods like Google, Facebook, etc.

## 3. Create a Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select a location for your database (pick the closest to your target users)
5. Click "Enable"

## 4. Set Up Firebase Storage

1. In your Firebase project, go to "Storage" in the left sidebar
2. Click "Get started"
3. Accept the default rules for now (you can modify them later)
4. Click "Next" and then "Done"

## 5. Register Your Web App

1. Go to your project overview page
2. Click the "</>" icon to add a web app
3. Optionally set up Firebase Hosting

## 6. Get Your Firebase Configuration

1. In your project settings (gear icon in the left sidebar), go to "General" tab
2. Copy the firebaseConfig object from the code snippet

## 7. Update Your Project Files

1. Open your js/app.js file
2. Replace the placeholder values in the `firebaseConfig` object with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

3. Make sure the `useLocalStorage` variable is set to `false` to use Firebase instead of localStorage

## 8. Update Security Rules

1. Go to Firestore Database > Rules and update them for secure access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow write: if request.auth != null && 
                    (resource == null || resource.data.ownerId == request.auth.uid);
    }
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /menuItems/{menuItemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

2. Go to Storage > Rules and update them:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 9. Test Your Firebase Authentication

1. Start by visiting the homepage of your app
2. Try to register a new account using the "Sign Up" page
3. Verify that the account is created in Firebase Authentication (check the Firebase console)
4. Log out and then log back in to confirm authentication works
5. Upload an image to test Firebase Storage functionality
6. Create restaurant/menu items to test Firestore functionality

## 10. Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that your Firebase configuration is correct
3. Make sure you've enabled Email/Password authentication
4. Check that your Firestore and Storage security rules are properly set
5. Ensure all Firebase SDK scripts are properly loaded in your HTML files

Now your Food Panda Clone is fully connected to your Firebase account with proper authentication!

## Useful Firebase Documentation Links

- [Firebase Web Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules) 