import os
import requests

# Liste des noms de fichiers d'images à télécharger
liste_noms_fichiers = ["Ensoleillé", "Nuit claire",
                        "Ciel voilé",
                        "Nuit légèrement voilée",
                        "Faibles passages nuageux",
                        "Nuit bien dégagée",
                        "Brouillard",
                        "Stratus",
                        "Stratus se dissipant",
                        "Nuit claire et stratus",
                        "Eclaircies",
                        "Nuit nuageuse",
                        "Faiblement nuageux",
                        "Fortement nuageux",
                        "Averses de pluie faible",
                        "Nuit avec averses",
                        "Averses de pluie modérée",
                        "Averses de pluie forte",
                        "Couvert avec averses",
                        "Pluie faible",
                        "Pluie forte",
                        "Pluie modérée",
                        "Développement nuageux",
                        "Nuit avec développement nuageux",
                        "Faiblement orageux",
                        "Nuit faiblement orageuse",
                        "Orage modéré",
                        "Fortement orageux",
                        "Averses de neige faible",
                        "Nuit avec averses de neige faible",
                        "Neige faible",
                        "Neige modérée",
                        "Neige forte",
                        "Pluie et neige mêlée faible",
                        "Pluie et neige mêlée modérée",
                        "Pluie et neige mêlée forte"]

# URL de base où se trouvent les images
base_url = "https://prevision-meteo.ch/style/images/icon/"

# Dossier de destination pour enregistrer les images téléchargées
dossier_destination = "./img/"

# Créer le dossier de destination s'il n'existe pas
if not os.path.exists(dossier_destination):
    os.makedirs(dossier_destination)

# Fonction pour télécharger une image à partir de son nom de fichier


def telecharger_image(nom_fichier):
    nom_fichier = nom_fichier + "-big.png"
    url_image = base_url + nom_fichier
    response = requests.get(url_image)
    if response.status_code == 200:
        chemin_destination = os.path.join(dossier_destination, nom_fichier)
        with open(chemin_destination, "wb") as f:
            f.write(response.content)
        print(f"{nom_fichier} téléchargé avec succès.")
    else:
        print(
            f"Échec du téléchargement de {nom_fichier}. Code d'état : {response.status_code}")


# Télécharger toutes les images de la liste
for nom_fichier in liste_noms_fichiers:
    file = nom_fichier.lower()
    replacements = {" ": "-", "é": "e", "ê": "e", "è": "e"}

    for old, new in replacements.items():
        file = file.replace(old, new)

    telecharger_image(file)
