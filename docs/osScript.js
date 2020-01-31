let stationJson = {
    "stations": 
    [
    {'Station_Name': 'Edinburgh Waverley', 'coordinates': [-3.1917618,  55.9519361]}, 
    {"Station_Name": "York", 'coordinates': [-1.0953797,  53.9579841]},
    {'Station_Name': 'Bristol', 'coordinates': [-2.6672406,  51.4720163]},
    {'Station_Name': 'Farringdon', 'coordinates': [-0.1070064,  51.5202109]},
    {'Station_Name': 'Waterloo', 'coordinates': [-0.1144938,  51.5031686]},
    {'Station_Name': 'Southampton', 'coordinates': [-1.4160523,  50.9078191]},
    {'Station_Name': 'Cardiff', 'coordinates': [-3.1811426,  51.4751516]},
    {'Station_Name': 'Newcastle', 'coordinates': [-1.6192629,  54.968503]},
    {'Station_Name': 'Oxford', 'coordinates': [-1.2721341,  51.7534727]},
    {'Station_Name': 'Glasgow', 'coordinates': [-4.2602975,  55.8591148]}
    ]
    }



function stationLocator() {

    console.log(stationJson.stations[0].Station_Name);
    console.log(stationJson.stations[0].coordinates);
}


stationLocator()


