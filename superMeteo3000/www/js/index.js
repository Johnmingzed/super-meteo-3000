import { datasForTest } from "./datasForTest.js";

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

// Données de debugage
const DEBUG = false;

// Mode développement compatible avec Live Server
const DEV = true;

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
let windSpeed = 0;

// Variables de suivi de la souris
var yDown = null;
var yDiff = null;
var actualSize = null;

// Sélection des éléments textuels
const appElt = document.getElementsByClassName('app')[0];
const forecastElt = document.getElementById('forecast');
const cityElt = document.getElementById('city');
const maxminTempElt = document.getElementsByClassName('maxmin_temp')[0];
const maxTempElt = document.getElementById('max_temp');
const minTempElt = document.getElementById('min_temp');
const actualTempElt = document.getElementById('actual_temp');
const dayElt = document.getElementsByClassName('today')[0];
const infosElt = document.getElementsByClassName('infos')[0];
const nextElt = document.getElementsByClassName('next_day')[0];
const sun = document.getElementsByClassName('sun')[0];
const topTextElt = document.getElementById('top_text');
const bottomTextElt = document.getElementById('bottom_text');

// Sélection des éléments graphiques
const horizon = document.getElementById('horizon');
const sky = document.getElementById('sky');
const stars = document.getElementById('stars');
const background = document.getElementsByClassName('background')[0];

// Création des éléments à afficher en plus
const clouds = document.getElementById('clouds');
const dateElt = document.createElement('h2');
const nowElt = document.createElement('h3');

// Initialisation des écouteurs de clics
topTextElt.addEventListener('click', refreshMeteo);
bottomTextElt.addEventListener('click', nextForecast);

// Initilaisation des écouteurs de swipes
document.addEventListener('swiped-down', refreshMeteo);
document.addEventListener('swiped-up', nextForecast);
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchend', handleTouchEnd);
document.addEventListener('touchmove', handleTouchMove);

// Fonctions permettant le déplacement de l'arrière plan
function handleTouchStart(e) {
    yDown = e.touches[0].clientY;
    actualSize = (horizon.clientHeight - horizon.clientWidth) / 2;
    horizon.style.transitionDuration = "0ms";
    clouds.style.transitionDuration = "0ms";
}

function handleTouchEnd(e) {
    horizon.style.setProperty('--horizon-offset', '0px');
    horizon.style.transitionDuration = "250ms";
    clouds.style.translate = "0 0";
    clouds.style.transitionDuration = "250ms";
}

function handleTouchMove(e) {
    let yUp = e.touches[0].clientY;
    yDiff = yDown - yUp;
    let translateValue = yDiff;
    let newSize = actualSize - yDiff;
    if (newSize >= actualSize * 2) {
        newSize = actualSize * 2;
        translateValue = -actualSize;
    } else if (newSize < 0) {
        newSize = 0;
        translateValue = actualSize;
    }
    horizon.style.setProperty('--horizon-offset', translateValue + 'px');
    clouds.style.translate = "0 " + (0 - translateValue / 2) + "px";
}

// Réinitialisation du layout
function resetLayout() {
    dateElt.remove();
    nowElt.remove();
    maxminTempElt.classList.remove('only');
    infosElt.innerText = "";
    clouds.style.setProperty('display', 'none');
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
function formatDate(date, option = null) {
    if (date.length == 10) {
        let day = parseInt(date.slice(0, 2));
        let month = parseInt(date.slice(3, 5));
        let year = parseInt(date.slice(6, 10));
        const fullDate = new Date(year, month - 1, day); // Mois est basé sur 0-index, donc mois - 1
        const options = { month: 'long', day: 'numeric' };
        if (option == "numeric") {
            return fullDate;
        } else {
            return fullDate.toLocaleDateString('fr-FR', options);
        }
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
    let cloudVoverage = null;
    let night = false;
    const limit = forecastNumber(meteo);
    resetLayout();

    // Ajout des nouveaux éléments à afficher
    dayElt.before(nowElt);
    dayElt.after(dateElt);
    nextElt.before(infosElt);
    infosElt.innerText = "VOIR LES PRÉVISIONS POUR";
    clouds.style.setProperty('display', 'block');

    // Météo du jour
    if (dayToDisplay == 0) {
        forecastElt.innerText = meteo.current_condition.condition.toUpperCase();
        cityElt.innerText = cityName.toUpperCase();
        maxTempElt.innerText = "max." + meteo.fcst_day_0.tmax;
        minTempElt.innerText = "min." + meteo.fcst_day_0.tmin;
        actualTempElt.innerText = meteo.current_condition.tmp + "°";
        // Indication de la mention "maintenant"
        nowElt.innerText = 'MAINTENANT';
        nowElt.classList.add('blink');
        // Indication du jour de la semaine
        dayElt.classList.remove('blink');
        dayElt.innerText = meteo[`fcst_day_${dayToDisplay}`].day_long.toUpperCase();
        // Indication de la date
        dateElt.textContent = formatDate(meteo[`fcst_day_${dayToDisplay}`].date).toUpperCase();
        // Indication concernant les prévision affichables
        nextElt.innerText = 'DEMAIN';
        // Référence pour le thême des couleurs
        reference = meteo.current_condition.tmp;
        // Référence pour la couverture nuageuse
        cloudVoverage = meteo[`fcst_day_${dayToDisplay}`].hourly_data['14H00'];
        // Récupération de la vitesse du vent
        windSpeed = meteo.current_condition.wnd_spd;
        // Test de l'affichage nocturne
        night = isNight(meteo);

        // Prévision à J+X
    } else if (dayToDisplay > 0) {
        forecastElt.innerText = cityName.toUpperCase();
        cityElt.innerText = meteo[`fcst_day_${dayToDisplay}`].condition.toUpperCase();
        maxTempElt.innerText = "max." + meteo[`fcst_day_${dayToDisplay}`].tmax + "°";
        minTempElt.innerText = "min." + meteo[`fcst_day_${dayToDisplay}`].tmin + "°";
        maxminTempElt.classList.add('only');
        // Effacement des éléments inutils
        actualTempElt.innerText = "";
        nowElt.innerText = "";
        // Indication du jour de la semaine
        dayElt.innerText = meteo[`fcst_day_${dayToDisplay}`].day_long.toUpperCase();
        // Ajout de la date
        dateElt.textContent = formatDate(meteo[`fcst_day_${dayToDisplay}`].date).toUpperCase();
        nextElt.innerText = 'LE LENDEMAIN';
        // Référence pour le thême des couleurs
        reference = meteo[`fcst_day_${dayToDisplay}`].tmax;
        // Référence pour la couverture nuageuse
        cloudVoverage = meteo[`fcst_day_${dayToDisplay}`].hourly_data['14H00'];
        // Récupération de la vitesse du vent
        windSpeed = meteo[`fcst_day_${dayToDisplay}`].hourly_data['14H00'].WNDSPD10m;
    }

    // Préparations de la sélection des prochaines prévisions
    dayToDisplay += 1;

    // Vitesse du vent
    document.documentElement.style.setProperty('--wind-speed', windSpeed);

    // Retour à la météo du jour
    if (dayToDisplay > limit) {
        dayToDisplay = 0;
        nextElt.innerHTML = 'MAINTENANT';
        console.log('Fin des prévisions');
    }

    setFontSizes(forecastElt.innerText, cityElt.innerText);
    setClouds(cloudVoverage);
    setTheme(reference);
    setNight(night);
}

// Définition des couleurs en fonction de la température
function setTheme(reference) {
    // Situation de canicule
    if (reference > 35) {
        sky.style.setProperty('--color', 'var(--color-hotsky)');
        horizon.style.setProperty('--color', 'var(--color-sand)');
        sun.classList.add('radiate');
        // Temps clair
    } else {
        sky.style.setProperty('--color', 'var(--color-clearsky)');
        horizon.style.setProperty('--color', 'var(--color-grass)');
        sun.classList.remove('radiate');
    }
}

// Réglage de la couverture nuageuse
function setClouds(meteo) {
    const highClouds = parseInt(meteo.HCDC);
    const mediumClouds = parseInt(meteo.MCDC);
    const lowClouds = parseInt(meteo.LCDC);
    const coverage = Math.trunc((highClouds + mediumClouds + lowClouds) / 3);
    document.documentElement.style.setProperty('--cloud-coverage', coverage / 100);
}

// Longueur des noms
function setFontSizes(forecast, city) {
    let forecastFontSize = forecast.length > 16 ? 1.4 : 2;
    let cityFontSize = city.length > 10 ? 2.5 : 4;
    forecastElt.style.fontSize = forecastFontSize + "rem";
    cityElt.style.fontSize = cityFontSize + "rem";
}

// Gestion de la nuit
function isNight(meteo) {
    let now = Date.now();
    let sunrise = new Date().setHours(meteo.city_info.sunrise.slice(0, 2), meteo.city_info.sunrise.slice(3, 5));
    let sunset = new Date().setHours(meteo.city_info.sunset.slice(0, 2), meteo.city_info.sunset.slice(3, 5));
    return (now < sunrise && now > sunset) || DEBUG;
}

// Affichage de la nuit
function setNight(bool = false) {
    if (bool) {
        // Il fait nuit
        horizon.classList.add('night');
        stars.style.display = 'block';
        sun.style.backgroundColor = '#abc';
        sky.style.setProperty('--color', 'var(--color-night)');
        background.style.setProperty('--atmosphere', 'var(--color-night)');
    } else {
        // Il fait jour
        horizon.classList.remove('night');
        stars.style.display = 'none';
        sun.style.backgroundColor = 'var(--color-sun)';
        background.style.setProperty('--atmosphere', 'rgba(255, 255, 255, 0.5)');
    }
}

// Rechargement des résultats
async function refreshMeteo() {
    resetLayout();
    console.log('Refresh');
    dayToDisplay = 0;
    dateElt.innerText = "";
    dayElt.classList.add('blink');
    dayElt.innerText = "RECHERCHE SIGNAL GPS";
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
    if (!DEV) {
        console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    }
    // Recherhe du signal GPS (asyncrhone)
    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
}

/**
 *
 * Lancement forcé du programme pour utilisation avec Live Server
 * penser à éditer le fichier index.html avant la mise en production
 * retirer le 'unsafe-inline' des "Content-Security-Policy"
 * activer la ligne de script cordova.js
 */

if (DEV) {
    onDeviceReady();
}