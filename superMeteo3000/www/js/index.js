/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

// Définition de la ville
let cityName = "VILLE INCONNUE";

// Stockage de la météo
let meteo;

// Adresse du fournisseur de météo 
// exemple : https://www.prevision-meteo.ch/services/json/lat=45.32lng=8.54
const urlMeteo = 'https://www.prevision-meteo.ch/services/json/';

// Adresse du résolveur d'adresse
// exepmple : https://api-adresse.data.gouv.fr/reverse/?lon=2.37&lat=48.357
const urlCity = 'https://api-adresse.data.gouv.fr/reverse/';

// Variables globales
let Latitude;
let Longitude;
let dayToDisplay = 0;

// Sélection des objets
const appElt = document.getElementsByClassName('app')[0];
const forecastElt = document.getElementById('forecast');
const cityElt = document.getElementById('city');
const maxminTempElt = document.getElementsByClassName('maxmin_temp')[0];
const maxTempElt = document.getElementById('max_temp');
const minTempElt = document.getElementById('min_temp');
const actualTempElt = document.getElementById('actual_temp');
const nowElt = document.getElementsByClassName('today')[0];
const nextElt = document.getElementsByClassName('next_day')[0];
const sun = document.getElementsByClassName('sun')[0];

// Création de l'objet date
const dateElt = document.createElement('h2');

// Initialisation des écouteurs de clics
nowElt.addEventListener('click', refreshMeteo);
nextElt.addEventListener('click', nextForecast);

// Initilaisation des écouteurs de swipes
document.addEventListener('swiped-up', refreshMeteo);
document.addEventListener('swiped-down', nextForecast);

// Réinitialisation du layout
function resetLayout() {
    dateElt.remove();
    maxminTempElt.classList.remove('only');
}

// Interrogation de l'API meteo
async function fetchMeteo(request) {
    await fetch(request)
        .then(function (reponse) {
            if (reponse.ok) {
                return reponse.json();
            } else {
                alert('Erreur : ', reponse.status);
            }
        })
        .then(function (data) {
            if (data.errors) {
                console.error(data.error);
                alert(data.error);
            } else {
                meteo = data;
                console.log(meteo);
                displayMeteo(meteo);
            };
        })
        .catch(function (error) {
            console.error(error);
            alert(error);
        })
    console.log('Météo prête');
}

// Interrogation de l'API ville
async function fetchCity(Longitude, Latitude) {
    try {
        let coordinates = '?lon=' + Longitude.toFixed(2) + '&lat=' + Latitude.toFixed(2);
        let reponse = await fetch(urlCity + coordinates);
        let fetchedCity = await reponse.json();
        cityName = extractCity(fetchedCity);
        return cityName;
    } catch (error) {
        console.error(error);
        alert(error);
    }
}

// Extraction de la ville
function extractCity(JSON) {
    if (JSON.features.length > 0) {
        return JSON.features[0].properties.city;
    } else {
        return 'VILLE INCONNUE';
    }
}

// Préparation de la date pour affichage
function formatDate(date) {
    if (date.length == 10) {
        let day = parseInt(date.slice(0, 2));
        let month = parseInt(date.slice(3, 5));
        let year = parseInt(date.slice(6, 10));
        const fullDate = new Date(year, month - 1, day); // Mois est basé sur 0-index, donc mois - 1
        const options = { month: 'long', day: 'numeric' };
        return fullDate.toLocaleDateString('fr-FR', options);
    } else {
        console.log('Données invalides');
    }
}

// Compte le nombre de jours de prévisions
function forecastNumber(meteo) {
    let count = 0;
    for (let i = 1; meteo[`fcst_day_${i}`] !== undefined; i++) {
        count++;
    }
    return count;
}

// Affiche les résultats
function displayMeteo(meteo) {
    sun.classList.remove('rotate');
    let reference = 0;
    const limit = forecastNumber(meteo);
    if (dayToDisplay == 0) {
        resetLayout();
        forecastElt.innerText = meteo.current_condition.condition.toUpperCase();
        cityElt.innerText = cityName.toUpperCase();
        maxTempElt.innerText = "max." + meteo.fcst_day_0.tmax;
        minTempElt.innerText = "min." + meteo.fcst_day_0.tmin;
        actualTempElt.innerText = meteo.current_condition.tmp + "°";
        nowElt.innerText = 'MAINTENANT';
        nowElt.classList.remove('blink');
        nextElt.innerText = 'DEMAIN';
        // Référence pour le thême des couleurs
        reference = meteo.current_condition.tmp;
    } else if (dayToDisplay > 0) {
        forecastElt.innerText = meteo[`fcst_day_${dayToDisplay}`].condition.replace("Développement", "").toUpperCase();
        cityElt.innerText = cityName.toUpperCase();
        maxTempElt.innerText = "max." + meteo[`fcst_day_${dayToDisplay}`].tmax + "°";
        minTempElt.innerText = "min." + meteo[`fcst_day_${dayToDisplay}`].tmin + "°";
        maxminTempElt.classList.add('only');
        actualTempElt.innerText = "";
        nowElt.innerText = meteo[`fcst_day_${dayToDisplay}`].day_long.toUpperCase();
        // Ajout de la date
        dateElt.textContent = formatDate(meteo[`fcst_day_${dayToDisplay}`].date).toUpperCase();
        nowElt.after(dateElt);
        nextElt.innerText = 'LE LENDEMAIN';
        // Référence pour le thême des couleurs
        reference = meteo[`fcst_day_${dayToDisplay}`].tmax;
    }
    dayToDisplay += 1;
    if (dayToDisplay > limit) {
        dayToDisplay = 0;
        nextElt.innerHTML = 'MAINTENANT';
        console.log('Fin des prévisions');
    }
    setTheme(reference);
}

// Définition des couleurs en fonction de la température
function setTheme(reference) {
    const horizon = document.getElementById('horizon');
    const sky = document.getElementById('sky');
    const ground = document.getElementsByClassName('background')[0];
    // Situation de canicule
    if (reference > 35) {
        horizon.style.borderTopColor = 'var(--color-sky)';
        sky.style.borderTopColor = 'var(--color-sky)';
        ground.style.backgroundColor = 'var(--color-sand)';
        sun.classList.add('radiate');
    // Temps clair
    } else {
        horizon.style.borderTopColor = 'var(--color-clearsky)';
        sky.style.borderTopColor = 'var(--color-clearsky)';
        ground.style.backgroundColor = 'var(--color-grass)';
        sun.classList.remove('radiate');
    }
}

// Rechargement des résultats
async function refreshMeteo() {
    console.log('Refresh');
    dayToDisplay = 0;
    dateElt.innerText = "";
    nowElt.classList.add('blink');
    nowElt.innerText = "RECHERCHE SIGNAL GPS";
    sun.classList.add('rotate');
    forecastElt.innerHTML = "&nbsp;";
    cityElt.innerHTML = "&nbsp;";
    maxTempElt.innerHTML = "&nbsp;";
    minTempElt.innerHTML = "&nbsp;";
    actualTempElt.innerHTML = "&nbsp;";
    nextElt.innerHTML = "&nbsp;";
    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
}

// Affichage du jour suivant
async function nextForecast() {
    console.log('Next Day');
    await transition('fadeout');
    displayMeteo(meteo);
    await transition('fadein');
}

// Fade de l'affichage
async function transition(param) {
    return new Promise(resolve => {
        if (param == 'fadeout') {
            appElt.classList.remove("loading");
            let opacity = 1;
            sun.style.scale = 1;
            const interval = setInterval(() => {
                if (opacity > 0) {
                    opacity -= 0.05;
                    appElt.style.opacity = opacity;
                    sun.style.scale -= 0.05;
                } else {
                    clearInterval(interval);
                    // Résolution de la promesse à la fin de la transition
                    sun.style.scale = 0;
                    appElt.style.opacity = 0;
                    resolve();
                }
            }, 20);
        }
        if (param == 'fadein') {
            appElt.classList.add("loading");
            let opacity = 0;
            sun.style.scale = 0;
            const interval = setInterval(() => {
                if (opacity < 1) {
                    opacity += 0.05;
                    appElt.style.opacity = opacity;
                    sun.style.scale = parseFloat(sun.style.scale) + 0.05;
                } else {
                    clearInterval(interval);
                    // Résolution de la promesse à la fin de la transition
                    sun.style.scale = 1;
                    appElt.style.opacity = 1;
                    resolve();
                }
            }, 20);
        }
    })
}

// Récupération des coordonnées GPS
function getCoordinates(position) {
    Latitude = position.coords.latitude;
    Longitude = position.coords.longitude;
}

// onSuccess Callback
// This method accepts a Position object, which contains the
// current GPS coordinates
//
var geolocationSuccess = async function (position) {
    console.log(position);
    // Interrogation de l'API météo et affiche le résultat
    getCoordinates(position);
    cityName = await fetchCity(Longitude, Latitude);
    console.log(Latitude, Longitude, cityName);
    // Transition fadeout
    await transition('fadeout');
    resetLayout();
    // Récupération de la météo
    await fetchMeteo(urlMeteo + 'lat=' + Latitude.toFixed(2) + 'lng=' + Longitude.toFixed(2));
    // Transition fadein
    await transition('fadein');
};

// onError Callback receives a PositionError object
//
function geolocationError(error) {
    alert('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
}

// Point d'entrée du programme
function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    /* console.log('Running cordova-' + cordova.platformId + '@' + cordova.version); */
    // Recherhe du signal GPS (asyncrhone)
    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
}

// Lancement forcé du programme
onDeviceReady();