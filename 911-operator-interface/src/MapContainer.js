import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';

const MapContainer = (props) => {
  
  const mapStyles = {        
    height: "50vh",
    width: "50%"};
  
  const defaultCenter = {
    lat: props.lat, lng: props.lng
  }
  
  return (
     <LoadScript googleMapsApiKey='AIzaSyBHDIhLweDpPRPyiQt2U62EhnT1bSe5c6c'>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={13}
          center={defaultCenter}
        />
     </LoadScript>
  )
}

export default MapContainer;