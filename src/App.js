import "./App.css";
import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
  // getDetails,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import Geocode from "react-geocode";
import AddressList from "./AddressList";
import AddressDataService from "./services/address.service";

const libraries = ["places"];
const mapContainerStyle = {
  width: "70vw",
  height: "100vh",
};
const center = {
  lat: 6.927079,
  lng: 79.861244,
};
const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  Geocode.setApiKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
  Geocode.setLocationType("ROOFTOP");

  React.useEffect(async () => {
    const addresses = await AddressDataService.getAll();
    console.log("Addresses: ", addresses.data);
    addresses.data.map( (address) => {
      console.log(address.formatted_address);
      setAddresses((addresses) => [...addresses, address.formatted_address]);
    });

  }, [])

  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [addresses, setAddresses] = React.useState([]);
  const [selectedMarkerAddress, setSelectedMarkerAddress] = React.useState([]);

  const onMapClick = React.useCallback(async (event) => {
    console.log(event);
    setMarkers((current) => [
      ...current,
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date(),
      },
    ]);
    const response = await getMarkerAddress(
      event.latLng.lat(),
      event.latLng.lng()
    );
    setAddresses((addresses) => [...addresses, response.address]);
    AddressDataService.create({ addressData: response.reqObj }).then((res) =>
      console.log(res)
    );
  }, []);

  const onMarkerClick = async (marker) => {
    console.log("calling on marker click");
    setSelected(marker);
    const response = await getMarkerAddress(marker.lat, marker.lng);
    console.log("response: ", response);
    setSelectedMarkerAddress(response.address);
  };

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  const getMarkerAddress = async (lat, lng) => {
    console.log("calling");
    let address = "address not found";
    let requestObj = {
      street_number: null,
      route: null,
      political: null,
      locality: null,
      administrative_area_level_2: null,
      administrative_area_level_1: null,
      country: null,
      postal_code: null,
      plus_code: null,
      subpremise: null,
      premise: null,
      formatted_address: null
    };
    await Geocode.fromLatLng(lat, lng).then(
      (response) => {
        console.log("response from getMarkerAddress", response.results[0].address_components);
        response.results[0].address_components.map((address) => {
          console.log("ADD: ", address);
          for( let key in requestObj){
            if(requestObj.hasOwnProperty(key) && key === address.types[0]){
              requestObj[key] = address.long_name;
            }
          }  
        });
        address = response.results[0].formatted_address;
        requestObj.formatted_address = address;
        console.log("request obj", requestObj);
        console.log("adress: ", address);
      },
      (error) => {
        console.error(error);
      }
    );
    return {
      "address": address,
      "reqObj": requestObj
    };
  };

  if (loadError) return "Error Loading maps";
  if (!isLoaded) return "Loading Maps";

  return (
    <div className="App">
      <Search panTo={panTo} />
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => onMarkerClick(marker)}
          />
        ))}
        {selected ? (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }}>
            <div>
              <p>Address :</p>
              <p>{selectedMarkerAddress}</p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
      <AddressList addresses={addresses} />
    </div>
  );
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 6.927079, lng: () => 79.861244 },
      radius: 200 * 1000,
    },
  });

  return (
    <div className="search">
      <Combobox
        onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();
          try {
            const results = await getGeocode({ address });
            console.log("GetGeocode: ", results);
            const { lat, lng } = await getLatLng(results[0]);
            console.log(lat, lng);
            panTo({ lat, lng });
          } catch (error) {
            console.log("error!");
          }
          console.log(address);
        }}
      >
        <ComboboxInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Enter an address"
        />
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}

export default App;
