import React, { useState, Component } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Col,
  Row,
  Progress,
  // Button,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown
} from "reactstrap";
import Widget from "../../components/Widget/Widget.js";
import ApexActivityChart from "./components/ActivityChart.js";

import meal1 from "../../assets/dashboard/meal-1.svg";
import meal2 from "../../assets/dashboard/meal-2.svg";
import meal3 from "../../assets/dashboard/meal-3.svg";
import upgradeImage from "../../assets/dashboard/upgradeImage.svg";
import heartRed from "../../assets/dashboard/heartRed.svg";
import heartTeal from "../../assets/dashboard/heartTeal.svg";
import heartViolet from "../../assets/dashboard/heartViolet.svg";
import heartYellow from "../../assets/dashboard/heartYellow.svg";
import gymIcon from "../../assets/dashboard/gymIcon.svg";
import addressIcon from "../../assets/dashboard/addressIcon.svg";
import therapyIcon from "../../assets/dashboard/therapyIcon.svg";
import emergencyIcon from "../../assets/dashboard/emergencyIcon.svg"
import user from "../../assets/user.svg";
import CamelCase from 'react-camelcase';
import statsPie from "../../assets/dashboard/statsPie.svg";
// import React, { Component } from 'react';

import Button from '@material-ui/core/Button';

import s from "./Dashboard.module.scss";

import axios from 'axios';

import Recorder from 'recorder-js';
// import './App.css';
import MapContainer from './components/MapContainer';

var recorder = null;
var audioStream = null;

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.mic = React.createRef();

    this.accessMic = this.accessMic.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);

    this.stopAccessingMic = this.stopAccessingMic.bind(this);
    this.getTextFromGoogle = this.getTextFromGoogle.bind(this);
    // const [checkboxes, setCheckboxes] = useState([true, false])
  
    // this.meals = [meal1, meal2, meal3];
  }

  state = {

    // Initially, no file is selected
    selectedFile: null,
    transcription: null,
    lat: 37.4275,
    lng: -122.1697,
    raw_ner: null,
    emergency: null,
    isMicActive: false,
    police: null,
    hospital: null,
    fire: null,
    translation: null,
  };

  accessMic() {
    if (!this.state.isMicActive) {
      return;
    }

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    recorder = new Recorder(audioContext);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(this.handleSuccess)
      .catch(err => console.log('Uh oh... unable to get stream...', err));

    setTimeout(() => { this.stopAccessingMic(); this.accessMic() }, 5000);
  }

  handleSuccess(stream) {
    audioStream = stream;

    recorder.init(stream);
    recorder.start();
  }

  getTextFromGoogle(blob) {
    let filename = new Date().toISOString();
    let xhr = new XMLHttpRequest();
    let appObject = this;
    xhr.onload = function (e) {
      if (this.readyState === 4) {
        console.log(e.target.responseText);
        let newTranscription = ""
        if (appObject.state.transcription) {
          newTranscription = appObject.state.transcription + ". " + e.target.responseText;
        } else {
          newTranscription = e.target.responseText;
        }
        appObject.setState({ 'transcription': newTranscription });
        appObject.analyzeTranscription();
      }
    };
    let formData = new FormData();
    const myFile = new File([blob], filename, { type: blob.type });
    formData.append('myFile', myFile, filename);
    formData.append('noPunctuation', true)
    xhr.open('POST', 'http://localhost:5000/transcribe', true);
    xhr.send(formData);
  }

  handleClick() {
    const isMicActive = this.state.isMicActive;

    this.state.isMicActive = !isMicActive;

    if (!isMicActive) {
      this.checkPermissions();
      this.accessMic();
    } else {
      this.stopAccessingMic();
    }
  }

  stopAccessingMic() {
    audioStream && audioStream.getTracks()[0].stop();
    recorder.stop().then(({ blob, buffer }) => {
      this.getTextFromGoogle(blob);
    });
  }

  checkPermissions() {
    navigator.permissions
      .query({ name: 'microphone' })
      .then(permissionObj => {
        console.log('Permission status - ', permissionObj.state);
      })
      .catch(error => {
        console.log('Permission status - Got error :', error);
      });
  }

  analyzeTranscription = () => {
    const formData = new FormData();
    let transcription = this.state.transcription;
    console.log(transcription)
    if (transcription) {
      const transcriptionData = new FormData()
      transcriptionData.append(
        "transcription",
        transcription,
      )
      axios.post('http://localhost:5000/recognize', transcriptionData)
        .then(
          res_ner => {
            this.setState({ raw_ner: res_ner })
            if (this.state.raw_ner) {

              formData.append(
                "location",
                this.state.raw_ner.data.address
              );
              axios.post('http://localhost:5000/coordinates', formData)
                .then(res => {
                  this.setState({ lat: res.data.lat });
                  this.setState({ lng: res.data.lng });
                  formData.append(
                    "lat",
                    this.state.lat
                  )
                  formData.append(
                    "lng",
                    this.state.lng
                  )
                  axios.post('http://localhost:5000/nearest', formData)
                    .then(res_nearest => {
                      this.setState({ hospital: res_nearest.data.hospital });
                      this.setState({ police: res_nearest.data.police });
                      this.setState({ fire: res_nearest.data.fire });

                    });
                });

            }
          }
        )
      const smallTranscription = new FormData()
      smallTranscription.append(
        "transcription",
        transcription.toLowerCase(),
      )
      axios.post('http://localhost:5000/emergency', smallTranscription)
        .then(
          res_emergency => {
            this.setState({ emergency: res_emergency.data.emergency })
          }
        )
      axios.post('http://localhost:5000/translate', transcriptionData)
        .then(res => {
          this.setState({ translation: res.data.text });
        });
    }
  }


  // On file upload (click the upload button)
  onFileUpload = event => {

    this.state.selectedFile = event.target.files[0];
    // Create an object of formData
    const formData = new FormData();

    // Update the formData object
    formData.append(
      "myFile",
      this.state.selectedFile,
      this.state.selectedFile.name
    );

    // Details of the uploaded file
    console.log(this.state.selectedFile);

    // Request made to the backend api
    // Send formData object
    axios.post('http://localhost:5000/transcribe', formData)
      .then(res => {
        this.setState({ transcription: res.data });
        this.analyzeTranscription();
      });
  };

  fileData = () => {

    if (this.state.selectedFile) {
      return (
        <div>
          <h2 className='center'>File Details:</h2>

          <p className='center'>File Name: {this.state.selectedFile.name}</p>


          <p className='center'>File Type: {this.state.selectedFile.type}</p>


          <p className='center'>
            Last Modified:{" "}
            {this.state.selectedFile.lastModifiedDate.toDateString()}
          </p>

        </div>
      );
    } else {
      return (
        <div className='center'>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      );
    }
  };

  getTranscription = () => {

    if (this.state.transcription) {
      return (
        <div>
          <div className='new-line center' style={{ paddingLeft: 2 + "em", whiteSpace: "pre-line", maxHeight: "300px", overflowY: 'scroll'}}>{this.state.transcription.replaceAll(".", ".\n").replaceAll("?", "?\n")}</div>
        </div>
      );
    } else {
      return (
        <div className='center'>
        </div>
      );
    }
  };

  getTranslation = () => {

    if (this.state.translation) {
      return (
        <div>
          <div className='new-line center' style={{ paddingLeft: 2 + "em", whiteSpace: "pre-line", maxHeight: "300px", overflowY: 'scroll'}}>{this.state.translation.replaceAll(".", ".\n").replaceAll("?", "?\n")}</div>
        </div>
      );
    } else {
      return (
        <div className='center'>
        </div>
      );
    }
  };

  getNER = () => {
    if (this.state.raw_ner) {
      return (
        <p>
          {this.state.raw_ner.data.address}
        </p>
      )
    }
  }

  getEmergency = () => {
    if (this.state.emergency) {
      this.state.emergency = this.state.emergency.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
      return (
        <p>
          {this.state.emergency}
        </p>
      )
    }
  }

  getMicButton() {
    return (<div
      id='mic'
      ref={this.mic}
      onClick={this.handleClick}
      className={
        this.state.isMicActive ? 'mic-btn mic-btn-active' : 'mic-btn'
      }
    >
      <Button className="rounded-pill body-3" outline color="dark" variant="contained">Mic Input</Button>
    </div>);
  }


  getMap = () => {
    return (
      <div className='center'>
        <MapContainer className='center' lat={this.state.lat} lng={this.state.lng} isMarkerShown={true} police_lat={this.state.police ? this.state.police.lat : 0} police={this.state.police} hospital={this.state.hospital} fire={this.state.fire} />
      </div>
    )
  }

  render() {

    return (
      <div style={{margin: '1em'}}>
        <div className="headline-2" style={{marginBottom:'0.5em', marginTop:'0.5em'}}>911 Operator Assistant</div>
        <div className='center' style={{marginBottom:'1em'}}>
          <Row>
            <Col/>
            <Col/>
            <Col>
              <div>
              <Button className="rounded-pill mr-3" color="primary" variant="contained" component="label" id='button-margin'>
                Upload File
                <input type="file" hidden onChange={this.onFileUpload} />
              </Button>
              </div>
            </Col>
            <Col>
              {this.getMicButton()}
          </Col>
          <Col/>
          <Col/>
          </Row>
        </div>
        <Row>
          {/* <Row className="gutter mb-4">
            <div className='center'>
              <Button variant="contained" component="label" id='button-margin'>
                Upload File
                <input type="file" hidden onChange={this.onFileUpload} />
              </Button>
              {this.getMicButton()}
            </div>
          </Row> */}
          <Col className="pr-grid-col" xs={12} lg={8}>
            <Row className="gutter mb-4">
              <Col className="mb-4 mb-md-0" xs={12} md={6}>
                <Widget className="">
                  <div className="d-flex justify-content-between widget-p-md">
                    <div className="headline-3 d-flex align-items-center">Transcription</div>
                  </div>
                  {this.getTranscription()}
                </Widget>
              </Col>
              <Col xs={12} md={6}>
                <Widget className="">
                  <div className="d-flex justify-content-between widget-p-md">
                    <div className="headline-3 d-flex align-items-center">Translation</div>
                  </div>
                  {this.getTranslation()}
                </Widget>
              </Col>
            </Row>
            <Row className="gutter mb-4">
              <Col xs={12}>
                <Widget className="widget-p-md">
                  <div className="d-flex flex-wrap align-items-center justify-content-center">
                    <div className="headline-3 d-flex align-items-center" style={{ marginBottom: '1em'}}>Location Visualization</div>
                    <MapContainer   className='widget-p-md center' lat={this.state.lat} lng={this.state.lng} isMarkerShown={true} police_lat={this.state.police ? this.state.police.lat : 0} police={this.state.police} hospital={this.state.hospital} fire={this.state.fire} />
                  </div>
                </Widget>
              </Col>
            </Row>
          </Col>
          <Col className="mt-4 mt-lg-0 pl-grid-col" xs={12} lg={4}>
            <Widget className="widget-p-lg">
              <div className="d-flex">
                <img className={s.image} src={user} alt="..." />
                <div className={s.userInfo}>
                  <p className="headline-3">Christina Karey</p>
                  <p className="body-3 muted">Brasil</p>
                </div>
              </div>
              <div className={s.userParams}>
                <div className="d-flex flex-column">
                  <p className="headline-3">63 kg</p>
                  <p className="body-3 muted">Weight</p>
                </div>
                <div className="d-flex flex-column">
                  <p className="headline-3">175 sm</p>
                  <p className="body-3 muted">Height</p>
                </div>
                <div className="d-flex flex-column">
                  <p className="headline-3">28 y.</p>
                  <p className="body-3 muted">Age</p>
                </div>
              </div>
              <div className={s.goals}>
                <div className={s.goalsTitle}>
                  <p className="headline-3">Your Goals</p>
                </div>
                <div className="d-flex flex-column mt-3">
                  <div className={s.activity}>
                    <p className="body-2">Sleep</p>
                    <p className="body-2">92<span className="body-3 muted"> / 160</span></p>
                  </div>
                  <Progress color="secondary-red" className="progress-xs" value={60} />
                </div>
                <div className="d-flex flex-column mt-3">
                  <div className={s.activity}>
                    <p className="body-2">Sport</p>
                    <p className="body-2">40<span className="body-3 muted"> / 50</span></p>
                  </div>
                  <Progress color="secondary-yellow" className="progress-xs" value={80} />
                </div>
                <div className="d-flex flex-column mt-3">
                  <div className={s.activity}>
                    <p className="body-2">Water</p>
                    <p className="body-2">25<span className="body-3 muted"> / 40</span></p>
                  </div>
                  <Progress color="secondary-cyan" className="progress-xs" value={40} />
                </div>
              </div>
              <p className="headline-3">Critical Information</p>
              <div className={`mt-3 ${s.widgetBlock}`}>
                <div className={s.widgetBody}>
                  <div className="d-flex">
                    <img className="img-fluid mr-2" style={{width: "2.5em"}} src={addressIcon} alt="..." />
                    <div className="d-flex flex-column">
                      <p className="body-2">{this.getNER()}</p>
                      <p className="body-3 muted">Callee's Exact Address</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`mt-3 ${s.widgetBlock}`}>
                <div className={s.widgetBody}>
                  <div className="d-flex">
                    <img className="img-fluid mr-2" src={emergencyIcon} style={{width: "2.5em"}} alt="..." />
                    <div className="d-flex flex-column">
                      <p className="body-2">{this.getEmergency()}</p>
                      <p className="body-3 muted">Callee's Emergency</p>
                    </div>
                  </div>
                  {/* <div className="checkbox checkbox-primary">
                    <input
                      id="checkbox1"
                      type="checkbox"
                      className="styled"
                      checked={checkboxes[1]}
                      onChange={() => toggleCheckbox(1)}
                    />
                    <label htmlFor="checkbox1" />
                  </div> */}
                </div>
              </div>
              {/* <a className={`btn-secondary-red ${s.statsBtn}`} href="#top" role="button">
                <img className={s.pieImg}  src={statsPie} alt="..." />
                <div>
                  <p className="headline-2">STATISTIC</p>
                  <p className="body-3">Download your activity</p>
                </div>
              </a> */}
            </Widget>
          </Col>
        </Row>
      </div>
    )
  }
}

export default Dashboard;