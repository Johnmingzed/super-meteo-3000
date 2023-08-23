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
const ville = "Bordeaux";

// Adresse du fournisseur de météo
const url = 'https://www.prevision-meteo.ch/services/json/';

// Sélection des objets
const appElt = document.getElementsByClassName('app')[0];
const forecastElt = document.getElementById('forecast');
const cityElt = document.getElementById('city');
const maxTempElt = document.getElementById('max_temp');
const minTempElt = document.getElementById('min_temp');
const actualTempElt = document.getElementById('actual_temp');
const nowElt = document.getElementsByClassName('today')[0];
nowElt.addEventListener('click', refreshMeteo);

// Interrogation de l'API
function fetchMeteo(request) {
    fetch(request)
        .then(function (reponse) {
            if (reponse.ok) {
                return reponse.json();
            } else {
                alert('Erreur : ', reponse.status);
            }
        })
        .then(function (data) {
            if (data.errors) {
                let message = document.createElement('p');
                message.innerText = data.errors[0].text;
                message.style.color = 'white';
                message.style.backgroundColor = 'red';
                errorDivElt.appendChild(message);
            } else {
                let meteo = data;
                console.log(meteo);
                displayMeteo(meteo);
            };
        })
        .catch(function (error) {
            console.error(error);
            alert(error);
        })
}

// Affiche les résultats
function displayMeteo(meteo) {
    // Réinitialisation de l'affichage
    forecastElt.innerText = meteo.current_condition.condition.replace("Développement", "").toUpperCase();
    cityElt.innerText = meteo.city_info.name.toUpperCase();
    maxTempElt.innerText = "max." + meteo.fcst_day_0.tmax;
    minTempElt.innerText = "min." + meteo.fcst_day_0.tmin;
    actualTempElt.innerText = meteo.current_condition.tmp + "°";
}

// Rechargement des résultats
function refreshMeteo() {
    console.log('Refresh');
    fadeOut();
    setInterval(()=>{location.reload()}, 700);
}

// Effacement de l'affichage
function fadeOut() {
    appElt.classList.remove("loading");
    let opacity = 1;
    setInterval(()=>{
        console.log(opacity);
        if (opacity > 0) {
            opacity -= 0.05;
            appElt.style.opacity = opacity;
        }

    }, 20);
}

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

fetchMeteo(url + ville);
