import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapContainer = (props) => {

  const mapStyles = {
    height: "50vh",
    width: "50%"
  };
  console.log(props);
  const defaultCenter = {
    lat: props.lat, lng: props.lng, police: props.police, hospital: props.hospital, fire: props.fire
  }

  console.log(defaultCenter);

  return (
    <LoadScript googleMapsApiKey='AIzaSyBHDIhLweDpPRPyiQt2U62EhnT1bSe5c6c'>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        center={defaultCenter}
      >
        <Marker label={'C'} position={{ lat: defaultCenter.lat, lng: defaultCenter.lng }} />
        {defaultCenter.police ? <Marker label={'P'} position={{ lat: defaultCenter.police.lat, lng: defaultCenter.police.lng }} /> : ""}
        {defaultCenter.hospital ? <Marker label={'H'} position={{ lat: defaultCenter.hospital.lat, lng: defaultCenter.hospital.lng }} /> : ""}
        {defaultCenter.fire ? <Marker label={'F'} position={{ lat: defaultCenter.fire.lat, lng: defaultCenter.fire.lng }} /> : ""}
      </GoogleMap>
    </LoadScript>
  )
}

export default MapContainer;