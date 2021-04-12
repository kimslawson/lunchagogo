navigator.geolocation.getCurrentPosition(position => {
//  console.log(position)
    document.getElementById('truck-latitude').value = position.coords.latitude;
    document.getElementById('truck-longitude').value = position.coords.longitude;
    document.getElementById('foodie-latitude').value = position.coords.latitude;
    document.getElementById('foodie-longitude').value = position.coords.longitude;
}, error => {
	console.error(error)
}, {
  timeout: 10000,
  maximumAge: 10000,
  enableHighAccuracy: true
})

function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

var easter_egg = new Konami(function() { 
// make it rain tasty emoji

// Get the reference node 
var referenceNode = document.querySelector('#end');

// Insert the new node before the reference node
for (i = 0; i < 80; i++) {
	// Create a new element
	var newNode = document.createElement('i');
	referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

});
