// Register a listener for the DOMContentLoaded event. This is triggered when the HTML is loaded and the DOM is constructed.
// We are doing this because the script is loaded in the head of the document, so the DOM is not yet constructed when the script is executed.
import config from "./config.js";

document.addEventListener("DOMContentLoaded", (_event) => {
    // todo: Add code here that updates the HTML, registers event listeners, calls HTTP endpoints, etc.

    function addressAutocomplete(containerElement, callback, options) {
        var inputElement = document.createElement("input");
        var inputCity = "";
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("placeholder", options.placeholder);
        containerElement.appendChild(inputElement);

        var favoriteList = document.querySelector(".favorite-cities");
        var noneText = document.querySelector(".none");

        function verifyEmpty() {
            if (favoriteList.querySelectorAll(".city").length === 0) {
                noneText.style.display = "block";
                favoriteList.style.display = "none";
            }
            else {
                noneText.style.display = "none";
                favoriteList.style.display = "flex";
            }
        }

        verifyEmpty();

        var favoriteButton = document.createElement("i");
        favoriteButton.classList.add("fa", "fa-heart", "search-heart-style");
        favoriteButton.id = "search-heart";

        var clearButton = document.createElement("div");
        clearButton.classList.add("clear-button");
        addIcon(clearButton);
        clearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            inputElement.value = "";
            callback(null);
            clearButton.classList.remove("visible");
            favoriteButton.classList.remove("visible");
            closeDropDownList();
        });

        favoriteButton.addEventListener("click", function () {
            verifyEmpty();
            var favoriteCitiesList = favoriteList.querySelectorAll(".city");
            if (favoriteButton.classList.contains("list-heart")) {
                favoriteButton.classList.remove("list-heart");
                favoriteCitiesList.forEach(element => {
                    if (element.querySelector(".city-title").textContent.trim() === inputElement.value) {
                        element.remove();
                        verifyEmpty();
                    }
                });
                return;
            }
            favoriteButton.classList.add("list-heart");
            var newCity = document.createElement("div");
            newCity.classList.add("city");
            var inputForFetch = inputCity;
            var newCityTitle = document.createElement("div");
            newCityTitle.classList.add("city-title");
            newCityTitle.textContent = inputElement.value;
            newCityTitle.addEventListener("click", function (e) {
                spinner.removeAttribute("hidden");
                weatherInfo.style.display = "none";
                console.log(inputForFetch);
                fetchResults(inputForFetch);
            });
            var removeFromFavoriteButton = document.createElement("i");
            removeFromFavoriteButton.classList.add("fa", "fa-heart", "visible", "list-heart");
            removeFromFavoriteButton.id = "list-heart";
            removeFromFavoriteButton.addEventListener("click", function (e) {
                if (inputElement.value === newCityTitle.textContent) {
                    favoriteButton.classList.remove("list-heart");
                }
                favoriteList.removeChild(newCity);
                verifyEmpty();
            });

            newCity.appendChild(newCityTitle);
            newCity.appendChild(removeFromFavoriteButton);

            favoriteList.appendChild(newCity);
            verifyEmpty();
        });

        function storeListState(list) {
            var listState = {
                outerHTML: list.outerHTML,
                eventListeners: getEventListeners(list)
            };
        }

        containerElement.appendChild(favoriteButton);
        containerElement.appendChild(clearButton);

        var currentItems;
        var currentPromiseReject;
        var focusedItemIndex;

        inputElement.addEventListener("input", function (e) {
            var currentValue = this.value;

            closeDropDownList();

            if (currentPromiseReject) {
                currentPromiseReject({
                    canceled: true,
                });
            }

            if (!currentValue) {
                clearButton.classList.remove("visible");
                favoriteButton.classList.remove("visible");
                return false;
            }

            clearButton.classList.add("visible");

            var promise = new Promise((resolve, reject) => {
                currentPromiseReject = reject;

                var apiKey = config.GEOAPIFY_API_KEY;
                var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
                    currentValue
                )}&limit=5&apiKey=${apiKey}`;

                if (options.type) {
                    url += `&type=${options.type}`;
                }

                fetch(url).then((response) => {
                    if (response.ok) {
                        response.json().then((data) => resolve(data));
                    } else {
                        response.json().then((data) => reject(data));
                    }
                });
            });

            promise.then(
                (data) => {
                    currentItems = data.features;

                    var autocompleteItemsElement = document.createElement("div");
                    autocompleteItemsElement.setAttribute("class", "autocomplete-items");
                    containerElement.appendChild(autocompleteItemsElement);

                    data.features.forEach((feature, index) => {
                        var itemElement = document.createElement("DIV");
                        itemElement.innerHTML = feature.properties.formatted;

                        itemElement.addEventListener("click", function (e) {
                            favoriteButton.classList.add("visible");
                            favoriteButton.classList.remove("list-heart");
                            var listOfFavoriteCities =
                                favoriteList.querySelectorAll(".city-title");
                            inputElement.value = currentItems[index].properties.formatted;
                            inputCity = currentItems[index].properties.city;
                            listOfFavoriteCities.forEach((element) => {
                                console.log(element.textContent.trim() + " " + inputElement.value);
                                if (element.textContent.trim() === inputElement.value) {
                                    favoriteButton.classList.add("list-heart");
                                    return;
                                }
                            });

                            callback(currentItems[index]);

                            closeDropDownList();
                        });

                        autocompleteItemsElement.appendChild(itemElement);
                    });
                },
                (err) => {
                    if (!err.canceled) {
                        console.log(err);
                    }
                }
            );
        });

        function closeDropDownList() {
            var autocompleteItemsElement = containerElement.querySelector(
                ".autocomplete-items"
            );
            if (autocompleteItemsElement) {
                containerElement.removeChild(autocompleteItemsElement);
            }

            focusedItemIndex = -1;
        }

        function addIcon(buttonElement) {
            var svgElement = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            svgElement.setAttribute("viewBox", "0 0 24 24");
            svgElement.setAttribute("height", "24");

            var iconElement = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            iconElement.setAttribute(
                "d",
                "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            );
            iconElement.setAttribute("fill", "currentColor");
            svgElement.appendChild(iconElement);
            buttonElement.appendChild(svgElement);
        }

        document.addEventListener("click", function (e) {
            if (e.target !== inputElement) {
                closeDropDownList();
            } else if (!containerElement.querySelector(".autocomplete-items")) {
                var event = document.createEvent("Event");
                event.initEvent("input", true, true);
                inputElement.dispatchEvent(event);
            }
        });
    }

    const spinner = document.getElementById("spinner");
    const weatherInfo = document.querySelector(".weather-info");

    addressAutocomplete(
        document.getElementById("search-box"),
        (data) => {
            console.log("Selected city: ");
            console.log(data);
            if (data !== null) {
                spinner.removeAttribute("hidden");
                weatherInfo.style.display = "none";
                fetchResults(data.properties.city);
            }
        },
        {
            placeholder: "Search for cities",
        }
    );

    const currentContainer = document.querySelector(".current");
    const locationField = document.querySelector(".location");
    const currentTemp = document.querySelector(".temperature");
    const currentWeatherDesc = document.querySelector(".weather-desc");
    const pressure = document.querySelector(".pressure .value");
    const humidity = document.querySelector(".humidity .value");
    const windSpeed = document.querySelector(".wind .value");
    const currentDate = document.querySelector(".date-day");
    const currentDay = document.querySelector(".day-name");
    const daysList = document.querySelector(".days-list");

    const weatherAPIKey = config.OPENWEATHERMAP_API_KEY;

    const fetchResults = async (city) => {
        let url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherAPIKey}&units=metric`;
        const res = await fetch(url);
        const data = await res.json();
        setTimeout(function () {
            spinner.setAttribute("hidden", "");
            weatherInfo.style.display = "flex";
            console.log(data);
            findBackgroundImage(city);
            updateWeatherData(data);
        }, 1500);
    };

    const updateWeatherData = (data) => {
        locationField.innerHTML = data.city.name + ", " + data.city.country;
        currentTemp.innerHTML = Math.round(data.list[0].main.temp) + " °C";
        currentWeatherDesc.innerHTML = data.list[0].weather[0].main;
        windSpeed.innerHTML = data.list[0].wind.speed + " km/h";
        humidity.innerHTML = data.list[0].main.humidity + " %";
        pressure.innerHTML = data.list[0].main.pressure + " hPa";
        const formattedDate = data.list[0].dt_txt.split(" ")[0].split("-");
        currentDate.innerHTML =
            formattedDate[2] +
            " " +
            getMonthName(formattedDate[1]) +
            " " +
            formattedDate[0];
        currentDay.innerHTML = getDayName(formattedDate.join("-"));

        const days = daysList.querySelectorAll("li");
        days.forEach(function (element, index) {
            let iconId;

            const dayIcon = element.querySelector(".day-weather-icon");
            const dayName = element.querySelector(".day-name");
            const dayTemp = element.querySelector(".day-temp");
            if (index === 0) {
                iconId = data.list[0].weather[0].icon;
                dayTemp.innerHTML = Math.round(data.list[0].main.temp) + " °C";
                dayName.innerHTML = getDayNameAbr(formattedDate.join("-"));
            } else {
                const newDate = formattedDate;
                newDate[2]++;
                let indexOfAverage = data.list.findIndex(
                    (interval) => interval.dt_txt === newDate.join("-") + " 12:00:00"
                );
                if (indexOfAverage === -1) {
                    indexOfAverage = 39;
                }
                iconId = data.list[indexOfAverage].weather[0].icon;
                dayTemp.innerHTML =
                    Math.round(data.list[indexOfAverage].main.temp) + " °C";
                dayName.innerHTML = getDayNameAbr(newDate.join("-"));
            }
            const iconUrl = `http://openweathermap.org/img/wn/${iconId}.png?appid=${weatherAPIKey}`;
            dayIcon.src = iconUrl;
        });
    };

    const apiKeyPexeles = config.PEXELS_API_KEY;

    const findBackgroundImage = (input) => {
        console.log(input);
        const apiURL = `https://api.pexels.com/v1/search?query=${input}&per_page=10`;
        fetchImages(apiURL).then((data) => {
            currentContainer.style.backgroundImage = `url(${data.photos[0].src.large})`;
            console.log(data);
        });
    };

    const fetchImages = async (apiURL) => {
        try {
            const resp = await fetch(apiURL, {
                headers: { Authorization: apiKeyPexeles },
            });

            if (!resp.ok) {
                throw new Error(`status=${resp.status}`);
            }

            return await resp.json();
        } catch (error) {
            console.error("Fetch error", error);
        }
    };
});

function onClickFavorite(element) {
    var city = element.textContent || element.innerText;
    console.log(city);
    fetchResultsFunction(city);
}

function toggleSearchBox() {
    const button = document.querySelector(".icon-button");
    const searchBox = document.querySelector(".search-box input");
    const favorites = document.querySelector(".favorites");

    button.style.display = "none";
    searchBox.style.display = "block";

    requestAnimationFrame(function () {
        searchBox.style.width = "40vw";
    });
}

window.toggleSearchBox = toggleSearchBox;

function getMonthName(monthNumber) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
    ];

    if (monthNumber >= 1 && monthNumber <= 12) {
        return months[monthNumber - 1];
    } else {
        return "Invalid month number";
    }
}

function getDayName(dateString) {
    const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const date = new Date(dateString);

    if (!isNaN(date)) {
        const dayIndex = date.getDay();
        return daysOfWeek[dayIndex];
    } else {
        return "Invalid date";
    }
}

function getDayNameAbr(dateString) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const date = new Date(dateString);

    if (!isNaN(date)) {
        const dayIndex = date.getDay();
        return daysOfWeek[dayIndex];
    } else {
        return "Invalid date";
    }
}
