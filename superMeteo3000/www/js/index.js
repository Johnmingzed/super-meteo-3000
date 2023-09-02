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
const testCity = 'Strasbourg';

// Mode développement compatible avec Live Server
const DEV = false;

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
const horizonElt = document.getElementById('horizon');
const skyElt = document.getElementById('sky');
const starsElt = document.getElementById('stars');
const backgroundElt = document.getElementsByClassName('background')[0];
const rainElt = document.getElementById('rain');

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
    actualSize = (horizonElt.clientHeight - horizonElt.clientWidth) / 2;
    horizonElt.style.transitionDuration = "0ms";
    clouds.style.transitionDuration = "0ms";
}

function handleTouchEnd(e) {
    horizonElt.style.setProperty('--horizon-offset', '0px');
    horizonElt.style.transitionDuration = "250ms";
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
    horizonElt.style.setProperty('--horizon-offset', translateValue + 'px');
    clouds.style.translate = "0 " + (0 - translateValue / 2) + "px";
}

// Réinitialisation du layout
function resetLayout() {
    dateElt.remove();
    nowElt.remove();
    maxminTempElt.classList.remove('only');
    infosElt.innerText = "";
    clouds.style.setProperty('display', 'none');
    skyElt.style.setProperty('--opacity', 'var(--high-cloud)');
    rainElt.innerHTML = "";
    document.documentElement.style.setProperty('--cloud-color', '#def');
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

// Calcule la valeur moyenne d'une propriété sur la journée
function average(forecast_day, property) {
    let average = 0;
    let count = 0;
    for (let hour = 0; hour < 24; hour++) {
        average += parseFloat(forecast_day.hourly_data[`${hour}H00`][`${property}`]);
        count++;
    }
    const result = Math.trunc(average / count);
    console.log(`Moyenne de ${property} sur la journée : ${result}`);
    return result;
}

// Calcule la valeur totale d'une propriété sur la journée
function cumulative(forecast_day, property) {
    let total = 0;
    for (let hour = 0; hour < 24; hour++) {
        total += parseFloat(forecast_day.hourly_data[`${hour}H00`][`${property}`]);
    }
    const result = total.toFixed(2);
    console.log(`Total de ${property} sur la journée : ${result}`);
    return parseFloat(result);
}

// Affiche les résultats
function displayMeteo(meteo) {
    sun.classList.remove('rotate');
    let reference = 0;
    let cloudCoverage = null;
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
        const hour = meteo.current_condition.hour.replace(":", "H");
        cloudCoverage = [meteo[`fcst_day_${dayToDisplay}`], hour];
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
        cloudCoverage = [meteo[`fcst_day_${dayToDisplay}`], null];
        // Récupération de la vitesse du vent
        // calculer la moyenne sur la journée
        windSpeed = meteo[`fcst_day_${dayToDisplay}`].hourly_data['14H00'].WNDSPD10m;
        windSpeed = average(meteo[`fcst_day_${dayToDisplay}`], 'WNDSPD10m');
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
    setClouds(cloudCoverage);
    setRain(cloudCoverage);
    setTheme(reference);
    setNight(night);
}

// Définition des couleurs en fonction de la température
function setTheme(reference) {
    // Situation de canicule
    if (reference > 35) {
        skyElt.style.setProperty('--color', 'var(--color-hotsky)');
        horizonElt.style.setProperty('--color', 'var(--color-sand)');
        sun.classList.add('radiate');
        // Temps clair
    } else {
        skyElt.style.setProperty('--color', 'var(--color-clearsky)');
        horizonElt.style.setProperty('--color', 'var(--color-grass)');
        sun.classList.remove('radiate');
    }
}

// Réglage de la couverture nuageuse
function setClouds(array) {
    let meteo = array[0];
    let hour = array[1];
    let highClouds = null;
    let mediumClouds = null;
    let lowClouds = null;
    if (hour) {
        hour = parseInt(hour) + "H00";
        highClouds = parseInt(meteo.hourly_data[hour].HCDC);
        mediumClouds = parseInt(meteo.hourly_data[hour].MCDC);
        lowClouds = parseInt(meteo.hourly_data[hour].LCDC);
    } else {
        highClouds = parseInt(average(meteo, 'HCDC'));
        mediumClouds = parseInt(average(meteo, 'MCDC'));
        lowClouds = parseInt(average(meteo, 'LCDC'));
    }
    const coverage = Math.trunc((highClouds + mediumClouds + lowClouds) / 3);
    const density = Math.trunc(100 - (mediumClouds + lowClouds) / 2);
    document.documentElement.style.setProperty('--high-cloud', highClouds / 100);
    // Opacité des nuages
    document.documentElement.style.setProperty('--cloud-coverage', mediumClouds / 100);
    // Densité des nuages
    document.documentElement.style.setProperty('--cloud-space', ((100 - density) * 0.12 + 0.5) + "rem");
    document.documentElement.style.setProperty('--cloud-size', (density * 0.07 + 3) + "rem");
}

// Réglage de la pluie
function setRain(array) {
    let meteo = array[0];
    let hour = array[1];
    let rain = null;
    if (hour) {
        hour = parseInt(hour) + "H00";
        rain = meteo.hourly_data[hour].APCPsfc;
        console.log("Pluie dans l'heure :", rain);
    } else {
        rain = parseFloat(cumulative(meteo, 'APCPsfc'));
        console.log("Total de pluie sur la journée :", rain);
    }
    const frame = document.createElement('div');
    frame.classList.add('rain');
    if (rain) {
        rainElt.appendChild(frame);
        makeItRain(frame, parseFloat(rain + 0.1) * 50);
        const cloudsForRain = {
            "hourly_data": {
                "0H00": {
                    "HCDC": "50.00",
                    "MCDC": "90.00",
                    "LCDC": "50.00"
                }}};
        setClouds([cloudsForRain, "00:00"]);
        document.documentElement.style.setProperty('--cloud-color', '#bbc')
    }
}

// Création de la pluie
function makeItRain(frame, number) {
    frame.innerHTML = "";
    const durationValue = getComputedStyle(
        document.documentElement
    ).getPropertyValue("--drop-duration");
    let dropNumber = 0;
    const offset = 100 / (number + 1);
    while (dropNumber < number) {
        const randomDelay = Math.random() * parseFloat(durationValue);
        const randomVariation = parseFloat(durationValue) + Math.random() / 2;
        const drop = document.createElement("drop");

        drop.style.setProperty("left", offset * (1 + dropNumber) + "%");
        drop.style.setProperty("animation-delay", randomDelay.toFixed(2) + "s");
        drop.style.setProperty(
            "animation-duration",
            randomVariation.toFixed(2) + "s"
        );

        frame.appendChild(drop);

        dropNumber++;
    }
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
    if (now <= sunrise || now >= sunset) {
        console.log('Il fait nuit');
    }
    return (now <= sunrise || now >= sunset) || DEBUG;
}

// Affichage de la nuit
function setNight(bool = false) {
    if (bool) {
        // Il fait nuit
        horizonElt.classList.add('night');
        starsElt.style.display = 'block';
        sun.style.backgroundColor = '#abc';
        skyElt.style.setProperty('--color', 'var(--color-night)');
        skyElt.style.setProperty('--opacity', 'calc(var(--high-cloud)/4)');
        backgroundElt.style.setProperty('--atmosphere', 'var(--color-night)');
    } else {
        // Il fait jour
        horizonElt.classList.remove('night');
        starsElt.style.display = 'none';
        sun.style.backgroundColor = 'var(--color-sun)';
        backgroundElt.style.setProperty('--atmosphere', 'rgba(255, 255, 255, 0.5)');
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
    if (DEBUG) {
        cityName = testCity;
    } else {
        cityName = await fetchCity(Longitude, Latitude);
    }
    console.log(Latitude, Longitude, cityName);
    // Transition fadeout
    await transition('fadeout');
    resetLayout();
    // Récupération de la météo
    await fetchMeteo(urlMeteo + cityName);
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