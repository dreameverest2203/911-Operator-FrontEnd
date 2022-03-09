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
import helpIcon from "../../assets/dashboard/helpIcon.svg";
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
    police: {'lat': 0, 'lng': 0, 'dist': '---'},
    hospital: {'lat': 0, 'lng': 0, 'dist': '---'},
    fire: {'lat': 0, 'lng': 0, 'dist': '---'},
    translation: null,
    confidence_scores: null,
    closestHelp: {'dist': null, 'name': '---'},
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
                      if (res_nearest.data.hospital.lat) {
                        this.setState({ hospital: res_nearest.data.hospital });
                        if (!this.state.closestHelp.dist || this.state.closestHelp.dist > parseFloat(this.state.hospital.dist)) {
                          this.setState({closestHelp: {'dist': parseFloat(this.state.hospital.dist), 'name': this.state.hospital.name}});
                        }
                      }
                      if (res_nearest.data.police.lat) {
                        this.setState({ police: res_nearest.data.police });
                        if (!this.state.closestHelp.dist || this.state.closestHelp.dist > parseFloat(this.state.police.dist)) {
                          this.setState({closestHelp: {'dist': parseFloat(this.state.police.dist), 'name': this.state.police.name}});
                        }
                      }
                      if (res_nearest.data.fire.lat) {
                        this.setState({ fire: res_nearest.data.fire });
                        if (!this.state.closestHelp.dist || this.state.closestHelp.dist > parseFloat(this.state.fire.dist)) {
                          this.setState({closestHelp: {'dist': parseFloat(this.state.fire.dist), 'name': this.state.fire.name}});
                        }
                      }
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
            this.setState({ confidence_scores: res_emergency.data.scores })
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
          <span>
            {this.state.raw_ner.data.address}
          </span>
      )
    }
  }

  getEmergency = () => {
    if (this.state.emergency) {
      this.state.emergency = this.state.emergency.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
      return (
        <span>
          {this.state.emergency}
        </span>
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

  getConfidenceScores = () => {
    if (this.state.confidence_scores){
      return (
    <div>
      <div className="d-flex flex-column mt-3">
        <div className={s.activity}>
          <p className="body-2">{this.state.confidence_scores[0][1]}</p>
          <p className="body-2">{this.state.confidence_scores[0][0]}</p>
        </div>
        <Progress color="secondary-red" className="progress-xs" value={parseFloat(this.state.confidence_scores[0][0])} />
      </div>
      <div className="d-flex flex-column mt-3">
        <div className={s.activity}>
          <p className="body-2">{this.state.confidence_scores[1][1]}</p>
          <p className="body-2">{this.state.confidence_scores[1][0]}</p>
        </div>
        <Progress color="secondary-yellow" className="progress-xs" value={parseFloat(this.state.confidence_scores[1][0])} />
      </div>
      <div className="d-flex flex-column mt-3">
        <div className={s.activity}>
          <p className="body-2">{this.state.confidence_scores[2][1]}</p>
          <p className="body-2">{this.state.confidence_scores[2][0]}</p>
        </div>
        <Progress color="secondary-cyan" className="progress-xs" value={parseFloat(this.state.confidence_scores[2][0])} />
      </div>
    </div>
      );
    }
  }

  getEmergencyDescription = () => {
    console.log(this.state.emergency);
    if (this.state.emergency === "Fire") {
      return (
        <div>
          <div>
              <h6><b>If a Fire Starts:</b></h6>
          <ul>
          <li>Know how to <a href="https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/fire/fire-safety-equipment.html#Fire-Extinguishers" target="Target" data-aa-link-button="safely-operate-a-fire-extinguisher">safely operate a fire extinguisher</a></li>
          <li>Yell "Fire!" several times and go outside right away. If you live in a building with elevators, use the stairs. Leave all your things where they are and save yourself.</li>
          <li>If closed doors or handles are warm or smoke blocks your primary escape route, use your second way out. Never open doors that are warm to the touch.</li>
          <li>If you must escape through smoke, get low and go under the smoke to your exit. Close doors behind you.</li>
          <li>If smoke, heat or flames block your exit routes, stay in the room with doors closed. Place a wet towel under the door and call the fire department or 9-1-1. Open a window and wave a brightly colored cloth or flashlight to signal for help.</li>
          <li>Once you are outside, go to your meeting place and then send one person to call the fire department. If you cannot get to your meeting place, follow your family emergency communication plan.</li>
          </ul>
          </div>
          <div class="description text"><h6><b>If your clothes catch on fire:</b></h6>
          <ul>
          <li><b><u>Stop</u></b> what you're doing.</li>
          <li><b><u>Drop</u></b> to the ground and cover your face if you can.</li>
          <li><b><u>Roll</u></b> over and over or back and forth until the flames go out. Running will only make the fire burn faster.</li>
          </ul>
          <h6><b>Once the flames are out, cool the burned skin with water for three to five minutes. Call for medical attention.</b></h6>
          </div>
        </div>
      )
    } else if (this.state.emergency) {
      return (<div><p className='center' id='text-margin'>Emergency: {this.state.emergency}</p></div>);
    }
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
                <img className={s.image} src={helpIcon} alt="..." />
                <div className={s.userInfo}>
                  <p className="headline-3">{this.state.closestHelp.name}</p>
                  <p className="body-3 muted">Closest Help</p>
                </div>
              </div>
              <div className={s.userParams}>
                <div className="d-flex flex-column">
                  <p className="headline-3">{this.state.hospital.dist} km</p>
                  <p className="body-3 muted">Hospital</p>
                </div>
                <div className="d-flex flex-column">
                  <p className="headline-3">{this.state.fire.dist} km</p>
                  <p className="body-3 muted">Fire Station</p>
                </div>
                <div className="d-flex flex-column">
                  <p className="headline-3">{this.state.police.dist} km</p>
                  <p className="body-3 muted">Police Station</p>
                </div>
              </div>
              <div className={s.goals}>
                <div className={s.goalsTitle}>
                  <p className="headline-3">Emergency type</p>
                </div>
                {this.getConfidenceScores()}
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

              {this.getEmergencyDescription()}
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
