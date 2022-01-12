var blogpostFilter = document.getElementById("blogpostfilter");
var itemTemplate = document.getElementById("ItemTemplate");
var filterTemplate = document.getElementById("Templatecontainer");
var requestLink = "/projects.json";
var filters = {};

var response_cache;
var current_page = 1;
var page_count = 1;
var per_page = 10;

function getResponse() {
	if (!response_cache) {
		let xhttp = new XMLHttpRequest();
		xhttp.open("GET", requestLink, false);
		xhttp.send();
		response_cache = JSON.parse(xhttp.responseText);
	}
	return JSON.parse(JSON.stringify(response_cache));;

}

async function populateFilters() {
	//Remove Old Filters
	let itemList = filterTemplate.parentElement.querySelectorAll(':scope > :not(#Templatecontainer)');
	for (let i = 0; i < itemList.length; i++) {
		itemList[i].remove();
	}
	filters = {};
	let response = getResponse().projects;
	//Perform Database Request
	for (let i = 0; i < response.length; i++) {
		let res_filters = response[i].filters;
		for (const [key, value] of Object.entries(res_filters)) {
			filters[key] = key;
		}
	}
	let newfilters = {};
	for (const [key, value] of Object.entries(filters)) {
		newfilters[key] = new Set();
	}
	for (let i = 0; i < response.length; i++) {
		let res_filters = response[i].filters;
		for (const [key, value] of Object.entries(res_filters)) {
			for (let k = 0; k < value.length; k++) {
				newfilters[key].add(value[k]);
			}
		}

	}
	//Reconstruct Form Based on Response.
	for (const [attrid, field] of Object.entries(filters)) {
		let newFilter = filterTemplate.cloneNode(true);
		newFilter.querySelector("label").innerHTML = field;
		filterTemplate.parentElement.appendChild(newFilter);
		let checkboxTemplate = document.getElementById("Templatecheckboxtemplate");
		for (const keyval of newfilters[attrid].entries()) {
			let option = keyval[0];
			let newOption = checkboxTemplate.cloneNode(true);
			newFilter.appendChild(newOption);
			newOption.style.visibility = "visible";
			newOption.style.display = "flex";
			newOption.lastElementChild.htmlFor = attrid + option;
			newOption.lastElementChild.innerHTML = option;
			newOption.firstElementChild.name = field;
			newOption.firstElementChild.value = option;
			newOption.firstElementChild.id = attrid + option;
			newOption.id = "";
			//newOption.onclick=updateResults;
		}
		newFilter.id = attrid + "container";
		newFilter.style.visibility = "visible";
		newFilter.style.display = "";
	}
}
populateFilters();
async function updateResults() {
	//Retrieve Current Filters
	let response = getResponse().projects;

	//Filter the response

	//Attributes
	for (const [key, field] of Object.entries(filters)) {
		let arr = blogpostFilter[field];
		if (arr) {
			let tempset = new Set();
			for (let i = 0; i < arr.length; i++) {
				if (arr[i].checked) {
					tempset.add(arr[i].value);
				}
			}
			if (tempset.size == 0) {
				continue;
			}
			for (let i = 0; i < response.length; i++) {
				let hasattributes = false;
				let res_filters = response[i].filters;
				for (const [filtername, values] of Object.entries(res_filters)) {
					if(filtername == key){
						for(const value of values){
							if(tempset.has(value)){
								hasattributes = true;
								break;
							}
						}
					}
					if (hasattributes)
						break;
				}
				if (hasattributes) continue;
				response.splice(i, 1);
				i--;
			}
		} else {
			console.error("Arr is null for field: " + field);
		}
	}

	page_count = Math.trunc((response.length + per_page - 1) / per_page);
	let itemList = itemTemplate.parentElement.querySelectorAll(':scope > :not(#ItemTemplate, .page-btn)');
	for (let i = 0; i < itemList.length; i++) {
		itemList[i].remove();
	}
	for (let i = 0; i < response.length; i++) {
		let newItem = itemTemplate.cloneNode(true);
		newItem.style.display = "flex";
		newItem.querySelector('[name="Title"]').innerHTML = response[i].title;
		newItem.querySelector('[name="Date"]').innerHTML = response[i].date;
		newItem.querySelector('[name="About"]').innerHTML = response[i].about;
		newItem.querySelector('a').href = response[i].url;
		if (response[i].images && response[i].images.length > 0) {
			newItem.querySelector('[name="Image"]').src = response[i].images[0].src;
		}
		newItem.id = "";
		itemTemplate.parentElement.appendChild(newItem);
	}
}

async function applyFilters() {
	current_page = 1;
	changePage(0);
}

async function changePage(delta) {
	current_page += delta;
	await updateResults();

	if (current_page == 1) {
		for (button of document.querySelectorAll("a[name='previouspage']")) {
			button.classList.add("disabled");
		}
	} else {
		for (button of document.querySelectorAll("a[name='previouspage']")) {
			button.classList.remove("disabled");
		}

	}
	if (current_page >= page_count) {
		for (button of document.querySelectorAll("a[name='nextpage']")) {
			button.classList.add("disabled");
		}
	} else {
		for (button of document.querySelectorAll("a[name='nextpage']")) {
			button.classList.remove("disabled");
		}

	}
}
changePage(0);
