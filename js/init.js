

function openTab(evt, tabName) {
  // get and fuzz user's current lat and lon
  // do it here and not right off in init because we want it to be as a result of user action and to build trust

  navigator.geolocation.getCurrentPosition(position => {
    //  console.log(position)
    //  https://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude/8674#8674

    // fuzz location for privacy
    fuzzylat = position.coords.latitude.toFixed(3);
    fuzzylon = position.coords.longitude.toFixed(3);

    document.getElementById('truck-latitude').value = fuzzylat;
    document.getElementById('truck-longitude').value = fuzzylon;
    document.getElementById('foodie-latitude').value = fuzzylat;
    document.getElementById('foodie-longitude').value = fuzzylon;
  }, error => {
	  console.error(error)
  }, {
    timeout: 10000,
    maximumAge: 10000,
    enableHighAccuracy: true
  })
  alert(fuzzylat);
  alert(fuzzylon);

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
