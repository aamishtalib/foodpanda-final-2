// Location dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  const locationDropdown = document.getElementById('locationDropdown');
  const locationToggle = document.getElementById('locationToggle');
  
  if (locationToggle && locationDropdown) {
    // Toggle dropdown when clicking the button
    locationToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      locationDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!locationDropdown.contains(e.target)) {
        locationDropdown.classList.remove('active');
      }
    });
    
    // Handle location selection
    const locationLinks = document.querySelectorAll('.location-list a');
    locationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get the selected location
        const selectedLocation = this.textContent.trim();
        
        // Update the dropdown toggle text
        const locationText = locationToggle.querySelector('span');
        if (locationText) {
          locationText.textContent = selectedLocation;
        }
        
        // Close the dropdown
        locationDropdown.classList.remove('active');
        
        // Show notification
        showLocationNotification(selectedLocation);
        
        // You can also store the selected location in localStorage or cookies
        localStorage.setItem('selectedLocation', selectedLocation);
      });
    });
    
    // Check if there's a previously selected location
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      const locationText = locationToggle.querySelector('span');
      if (locationText) {
        locationText.textContent = savedLocation;
      }
    }
  }
});

// Function to show location notification
function showLocationNotification(location) {
  // Create notification container if it doesn't exist
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.maxWidth = '350px';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.display = 'flex';
    notificationContainer.style.flexDirection = 'column';
    notificationContainer.style.gap = '10px';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.backgroundColor = '#fff';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.borderRadius = '8px';
  notification.style.padding = '12px 16px';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.animation = 'slideIn 0.3s forwards';
  
  // Add notification content
  notification.innerHTML = `
    <i class="fas fa-map-marker-alt" style="color: #ff0080; margin-right: 10px; font-size: 20px;"></i>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 3px;">Location Updated</div>
      <div style="font-size: 14px; color: #555;">Your location is now set to ${location}</div>
    </div>
    <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 16px; margin-left: 10px;">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add notification to container
  notificationContainer.appendChild(notification);
  
  // Auto-remove notification after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
  
  // Add close button functionality
  const closeBtn = notification.querySelector('button');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Add slideIn and slideOut animations if they don't exist
  if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(50px); }
      }
    `;
    document.head.appendChild(style);
  }
} 