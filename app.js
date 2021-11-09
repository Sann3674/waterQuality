const form = document.querySelector('#location');
const beachPara = document.querySelector('#beach');
const validateInput = document.querySelector('#validateInput');
const nearContainer = document.querySelector('#nearBeach');
const measureContainer = document.querySelector('#measurement');
const beachPara2 = document.querySelector('#beach2');
const rating = document.querySelector('#rating');

//initialise long & lat values (used Portsmouth postcode as default)
let latValue = 50.78943;
let longValue = -1.10173;

//initialise arrays to store distance of each array item from user location
let distanceStats = [];

//initialise id for nearest beach (using southsea as default)
let beachId = 'SO-G0006811';

//allow user to enter an address with long & lat values
form.addEventListener('submit', function (e) {
    e.preventDefault();
    let parsedLat = parseFloat(form.elements.lat.value);
    let parsedLong = parseFloat(form.elements.long.value);
    let nanLat = isNaN(parsedLat);
    let nanLong = isNaN(parsedLong);
    if ( nanLat || nanLong ) {
        invalidInput();
        return;
    }
    else if (parsedLat > 90 || parsedLat < -90) {
        invalidInput();
        return;
    }
    else if (parsedLong > 180 || parsedLong < -180) {
        invalidInput();
        return;
    }
    latValue = parsedLat;
    longValue = parsedLong;
    validateInput.classList.add('hidden');
    getLocationArray();
    getReading(beachId);
})

//function to get list of beach sampling points in the UK/
//output should be the closest beach to the user's input address
const getLocationArray = async () => {
    try {
        const res = await axios.get('http://environment.data.gov.uk/water-quality/id/sampling-point?_limit=1000&samplingPointType=CA');
        const locationArray = res.data.items;
        console.log(locationArray);
        const shortestIndex = getCoord(locationArray);
        beachId = locationArray[shortestIndex].notation;
        let beachName = (locationArray[shortestIndex].label);
        let area = locationArray[shortestIndex].area.label;
        beachPara.innerHTML = `Your nearest beach with a water reading is ${beachName} beach, in the ${area} area.`
        beachPara2.innerHTML = beachName;
        nearContainer.classList.remove('hidden');
    }
    catch(e) {
        console.log('Error!', e);
    }
}

//function for getting & interpreting results from that nearest beach
const getReading = async(beachId) => {
    try {
        const res = await axios.get(`http://environment.data.gov.uk/water-quality/id/sampling-point/${beachId}/measurements?startDate=2016-01-01&endDate=2021-09-30&determinand=2348`)
        let measurementArray = res.data.items;
        console.log(measurementArray);
        let qual = ecoliCheck(measurementArray);
        if (qual === true) {
            rating.innerHTML = 'better than the national average'
        }
        else if (qual === false) {
            rating.innerHTML = 'worse than the national average'
        }
        measureContainer.classList.remove('hidden');
    }
    catch(e) {
        console.log('Error!', e);
    }
}

//function for getting coordinates from API array and using them to calc distance & populate arrays
//should return index of the location with shortest distance
function getCoord(array) {
    for (let location of array) {
        let calcDist = distance(latValue, longValue, location.lat, location.long);
        distanceStats.push(calcDist);
    }
    console.log(distanceStats);
    let minimum = Math.min(...distanceStats);
    let index = distanceStats.indexOf(minimum);
    console.log(index);
    return index;
}

//function for comparing 

//declaring function to find the distance between two points.  unit = the unit you desire for results, where: 'M' is statute miles (default)
//'K' is kilometers & 'N' is nautical miles 
//source of function: https://www.geodatasource.com/developers/javascript
function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 === lat2) && (lon1 === lon2)) {
		return 0;
	}
	else {
		let radlat1 = Math.PI * lat1/180;
		let radlat2 = Math.PI * lat2/180;
		let theta = lon1-lon2;
		let radtheta = Math.PI * theta/180;
		let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

//function for if input is invalid
function invalidInput() {
    console.log('Please enter valid latitude and longitude coordinates');
    validateInput.innerHTML = 'Please enter valid input. Latitude must be a number between -90 and 90, and longitude must be a number between -180 and 180.';
}

//function to check quality of e-coli readings vs average
function ecoliCheck(array) {
    let total = 0;
    for (reading of array) {
        let measure = reading.result;
        total = total + measure;
    }
    let avg = (total / array.length);
    if (avg > 50) {
        return true;
    }
    else {
        return false;
    }
}
